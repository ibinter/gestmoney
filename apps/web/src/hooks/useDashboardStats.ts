// ============================================================
// HOOK useDashboardStats — GESTMONEY
// React Query + polling 30s — données réelles API
// ============================================================
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Transaction {
  id: string;
  type: string;
  montant: number;
  operateur: string;
  statut: 'success' | 'pending' | 'failed' | string;
  clientNom: string;
  agentNom: string;
  agenceNom: string;
  date: string;
}

export interface AgentPerf {
  id: string;
  nom: string;
  nbTransactions: number;
  volume: number;
  commission: number;
  statut: 'actif' | 'inactif';
}

export interface AuditEntry {
  id: string;
  action: string;
  utilisateur: string;
  ressource: string;
  date: string;
  ip: string;
}

export interface DashboardStatsExtended {
  nbTransactionsJour: number;
  volumeJour: number;
  variationPct: number;
  nbAgentsActifs: number;
  nbAgencesActives: number;
  alertesAgentsInactifs: number;
  alertesFloatBas: number;
  commissionsAValider: number;
  transactionsRecentes: Transaction[];
  sparklineData: number[];
  nbAgentsSupervisés: number;
  volumeAgence: number;
  alerteFloatAgence: boolean;
  performancesAgents: AgentPerf[];
  maCommissionMois: number;
  monFloat: number;
  mesTransactions: Transaction[];
  operationsAuditees: number;
  journalAudit: AuditEntry[];
}

function mapApiToStats(raw: any): DashboardStatsExtended {
  const parJour: Array<{ date: string; count: number; volume: number }> = raw.transactionsParJour ?? [];
  const topAgents: Array<{ nom: string; agence: string; nbTransactions: number; volume: number }> = raw.topAgents ?? [];
  const alertesFloat: Array<any> = raw.alertesFloat ?? [];
  const txRecentes: Array<any> = raw.transactionsRecentes ?? [];

  const sparklineData = parJour.slice(-7).map((j) => j.count);

  const transactionsRecentes: Transaction[] = txRecentes.map((t: any) => ({
    id: t.id,
    type: t.type ?? '',
    montant: Number(t.montant ?? t.amount ?? 0),
    operateur: t.operateur ?? t.network?.operatorCode ?? '',
    statut: t.statut ?? t.status ?? 'success',
    clientNom: t.clientNom ?? '',
    agentNom: t.agentNom ?? '',
    agenceNom: t.agenceNom ?? '',
    date: t.date ?? t.createdAt ?? new Date().toISOString(),
  }));

  const performancesAgents: AgentPerf[] = topAgents.map((a, i) => ({
    id: String(i),
    nom: a.nom,
    nbTransactions: a.nbTransactions,
    volume: a.volume,
    commission: Math.round(a.volume * 0.003),
    statut: 'actif' as const,
  }));

  return {
    nbTransactionsJour: raw.nbTransactionsJour ?? 0,
    volumeJour: raw.volumeJour ?? 0,
    variationPct: raw.variationPct ?? 0,
    nbAgentsActifs: raw.nbAgentsActifs ?? topAgents.length,
    nbAgencesActives: raw.nbAgences ?? [...new Set(topAgents.map((a) => a.agence))].length,
    alertesAgentsInactifs: 0,
    alertesFloatBas: alertesFloat.length,
    commissionsAValider: 0,
    transactionsRecentes,
    sparklineData,
    nbAgentsSupervisés: raw.nbAgentsActifs ?? topAgents.length,
    volumeAgence: raw.volumeJour ?? 0,
    alerteFloatAgence: alertesFloat.length > 0,
    performancesAgents,
    maCommissionMois: 0,
    monFloat: 0,
    mesTransactions: transactionsRecentes.slice(0, 5),
    operationsAuditees: 0,
    journalAudit: [],
  };
}

export const DASHBOARD_STATS_KEY = ['dashboard', 'stats'] as const;

export function useDashboardStats() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_STATS_KEY,
    queryFn: async (): Promise<DashboardStatsExtended> => {
      const res = await api.get('/analytics/dashboard');
      const raw = res.data?.data ?? res.data ?? {};
      return mapApiToStats(raw);
    },
    refetchInterval: 30_000,
    staleTime: 0,
    retry: 2,
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isMock: false,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toISOString() : null,
    refresh: () => queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY }),
  };
}
