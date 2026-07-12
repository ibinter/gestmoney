import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFloatMovementDto } from './dto/create-float-movement.dto';
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

@Injectable()
export class FloatService {
  private readonly logger = new Logger(FloatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Opérations atomiques float ─────────────────────────────────────────────

  async debitFloat(
    agentId: string,
    operateur: MobileMoneyOperator,
    montant: number,
    tenantId: string,
    transactionId?: string,
    motif?: string,
  ): Promise<void> {
    const account = await this.prisma.floatAccount.findFirst({
      where: { agentId, operateur, tenantId },
    });

    if (!account) throw new FloatAccountNotFoundException(agentId, operateur);
    if (account.solde < montant) {
      throw new InsufficientFloatException(operateur, account.solde, montant);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.floatAccount.update({
        where: { id: account.id },
        data: { solde: { decrement: montant } },
      });

      await tx.floatMovement.create({
        data: {
          tenantId,
          floatAccountId: account.id,
          agentId,
          operateur,
          type: 'DEBIT',
          montant,
          soldeAvant: account.solde,
          soldeApres: account.solde - montant,
          transactionId,
          motif,
        },
      });
    });

    // Vérifier seuil après débit
    const updated = await this.prisma.floatAccount.findUnique({ where: { id: account.id } });
    if (updated && updated.seuilMin && updated.solde <= updated.seuilMin) {
      this.logger.warn(`Float bas: Agent ${agentId} / ${operateur} = ${updated.solde} FCFA`);
      this.eventEmitter.emit(FLOAT_EVENTS.LOW_BALANCE_ALERT, {
        agentId,
        operateur,
        solde: updated.solde,
        seuilMin: updated.seuilMin,
        tenantId,
      });
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
    const account = await this.prisma.floatAccount.findFirst({
      where: { agentId, operateur, tenantId },
    });

    if (!account) throw new FloatAccountNotFoundException(agentId, operateur);

    await this.prisma.$transaction(async (tx) => {
      await tx.floatAccount.update({
        where: { id: account.id },
        data: { solde: { increment: montant } },
      });

      await tx.floatMovement.create({
        data: {
          tenantId,
          floatAccountId: account.id,
          agentId,
          operateur,
          type: 'CREDIT',
          montant,
          soldeAvant: account.solde,
          soldeApres: account.solde + montant,
          transactionId,
          motif,
        },
      });
    });
  }

  // ─── Consultation ─────────────────────────────────────────────────────────────

  async getFloatAccounts(tenantId: string, agenceId?: string, operateur?: string) {
    return this.prisma.floatAccount.findMany({
      where: {
        tenantId,
        ...(agenceId && { agent: { agenceId } }),
        ...(operateur && { operateur }),
      },
      include: { agent: { select: { nom: true, prenom: true, agenceId: true } } },
      orderBy: { solde: 'asc' },
    });
  }

  async getAgentFloat(agentId: string, tenantId: string) {
    return this.prisma.floatAccount.findMany({
      where: { agentId, tenantId },
      orderBy: { operateur: 'asc' },
    });
  }

  async getNetworkSummary(tenantId: string) {
    const accounts = await this.prisma.floatAccount.groupBy({
      by: ['operateur'],
      where: { tenantId },
      _sum: { solde: true },
      _count: { id: true },
      _avg: { solde: true },
    });

    return accounts.map((a) => ({
      operateur: a.operateur,
      totalFloat: a._sum.solde ?? 0,
      nombreComptes: a._count.id,
      moyenneFloat: Math.round(a._avg.solde ?? 0),
    }));
  }

  // ─── Demandes de réapprovisionnement ─────────────────────────────────────────

  async requestReplenishment(
    dto: ReplenishmentRequestDto,
    tenantId: string,
    userId: string,
  ) {
    const account = await this.prisma.floatAccount.findFirst({
      where: { agentId: dto.agentId, operateur: dto.operateur, tenantId },
    });

    if (!account) throw new FloatAccountNotFoundException(dto.agentId, dto.operateur);

    const request = await this.prisma.replenishmentRequest.create({
      data: {
        tenantId,
        agentId: dto.agentId,
        operateur: dto.operateur,
        floatAccountId: account.id,
        montantDemande: dto.montantDemande,
        justification: dto.justification,
        statut: 'PENDING',
        demandeurId: userId,
      },
    });

    this.eventEmitter.emit(FLOAT_EVENTS.REPLENISHMENT_REQUESTED, { request, tenantId });
    return request;
  }

  async approveReplenishment(
    id: string,
    dto: ApproveReplenishmentDto,
    tenantId: string,
    userId: string,
  ) {
    const request = await this.prisma.replenishmentRequest.findFirst({
      where: { id, tenantId, statut: 'PENDING' },
    });

    if (!request) throw new NotFoundException(`Demande de réappro introuvable: ${id}`);

    const montantApprouve = dto.montantApprouve ?? request.montantDemande;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.replenishmentRequest.update({
        where: { id },
        data: {
          statut: 'APPROVED',
          montantApprouve,
          approbateurId: userId,
          commentaire: dto.commentaire,
          approvedAt: new Date(),
        },
      });

      // Créditer le float
      await this.creditFloat(
        request.agentId,
        request.operateur as MobileMoneyOperator,
        montantApprouve,
        tenantId,
        undefined,
        `Réappro approuvée #${id}`,
      );

      return result;
    });

    this.eventEmitter.emit(FLOAT_EVENTS.REPLENISHMENT_APPROVED, { request: updated, tenantId });
    return updated;
  }

  async rejectReplenishment(
    id: string,
    dto: RejectReplenishmentDto,
    tenantId: string,
    userId: string,
  ) {
    const request = await this.prisma.replenishmentRequest.findFirst({
      where: { id, tenantId, statut: 'PENDING' },
    });

    if (!request) throw new NotFoundException(`Demande de réappro introuvable: ${id}`);

    const updated = await this.prisma.replenishmentRequest.update({
      where: { id },
      data: {
        statut: 'REJECTED',
        approbateurId: userId,
        commentaire: dto.motif,
        rejectedAt: new Date(),
      },
    });

    this.eventEmitter.emit(FLOAT_EVENTS.REPLENISHMENT_REJECTED, { request: updated, tenantId });
    return updated;
  }

  async getPendingReplenishments(tenantId: string) {
    return this.prisma.replenishmentRequest.findMany({
      where: { tenantId, statut: 'PENDING' },
      include: { agent: { select: { nom: true, prenom: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Mouvements & Alertes ────────────────────────────────────────────────────

  async getMovements(tenantId: string, agentId?: string, operateur?: string, page = 1, limit = 20) {
    const where: any = { tenantId };
    if (agentId) where.agentId = agentId;
    if (operateur) where.operateur = operateur;

    const [data, total] = await Promise.all([
      this.prisma.floatMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.floatMovement.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getAlerts(tenantId: string) {
    const accounts = await this.prisma.floatAccount.findMany({
      where: { tenantId },
      include: { agent: { select: { nom: true, prenom: true, agenceId: true } } },
    });

    return accounts
      .filter((a) => a.seuilMin && a.solde <= a.seuilMin)
      .map((a) => ({
        agentId: a.agentId,
        agentNom: `${a.agent?.prenom} ${a.agent?.nom}`,
        operateur: a.operateur,
        solde: a.solde,
        seuilMin: a.seuilMin,
        deficit: (a.seuilMin ?? 0) - a.solde,
        niveau: a.solde === 0 ? 'CRITIQUE' : 'BAS',
      }));
  }

  async setThresholds(dto: FloatThresholdDto, tenantId: string) {
    const account = await this.prisma.floatAccount.findFirst({
      where: { agentId: dto.agentId, operateur: dto.operateur, tenantId },
    });

    if (!account) throw new FloatAccountNotFoundException(dto.agentId, dto.operateur);

    return this.prisma.floatAccount.update({
      where: { id: account.id },
      data: { seuilMin: dto.seuilMin, seuilCible: dto.seuilCible },
    });
  }

  // ─── Prévisions (IA simple) ──────────────────────────────────────────────────

  async getForecast(tenantId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const movements = await this.prisma.floatMovement.groupBy({
      by: ['agentId', 'operateur'],
      where: {
        tenantId,
        type: 'DEBIT',
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: { montant: true },
    });

    const accounts = await this.prisma.floatAccount.findMany({
      where: { tenantId },
    });

    return accounts.map((account) => {
      const movement = movements.find(
        (m) => m.agentId === account.agentId && m.operateur === account.operateur,
      );

      const totalDebits7Days = movement?._sum.montant ?? 0;
      const moyenneJournaliere = totalDebits7Days / 7;
      const joursAvantEpuisement =
        moyenneJournaliere > 0 ? Math.floor(account.solde / moyenneJournaliere) : 999;
      const besoinsReappro7Jours = Math.max(0, moyenneJournaliere * 7 - account.solde);

      return {
        agentId: account.agentId,
        operateur: account.operateur,
        soldeActuel: account.solde,
        moyenneConsommationJournaliere: Math.round(moyenneJournaliere),
        joursAvantEpuisement,
        besoinsReappro7Jours: Math.round(besoinsReappro7Jours),
        priorite: joursAvantEpuisement <= 1 ? 'URGENTE' : joursAvantEpuisement <= 3 ? 'HAUTE' : 'NORMALE',
      };
    });
  }
}
