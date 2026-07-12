import {
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
  ): Promise<void> {
    // Vérifier que l'agent existe et est actif
    const agent = await this.prisma.agent.findFirst({
      where: { id: dto.agentId, tenantId },
    });

    if (!agent) throw new AgentNotFoundException(dto.agentId);
    if (agent.statut === 'SUSPENDU') throw new AgentSuspendedException(dto.agentId);

    // Vérifier float suffisant (pour RETRAIT, CASH_OUT)
    const debitTypes = ['RETRAIT', 'CASH_OUT', 'TRANSFERT'];
    if (debitTypes.includes(dto.type)) {
      const floatAccount = await this.prisma.floatAccount.findFirst({
        where: { agentId: dto.agentId, operateur: dto.operateur, tenantId },
      });

      if (!floatAccount || floatAccount.solde < dto.montant) {
        throw new InsufficientFloatException(
          dto.operateur,
          floatAccount?.solde ?? 0,
          dto.montant,
        );
      }
    }

    // Vérifier limites journalières
    if (agent.limiteDailyMontant) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aggregate = await this.prisma.transaction.aggregate({
        where: {
          agentId: dto.agentId,
          tenantId,
          status: 'COMPLETED',
          createdAt: { gte: today },
        },
        _sum: { montant: true },
      });
      const currentTotal = aggregate._sum.montant ?? 0;
      if (currentTotal + dto.montant > agent.limiteDailyMontant) {
        throw new DailyLimitExceededException(
          dto.agentId,
          agent.limiteDailyMontant,
          currentTotal,
        );
      }
    }
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

  async create(dto: CreateTransactionDto, tenantId: string, userId: string): Promise<ITransaction> {
    await this.validateTransaction(dto, tenantId);

    const frais = this.calculateFrais(dto.montant, dto.type, dto.operateur);
    const reference = this.generateReference();

    // Récupérer l'agenceId de l'agent
    const agent = await this.prisma.agent.findFirst({
      where: { id: dto.agentId, tenantId },
      select: { agenceId: true },
    });

    const transaction = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          tenantId,
          reference,
          type: dto.type,
          status: 'PENDING',
          operateur: dto.operateur,
          montant: dto.montant,
          frais,
          commission: 0,
          agentId: dto.agentId,
          agenceId: agent?.agenceId ?? '',
          clientPhone: dto.clientPhone,
          description: dto.description,
          metadata: dto.metadata as any,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'TRANSACTION_CREATED',
          entityType: 'Transaction',
          entityId: created.id,
          details: { reference, type: dto.type, montant: dto.montant },
        },
      });

      return created;
    });

    const txResult = transaction as unknown as ITransaction;
    this.eventEmitter.emit(
      TRANSACTION_EVENTS.CREATED,
      new TransactionCreatedEvent(txResult),
    );

    this.logger.log(`Transaction créée: ${reference} | ${dto.type} | ${dto.montant} FCFA`);
    return txResult;
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
    if (type) where.type = type;
    if (operateur) where.operateur = operateur;
    if (statut) where.status = statut;
    if (agentId) where.agentId = agentId;
    if (agenceId) where.agenceId = agenceId;
    if (montantMin !== undefined || montantMax !== undefined) {
      where.montant = {};
      if (montantMin !== undefined) where.montant.gte = montantMin;
      if (montantMax !== undefined) where.montant.lte = montantMax;
    }
    if (clientPhone) where.clientPhone = { contains: clientPhone };
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
          action: 'TRANSACTION_CANCELLED',
          entityType: 'Transaction',
          entityId: id,
          details: { reference: transaction.reference },
        },
      });

      return result;
    });

    const updatedTx = updated as unknown as ITransaction;
    this.eventEmitter.emit(
      TRANSACTION_EVENTS.CANCELLED,
      new TransactionCancelledEvent(updatedTx, userId),
    );

    return updatedTx;
  }

  async reverse(id: string, tenantId: string, userId: string): Promise<ITransaction> {
    const transaction = await this.findOne(id, tenantId);

    if (transaction.status !== 'COMPLETED') {
      throw new TransactionNotReversibleException(id, transaction.status);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.transaction.update({
        where: { id },
        data: { status: 'REVERSED', updatedAt: new Date() },
      });

      // Créer transaction de reversal
      await tx.transaction.create({
        data: {
          tenantId,
          reference: this.generateReference(),
          type: 'REVERSAL',
          status: 'COMPLETED',
          operateur: transaction.operateur,
          montant: transaction.montant,
          frais: 0,
          commission: 0,
          agentId: transaction.agentId,
          agenceId: transaction.agenceId,
          clientPhone: transaction.clientPhone,
          description: `Reversal de ${transaction.reference}`,
          metadata: { originalTransactionId: id } as any,
          completedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'TRANSACTION_REVERSED',
          entityType: 'Transaction',
          entityId: id,
          details: { reference: transaction.reference },
        },
      });

      return result;
    });

    const updatedTx = updated as unknown as ITransaction;
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
      _sum: { montant: true },
      orderBy: { _sum: { montant: 'desc' } },
      take: 10,
    });

    return {
      periode: { debut, fin },
      stats,
      topAgents: topAgentsRaw.map((a) => ({
        agentId: a.agentId,
        count: a._count.id,
        montant: a._sum.montant ?? 0,
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
        _sum: { montant: true, commission: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
        _sum: { montant: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['operateur'],
        where,
        _count: { id: true },
        _sum: { montant: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      total,
      montantTotal: aggregate._sum.montant ?? 0,
      commissionsTotal: aggregate._sum.commission ?? 0,
      byType: Object.fromEntries(
        byType.map((r) => [r.type, { count: r._count.id, montant: r._sum.montant ?? 0 }]),
      ) as any,
      byOperateur: Object.fromEntries(
        byOperateur.map((r) => [
          r.operateur,
          { count: r._count.id, montant: r._sum.montant ?? 0 },
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

    const rows = data.map((t) =>
      [
        t.reference,
        t.createdAt.toISOString(),
        t.type,
        t.operateur,
        t.montant,
        t.frais,
        t.commission,
        t.status,
        t.agentId,
        t.clientPhone,
        `"${t.description ?? ''}"`,
      ].join(','),
    );

    return [headers, ...rows].join('\n');
  }
}
