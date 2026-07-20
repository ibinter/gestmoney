import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApproveReplenishmentDto,
  RejectReplenishmentDto,
  ReplenishmentRequestDto,
} from './dto/replenishment-request.dto';
import { FloatThresholdDto } from './dto/float-threshold.dto';
import {
  FloatAccountNotFoundException,
  InsufficientFloatException,
} from '../common/exceptions/business.exceptions';
import { MobileMoneyOperator } from '../transactions/interfaces/transaction.interface';

export const FLOAT_EVENTS = {
  LOW_BALANCE_ALERT: 'float.low_balance_alert',
  REPLENISHMENT_REQUESTED: 'float.replenishment_requested',
  REPLENISHMENT_APPROVED: 'float.replenishment_approved',
  REPLENISHMENT_REJECTED: 'float.replenishment_rejected',
} as const;

/**
 * Le schéma Prisma est en anglais (`balance`, `status`, `networkId`…) alors que
 * l'API expose des noms français (`solde`, `statut`, `operateur`). Ce service
 * traduit dans les deux sens : anglais côté Prisma, français côté réponse HTTP.
 * L'« opérateur » (ORANGE_MONEY, WAVE…) est porté par `Network.operatorCode`.
 */
@Injectable()
export class FloatService {
  private readonly logger = new Logger(FloatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private num(value: unknown): number {
    return value === null || value === undefined ? 0 : Number(value);
  }

  /** Retrouve le compte float d'un agent pour un opérateur (via Network.operatorCode). */
  private async findAccount(agentId: string, operateur: string, tenantId: string) {
    return this.prisma.floatAccount.findFirst({
      where: { agentId, tenantId, network: { operatorCode: operateur } },
      include: { network: { select: { operatorCode: true, name: true } } },
    });
  }

  // ─── Opérations atomiques float ─────────────────────────────────────────────

  async debitFloat(
    agentId: string,
    operateur: MobileMoneyOperator,
    montant: number,
    tenantId: string,
    transactionId?: string,
    motif?: string,
  ): Promise<void> {
    const account = await this.findAccount(agentId, operateur, tenantId);

    if (!account) throw new FloatAccountNotFoundException(agentId, operateur);

    const soldeAvant = this.num(account.balance);
    if (soldeAvant < montant) {
      throw new InsufficientFloatException(operateur, soldeAvant, montant);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.floatAccount.update({
        where: { id: account.id },
        data: { balance: { decrement: montant }, lastMovementAt: new Date() },
      });

      await tx.floatMovement.create({
        data: {
          tenantId,
          floatAccountId: account.id,
          transactionId,
          type: 'DEBIT',
          amount: montant,
          balanceBefore: soldeAvant,
          balanceAfter: soldeAvant - montant,
          currency: account.currency,
          description: motif ?? 'Débit float',
          reference: transactionId ?? `FLT-${Date.now()}`,
          performedById: agentId,
        },
      });
    });

    // Vérifier seuil après débit
    const updated = await this.prisma.floatAccount.findUnique({ where: { id: account.id } });
    if (updated) {
      const solde = this.num(updated.balance);
      const seuilMin = this.num(updated.minimumBalance);
      if (seuilMin > 0 && solde <= seuilMin) {
        this.logger.warn(`Float bas: Agent ${agentId} / ${operateur} = ${solde} FCFA`);
        this.eventEmitter.emit(FLOAT_EVENTS.LOW_BALANCE_ALERT, {
          agentId,
          operateur,
          solde,
          seuilMin,
          tenantId,
        });
      }
    }
  }

  async creditFloat(
    agentId: string,
    operateur: MobileMoneyOperator,
    montant: number,
    tenantId: string,
    transactionId?: string,
    motif?: string,
  ): Promise<void> {
    const account = await this.findAccount(agentId, operateur, tenantId);

    if (!account) throw new FloatAccountNotFoundException(agentId, operateur);

    const soldeAvant = this.num(account.balance);

    await this.prisma.$transaction(async (tx) => {
      await tx.floatAccount.update({
        where: { id: account.id },
        data: { balance: { increment: montant }, lastMovementAt: new Date() },
      });

      await tx.floatMovement.create({
        data: {
          tenantId,
          floatAccountId: account.id,
          transactionId,
          type: 'CREDIT',
          amount: montant,
          balanceBefore: soldeAvant,
          balanceAfter: soldeAvant + montant,
          currency: account.currency,
          description: motif ?? 'Crédit float',
          reference: transactionId ?? `FLT-${Date.now()}`,
          performedById: agentId,
        },
      });
    });
  }

  // ─── Consultation ─────────────────────────────────────────────────────────────

  async getFloatAccounts(tenantId: string, agenceId?: string, operateur?: string) {
    const accounts = await this.prisma.floatAccount.findMany({
      where: {
        tenantId,
        ...(agenceId && { agencyId: agenceId }),
        ...(operateur && { network: { operatorCode: operateur } }),
      },
      include: {
        agent: { select: { id: true, agentCode: true, agencyId: true } },
        network: { select: { operatorCode: true, name: true } },
      },
      orderBy: { balance: 'asc' },
    });

    return accounts.map((a) => this.toFloatSolde(a));
  }

  private toFloatSolde(a: any) {
    const solde = this.num(a.balance);
    const seuilMin = this.num(a.minimumBalance);
    const seuilCible = this.num(a.maximumBalance);

    return {
      id: a.id,
      agentId: a.agentId,
      agenceId: a.agencyId,
      agentCode: a.agent?.agentCode ?? null,
      operateur: a.network?.operatorCode ?? null,
      operateurNom: a.network?.name ?? null,
      numeroCompte: a.accountNumber,
      soldeActuel: solde,
      solde,
      soldeReserve: this.num(a.reservedBalance),
      devise: a.currency,
      seuilAlerte: seuilMin,
      seuilMin,
      seuilCritique: Math.round(seuilMin / 2),
      seuilCible,
      actif: a.isActive,
      statut: solde <= 0 ? 'critique' : seuilMin > 0 && solde <= seuilMin ? 'alerte' : 'ok',
      derniereMaj: a.updatedAt,
      updatedAt: a.updatedAt,
    };
  }

  async getAgentFloat(agentId: string, tenantId: string) {
    const accounts = await this.prisma.floatAccount.findMany({
      where: { agentId, tenantId },
      include: {
        agent: { select: { id: true, agentCode: true, agencyId: true } },
        network: { select: { operatorCode: true, name: true } },
      },
      orderBy: { networkId: 'asc' },
    });

    return accounts.map((a) => this.toFloatSolde(a));
  }

  async getNetworkSummary(tenantId: string) {
    const grouped = await this.prisma.floatAccount.groupBy({
      by: ['networkId'],
      where: { tenantId },
      _sum: { balance: true },
      _count: { id: true },
      _avg: { balance: true },
    });

    const networks = await this.prisma.network.findMany({
      where: { id: { in: grouped.map((g) => g.networkId) } },
      select: { id: true, operatorCode: true, name: true },
    });

    return grouped.map((g) => {
      const network = networks.find((n) => n.id === g.networkId);
      return {
        operateur: network?.operatorCode ?? g.networkId,
        operateurNom: network?.name ?? null,
        totalFloat: this.num(g._sum.balance),
        nombreComptes: g._count.id,
        moyenneFloat: Math.round(this.num(g._avg.balance)),
      };
    });
  }

  // ─── Demandes de réapprovisionnement ─────────────────────────────────────────

  async requestReplenishment(
    dto: ReplenishmentRequestDto,
    tenantId: string,
    userId: string,
  ) {
    const account = await this.findAccount(dto.agentId, dto.operateur, tenantId);

    if (!account) throw new FloatAccountNotFoundException(dto.agentId, dto.operateur);

    const request = await this.prisma.replenishmentRequest.create({
      data: {
        tenantId,
        floatAccountId: account.id,
        requestedById: userId,
        requestedAmount: dto.montantDemande,
        currency: account.currency,
        status: 'PENDING',
        reason: dto.justification,
      },
      include: this.replenishmentInclude(),
    });

    const mapped = this.toReplenishment(request);
    this.eventEmitter.emit(FLOAT_EVENTS.REPLENISHMENT_REQUESTED, { request: mapped, tenantId });
    return mapped;
  }

  private replenishmentInclude() {
    return {
      floatAccount: {
        include: {
          agent: { select: { id: true, agentCode: true, agencyId: true } },
          network: { select: { operatorCode: true, name: true } },
        },
      },
      requestedBy: { select: { id: true, firstName: true, lastName: true } },
    };
  }

  private toReplenishment(r: any) {
    return {
      id: r.id,
      agentId: r.floatAccount?.agentId ?? null,
      agentCode: r.floatAccount?.agent?.agentCode ?? null,
      operateur: r.floatAccount?.network?.operatorCode ?? null,
      montant: this.num(r.requestedAmount),
      montantDemande: this.num(r.requestedAmount),
      montantApprouve: r.approvedAmount === null ? null : this.num(r.approvedAmount),
      devise: r.currency,
      statut: r.status,
      justification: r.reason ?? null,
      commentaire: r.reason ?? r.rejectionReason ?? null,
      motifRejet: r.rejectionReason ?? null,
      demandeurId: r.requestedById,
      demandeurNom: r.requestedBy
        ? `${r.requestedBy.firstName} ${r.requestedBy.lastName}`.trim()
        : null,
      approbateurId: r.approvedById ?? null,
      date: r.createdAt,
      createdAt: r.createdAt,
      approvedAt: r.approvedAt ?? null,
    };
  }

  async approveReplenishment(
    id: string,
    dto: ApproveReplenishmentDto,
    tenantId: string,
    userId: string,
  ) {
    const request = await this.prisma.replenishmentRequest.findFirst({
      where: { id, tenantId, status: 'PENDING' },
      include: this.replenishmentInclude(),
    });

    if (!request) throw new NotFoundException(`Demande de réappro introuvable: ${id}`);

    const montantApprouve = dto.montantApprouve ?? this.num(request.requestedAmount);
    const agentId = request.floatAccount?.agentId;
    const operateur = request.floatAccount?.network?.operatorCode;

    const updated = await this.prisma.replenishmentRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAmount: montantApprouve,
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: this.replenishmentInclude(),
    });

    // Créditer le float (hors transaction Prisma : creditFloat ouvre la sienne)
    if (agentId && operateur) {
      await this.creditFloat(
        agentId,
        operateur as MobileMoneyOperator,
        montantApprouve,
        tenantId,
        undefined,
        `Réappro approuvée #${id}`,
      );
    }

    const mapped = this.toReplenishment(updated);
    this.eventEmitter.emit(FLOAT_EVENTS.REPLENISHMENT_APPROVED, { request: mapped, tenantId });
    return mapped;
  }

  async rejectReplenishment(
    id: string,
    dto: RejectReplenishmentDto,
    tenantId: string,
    userId: string,
  ) {
    const request = await this.prisma.replenishmentRequest.findFirst({
      where: { id, tenantId, status: 'PENDING' },
    });

    if (!request) throw new NotFoundException(`Demande de réappro introuvable: ${id}`);

    const updated = await this.prisma.replenishmentRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: userId,
        rejectionReason: dto.motif,
      },
      include: this.replenishmentInclude(),
    });

    const mapped = this.toReplenishment(updated);
    this.eventEmitter.emit(FLOAT_EVENTS.REPLENISHMENT_REJECTED, { request: mapped, tenantId });
    return mapped;
  }

  async getPendingReplenishments(tenantId: string) {
    const requests = await this.prisma.replenishmentRequest.findMany({
      where: { tenantId, status: 'PENDING' },
      include: this.replenishmentInclude(),
      orderBy: { createdAt: 'asc' },
    });

    return requests.map((r) => this.toReplenishment(r));
  }

  // ─── Mouvements & Alertes ────────────────────────────────────────────────────

  async getMovements(tenantId: string, agentId?: string, operateur?: string, page = 1, limit = 20) {
    const where: any = { tenantId };
    if (agentId || operateur) {
      where.floatAccount = {
        ...(agentId && { agentId }),
        ...(operateur && { network: { operatorCode: operateur } }),
      };
    }

    const [movements, total] = await Promise.all([
      this.prisma.floatMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          floatAccount: {
            select: {
              agentId: true,
              network: { select: { operatorCode: true } },
            },
          },
        },
      }),
      this.prisma.floatMovement.count({ where }),
    ]);

    const data = movements.map((m) => ({
      id: m.id,
      type: m.type,
      operateur: m.floatAccount?.network?.operatorCode ?? null,
      agentId: m.floatAccount?.agentId ?? null,
      montant: this.num(m.amount),
      soldeAvant: this.num(m.balanceBefore),
      soldeApres: this.num(m.balanceAfter),
      devise: m.currency,
      description: m.description,
      motif: m.description,
      reference: m.reference,
      transactionId: m.transactionId,
      date: m.createdAt,
      createdAt: m.createdAt,
    }));

    return { data, total, page, limit };
  }

  async getAlerts(tenantId: string) {
    const accounts = await this.prisma.floatAccount.findMany({
      where: { tenantId },
      include: {
        agent: { select: { id: true, agentCode: true, agencyId: true } },
        network: { select: { operatorCode: true, name: true } },
      },
    });

    return accounts
      .map((a) => {
        const solde = this.num(a.balance);
        const seuilMin = this.num(a.minimumBalance);
        return { a, solde, seuilMin };
      })
      .filter(({ solde, seuilMin }) => seuilMin > 0 && solde <= seuilMin)
      .map(({ a, solde, seuilMin }) => ({
        agentId: a.agentId,
        agentNom: a.agent?.agentCode ?? a.accountNumber,
        agenceId: a.agencyId,
        operateur: a.network?.operatorCode ?? null,
        solde,
        seuilMin,
        deficit: seuilMin - solde,
        niveau: solde === 0 ? 'CRITIQUE' : 'BAS',
      }));
  }

  async setThresholds(dto: FloatThresholdDto, tenantId: string) {
    const account = await this.findAccount(dto.agentId, dto.operateur, tenantId);

    if (!account) throw new FloatAccountNotFoundException(dto.agentId, dto.operateur);

    const updated = await this.prisma.floatAccount.update({
      where: { id: account.id },
      data: {
        minimumBalance: dto.seuilMin,
        ...(dto.seuilCible !== undefined && { maximumBalance: dto.seuilCible }),
      },
      include: {
        agent: { select: { id: true, agentCode: true, agencyId: true } },
        network: { select: { operatorCode: true, name: true } },
      },
    });

    return this.toFloatSolde(updated);
  }

  // ─── Prévisions (IA simple) ──────────────────────────────────────────────────

  async getForecast(tenantId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const movements = await this.prisma.floatMovement.groupBy({
      by: ['floatAccountId'],
      where: {
        tenantId,
        type: 'DEBIT',
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: { amount: true },
    });

    const accounts = await this.prisma.floatAccount.findMany({
      where: { tenantId },
      include: { network: { select: { operatorCode: true } } },
    });

    return accounts.map((account) => {
      const movement = movements.find((m) => m.floatAccountId === account.id);

      const solde = this.num(account.balance);
      const totalDebits7Days = this.num(movement?._sum.amount);
      const moyenneJournaliere = totalDebits7Days / 7;
      const joursAvantEpuisement =
        moyenneJournaliere > 0 ? Math.floor(solde / moyenneJournaliere) : 999;
      const besoinsReappro7Jours = Math.max(0, moyenneJournaliere * 7 - solde);

      return {
        agentId: account.agentId,
        operateur: account.network?.operatorCode ?? null,
        soldeActuel: solde,
        moyenneConsommationJournaliere: Math.round(moyenneJournaliere),
        joursAvantEpuisement,
        besoinsReappro7Jours: Math.round(besoinsReappro7Jours),
        priorite: joursAvantEpuisement <= 1 ? 'URGENTE' : joursAvantEpuisement <= 3 ? 'HAUTE' : 'NORMALE',
      };
    });
  }
}
