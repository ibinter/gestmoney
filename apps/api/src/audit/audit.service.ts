import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditDto } from './dto/query-audit.dto';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface SuspiciousActivity {
  userId: string;
  reason: string;
  count: number;
  period: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Le modèle Prisma `AuditLog` expose `resource` / `resourceId` / `newValues`
 * (et non `entityType` / `entityId` / `details`), et `action` est l'enum
 * `AuditAction` — pas une chaîne libre. Les requêtes utilisent donc les noms
 * réels, et la réponse HTTP conserve la forme historique attendue par le front.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Valeurs autorisées par l'enum Prisma `AuditAction`. */
  private static readonly ACTIONS = Object.values(AuditAction) as AuditAction[];

  /** Actions de l'enum relevant de la sécurité (accès / cycle de vie compte). */
  private static readonly SECURITY_ACTIONS: AuditAction[] = [
    AuditAction.LOGIN,
    AuditAction.LOGOUT,
    AuditAction.SUSPEND,
    AuditAction.ACTIVATE,
  ];

  /** Ressources considérées comme financières (l'enum action ne les distingue pas). */
  private static readonly FINANCIAL_RESOURCES = [
    'transaction',
    'transactions',
    'reversal',
    'float',
    'float_account',
    'replenishment',
    'replenishment_request',
    'commission',
    'commission_payment',
    'payment',
    'journal_entry',
    'vault_operation',
  ];

  /** Convertit une chaîne en membre de l'enum, ou `undefined` si inconnue. */
  private toAction(value?: string): AuditAction | undefined {
    if (!value) return undefined;
    const upper = value.toUpperCase() as AuditAction;
    return AuditService.ACTIONS.includes(upper) ? upper : undefined;
  }

  /** Mappe une ligne Prisma vers la forme exposée par l'API. */
  private toEntry(l: {
    id: string;
    tenantId: string;
    userId: string | null;
    action: AuditAction;
    resource: string;
    resourceId: string | null;
    newValues: Prisma.JsonValue | null;
    oldValues: Prisma.JsonValue | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }): AuditLogEntry {
    return {
      id: l.id,
      tenantId: l.tenantId,
      userId: l.userId,
      action: l.action,
      entityType: l.resource,
      entityId: l.resourceId,
      details: l.newValues ?? l.oldValues ?? null,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      createdAt: l.createdAt,
    };
  }

  // ─── Enregistrement ───────────────────────────────────────────────────────────

  async log(
    action: string,
    userId: string | undefined,
    resource: string,
    data: any,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const auditAction = this.toAction(action);
    if (!auditAction) {
      this.logger.warn(`Action audit inconnue ignorée: ${action}`);
      return;
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: auditAction,
          resource,
          newValues: data ?? {},
          ipAddress,
          userAgent,
        },
      });
    } catch (err: any) {
      this.logger.error(`Erreur audit log: ${err.message}`);
    }
  }

  // ─── Récupération filtrée ─────────────────────────────────────────────────────

  async getFilteredLogs(
    filters: QueryAuditDto,
    tenantId: string,
  ): Promise<{ data: AuditLogEntry[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50, action, userId, resource, startDate, endDate } = filters;

    const where: Prisma.AuditLogWhereInput = { tenantId };

    // `action` est un enum : pas de `contains`, uniquement une égalité valide.
    const auditAction = this.toAction(action);
    if (auditAction) where.action = auditAction;
    if (userId) where.userId = userId;
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: data.map((l) => this.toEntry(l)), total, page, limit };
  }

  async findById(id: string, tenantId: string): Promise<AuditLogEntry> {
    const log = await this.prisma.auditLog.findFirst({ where: { id, tenantId } });
    if (!log) throw new NotFoundException(`Entrée audit ${id} introuvable`);
    return this.toEntry(log);
  }

  async getByUser(userId: string, tenantId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = { tenantId, userId };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: data.map((l) => this.toEntry(l)), total, page, limit };
  }

  // ─── Événements sécurité ──────────────────────────────────────────────────────

  async getSecurityEvents(
    tenantId: string,
    period: { start: Date; end: Date },
  ) {
    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      action: { in: AuditService.SECURITY_ACTIONS },
      createdAt: { gte: period.start, lte: period.end },
    };

    const [data, byAction] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      events: data.map((l) => this.toEntry(l)),
      summary: byAction.map((r) => ({ action: r.action as string, count: r._count.id })),
    };
  }

  // ─── Mouvements financiers ────────────────────────────────────────────────────

  async getFinancialAudit(
    tenantId: string,
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      resource: { in: AuditService.FINANCIAL_RESOURCES },
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: data.map((l) => this.toEntry(l)), total, page, limit };
  }

  // ─── Détection activité suspecte ──────────────────────────────────────────────

  async detectSuspiciousActivity(userId: string, tenantId: string): Promise<SuspiciousActivity[]> {
    const alerts: SuspiciousActivity[] = [];
    const oneHourAgo = new Date(Date.now() - 3600000);

    // Trop d'actions en 1h
    const recentCount = await this.prisma.auditLog.count({
      where: { tenantId, userId, createdAt: { gte: oneHourAgo } },
    });

    if (recentCount > 100) {
      alerts.push({
        userId,
        reason: `Volume inhabituel: ${recentCount} actions en 1 heure`,
        count: recentCount,
        period: '1h',
        severity: recentCount > 500 ? 'HIGH' : 'MEDIUM',
      });
    }

    // Volume de connexions anormal (l'enum ne distingue pas les échecs)
    const logins = await this.prisma.auditLog.count({
      where: {
        tenantId,
        userId,
        action: AuditAction.LOGIN,
        createdAt: { gte: new Date(Date.now() - 900000) }, // 15 min
      },
    });

    if (logins >= 5) {
      alerts.push({
        userId,
        reason: `${logins} connexions en 15 minutes`,
        count: logins,
        period: '15min',
        severity: 'HIGH',
      });
    }

    return alerts;
  }

  // ─── Export ───────────────────────────────────────────────────────────────────

  async exportAuditLog(
    tenantId: string,
    period: { start: Date; end: Date },
    format: 'CSV' | 'PDF',
  ): Promise<Buffer> {
    const data = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: { gte: period.start, lte: period.end },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    if (format === 'CSV') {
      const headers = ['ID', 'Date', 'Action', 'Utilisateur', 'Entité', 'Détails'];
      const rows = data.map((l) =>
        [
          l.id,
          l.createdAt.toISOString(),
          l.action,
          l.userId ?? '',
          l.resource ?? '',
          JSON.stringify(l.newValues ?? {}),
        ].join(','),
      );
      return Buffer.from([headers.join(','), ...rows].join('\n'), 'utf-8');
    }

    // PDF (HTML)
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Journal d'audit</title>
<style>body{font-family:Arial,sans-serif;margin:40px}table{width:100%;border-collapse:collapse}
th{background:#1a5276;color:white;padding:6px}td{padding:6px;border-bottom:1px solid #ddd;font-size:12px}</style>
</head><body>
<h1>Journal d'audit GESTMONEY</h1>
<p>Période: ${period.start.toLocaleDateString('fr-FR')} → ${period.end.toLocaleDateString('fr-FR')}</p>
<table>
<tr><th>Date</th><th>Action</th><th>Utilisateur</th><th>Entité</th></tr>
${data.map((l) => `<tr><td>${l.createdAt.toLocaleString('fr-FR')}</td><td>${l.action}</td><td>${l.userId ?? '-'}</td><td>${l.resource ?? '-'}</td></tr>`).join('')}
</table></body></html>`;
    return Buffer.from(html, 'utf-8');
  }

  // ─── Statistiques ─────────────────────────────────────────────────────────────

  async getStats(tenantId: string, period: { start: Date; end: Date }) {
    const where = { tenantId, createdAt: { gte: period.start, lte: period.end } };

    const [total, byAction, byUser] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      byAction: byAction.map((r) => ({ action: r.action as string, count: r._count.id })),
      byUser: byUser.map((r) => ({ userId: r.userId, count: r._count.id })),
    };
  }

  // ─── Alertes ──────────────────────────────────────────────────────────────────

  async getAlerts(tenantId: string) {
    const oneHourAgo = new Date(Date.now() - 3600000);

    // Utilisateurs avec activité excessive
    const topUsers = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: { tenantId, createdAt: { gte: oneHourAgo } },
      _count: { id: true },
      having: { id: { _count: { gt: 50 } } },
      orderBy: { _count: { id: 'desc' } },
    });

    const alerts = topUsers.map((u) => ({
      type: 'EXCESSIVE_ACTIVITY',
      userId: u.userId,
      count: u._count.id,
      period: '1h',
      severity: u._count.id > 200 ? 'HIGH' : 'MEDIUM',
      message: `Utilisateur ${u.userId}: ${u._count.id} actions en 1h`,
    }));

    return alerts;
  }
}
