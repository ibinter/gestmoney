import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionStatsQueryDto } from './dto/transaction-stats.dto';
import {
  TRANSACTION_EVENTS,
  TransactionCancelledEvent,
  TransactionCompletedEvent,
  TransactionCreatedEvent,
  TransactionFailedEvent,
  TransactionReversedEvent,
} from './events/transaction.events';
import {
  ITransaction,
  ITransactionStats,
  ITransactionSummary,
  MobileMoneyOperator,
  TransactionType,
  toPrismaTransactionType,
  fromPrismaTransactionType,
} from './interfaces/transaction.interface';
import {
  AgentNotFoundException,
  AgentSuspendedException,
  DailyLimitExceededException,
  InsufficientFloatException,
  TransactionNotCancellableException,
  TransactionNotFoundException,
  TransactionNotReversibleException,
} from '../common/exceptions/business.exceptions';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Génération référence unique ────────────────────────────────────────────

  private generateReference(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${dateStr}-${random}`;
  }

  // ─── Validation pré-création ─────────────────────────────────────────────────

  private async validateTransaction(
    dto: CreateTransactionDto,
    tenantId: string,
    agentId: string,
    networkId: string,
  ): Promise<void> {
    // Vérifier que l'agent existe et est actif
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, tenantId },
    });

    if (!agent) throw new AgentNotFoundException(agentId);
    if (agent.status === 'SUSPENDED') throw new AgentSuspendedException(agentId);

    // Vérifier float suffisant (pour RETRAIT, CASH_OUT, TRANSFERT). Le compte de
    // float est indexé par réseau (FloatAccount.networkId), pas par opérateur.
    // Contrôle appliqué uniquement si un compte de float existe pour ce couple
    // agent/réseau — sinon on ne bloque pas (float non configuré).
    const debitTypes = ['RETRAIT', 'CASH_OUT', 'TRANSFERT'];
    if (debitTypes.includes(dto.type)) {
      const floatAccount = await this.prisma.floatAccount.findFirst({
        where: { agentId, networkId, tenantId },
      });

      const solde = Number(floatAccount?.balance ?? 0);
      if (floatAccount && solde < dto.montant) {
        throw new InsufficientFloatException(dto.operateur, solde, dto.montant);
      }
    }
  }

  /**
   * Résout l'agent auteur de la transaction. Le formulaire front ne fournit pas
   * d'`agentId` (aucun sélecteur d'agent) : on retombe sur l'agent rattaché à
   * l'utilisateur authentifié. Sans agent identifiable, on lève une erreur claire.
   */
  private async resolveAgentId(
    dto: CreateTransactionDto,
    tenantId: string,
    userId: string,
  ): Promise<string> {
    if (dto.agentId) return dto.agentId;
    const agent = await this.prisma.agent.findFirst({
      where: { userId, tenantId },
      select: { id: true },
    });
    if (!agent) {
      throw new BadRequestException(
        "Impossible de créer la transaction : aucun agent n'est précisé et l'utilisateur courant n'est rattaché à aucun agent.",
      );
    }
    return agent.id;
  }

  // ─── Calcul frais ─────────────────────────────────────────────────────────────

  private calculateFrais(montant: number, type: string, operateur: string): number {
    // Logique simplifiée — à remplacer par la grille tarifaire
    const taux: Record<string, number> = {
      DEPOT: 0,
      RETRAIT: 0.01,
      CASH_IN: 0,
      CASH_OUT: 0.015,
      PAIEMENT_MARCHAND: 0.005,
      TRANSFERT: 0.02,
      ANNULATION: 0,
      REVERSAL: 0,
    };
    return Math.round(montant * (taux[type] ?? 0));
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  /**
   * Normalise un enregistrement Prisma (champs EN : operatorCode/amount/
   * agencyId/receiverPhone/type=enum) vers l'interface ITransaction (champs FR)
   * attendue par les listeners (float, notifications, gateway, comptabilité).
   * Sans ça, `x as unknown as ITransaction` fait lire `undefined` aux listeners.
   */
  private toEventPayload(r: any): ITransaction {
    const uiType = (r.metadata && (r.metadata as any).uiType) as
      | string
      | undefined;
    return {
      id: r.id,
      tenantId: r.tenantId,
      reference: r.reference,
      type: (uiType as TransactionType) ?? fromPrismaTransactionType(String(r.type)),
      status: r.status,
      operateur: r.operatorCode as MobileMoneyOperator,
      montant: Number(r.amount ?? 0),
      frais: Number(r.fee ?? 0),
      commission: Number(r.commission ?? 0),
      agentId: r.agentId,
      agenceId: r.agencyId,
      clientPhone: r.receiverPhone ?? '',
      description: r.description ?? undefined,
      metadata: (r.metadata as Record<string, unknown>) ?? undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      completedAt: r.completedAt ?? undefined,
    };
  }

  async create(dto: CreateTransactionDto, tenantId: string, userId: string): Promise<ITransaction> {
    // 1. Résoudre l'agent (fourni ou déduit de l'utilisateur courant).
    const agentId = await this.resolveAgentId(dto, tenantId, userId);

    // 2. Résoudre le réseau à partir de l'opérateur : `networkId` est OBLIGATOIRE
    //    sur Transaction. Son absence provoquait une erreur Prisma 500 à chaque
    //    création.
    const network = await this.prisma.network.findUnique({
      where: {
        tenantId_operatorCode: { tenantId, operatorCode: dto.operateur },
      },
      select: { id: true },
    });
    if (!network) {
      throw new BadRequestException(
        `Aucun réseau configuré pour l'opérateur « ${dto.operateur} » sur ce tenant.`,
      );
    }

    await this.validateTransaction(dto, tenantId, agentId, network.id);

    const frais = this.calculateFrais(dto.montant, dto.type, dto.operateur);
    const reference = this.generateReference();

    // Récupérer l'agencyId de l'agent
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, tenantId },
      select: { agencyId: true },
    });

    const transaction = await this.prisma.$transaction(async (tx) => {
      const txData: any = {
        tenantId,
        reference,
        // Enum Prisma strict : mapper le type métier FR (DEPOT/CASH_IN…) vers
        // l'enum réel (DEPOSIT/WITHDRAWAL…). On garde le type métier d'origine
        // dans metadata.uiType pour un affichage exact côté front.
        type: toPrismaTransactionType(dto.type),
        status: 'PENDING',
        operatorCode: dto.operateur,
        networkId: network.id,
        amount: dto.montant,
        fee: frais,
        netAmount: dto.montant - frais,
        commission: 0,
        currency: 'XOF',
        agentId,
        agencyId: agent?.agencyId ?? '',
        receiverPhone: dto.clientPhone,
        receiverName: dto.clientNom,
        description: dto.description,
        metadata: { ...(dto.metadata ?? {}), uiType: dto.type },
      };
      const created = await tx.transaction.create({ data: txData });

      // Audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'CREATE',
          resource: 'Transaction',
          resourceId: created.id,
          newValues: { reference, type: dto.type, amount: dto.montant } as any,
        },
      });

      return created;
    });

    const txResult = this.toEventPayload(transaction);
    this.eventEmitter.emit(
      TRANSACTION_EVENTS.CREATED,
      new TransactionCreatedEvent(txResult),
    );

    this.logger.log(`Transaction créée: ${reference} | ${dto.type} | ${dto.montant} FCFA`);
    return txResult;
  }

  /**
   * Valide (complète) une transaction PENDING. Émet l'évènement COMPLETED qui
   * déclenche l'enregistrement de la commission (CommissionListener). Sans cette
   * action, aucune transaction n'atteignait jamais l'état COMPLETED et AUCUNE
   * commission n'était donc calculée.
   */
  async complete(id: string, tenantId: string, userId: string): Promise<ITransaction> {
    const transaction = await this.findOne(id, tenantId);

    if (transaction.status !== 'PENDING') {
      throw new BadRequestException(
        `Transaction ${id} non complétable (statut actuel: ${transaction.status}).`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.transaction.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'UPDATE',
          resource: 'Transaction',
          resourceId: id,
          newValues: { status: 'COMPLETED', reference: transaction.reference } as any,
        },
      });

      // Cohérence inter-modules : marquer l'agent actif et propager les agrégats
      // au client concerné (rattachement par numéro de téléphone).
      await tx.agent.update({
        where: { id: result.agentId },
        data: { lastActivityAt: new Date() },
      });
      if (result.receiverPhone) {
        await tx.customer.updateMany({
          where: { tenantId, phoneNumber: result.receiverPhone },
          data: {
            totalTransactions: { increment: 1 },
            totalVolume: { increment: Number(result.amount) },
            lastTransactionAt: new Date(),
          },
        });
      }

      return result;
    });

    const completedTx = this.toEventPayload(updated);
    this.eventEmitter.emit(
      TRANSACTION_EVENTS.COMPLETED,
      new TransactionCompletedEvent(completedTx),
    );

    this.logger.log(`Transaction complétée: ${transaction.reference}`);
    return completedTx;
  }

  async findAll(
    query: QueryTransactionDto,
    tenantId: string,
  ): Promise<{ data: ITransaction[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateDebut,
      dateFin,
      type,
      operateur,
      statut,
      agentId,
      agenceId,
      montantMin,
      montantMax,
      clientPhone,
      search,
    } = query;

    const where: any = { tenantId };

    if (dateDebut || dateFin) {
      where.createdAt = {};
      if (dateDebut) where.createdAt.gte = new Date(dateDebut);
      if (dateFin) where.createdAt.lte = new Date(dateFin);
    }
    // Noms de colonnes RÉELS du schéma Prisma (operatorCode/amount/receiverPhone/
    // agencyId) — les anciens champs FR (operateur/montant/clientPhone/agenceId)
    // n'existent pas et provoquaient une erreur Prisma 500 dès qu'un filtre était
    // fourni (notamment la recherche).
    if (type) where.type = toPrismaTransactionType(type);
    if (operateur) where.operatorCode = operateur;
    if (statut) where.status = statut;
    if (agentId) where.agentId = agentId;
    if (agenceId) where.agencyId = agenceId;
    if (montantMin !== undefined || montantMax !== undefined) {
      where.amount = {};
      if (montantMin !== undefined) where.amount.gte = montantMin;
      if (montantMax !== undefined) where.amount.lte = montantMax;
    }
    if (clientPhone) where.receiverPhone = { contains: clientPhone };
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { receiverPhone: { contains: search } },
        { receiverName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          agent: { select: { id: true, agentCode: true } },
          agency: { select: { id: true, name: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data: data as unknown as ITransaction[], total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<ITransaction> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, tenantId },
    });
    if (!transaction) throw new TransactionNotFoundException(id);
    return transaction as unknown as ITransaction;
  }

  async cancel(id: string, tenantId: string, userId: string): Promise<ITransaction> {
    const transaction = await this.findOne(id, tenantId);

    if (transaction.status !== 'PENDING') {
      throw new TransactionNotCancellableException(id, transaction.status);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.transaction.update({
        where: { id },
        data: { status: 'CANCELLED', updatedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'UPDATE',
          resource: 'Transaction',
          resourceId: id,
          newValues: { status: 'CANCELLED', reference: transaction.reference } as any,
        },
      });

      return result;
    });

    const updatedTx = this.toEventPayload(updated);
    this.eventEmitter.emit(
      TRANSACTION_EVENTS.CANCELLED,
      new TransactionCancelledEvent(updatedTx, userId),
    );

    return updatedTx;
  }

  async reverse(
    id: string,
    tenantId: string,
    userId: string,
    reason = 'TECHNICAL_ERROR',
  ): Promise<ITransaction> {
    const transaction = await this.findOne(id, tenantId);

    if (transaction.status !== 'COMPLETED') {
      throw new TransactionNotReversibleException(id, transaction.status);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Enregistrement Reversal (traçabilité + lien 1:1 avec l'original).
      const reversal = await tx.reversal.create({
        data: {
          tenantId,
          originalTransactionId: id,
          reference: this.generateReference(),
          reason: reason as any,
          description: `Annulation de ${transaction.reference}`,
          amount:
            (transaction as any).amount ?? (transaction as any).montant ?? 0,
          status: 'COMPLETED',
          requestedById: userId,
          approvedById: userId,
          approvedAt: new Date(),
        },
      });

      // 2. Transaction d'origine → REVERSED, liée au reversal, commission annulée.
      const result = await tx.transaction.update({
        where: { id },
        data: {
          status: 'REVERSED',
          reversalId: reversal.id,
          commission: 0,
          updatedAt: new Date(),
        },
      });

      // 3. Annuler la commission générée par la transaction d'origine.
      await tx.commissionEarning.deleteMany({ where: { transactionId: id } });

      // 4. Transaction compensatoire (mouvement inverse)
      const reversalData: any = {
        tenantId,
        reference: this.generateReference(),
        type: 'REVERSAL',
        status: 'COMPLETED',
        operatorCode: (transaction as any).operatorCode ?? (transaction as any).operateur,
        networkId: (transaction as any).networkId,
        amount: (transaction as any).amount ?? (transaction as any).montant,
        fee: 0,
        netAmount: (transaction as any).amount ?? (transaction as any).montant ?? 0,
        commission: 0,
        currency: 'XOF',
        agentId: transaction.agentId,
        agencyId: (transaction as any).agencyId ?? (transaction as any).agenceId ?? '',
        receiverPhone: (transaction as any).receiverPhone ?? (transaction as any).clientPhone,
        description: `Reversal de ${transaction.reference}`,
        metadata: { originalTransactionId: id },
        completedAt: new Date(),
      };
      await tx.transaction.create({ data: reversalData });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'UPDATE',
          resource: 'Transaction',
          resourceId: id,
          newValues: { status: 'REVERSED', reference: transaction.reference } as any,
        },
      });

      return result;
    });

    const updatedTx = this.toEventPayload(updated);
    this.eventEmitter.emit(
      TRANSACTION_EVENTS.REVERSED,
      new TransactionReversedEvent(updatedTx, userId),
    );

    return updatedTx;
  }

  // ─── Stats ────────────────────────────────────────────────────────────────────

  async getStatsToday(tenantId: string): Promise<ITransactionStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.buildStats(tenantId, today, tomorrow);
  }

  async getSummary(query: TransactionStatsQueryDto, tenantId: string): Promise<ITransactionSummary> {
    const debut = query.dateDebut ? new Date(query.dateDebut) : new Date(Date.now() - 30 * 86400000);
    const fin = query.dateFin ? new Date(query.dateFin) : new Date();

    const stats = await this.buildStats(tenantId, debut, fin);

    // Top agents
    const topAgentsRaw = await this.prisma.transaction.groupBy({
      by: ['agentId'],
      where: {
        tenantId,
        status: 'COMPLETED',
        createdAt: { gte: debut, lte: fin },
      },
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });

    return {
      periode: { debut, fin },
      stats,
      topAgents: topAgentsRaw.map((a) => ({
        agentId: a.agentId,
        count: a._count.id,
        montant: Number(a._sum.amount ?? 0),
      })),
    };
  }

  private async buildStats(
    tenantId: string,
    debut: Date,
    fin: Date,
  ): Promise<ITransactionStats> {
    const where = {
      tenantId,
      createdAt: { gte: debut, lte: fin },
    };

    const [total, aggregate, byType, byOperateur, byStatus] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true, commission: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['operatorCode'],
        where,
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      total,
      montantTotal: Number(aggregate._sum.amount ?? 0),
      commissionsTotal: Number(aggregate._sum.commission ?? 0),
      byType: Object.fromEntries(
        byType.map((r) => [r.type, { count: r._count.id, montant: Number(r._sum.amount ?? 0) }]),
      ) as any,
      byOperateur: Object.fromEntries(
        byOperateur.map((r) => [
          r.operatorCode,
          { count: r._count.id, montant: Number(r._sum.amount ?? 0) },
        ]),
      ) as any,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count.id])) as any,
    };
  }

  // ─── Import / Export ─────────────────────────────────────────────────────────

  async bulkImport(
    file: Express.Multer.File,
    tenantId: string,
    userId: string,
  ): Promise<{ imported: number; errors: string[] }> {
    const content = file.buffer.toString('utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    const errors: string[] = [];
    let imported = 0;

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      try {
        const [montant, type, operateur, agentId, clientPhone, description] = lines[i].split(',');
        const dto: CreateTransactionDto = {
          montant: parseFloat(montant),
          type: type.trim() as any,
          operateur: operateur.trim() as any,
          agentId: agentId.trim(),
          clientPhone: clientPhone.trim(),
          description: description?.trim(),
        };
        await this.create(dto, tenantId, userId);
        imported++;
      } catch (err: any) {
        errors.push(`Ligne ${i + 1}: ${err.message}`);
      }
    }

    return { imported, errors };
  }

  async exportCsv(query: QueryTransactionDto, tenantId: string): Promise<string> {
    const { data } = await this.findAll({ ...query, limit: 10000 }, tenantId);

    const headers = [
      'Reference',
      'Date',
      'Type',
      'Operateur',
      'Montant',
      'Frais',
      'Commission',
      'Statut',
      'Agent',
      'Client',
      'Description',
    ].join(',');

    const rows = data.map((t) => {
      const r = t as any;
      const createdAt =
        r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? '');
      return [
        r.reference,
        createdAt,
        r.metadata?.uiType ?? r.type,
        r.operatorCode ?? r.operateur,
        r.amount ?? r.montant,
        r.fee ?? r.frais,
        r.commission,
        r.status,
        r.agentId,
        r.receiverPhone ?? r.clientPhone,
        `"${r.description ?? ''}"`,
      ].join(',');
    });

    return [headers, ...rows].join('\n');
  }
}
