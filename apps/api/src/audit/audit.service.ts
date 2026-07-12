import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditDto } from './dto/query-audit.dto';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface SuspiciousActivity {
  userId: string;
  reason: string;
  count: number;
  period: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action,
          entityType: resource,
          details: data ?? {},
          // ipAddress et userAgent si le modèle le supporte
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

    const where: any = { tenantId };

    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (userId) where.userId = userId;
    if (resource) where.entityType = resource;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
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

    return { data: data as unknown as AuditLogEntry[], total, page, limit };
  }

  async findById(id: string, tenantId: string): Promise<AuditLogEntry> {
    const log = await this.prisma.auditLog.findFirst({ where: { id, tenantId } });
    if (!log) throw new NotFoundException(`Entrée audit ${id} introuvable`);
    return log as unknown as AuditLogEntry;
  }

  async getByUser(userId: string, tenantId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = { tenantId, userId };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ─── Événements sécurité ──────────────────────────────────────────────────────

  async getSecurityEvents(
    tenantId: string,
    period: { start: Date; end: Date },
  ) {
    const securityActions = [
      'LOGIN',
      'LOGOUT',
      'LOGIN_FAILED',
      'PASSWORD_RESET',
      'TWO_FA_ENABLED',
      'TWO_FA_DISABLED',
      'ACCOUNT_LOCKED',
      'TOKEN_REFRESHED',
    ];

    const where = {
      tenantId,
      action: { in: securityActions },
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
      events: data,
      summary: byAction.map((r) => ({ action: r.action, count: r._count.id })),
    };
  }

  // ─── Mouvements financiers ────────────────────────────────────────────────────

  async getFinancialAudit(
    tenantId: string,
    page = 1,
    limit = 50,
  ) {
    const financialActions = [
      'TRANSACTION_CREATED',
      'TRANSACTION_COMPLETED',
      'TRANSACTION_CANCELLED',
      'TRANSACTION_REVERSED',
      'FLOAT_REPLENISHMENT',
      'COMMISSION_PAID',
    ];

    const skip = (page - 1) * limit;
    const where = { tenantId, action: { in: financialActions } };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
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

    // Trop d'échecs de connexion
    const loginFailed = await this.prisma.auditLog.count({
      where: {
        tenantId,
        userId,
        action: 'LOGIN_FAILED',
        createdAt: { gte: new Date(Date.now() - 900000) }, // 15 min
      },
    });

    if (loginFailed >= 5) {
      alerts.push({
        userId,
        reason: `${loginFailed} tentatives de connexion échouées en 15 minutes`,
        count: loginFailed,
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
          l.entityType ?? '',
          JSON.stringify(l.details ?? {}),
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
${data.map((l) => `<tr><td>${l.createdAt.toLocaleString('fr-FR')}</td><td>${l.action}</td><td>${l.userId ?? '-'}</td><td>${l.entityType ?? '-'}</td></tr>`).join('')}
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
      byAction: byAction.map((r) => ({ action: r.action, count: r._count.id })),
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
