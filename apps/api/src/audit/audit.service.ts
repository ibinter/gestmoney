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
  oldValues?: any;
  newValues?: any;
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
/**
 * Normalise la pagination. Une valeur par défaut de paramètre (`page = 1`) ne
 * couvre que `undefined` : le contrôleur transmet `null` quand le paramètre de
 * requête est absent, ce qui produit `take: null` et fait rejeter la requête
 * par Prisma (« + take: Int »). C'est ce qui mettait /audit/financial en 500.
 */
function normaliserPagination(page?: unknown, limit?: unknown, limitParDefaut = 50) {
  const p = Math.trunc(Number(page));
  const l = Math.trunc(Number(limit));
  return {
    page: Number.isFinite(p) && p > 0 ? p : 1,
    limit: Number.isFinite(l) && l > 0 ? Math.min(l, 500) : limitParDefaut,
  };
}

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
      oldValues: l.oldValues ?? null,
      newValues: l.newValues ?? null,
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
    /** État de la ressource AVANT la mutation — requis pour la traçabilité complète. */
    oldValues?: any,
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
          // Capture l'état avant mutation pour permettre la reconstruction
          // de l'historique et la détection de modifications frauduleuses.
          ...(oldValues !== undefined && { oldValues }),
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
    const { action, userId, resource, startDate, endDate } = filters;
    const { page: p, limit: l } = normaliserPagination(filters.page, filters.limit);

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
    // Recherche libre dans le champ description ou les valeurs JSON
    if (filters.search) {
      where.description = { contains: filters.search, mode: 'insensitive' };
    }

    const skip = (p - 1) * l;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: data.map((e) => this.toEntry(e)), total, page: p, limit: l };
  }

  async findById(id: string, tenantId: string): Promise<AuditLogEntry> {
    const log = await this.prisma.auditLog.findFirst({ where: { id, tenantId } });
    if (!log) throw new NotFoundException(`Entrée audit ${id} introuvable`);
    return this.toEntry(log);
  }

  async getByUser(userId: string, tenantId: string, page?: number, limit?: number) {
    const { page: p, limit: l } = normaliserPagination(page, limit);
    const skip = (p - 1) * l;
    const where = { tenantId, userId };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: l, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: data.map((e) => this.toEntry(e)), total, page: p, limit: l };
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
    page?: number,
    limit?: number,
  ) {
    const { page: p, limit: l } = normaliserPagination(page, limit);
    const skip = (p - 1) * l;
    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      resource: { in: AuditService.FINANCIAL_RESOURCES },
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: l, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: data.map((e) => this.toEntry(e)), total, page: p, limit: l };
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
    filtres?: { action?: string; userId?: string; resource?: string; search?: string },
  ): Promise<{ buffer: Buffer; filename: string }> {
    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      createdAt: { gte: period.start, lte: period.end },
    };

    if (filtres?.action) {
      const a = this.toAction(filtres.action);
      if (a) where.action = a;
    }
    if (filtres?.userId) where.userId = filtres.userId;
    if (filtres?.resource) where.resource = filtres.resource;
    if (filtres?.search) where.description = { contains: filtres.search, mode: 'insensitive' };

    const data = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });

    const dateSuffix = new Date().toISOString().slice(0, 10);
    const filename = `audit-${tenantId.slice(0, 8)}-${dateSuffix}.csv`;

    if (format === 'CSV') {
      /** Échappe une valeur CSV : entoure de guillemets si nécessaire. */
      const esc = (v: unknown): string => {
        const s = v == null ? '' : String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const headers = ['Date', 'Utilisateur', 'Email', 'Action', 'Ressource', 'ID Ressource', 'Détail', 'IP'];
      const rows = data.map((l) => {
        const nom = l.user ? `${l.user.firstName ?? ''} ${l.user.lastName ?? ''}`.trim() : l.userId ?? '';
        const email = l.user?.email ?? '';
        const detail = l.description ?? JSON.stringify(l.newValues ?? {});
        return [
          l.createdAt.toISOString(),
          nom,
          email,
          l.action,
          l.resource,
          l.resourceId ?? '',
          detail,
          l.ipAddress ?? '',
        ].map(esc).join(',');
      });

      const buffer = Buffer.from([headers.join(','), ...rows].join('\r\n'), 'utf-8');
      return { buffer, filename };
    }

    // HTML fallback
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
    return { buffer: Buffer.from(html, 'utf-8'), filename: filename.replace('.csv', '.html') };
  }

  // ─── Statistiques ─────────────────────────────────────────────────────────────

  async getStats(tenantId: string, period: { start: Date; end: Date }) {
    const where = { tenantId, createdAt: { gte: period.start, lte: period.end } };

    const [total, byAction, byUser, byResource, daily] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      // Activité journalière : requête SQL brute pour éviter le GROUP BY DATE
      // non supporté nativement par Prisma groupBy.
      this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("created_at") AS date, COUNT(*)::integer AS count
        FROM audit_logs
        WHERE tenant_id = ${tenantId}
          AND created_at >= ${period.start}
          AND created_at <= ${period.end}
        GROUP BY DATE("created_at")
        ORDER BY date ASC
      `,
    ]);

    return {
      total,
      byAction: byAction.map((r) => ({ action: r.action as string, count: r._count.id })),
      byUser: byUser.map((r) => ({ userId: r.userId, count: r._count.id })),
      byResource: byResource.map((r) => ({ resource: r.resource, count: r._count.id })),
      daily: daily.map((r) => ({
        date: String(r.date).slice(0, 10),
        count: Number(r.count),
      })),
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
