import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CaisseAlreadyOpenException,
  CaisseNotOpenException,
} from '../common/exceptions/business.exceptions';
import { normaliserPagination } from '../common/utils/pagination';

export interface OpenCaisseDto {
  soldInitial: number;
  notes?: string;
}

export interface CloseCaisseDto {
  soldeFinal: number;
  notes?: string;
}

export interface CaisseEntryDto {
  montant: number;
  motif: string;
  type: 'ENTREE' | 'SORTIE';
}

/**
 * Service caisse — recâblé sur le schéma Prisma RÉEL.
 *
 * Modèles réels :
 *   - Cashier      : caisse PERSISTANTE par utilisateur (userId @unique),
 *                    rattachée à une agence, avec isOpen / opening/closingBalance.
 *   - CashMovement : mouvement (type FloatMovementType CREDIT/DEBIT, amount,
 *                    balanceBefore/After, description, reference, performedById).
 *
 * L'ancienne implémentation visait des modèles inexistants (`caisseSession`,
 * `caisseMovement`, `vaultMovement`) et des champs FR : elle ne compilait pas
 * et n'était même pas branchée (module absent d'app.module). Le solde courant
 * est le `balanceAfter` du dernier mouvement (à défaut l'openingBalance).
 *
 * Périmètre volontairement scopé à la caisse de l'utilisateur courant (la page
 * /dashboard/caisse) : pas d'agrégat tenant inventé.
 */
@Injectable()
export class CashierService {
  private readonly logger = new Logger(CashierService.name);

  constructor(private readonly prisma: PrismaService) {}

  private num(v: any): number {
    return v == null ? 0 : Number(v);
  }

  private async caisseDe(userId: string, tenantId: string) {
    return this.prisma.cashier.findFirst({ where: { userId, tenantId } });
  }

  private async soldeCourant(cashier: {
    id: string;
    openingBalance: any;
  }): Promise<number> {
    const dernier = await this.prisma.cashMovement.findFirst({
      where: { cashierId: cashier.id },
      orderBy: { createdAt: 'desc' },
    });
    return dernier ? this.num(dernier.balanceAfter) : this.num(cashier.openingBalance);
  }

  // ─── Solde / stats ─────────────────────────────────────────────────────────────

  async getBalance(userId: string, tenantId: string) {
    const cashier = await this.caisseDe(userId, tenantId);
    if (!cashier || !cashier.isOpen) return { statut: 'FERMEE', soldeActuel: 0 };

    return {
      statut: 'OUVERTE',
      cashierId: cashier.id,
      soldeInitial: this.num(cashier.openingBalance),
      soldeActuel: await this.soldeCourant(cashier),
      ouvertureAt: cashier.openedAt,
    };
  }

  async getStats(userId: string, tenantId: string) {
    const cashier = await this.caisseDe(userId, tenantId);
    const soldeOuverture = cashier ? this.num(cashier.openingBalance) : 0;
    const soldeActuel = cashier ? await this.soldeCourant(cashier) : 0;

    if (!cashier) {
      return {
        statut: 'FERMEE',
        soldeActuel: 0,
        soldeOuverture: 0,
        entreesJour: 0,
        sortiesJour: 0,
        nbEntrees: 0,
        nbSorties: 0,
      };
    }

    const now = new Date();
    const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const parType = await this.prisma.cashMovement.groupBy({
      by: ['type'],
      where: { cashierId: cashier.id, tenantId, createdAt: { gte: debutJour } },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const credit = parType.find((g: any) => g.type === 'CREDIT');
    const debit = parType.find((g: any) => g.type === 'DEBIT');

    return {
      statut: cashier.isOpen ? 'OUVERTE' : 'FERMEE',
      soldeActuel,
      soldeOuverture,
      entreesJour: this.num(credit?._sum.amount),
      sortiesJour: this.num(debit?._sum.amount),
      nbEntrees: credit?._count._all ?? 0,
      nbSorties: debit?._count._all ?? 0,
    };
  }

  // ─── Écritures ─────────────────────────────────────────────────────────────────

  private mapEcriture(m: any) {
    return {
      id: m.id,
      type: m.type === 'CREDIT' ? 'credit' : 'debit',
      amount: this.num(m.amount),
      balanceAfter: this.num(m.balanceAfter),
      description: m.description,
      reference: m.reference,
      createdAt: m.createdAt,
    };
  }

  async getEcritures(
    userId: string,
    tenantId: string,
    page?: number,
    limit?: number,
  ) {
    const cashier = await this.caisseDe(userId, tenantId);
    if (!cashier) return { data: [], total: 0, page: 1, limit: limit ?? 20 };

    const { page: p, limit: l, skip } = normaliserPagination(page, limit, 20);
    const [rows, total] = await Promise.all([
      this.prisma.cashMovement.findMany({
        where: { cashierId: cashier.id, tenantId },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cashMovement.count({
        where: { cashierId: cashier.id, tenantId },
      }),
    ]);

    return { data: rows.map((m) => this.mapEcriture(m)), total, page: p, limit: l };
  }

  async addEcriture(
    dto: CaisseEntryDto,
    tenantId: string,
    userId: string,
  ) {
    const cashier = await this.caisseDe(userId, tenantId);
    if (!cashier || !cashier.isOpen) throw new CaisseNotOpenException();

    const before = await this.soldeCourant(cashier);
    const isCredit = dto.type === 'ENTREE';
    const after = isCredit ? before + dto.montant : before - dto.montant;

    const mouvement = await this.prisma.cashMovement.create({
      data: {
        tenantId,
        cashierId: cashier.id,
        type: isCredit ? 'CREDIT' : 'DEBIT',
        amount: dto.montant,
        balanceBefore: before,
        balanceAfter: after,
        description: dto.motif,
        reference: `CAISSE-${Date.now()}`,
        performedById: userId,
      },
    });

    return this.mapEcriture(mouvement);
  }

  // ─── Ouverture / clôture ─────────────────────────────────────────────────────

  async open(dto: OpenCaisseDto, tenantId: string, userId: string) {
    const existante = await this.caisseDe(userId, tenantId);
    if (existante?.isOpen) throw new CaisseAlreadyOpenException();

    let cashier;
    if (!existante) {
      // Créer la caisse : l'agence vient de l'agent rattaché à cet utilisateur.
      const agent = await this.prisma.agent.findFirst({
        where: { userId, tenantId },
      });
      if (!agent) {
        throw new BadRequestException(
          "Aucune caisse ne peut être ouverte : cet utilisateur n'est rattaché à aucun agent/agence.",
        );
      }
      cashier = await this.prisma.cashier.create({
        data: {
          tenantId,
          agencyId: agent.agencyId,
          userId,
          code: `CAISSE-${agent.agentCode ?? userId.slice(-6)}`,
          isOpen: true,
          openedAt: new Date(),
          openingBalance: dto.soldInitial,
        },
      });
    } else {
      cashier = await this.prisma.cashier.update({
        where: { id: existante.id },
        data: {
          isOpen: true,
          openedAt: new Date(),
          openingBalance: dto.soldInitial,
          closedAt: null,
          closingBalance: null,
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'CREATE',
        resource: 'Cashier',
        resourceId: cashier.id,
        newValues: { soldeInitial: dto.soldInitial },
      },
    });

    this.logger.log(
      `Caisse ouverte: user ${userId}, solde initial ${dto.soldInitial} FCFA`,
    );
    return cashier;
  }

  async close(tenantId: string, userId: string, dto: CloseCaisseDto) {
    const cashier = await this.caisseDe(userId, tenantId);
    if (!cashier || !cashier.isOpen) throw new CaisseNotOpenException();

    const soldeCalcule = await this.soldeCourant(cashier);
    const ecart = dto.soldeFinal - soldeCalcule;

    const closed = await this.prisma.cashier.update({
      where: { id: cashier.id },
      data: {
        isOpen: false,
        closedAt: new Date(),
        closingBalance: dto.soldeFinal,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'UPDATE',
        resource: 'Cashier',
        resourceId: cashier.id,
        newValues: { soldeFinal: dto.soldeFinal, ecart },
      },
    });

    this.logger.log(`Caisse fermée: ${cashier.id}, écart ${ecart} FCFA`);
    return { ...closed, soldeCalcule, ecart };
  }

  async getHistory(userId: string, tenantId: string, page?: number, limit?: number) {
    // Le modèle Cashier n'historise pas les sessions ; on renvoie l'historique
    // des mouvements de la caisse comme journal.
    return this.getEcritures(userId, tenantId, page, limit);
  }
}
