import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import {
  TRANSACTION_EVENTS,
  TransactionCompletedEvent,
  TransactionCreatedEvent,
  TransactionFailedEvent,
} from '../../transactions/events/transaction.events';
import { FLOAT_EVENTS } from '../../float/float.service';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(TRANSACTION_EVENTS.CREATED)
  async onTransactionCreated(event: TransactionCreatedEvent) {
    const { transaction: tx } = event;
    await this.notificationsService.sendSms({
      to: tx.clientPhone,
      message: `GESTMONEY: Transaction ${tx.reference} initiée. Montant: ${tx.montant} FCFA. En attente de traitement.`,
      tenantId: tx.tenantId,
    });
  }

  @OnEvent(TRANSACTION_EVENTS.COMPLETED)
  async onTransactionCompleted(event: TransactionCompletedEvent) {
    const { transaction: tx } = event;
    await this.notificationsService.sendSms({
      to: tx.clientPhone,
      message: `GESTMONEY: Transaction ${tx.reference} CONFIRMÉE. Montant: ${tx.montant} FCFA. Merci.`,
      tenantId: tx.tenantId,
    });
  }

  @OnEvent(TRANSACTION_EVENTS.FAILED)
  async onTransactionFailed(event: TransactionFailedEvent) {
    const { transaction: tx, reason } = event;
    await this.notificationsService.sendSms({
      to: tx.clientPhone,
      message: `GESTMONEY: Transaction ${tx.reference} ECHOUÉE. Raison: ${reason}. Contactez votre agent.`,
      tenantId: tx.tenantId,
    });
  }

  @OnEvent(FLOAT_EVENTS.LOW_BALANCE_ALERT)
  async onFloatLowBalance(payload: {
    agentId: string;
    operateur: string;
    solde: number;
    seuilMin: number;
    tenantId: string;
  }) {
    this.logger.warn(
      `Alerte float bas: Agent ${payload.agentId} / ${payload.operateur} = ${payload.solde} FCFA (seuil: ${payload.seuilMin})`,
    );
    // En production: notifier superviseur/manager via push + email
    await this.notificationsService.sendPush({
      userId: payload.agentId,
      title: 'Alerte Float Bas',
      body: `Votre float ${payload.operateur} est bas: ${payload.solde} FCFA`,
      data: { agentId: payload.agentId, operateur: payload.operateur, solde: payload.solde },
      tenantId: payload.tenantId,
    });
  }

  @OnEvent(FLOAT_EVENTS.REPLENISHMENT_APPROVED)
  async onReplenishmentApproved(payload: { request: any; tenantId: string }) {
    const { request } = payload;
    await this.notificationsService.sendPush({
      userId: request.agentId,
      title: 'Réapprovisionnement Approuvé',
      body: `Votre demande de réappro ${request.operateur} de ${request.montantApprouve} FCFA a été approuvée.`,
      tenantId: payload.tenantId,
    });
  }

  @OnEvent(FLOAT_EVENTS.REPLENISHMENT_REJECTED)
  async onReplenishmentRejected(payload: { request: any; tenantId: string }) {
    const { request } = payload;
    await this.notificationsService.sendPush({
      userId: request.agentId,
      title: 'Réapprovisionnement Rejeté',
      body: `Votre demande de réappro ${request.operateur} a été rejetée: ${request.commentaire}`,
      tenantId: payload.tenantId,
    });
  }
}
