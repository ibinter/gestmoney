import { Injectable, Logger } from '@nestjs/common';
import { AppGateway } from './app.gateway';

/**
 * GatewayService — service injectable pour émettre des événements WebSocket
 * depuis n'importe quel autre module de l'application.
 *
 * Exemples d'utilisation :
 *   // Émettre à tout le tenant
 *   this.gatewayService.broadcastToTenant(tenantId, 'transaction:new', data)
 *
 *   // Émettre à un utilisateur spécifique (toutes ses connexions)
 *   this.gatewayService.emitToUser(userId, 'notification:new', notifData)
 *
 *   // Émettre à un agent spécifique
 *   this.gatewayService.emitToAgent(agentId, 'agent:status', statusData)
 *
 *   // API générique
 *   this.gatewayService.emit('float:alert', tenantId, alertData)
 */
@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(private readonly gateway: AppGateway) {}

  /**
   * Émet un événement à tous les clients connectés d'un tenant.
   * C'est l'API principale utilisée par les autres services.
   */
  emit(event: string, tenantId: string, data: any): void {
    const tenantRoom = `tenant:${tenantId}`;
    this.gateway.getServer().to(tenantRoom).emit(event, {
      ...data,
      timestamp: data.timestamp ?? new Date().toISOString(),
    });
    this.logger.debug(`Émis "${event}" → tenant ${tenantId}`);
  }

  /**
   * Émet un événement uniquement à un utilisateur spécifique
   * (toutes ses connexions actives).
   */
  emitToUser(userId: string, event: string, data: any): void {
    const userRoom = `user:${userId}`;
    this.gateway.getServer().to(userRoom).emit(event, {
      ...data,
      timestamp: data.timestamp ?? new Date().toISOString(),
    });
    this.logger.debug(`Émis "${event}" → user ${userId}`);
  }

  /**
   * Alias sémantique pour broadcastToTenant.
   */
  broadcastToTenant(tenantId: string, event: string, data: any): void {
    this.emit(event, tenantId, data);
  }

  /**
   * Émet à la room d'un agent spécifique (clients abonnés via subscribe:agent).
   */
  emitToAgent(agentId: string, event: string, data: any): void {
    const agentRoom = `agent:${agentId}`;
    this.gateway.getServer().to(agentRoom).emit(event, {
      ...data,
      timestamp: data.timestamp ?? new Date().toISOString(),
    });
    this.logger.debug(`Émis "${event}" → agent ${agentId}`);
  }

  /**
   * Broadcast global à tous les clients connectés (toutes tenants).
   * Réserver aux alertes système critiques.
   */
  broadcastGlobal(event: string, data: any): void {
    this.gateway.getServer().emit(event, {
      ...data,
      timestamp: data.timestamp ?? new Date().toISOString(),
    });
    this.logger.warn(`Broadcast GLOBAL "${event}"`);
  }

  // ─── Raccourcis pour les événements métier courants ──────────────────────

  emitTransactionNew(tenantId: string, transaction: any): void {
    this.emit('transaction:new', tenantId, { transaction });
  }

  emitTransactionUpdated(tenantId: string, transaction: any): void {
    this.emit('transaction:updated', tenantId, { transaction });
  }

  emitFloatAlert(tenantId: string, alert: {
    operatorCode: string;
    currentBalance: number;
    threshold: number;
    currency: string;
  }): void {
    this.emit('float:alert', tenantId, alert);
  }

  emitFloatUpdated(tenantId: string, floatData: any): void {
    this.emit('float:updated', tenantId, floatData);
  }

  emitFraudAlert(tenantId: string, alert: any): void {
    this.emit('fraud:alert', tenantId, alert);
  }

  emitNotificationNew(userId: string, notification: any): void {
    this.emitToUser(userId, 'notification:new', { notification });
  }

  emitDashboardStats(tenantId: string, stats: any): void {
    this.emit('dashboard:stats', tenantId, { stats });
  }

  emitAgentStatus(tenantId: string, agentId: string, status: 'online' | 'offline'): void {
    this.emit('agent:status', tenantId, { agentId, status });
  }

  emitSystemAlert(tenantId: string, alert: { level: 'warning' | 'critical'; message: string; code?: string }): void {
    this.emit('system:alert', tenantId, alert);
  }
}
