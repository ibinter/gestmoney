import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FloatService } from '../float.service';
import {
  TRANSACTION_EVENTS,
  TransactionCompletedEvent,
  TransactionReversedEvent,
} from '../../transactions/events/transaction.events';

@Injectable()
export class FloatListener {
  private readonly logger = new Logger(FloatListener.name);

  constructor(private readonly floatService: FloatService) {}

  @OnEvent(TRANSACTION_EVENTS.COMPLETED)
  async handleTransactionCompleted(event: TransactionCompletedEvent): Promise<void> {
    const { transaction } = event;
    const { type, agentId, operateur, montant, tenantId, id: transactionId } = transaction;

    try {
      // Types qui débitent le float de l'agent
      const debitTypes = ['RETRAIT', 'CASH_OUT', 'TRANSFERT'];
      // Types qui créditent le float de l'agent
      const creditTypes = ['DEPOT', 'CASH_IN'];

      if (debitTypes.includes(type)) {
        await this.floatService.debitFloat(
          agentId,
          operateur,
          montant,
          tenantId,
          transactionId,
          `Transaction ${type} - ${transaction.reference}`,
        );
      } else if (creditTypes.includes(type)) {
        await this.floatService.creditFloat(
          agentId,
          operateur,
          montant,
          tenantId,
          transactionId,
          `Transaction ${type} - ${transaction.reference}`,
        );
      }

      this.logger.log(
        `Float mis à jour pour transaction ${transaction.reference} (${type})`,
      );
    } catch (error: any) {
      this.logger.error(
        `Erreur mise à jour float pour ${transaction.reference}: ${error.message}`,
      );
    }
  }

  @OnEvent(TRANSACTION_EVENTS.REVERSED)
  async handleTransactionReversed(event: TransactionReversedEvent): Promise<void> {
    const { transaction } = event;
    const { type, agentId, operateur, montant, tenantId, id: transactionId } = transaction;

    try {
      // Inverser l'opération sur le float
      const wasDebit = ['RETRAIT', 'CASH_OUT', 'TRANSFERT'].includes(type);

      if (wasDebit) {
        await this.floatService.creditFloat(
          agentId,
          operateur,
          montant,
          tenantId,
          transactionId,
          `Reversal transaction ${transaction.reference}`,
        );
      } else {
        await this.floatService.debitFloat(
          agentId,
          operateur,
          montant,
          tenantId,
          transactionId,
          `Reversal transaction ${transaction.reference}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Erreur reversal float pour ${transaction.reference}: ${error.message}`,
      );
    }
  }
}
