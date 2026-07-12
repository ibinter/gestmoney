import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CommissionsService } from '../commissions.service';
import {
  TRANSACTION_EVENTS,
  TransactionCompletedEvent,
} from '../../transactions/events/transaction.events';

@Injectable()
export class CommissionListener {
  private readonly logger = new Logger(CommissionListener.name);

  constructor(private readonly commissionsService: CommissionsService) {}

  @OnEvent(TRANSACTION_EVENTS.COMPLETED)
  async handleTransactionCompleted(event: TransactionCompletedEvent): Promise<void> {
    const { transaction } = event;

    try {
      await this.commissionsService.recordCommission(
        transaction.id,
        transaction.agentId,
        transaction.agenceId,
        transaction.montant,
        transaction.type,
        transaction.operateur,
        transaction.tenantId,
      );

      this.logger.log(`Commission calculée pour transaction ${transaction.reference}`);
    } catch (error: any) {
      this.logger.error(
        `Erreur calcul commission pour ${transaction.reference}: ${error.message}`,
      );
    }
  }
}
