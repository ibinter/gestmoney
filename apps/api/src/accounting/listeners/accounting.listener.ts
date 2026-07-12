import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountingService } from '../accounting.service';
import {
  TRANSACTION_EVENTS,
  TransactionCompletedEvent,
} from '../../transactions/events/transaction.events';

@Injectable()
export class AccountingListener {
  private readonly logger = new Logger(AccountingListener.name);

  constructor(
    private readonly accountingService: AccountingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Écoute l'événement transaction.completed et génère automatiquement
   * les écritures comptables en partie double (SYSCOHADA).
   *
   * L'écriture est générée uniquement si un exercice fiscal ouvert existe
   * pour la date de la transaction.
   */
  @OnEvent(TRANSACTION_EVENTS.COMPLETED, { async: true })
  async handleTransactionCompleted(event: TransactionCompletedEvent): Promise<void> {
    const { transaction } = event;

    try {
      this.logger.log(
        `[ACCOUNTING] Transaction complétée: ${transaction.reference} (${transaction.type})`,
      );

      // Trouver l'exercice fiscal ouvert couvrant la date de la transaction
      const txDate = transaction.completedAt ?? transaction.createdAt;
      const fiscalYear = await this.prisma.fiscalYear.findFirst({
        where: {
          tenantId: transaction.tenantId,
          isClosed: false,
          startDate: { lte: txDate },
          endDate: { gte: txDate },
        },
        orderBy: { startDate: 'desc' },
      });

      if (!fiscalYear) {
        this.logger.warn(
          `[ACCOUNTING] Aucun exercice fiscal ouvert pour ${transaction.reference}` +
            ` (tenant: ${transaction.tenantId}, date: ${txDate.toISOString()})`,
        );
        return;
      }

      // Utiliser la méthode sécurisée qui mappe les types Prisma → ITransaction
      const entry = await this.accountingService.generateEntryFromTransactionId(
        transaction.id,
        (fiscalYear as any).id,
        transaction.tenantId,
        'SYSTEM',
      );

      if (entry) {
        this.logger.log(
          `[ACCOUNTING] Écriture auto: ${(entry as any).reference} ← ${transaction.reference}`,
        );
      }
    } catch (error: any) {
      // Un listener ne doit jamais propager d'exception
      this.logger.error(
        `[ACCOUNTING] Erreur comptabilisation ${transaction.reference}: ${error.message}`,
        error.stack,
      );
    }
  }
}
