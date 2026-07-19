'use client';
// ============================================================
// HOOK useAudit — GESTMONEY
// Câblé sur le contrôleur NestJS `audit` (préfixe /api/v1) :
//   GET /audit/alerts    → alertes d'activité suspecte (audit)
//   GET /audit/stats     → statistiques du journal d'audit
//   GET /audit/security  → événements de sécurité
//   GET /audit/financial → mouvements financiers audités
// et sur le contrôleur `ai` : GET /ai/status.
//
// ⚠️ IMPORTANT — AUCUN FALLBACK MOCK ICI (contrairement aux autres hooks).
// Ces données servent à la page de détection de fraude : afficher des
// alertes fictives reviendrait à accuser à tort des agents réels, ou à
// masquer de vraies alertes derrière des données inventées. En cas
// d'erreur API, la requête échoue et la page affiche un état d'erreur.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const KEYS = {
  alerts: ['audit', 'alerts'] as const,
  stats: (jours: number) => ['audit', 'stats', jours] as const,
  security: (jours: number) => ['audit', 'security', jours] as const,
  financial: (limit: number) => ['audit', 'financial', limit] as const,
  aiStatus: ['ai', 'status'] as const,
};

// ─── Types (forme exacte renvoyée par le backend) ─────────────────────────────

/** GET /audit/alerts — AuditService.getAlerts() */
export interface AuditAlerte {
  type: string; // actuellement toujours 'EXCESSIVE_ACTIVITY'
  userId: string | null;
  count: number;
  period: string; // ex. '1h'
  severity: string; // 'HIGH' | 'MEDIUM' tels que renvoyés par le backend
  message: string;
}

/** GET /audit/stats — AuditService.getStats() */
export interface AuditStats {
  total: number;
  byAction: { action: string; count: number }[];
  byUser: { userId: string | null; count: number }[];
}

/** GET /audit/security — AuditService.getSecurityEvents() */
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: unknown;
  createdAt: string;
}

export interface AuditSecurity {
  events: AuditLogEntry[];
  summary: { action: string; count: number }[];
}

/** GET /audit/financial — AuditService.getFinancialAudit() */
export interface AuditFinancial {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

/** GET /ai/status — AiController.status() */
export interface AiStatus {
  sara: string;
  providers: string[];
  activeProvider: string;
  model: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function isoIlYa(jours: number): string {
  return new Date(Date.now() - jours * 86400000).toISOString();
}

/** Alertes d'audit réelles (activité excessive détectée sur le journal). */
export function useAuditAlertes() {
  return useQuery({
    queryKey: KEYS.alerts,
    queryFn: async (): Promise<AuditAlerte[]> => {
      const res = await api.get('/audit/alerts');
      return Array.isArray(res.data) ? (res.data as AuditAlerte[]) : [];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

/** Statistiques du journal d'audit sur une période (jours glissants). */
export function useAuditStats(jours = 1) {
  return useQuery({
    queryKey: KEYS.stats(jours),
    queryFn: async (): Promise<AuditStats> => {
      const res = await api.get('/audit/stats', {
        params: { startDate: isoIlYa(jours), endDate: new Date().toISOString() },
      });
      const d = res.data ?? {};
      return {
        total: Number(d.total ?? 0),
        byAction: Array.isArray(d.byAction) ? d.byAction : [],
        byUser: Array.isArray(d.byUser) ? d.byUser : [],
      };
    },
    staleTime: 60_000,
    retry: 1,
  });
}

/** Événements de sécurité (connexions, échecs, 2FA…) sur une période. */
export function useAuditSecurity(jours = 7) {
  return useQuery({
    queryKey: KEYS.security(jours),
    queryFn: async (): Promise<AuditSecurity> => {
      const res = await api.get('/audit/security', {
        params: { startDate: isoIlYa(jours), endDate: new Date().toISOString() },
      });
      const d = res.data ?? {};
      return {
        events: Array.isArray(d.events) ? d.events : [],
        summary: Array.isArray(d.summary) ? d.summary : [],
      };
    },
    staleTime: 60_000,
    retry: 1,
  });
}

/** Mouvements financiers audités (transactions, float, commissions). */
export function useAuditFinancial(limit = 20) {
  return useQuery({
    queryKey: KEYS.financial(limit),
    queryFn: async (): Promise<AuditFinancial> => {
      const res = await api.get('/audit/financial', { params: { page: 1, limit } });
      const d = res.data ?? {};
      return {
        data: Array.isArray(d.data) ? d.data : [],
        total: Number(d.total ?? 0),
        page: Number(d.page ?? 1),
        limit: Number(d.limit ?? limit),
      };
    },
    staleTime: 60_000,
    retry: 1,
  });
}

/** Statut du moteur IA SARA (providers configurés). */
export function useAiStatus() {
  return useQuery({
    queryKey: KEYS.aiStatus,
    queryFn: async (): Promise<AiStatus> => {
      const res = await api.get('/ai/status');
      const d = res.data ?? {};
      return {
        sara: String(d.sara ?? 'unknown'),
        providers: Array.isArray(d.providers) ? d.providers : [],
        activeProvider: String(d.activeProvider ?? ''),
        model: String(d.model ?? ''),
      };
    },
    staleTime: 300_000,
    retry: 1,
  });
}
