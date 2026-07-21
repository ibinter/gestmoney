import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normaliserPagination } from '../common/utils/pagination';
import { CommissionPlanDto } from './dto/commission-plan.dto';
import {
  CalculateCommissionsDto,
  QueryCommissionDto,
  ValidatePaymentDto,
} from './dto/query-commission.dto';
import { CommissionPlanNotFoundException } from '../common/exceptions/business.exceptions';
import {
  MobileMoneyOperator,
  TransactionType,
} from '../transactions/interfaces/transaction.interface';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Calcul commission ────────────────────────────────────────────────────────

  async calculateCommissionAmount(
    montant: number,
    type: TransactionType,
    operateur: MobileMoneyOperator,
    tenantId: string,
  ): Promise<{ total: number; partAgent: number; partReseau: number }> {
    const plan = await this.prisma.commissionPlan.findFirst({
      where: { tenantId, operateur, typeTransaction: type, active: true },
      include: { paliers: { orderBy: { montantMin: 'asc' } } },
    });

    if (!plan || plan.paliers.length === 0) {
      return { total: 0, partAgent: 0, partReseau: 0 };
    }

    // Trouver le palier applicable
    const palier = plan.paliers
      .reverse()
      .find(
        (p: any) => montant >= p.montantMin && (!p.montantMax || montant <= p.montantMax),
      );

    if (!palier) return { total: 0, partAgent: 0, partReseau: 0 };

    let total = 0;
    if ((palier as any).montantFixe) {
      total = (palier as any).montantFixe;
    } else if ((palier as any).taux) {
      total = Math.round(montant * ((palier as any).taux / 100));
    }

    const tauxAgent = plan.partAgent ?? 70;
    const tauxReseau = plan.partReseau ?? 30;

    return {
      total,
      partAgent: Math.round(total * (tauxAgent / 100)),
      partReseau: Math.round(total * (tauxReseau / 100)),
    };
  }

  async recordCommission(
    transactionId: string,
    agentId: string,
    agenceId: string,
    montantTransaction: number,
    type: TransactionType,
    operateur: MobileMoneyOperator,
    tenantId: string,
  ): Promise<void> {
    const { total, partAgent, partReseau } = await this.calculateCommissionAmount(
      montantTransaction,
      type,
      operateur,
      tenantId,
    );

    if (total <= 0) return;

    await this.prisma.commission.create({
      data: {
        tenantId,
        transactionId,
        agentId,
        agenceId,
        operateur,
        typeTransaction: type,
        montantTransaction,
        montantCommission: total,
        partAgent,
        partReseau,
        statut: 'DUE',
      },
    });

    // Mettre à jour le champ commission sur la transaction
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { commission: total },
    });
  }

  // ─── CRUD commissions ─────────────────────────────────────────────────────────

  async findAll(query: QueryCommissionDto, tenantId: string) {
    const p = Number(query.page) || 1;
    const l = Number(query.limit) || 20;
    const { agentId, dateDebut, dateFin } = query;

    const where: any = { tenantId };
    if (agentId) where.agentId = agentId;
    if (dateDebut || dateFin) {
      where.createdAt = {};
      if (dateDebut) where.createdAt.gte = new Date(dateDebut);
      if (dateFin) where.createdAt.lte = new Date(dateFin);
    }

    const [earnings, total] = await Promise.all([
      this.prisma.commissionEarning.findMany({
        where,
        skip: (p - 1) * l,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: { select: { agentCode: true, phoneNumber: true } },
          transaction: { select: { amount: true, type: true } },
        },
      }),
      this.prisma.commissionEarning.count({ where }),
    ]);

    const data = earnings.map((e: any) => ({
      id: e.id,
      agentId: e.agentId,
      agentNom: e.agent?.agentCode ?? 'N/A',
      agenceNom: '',
      periode: `${e.periodYear}-${String(e.periodMonth).padStart(2, '0')}`,
      nbTransactions: 1,
      montantTransactions: Number(e.transaction?.amount ?? 0),
      tauxCommission: 0,
      montantCommission: Number(e.agentAmount ?? 0),
      statut: 'calculee',
      datePaiement: null,
    }));

    return { data, total, page: p, limit: l };
  }

  async getSummary(tenantId: string) {
    const [total, paid] = await Promise.all([
      this.prisma.commissionEarning.aggregate({ where: { tenantId }, _sum: { agentAmount: true }, _count: { id: true } }),
      this.prisma.commissionEarning.aggregate({ where: { tenantId }, _sum: { agentAmount: true } }),
    ]);
    return {
      calculee: { count: total._count.id, montantTotal: Number(total._sum.agentAmount ?? 0) },
      validee: { count: 0, montantTotal: 0 },
      payee: { count: 0, montantTotal: 0 },
    };
  }

  async getAgentCommissions(agentId: string, tenantId: string, query: QueryCommissionDto) {
    return this.findAll({ ...query, agentId }, tenantId);
  }

  // ─── Recalcul batch ──────────────────────────────────────────────────────────

  async recalculate(dto: CalculateCommissionsDto, tenantId: string) {
    const where: any = { tenantId, status: 'COMPLETED' };
    if (dto.agentId) where.agentId = dto.agentId;
    if (dto.dateDebut) where.createdAt = { gte: new Date(dto.dateDebut) };
    if (dto.dateFin) {
      where.createdAt = { ...(where.createdAt || {}), lte: new Date(dto.dateFin) };
    }

    const transactions = await this.prisma.transaction.findMany({ where });
    let recalculated = 0;

    for (const tx of transactions) {
      // Supprimer ancienne commission si existe
      await this.prisma.commission.deleteMany({ where: { transactionId: tx.id } });

      await this.recordCommission(
        tx.id,
        tx.agentId,
        tx.agenceId,
        tx.montant,
        tx.type as TransactionType,
        tx.operateur as MobileMoneyOperator,
        tenantId,
      );
      recalculated++;
    }

    return { recalculated };
  }

  // ─── Grilles tarifaires ──────────────────────────────────────────────────────

  async createPlan(dto: CommissionPlanDto, tenantId: string) {
    return this.prisma.commissionPlan.create({
      data: {
        tenantId,
        nom: dto.nom,
        description: dto.description,
        operateur: dto.operateur,
        typeTransaction: dto.typeTransaction,
        active: dto.active ?? true,
        partAgent: dto.partAgent ?? 70,
        partReseau: dto.partReseau ?? 30,
        paliers: {
          create: dto.paliers.map((p) => ({
            montantMin: p.montantMin,
            montantMax: p.montantMax,
            taux: p.taux,
            montantFixe: p.montantFixe,
          })),
        },
      },
      include: { paliers: true },
    });
  }

  async getPlans(tenantId: string) {
    return this.prisma.commissionPlan.findMany({
      where: { tenantId },
      include: { paliers: { orderBy: { montantMin: 'asc' } } },
      orderBy: { operateur: 'asc' },
    });
  }

  async updatePlan(id: string, dto: Partial<CommissionPlanDto>, tenantId: string) {
    const plan = await this.prisma.commissionPlan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new CommissionPlanNotFoundException(id);

    return this.prisma.commissionPlan.update({
      where: { id },
      data: {
        nom: dto.nom,
        description: dto.description,
        active: dto.active,
        partAgent: dto.partAgent,
        partReseau: dto.partReseau,
        ...(dto.paliers && {
          paliers: {
            deleteMany: {},
            create: dto.paliers.map((p) => ({
              montantMin: p.montantMin,
              montantMax: p.montantMax,
              taux: p.taux,
              montantFixe: p.montantFixe,
            })),
          },
        }),
      },
      include: { paliers: true },
    });
  }

  // ─── Paiements ────────────────────────────────────────────────────────────────

  async validatePayment(dto: ValidatePaymentDto, tenantId: string, userId: string) {
    const where: any = { tenantId, statut: 'DUE' };
    if (dto.commissionIds?.length) where.id = { in: dto.commissionIds };
    if (dto.agentId) where.agentId = dto.agentId;
    if (dto.dateDebut) where.createdAt = { gte: new Date(dto.dateDebut) };
    if (dto.dateFin) {
      where.createdAt = { ...(where.createdAt || {}), lte: new Date(dto.dateFin) };
    }

    const commissions = await this.prisma.commission.findMany({ where });
    if (!commissions.length) throw new NotFoundException('Aucune commission DUE trouvée');

    const totalMontant = commissions.reduce((s, c) => s + c.partAgent, 0);

    const payment = await this.prisma.$transaction(async (tx) => {
      const pmt = await tx.commissionPayment.create({
        data: {
          tenantId,
          validatedBy: userId,
          montantTotal: totalMontant,
          nombreCommissions: commissions.length,
          commissionIds: commissions.map((c) => c.id),
        },
      });

      await tx.commission.updateMany({
        where: { id: { in: commissions.map((c) => c.id) } },
        data: { statut: 'PAID', paidAt: new Date(), paymentId: pmt.id },
      });

      return pmt;
    });

    this.logger.log(
      `Paiement batch validé: ${commissions.length} commissions, ${totalMontant} FCFA`,
    );

    return { payment, commissionsPayees: commissions.length, montantTotal: totalMontant };
  }

  async getPayments(tenantId: string, page?: number, limit?: number) {
    const { page: p, limit: l, skip } = normaliserPagination(page, limit, 20);
    const [data, total] = await Promise.all([
      this.prisma.commissionPayment.findMany({
        where: { tenantId },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commissionPayment.count({ where: { tenantId } }),
    ]);

    return { data, total, page: p, limit: l };
  }
}
