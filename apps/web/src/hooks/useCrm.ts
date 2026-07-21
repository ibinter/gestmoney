import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Hooks CRM SuperAdmin — pipeline commercial IBIG Soft (prospects,
 * démonstrations, offres). Branchés sur l'API réelle NestJS
 * (`/superadmin/crm/*`). Aucune donnée fictive : une base vide renvoie une
 * liste vide, que les pages affichent en tant qu'état vide.
 */

// ─── Types alignés sur le schéma Prisma ──────────────────────────────────────
export interface Prospect {
  id: string;
  nom: string;
  prenom: string | null;
  entreprise: string | null;
  fonction: string | null;
  email: string | null;
  telephone: string | null;
  whatsapp: string | null;
  pays: string | null;
  secteur: string | null;
  logiciel: string;
  besoin: string | null;
  budgetIndicatif: string | null;
  origine: string;
  priorite: string;
  score: number;
  statut: string;
  notes: string | null;
  prochainerAction: string | null;
  dateRelance: string | null;
  createdAt: string;
}

export interface ProspectStats {
  total: number;
  nouveaux: number;
  enCours: number;
  gagnes: number;
  perdus: number;
  tauxConversion: number;
}

interface ProspectMini {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone?: string | null;
  pays: string | null;
}

export interface Demonstration {
  id: string;
  prospectId: string | null;
  entreprise: string;
  logiciel: string;
  date: string;
  fuseau: string;
  mode: string;
  lienVisio: string | null;
  agentId: string | null;
  besoins: string | null;
  notes: string | null;
  statut: string;
  compteRendu: string | null;
  confirme: boolean;
  createdAt: string;
  prospect: ProspectMini | null;
}

export interface DemoStats {
  total: number;
  planifiees: number;
  realisees: number;
  annulees: number;
  tauxRealisation: number;
}

export interface Offre {
  id: string;
  reference: string;
  prospectId: string | null;
  entreprise: string;
  logiciel: string;
  formule: string | null;
  nbUtilisateurs: number;
  devise: string;
  prixHT: number;
  remise: number;
  taxes: number;
  prixTTC: number;
  validiteJours: number;
  conditions: string | null;
  statut: string;
  createdAt: string;
  dateExpiration: string;
  prospect: ProspectMini | null;
}

export interface OffreStats {
  total: number;
  pipeline: number;
  converties: number;
  enCours: number;
  tauxConversion: number;
}

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function unwrap<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw?.data)) return raw.data as T[];
  return [];
}

const KEYS = {
  prospects: (p?: Record<string, string>) => ['crm', 'prospects', p] as const,
  prospectStats: ['crm', 'prospects', 'stats'] as const,
  demos: (p?: Record<string, string>) => ['crm', 'demonstrations', p] as const,
  demoStats: ['crm', 'demonstrations', 'stats'] as const,
  offres: (p?: Record<string, string>) => ['crm', 'offres', p] as const,
  offreStats: ['crm', 'offres', 'stats'] as const,
};

// ─── PROSPECTS ───────────────────────────────────────────────────────────────
export function useProspects(params?: Record<string, string>) {
  return useQuery({
    queryKey: KEYS.prospects(params),
    queryFn: async (): Promise<Prospect[]> => {
      const res = await api.get<Paginated<Prospect>>('/superadmin/crm/prospects', {
        params,
      });
      return unwrap<Prospect>(res.data);
    },
    staleTime: 30_000,
  });
}

export function useProspectStats() {
  return useQuery({
    queryKey: KEYS.prospectStats,
    queryFn: async (): Promise<ProspectStats> => {
      const res = await api.get<ProspectStats>('/superadmin/crm/prospects/stats');
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useChangerStatutProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const res = await api.patch(`/superadmin/crm/prospects/${id}/statut`, { statut });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'prospects'] }),
  });
}

// ─── DÉMONSTRATIONS ──────────────────────────────────────────────────────────
export function useDemonstrations(params?: Record<string, string>) {
  return useQuery({
    queryKey: KEYS.demos(params),
    queryFn: async (): Promise<Demonstration[]> => {
      const res = await api.get<Paginated<Demonstration>>(
        '/superadmin/crm/demonstrations',
        { params },
      );
      return unwrap<Demonstration>(res.data);
    },
    staleTime: 30_000,
  });
}

export function useDemoStats() {
  return useQuery({
    queryKey: KEYS.demoStats,
    queryFn: async (): Promise<DemoStats> => {
      const res = await api.get<DemoStats>('/superadmin/crm/demonstrations/stats');
      return res.data;
    },
    staleTime: 30_000,
  });
}

// ─── OFFRES ──────────────────────────────────────────────────────────────────
export function useOffres(params?: Record<string, string>) {
  return useQuery({
    queryKey: KEYS.offres(params),
    queryFn: async (): Promise<Offre[]> => {
      const res = await api.get<Paginated<Offre>>('/superadmin/crm/offres', {
        params,
      });
      return unwrap<Offre>(res.data);
    },
    staleTime: 30_000,
  });
}

export function useOffreStats() {
  return useQuery({
    queryKey: KEYS.offreStats,
    queryFn: async (): Promise<OffreStats> => {
      const res = await api.get<OffreStats>('/superadmin/crm/offres/stats');
      return res.data;
    },
    staleTime: 30_000,
  });
}
