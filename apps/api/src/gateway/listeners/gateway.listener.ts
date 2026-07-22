import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GatewayService } from '../gateway.service';

/**
 * GatewayListener
 * Écoute les événements internes (EventEmitter2) et les relaie
 * vers les clients WebSocket connectés.
 *
 * Mapping des événements :
 *   transaction.completed  → transaction:new + float:updated
 *   transaction.updated    → transaction:updated
 *   float.low_balance      → float:alert
 *   float.updated          → float:updated
 *   fraud.alert            → fraud:alert
 *   notification.created   → notification:new (à l'utilisateur ciblé)
 *   agent.status_changed   → agent:status
 *   system.alert           → system:alert
 */
@Injectable()
export class GatewayListener {
  private readonly logger = new Logger(GatewayListener.name);

  constructor(private readonly gatewayService: GatewayService) {}

  // ─── Transactions ─────────────────────────────────────────────────────────

  @OnEvent('transaction.completed', { async: true })
  handleTransactionCompleted(payload: {
    transaction: any;
    floatBalance?: any;
  }) {
    // L'événement émis est TransactionCompletedEvent { transaction } : le
    // tenantId se trouve DANS la transaction (pas au premier niveau).
    const tenantId = payload.transaction?.tenantId;
    if (!tenantId) return;
    this.logger.debug(`transaction.completed → WebSocket (tenant: ${tenantId})`);

    // Nouvelle transaction visible dans le feed
    this.gatewayService.emitTransactionNew(tenantId, payload.transaction);

    // Si le float a été mis à jour avec la transaction
    if (payload.floatBalance) {
      this.gatewayService.emitFloatUpdated(tenantId, payload.floatBalance);
    }
  }

  @OnEvent('transaction.updated', { async: true })
  handleTransactionUpdated(payload: { tenantId: string; transaction: any }) {
    this.logger.debug(
      `transaction.updated → WebSocket (tenant: ${payload.tenantId})`,
    );
    this.gatewayService.emitTransactionUpdated(
      payload.tenantId,
      payload.transaction,
    );
  }

  @OnEvent('transaction.failed', { async: true })
  handleTransactionFailed(payload: { tenantId: string; transaction: any }) {
    this.gatewayService.emitTransactionUpdated(
      payload.tenantId,
      { ...payload.transaction, status: 'FAILED' },
    );
  }

  // ─── Float ────────────────────────────────────────────────────────────────

  // Le service float émet `float.low_balance_alert` avec les champs FR
  // { agentId, operateur, solde, seuilMin, tenantId } — on les mappe ici.
  @OnEvent('float.low_balance_alert', { async: true })
  handleFloatLowBalance(payload: {
    tenantId: string;
    agentId?: string;
    operateur: string;
    solde: number;
    seuilMin: number;
  }) {
    if (!payload.tenantId) return;
    this.logger.warn(
      `float.low_balance_alert → float:alert (tenant: ${payload.tenantId}, opérateur: ${payload.operateur})`,
    );
    this.gatewayService.emitFloatAlert(payload.tenantId, {
      operatorCode: payload.operateur,
      currentBalance: payload.solde,
      threshold: payload.seuilMin,
      currency: 'XOF',
    });
  }

  @OnEvent('float.updated', { async: true })
  handleFloatUpdated(payload: { tenantId: string; floatData: any }) {
    this.logger.debug(
      `float.updated → float:updated (tenant: ${payload.tenantId})`,
    );
    this.gatewayService.emitFloatUpdated(payload.tenantId, payload.floatData);
  }

  // ─── Fraude ───────────────────────────────────────────────────────────────

  @OnEvent('fraud.alert', { async: true })
  handleFraudAlert(payload: {
    tenantId: string;
    transactionId: string;
    riskScore: number;
    riskFactors: string[];
    agentId?: string;
  }) {
    this.logger.warn(
      `fraud.alert → WebSocket (tenant: ${payload.tenantId}, tx: ${payload.transactionId})`,
    );
    this.gatewayService.emitFraudAlert(payload.tenantId, payload);
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  @OnEvent('notification.created', { async: true })
  handleNotificationCreated(payload: {
    userId: string;
    tenantId: string;
    notification: any;
  }) {
    this.logger.debug(
      `notification.created → notification:new (user: ${payload.userId})`,
    );
    this.gatewayService.emitNotificationNew(payload.userId, payload.notification);
  }

  // ─── Agents ──────────────────────────────────────────────────────────────

  @OnEvent('agent.status_changed', { async: true })
  handleAgentStatusChanged(payload: {
    tenantId: string;
    agentId: string;
    status: 'online' | 'offline' | 'suspended';
  }) {
    this.logger.debug(
      `agent.status_changed → agent:status (agent: ${payload.agentId})`,
    );
    this.gatewayService.emitAgentStatus(
      payload.tenantId,
      payload.agentId,
      payload.status === 'suspended' ? 'offline' : payload.status,
    );
  }

  // ─── Système ─────────────────────────────────────────────────────────────

  @OnEvent('system.alert', { async: true })
  handleSystemAlert(payload: {
    tenantId?: string;
    level: 'warning' | 'critical';
    message: string;
    code?: string;
  }) {
    this.logger.warn(
      `system.alert [${payload.level}] → WebSocket${payload.tenantId ? ` (tenant: ${payload.tenantId})` : ' (global)'}`,
    );

    if (payload.tenantId) {
      this.gatewayService.emitSystemAlert(payload.tenantId, {
        level: payload.level,
        message: payload.message,
        code: payload.code,
      });
    } else {
      // Alerte globale toutes tenants
      this.gatewayService.broadcastGlobal('system:alert', {
        level: payload.level,
        message: payload.message,
        code: payload.code,
      });
    }
  }
}
