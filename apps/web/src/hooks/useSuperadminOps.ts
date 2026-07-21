import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Hooks de consultation pour la console SuperAdmin (Paiements / Licences /
 * Analytics), branchés sur le module API `superadmin/ops`.
 *
 * RÈGLE D'HONNÊTETÉ : on ne retombe JAMAIS sur des fixtures. En cas d'erreur,
 * react-query expose `isError` et la page affiche un état d'erreur explicite ;
 * base vide → liste vide → état vide explicite. Les métriques que l'API laisse
 * à `null` sont rendues « — » côté page.
 */

// ─── Types renvoyés par l'API ────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OpsPaiement {
  id: string;
  reference: string;
  montant: number;
  devise: string;
  provider: string;
  providerRef: string | null;
  statut: string;
  tenantId: string | null;
  tenantNom: string | null;
  tenantSlug: string | null;
  validePar: string | null;
  valideAt: string | null;
  rembourseAt: string | null;
  createdAt: string;
}

export interface OpsPaiementsStats {
  totalEncaisse: number;
  nbReussis: number;
  totalEnAttente: number;
  nbEnAttente: number;
  parStatut: { statut: string; nombre: number; montant: number }[];
  parProvider: { provider: string; nombre: number; montant: number }[];
}

export interface OpsLicence {
  id: string;
  tenant: string;
  slug: string;
  pays: string;
  devise: string;
  statut: string;
  plan: string;
  echeance: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  nbUtilisateurs: number;
  dernierMontant: number | null;
  dernierEvenement: { type: string; plan: string | null; motif: string | null; date: string } | null;
  createdAt: string;
}

export interface OpsLicencesStats {
  total: number;
  parStatut: { statut: string; nombre: number }[];
  parPlan: { plan: string; nombre: number }[];
  mrr: number | null;
  arr: number | null;
}

export interface OpsAnalytics {
  periode: { debut: string; fin: string };
  tenants: { parStatut: { statut: string; nombre: number }[] };
  utilisateurs: { total: number; actifs: number };
  transactions: { nombre: number; montant: number };
  paiements: { nbReussis: number; montantReussi: number };
  web: {
    nbEvenements: number;
    sessionsUniques: number | null;
    evenementsParType: { type: string; nombre: number }[] | null;
    paysTop: { pays: string; sessions: number }[] | null;
  } | null;
  tauxRebond: number | null;
  tauxConversion: number | null;
}

interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

const KEYS = {
  paiements: (p?: Record<string, string>) => ['ops', 'paiements', p] as const,
  paiementsStats: ['ops', 'paiements', 'stats'] as const,
  licences: (p?: Record<string, string>) => ['ops', 'licences', p] as const,
  licencesStats: ['ops', 'licences', 'stats'] as const,
  licencesHistorique: (p?: Record<string, string>) => ['ops', 'licences', 'historique', p] as const,
  analytics: (p?: Record<string, string>) => ['ops', 'analytics', p] as const,
};

// ─── Paiements ───────────────────────────────────────────────────────────────

export function useOpsPaiements(params?: Record<string, string>) {
  return useQuery({
    queryKey: KEYS.paiements(params),
    queryFn: async (): Promise<Paginated<OpsPaiement>> => {
      const res = await api.get('/superadmin/ops/paiements', { params });
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useOpsPaiementsStats() {
  return useQuery({
    queryKey: KEYS.paiementsStats,
    queryFn: async (): Promise<OpsPaiementsStats> => {
      const res = await api.get('/superadmin/ops/paiements/stats');
      return res.data;
    },
    staleTime: 30_000,
  });
}

// ─── Licences ────────────────────────────────────────────────────────────────

export function useOpsLicences(params?: Record<string, string>) {
  return useQuery({
    queryKey: KEYS.licences(params),
    queryFn: async (): Promise<Paginated<OpsLicence>> => {
      const res = await api.get('/superadmin/ops/licences', { params });
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useOpsLicencesStats() {
  return useQuery({
    queryKey: KEYS.licencesStats,
    queryFn: async (): Promise<OpsLicencesStats> => {
      const res = await api.get('/superadmin/ops/licences/stats');
      return res.data;
    },
    staleTime: 30_000,
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export function useOpsAnalytics(params?: Record<string, string>) {
  return useQuery({
    queryKey: KEYS.analytics(params),
    queryFn: async (): Promise<OpsAnalytics> => {
      const res = await api.get('/superadmin/ops/analytics', { params });
      return res.data;
    },
    staleTime: 30_000,
  });
}
