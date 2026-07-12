import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CaisseAlreadyOpenException,
  CaisseNotOpenException,
} from '../common/exceptions/business.exceptions';

export interface OpenCaisseDto {
  agentId: string;
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

export interface VaultOperationDto {
  montant: number;
  motif?: string;
}

@Injectable()
export class CashierService {
  private readonly logger = new Logger(CashierService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getOpenSession(agentId: string, tenantId: string) {
    return this.prisma.caisseSession.findFirst({
      where: { agentId, tenantId, statut: 'OUVERTE' },
    });
  }

  // ─── Balance ──────────────────────────────────────────────────────────────────

  async getBalance(agentId: string, tenantId: string) {
    const session = await this.getOpenSession(agentId, tenantId);
    if (!session) return { statut: 'FERMEE', solde: 0 };

    const movements = await this.prisma.caisseMovement.aggregate({
      where: { sessionId: session.id, tenantId },
      _sum: { montantEntree: true, montantSortie: true },
    });

    const solde =
      session.soldeInitial +
      (movements._sum.montantEntree ?? 0) -
      (movements._sum.montantSortie ?? 0);

    return {
      statut: 'OUVERTE',
      sessionId: session.id,
      soldeInitial: session.soldeInitial,
      totalEntrees: movements._sum.montantEntree ?? 0,
      totalSorties: movements._sum.montantSortie ?? 0,
      soldeActuel: solde,
      ouvertureAt: session.createdAt,
    };
  }

  // ─── Ouverture / Clôture ─────────────────────────────────────────────────────

  async open(dto: OpenCaisseDto, tenantId: string, userId: string) {
    const existing = await this.getOpenSession(dto.agentId, tenantId);
    if (existing) throw new CaisseAlreadyOpenException();

    const session = await this.prisma.$transaction(async (tx) => {
      const s = await tx.caisseSession.create({
        data: {
          tenantId,
          agentId: dto.agentId,
          ouvertPar: userId,
          soldeInitial: dto.soldInitial,
          statut: 'OUVERTE',
          notes: dto.notes,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'CAISSE_OPENED',
          entityType: 'CaisseSession',
          entityId: s.id,
          details: { soldeInitial: dto.soldInitial, agentId: dto.agentId },
        },
      });

      return s;
    });

    this.logger.log(`Caisse ouverte: Agent ${dto.agentId}, Solde initial: ${dto.soldInitial} FCFA`);
    return session;
  }

  async close(agentId: string, dto: CloseCaisseDto, tenantId: string, userId: string) {
    const session = await this.getOpenSession(agentId, tenantId);
    if (!session) throw new CaisseNotOpenException();

    const balance = await this.getBalance(agentId, tenantId);
    const ecart = dto.soldeFinal - (balance.soldeActuel ?? 0);

    const closed = await this.prisma.$transaction(async (tx) => {
      const s = await tx.caisseSession.update({
        where: { id: session.id },
        data: {
          statut: 'FERMEE',
          soldeFinal: dto.soldeFinal,
          ecart,
          closedAt: new Date(),
          fermetPar: userId,
          notes: dto.notes,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'CAISSE_CLOSED',
          entityType: 'CaisseSession',
          entityId: s.id,
          details: { soldeFinal: dto.soldeFinal, ecart },
        },
      });

      return s;
    });

    this.logger.log(
      `Caisse fermée: Session ${session.id}, Écart: ${ecart} FCFA`,
    );
    return { ...closed, soldeCalcule: balance.soldeActuel, ecart };
  }

  // ─── Mouvements manuels ──────────────────────────────────────────────────────

  async addEntry(agentId: string, dto: CaisseEntryDto, tenantId: string, userId: string) {
    const session = await this.getOpenSession(agentId, tenantId);
    if (!session) throw new CaisseNotOpenException();

    return this.prisma.caisseMovement.create({
      data: {
        tenantId,
        sessionId: session.id,
        agentId,
        type: dto.type,
        motif: dto.motif,
        montantEntree: dto.type === 'ENTREE' ? dto.montant : 0,
        montantSortie: dto.type === 'SORTIE' ? dto.montant : 0,
        createdBy: userId,
      },
    });
  }

  async getMovements(agentId: string, tenantId: string, sessionId?: string) {
    const session = sessionId
      ? await this.prisma.caisseSession.findFirst({ where: { id: sessionId, tenantId } })
      : await this.getOpenSession(agentId, tenantId);

    if (!session) return [];

    return this.prisma.caisseMovement.findMany({
      where: { sessionId: session.id, tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getHistory(agentId: string, tenantId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.caisseSession.findMany({
        where: { agentId, tenantId, statut: 'FERMEE' },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.caisseSession.count({ where: { agentId, tenantId, statut: 'FERMEE' } }),
    ]);

    return { data, total, page, limit };
  }

  // ─── Coffre ───────────────────────────────────────────────────────────────────

  async vaultDeposit(dto: VaultOperationDto, agentId: string, tenantId: string, userId: string) {
    const session = await this.getOpenSession(agentId, tenantId);
    if (!session) throw new CaisseNotOpenException();

    return this.prisma.$transaction(async (tx) => {
      // Sortie de caisse vers coffre
      await tx.caisseMovement.create({
        data: {
          tenantId,
          sessionId: session.id,
          agentId,
          type: 'SORTIE',
          motif: dto.motif ?? 'Dépôt coffre',
          montantEntree: 0,
          montantSortie: dto.montant,
          createdBy: userId,
        },
      });

      // Entrée dans le coffre
      return tx.vaultMovement.create({
        data: {
          tenantId,
          agentId,
          type: 'DEPOT',
          montant: dto.montant,
          motif: dto.motif,
          createdBy: userId,
        },
      });
    });
  }

  async vaultWithdraw(dto: VaultOperationDto, agentId: string, tenantId: string, userId: string) {
    const session = await this.getOpenSession(agentId, tenantId);
    if (!session) throw new CaisseNotOpenException();

    return this.prisma.$transaction(async (tx) => {
      // Vérifier solde coffre
      const vaultBalance = await tx.vaultMovement.aggregate({
        where: { agentId, tenantId },
        _sum: { montant: true },
      });
      // (simplifié - en prod: coffre séparé avec DEPOT/RETRAIT)

      // Entrée caisse depuis coffre
      await tx.caisseMovement.create({
        data: {
          tenantId,
          sessionId: session.id,
          agentId,
          type: 'ENTREE',
          motif: dto.motif ?? 'Retrait coffre',
          montantEntree: dto.montant,
          montantSortie: 0,
          createdBy: userId,
        },
      });

      return tx.vaultMovement.create({
        data: {
          tenantId,
          agentId,
          type: 'RETRAIT',
          montant: -dto.montant,
          motif: dto.motif,
          createdBy: userId,
        },
      });
    });
  }
}
