// ============================================================
// HOOK — ADMINISTRATION (React Query + API réelle)
// Endpoints réels utilisés :
//   GET /users              (users.controller)
//   GET /roles              (roles.controller)
//   GET /audit/logs         (audit.controller)
//   GET /audit/stats        (audit.controller)
//   GET /audit/alerts       (audit.controller)
//   GET /audit/export       (audit.controller)
// Aucune donnée n'est inventée : si l'API ne répond pas, la requête
// remonte l'erreur et la page affiche un état d'erreur explicite.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const ADMIN_KEYS = {
  all: ['administration'] as const,
  users: (page: number) => ['administration', 'users', page] as const,
  roles: () => ['administration', 'roles'] as const,
  auditLogs: (limit: number) => ['administration', 'audit', 'logs', limit] as const,
  auditStats: (depuis: string) => ['administration', 'audit', 'stats', depuis] as const,
  auditAlerts: () => ['administration', 'audit', 'alerts'] as const,
};

// ─── Types (calqués sur les réponses réelles de l'API) ───────────────────────

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: string;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  roles: string[];
};

export type AdminUsersPage = {
  data: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
};

export type AdminRole = {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  nbUtilisateurs: number;
  permissions: string[];
};

export type AdminAuditLog = {
  id: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};

export type AdminAuditStats = {
  total: number;
  byAction: { action: string; count: number }[];
  byUser: { userId: string | null; count: number }[];
};

export type AdminAuditAlert = {
  type: string;
  userId?: string | null;
  count: number;
  period: string;
  severity: string;
  message: string;
};

// ─── Utilisateurs ────────────────────────────────────────────────────────────

export function useAdminUsers(page = 1, limit = 50) {
  return useQuery({
    queryKey: ADMIN_KEYS.users(page),
    queryFn: async (): Promise<AdminUsersPage> => {
      const res = await api.get('/users', { params: { page, limit } });
      const brut = res.data ?? {};
      const items: any[] = Array.isArray(brut) ? brut : brut.data ?? [];
      const meta = brut.meta ?? {};
      return {
        data: items.map((u): AdminUser => ({
          id: String(u.id),
          email: u.email ?? '',
          firstName: u.firstName ?? '',
          lastName: u.lastName ?? '',
          phone: u.phone ?? null,
          status: u.status ?? 'UNKNOWN',
          lastLoginAt: u.lastLoginAt ?? null,
          createdAt: u.createdAt ?? null,
          roles: Array.isArray(u.roles) ? u.roles.map(String) : [],
        })),
        total: Number(meta.total ?? items.length),
        page: Number(meta.page ?? page),
        totalPages: Number(meta.totalPages ?? 1),
      };
    },
    staleTime: 60_000,
    retry: false,
  });
}

// ─── Rôles & permissions ─────────────────────────────────────────────────────

export function useAdminRoles() {
  return useQuery({
    queryKey: ADMIN_KEYS.roles(),
    queryFn: async (): Promise<AdminRole[]> => {
      const res = await api.get('/roles');
      const items: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      return items.map((r): AdminRole => ({
        id: String(r.id),
        name: r.name ?? '',
        description: r.description ?? null,
        isSystem: Boolean(r.isSystem),
        nbUtilisateurs: Number(r._count?.userRoles ?? 0),
        permissions: Array.isArray(r.rolePerms)
          ? r.rolePerms
              .map((rp: any) =>
                rp?.permission ? `${rp.permission.resource}:${rp.permission.action}` : null,
              )
              .filter((p: string | null): p is string => Boolean(p))
          : [],
      }));
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

// ─── Journal d'audit ─────────────────────────────────────────────────────────

export function useAdminAuditLogs(limit = 20) {
  return useQuery({
    queryKey: ADMIN_KEYS.auditLogs(limit),
    queryFn: async (): Promise<AdminAuditLog[]> => {
      const res = await api.get('/audit/logs', { params: { page: 1, limit } });
      const items: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      return items.map((l): AdminAuditLog => ({
        id: String(l.id),
        userId: l.userId ?? null,
        action: l.action ?? '',
        entityType: l.entityType ?? null,
        entityId: l.entityId ?? null,
        ipAddress: l.ipAddress ?? null,
        createdAt: l.createdAt,
      }));
    },
    staleTime: 30_000,
    retry: false,
  });
}

/** Statistiques d'audit sur les `heures` dernières heures. */
export function useAdminAuditStats(heures = 24) {
  const depuis = borneDepuis(heures);
  return useQuery({
    queryKey: ADMIN_KEYS.auditStats(depuis),
    queryFn: async (): Promise<AdminAuditStats> => {
      const res = await api.get('/audit/stats', { params: { startDate: depuis } });
      const d = res.data ?? {};
      return {
        total: Number(d.total ?? 0),
        byAction: Array.isArray(d.byAction)
          ? d.byAction.map((a: any) => ({ action: String(a.action ?? ''), count: Number(a.count ?? 0) }))
          : [],
        byUser: Array.isArray(d.byUser)
          ? d.byUser.map((u: any) => ({ userId: u.userId ?? null, count: Number(u.count ?? 0) }))
          : [],
      };
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useAdminAuditAlerts() {
  return useQuery({
    queryKey: ADMIN_KEYS.auditAlerts(),
    queryFn: async (): Promise<AdminAuditAlert[]> => {
      const res = await api.get('/audit/alerts');
      const items: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      return items.map((a): AdminAuditAlert => ({
        type: String(a.type ?? ''),
        userId: a.userId ?? null,
        count: Number(a.count ?? 0),
        period: String(a.period ?? ''),
        severity: String(a.severity ?? ''),
        message: String(a.message ?? ''),
      }));
    },
    staleTime: 60_000,
    retry: false,
  });
}

/** Télécharge l'export du journal d'audit via GET /audit/export. */
export async function telechargerExportAudit(format: 'CSV' | 'PDF' = 'CSV') {
  const res = await api.get('/audit/export', {
    params: { format },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = format === 'CSV' ? 'audit-log.csv' : 'audit-log.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Borne temporelle stable (arrondie à l'heure) pour éviter de recréer la clé
// de cache à chaque rendu.
function borneDepuis(heures: number): string {
  const maintenant = Date.now();
  const arrondi = Math.floor(maintenant / 3600000) * 3600000;
  return new Date(arrondi - heures * 3600000).toISOString();
}
