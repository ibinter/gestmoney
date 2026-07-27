// ============================================================
// HOOK useAnalytics — GESTMONEY
// React Query + polling 30s — données réelles API
// ============================================================
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface JourStat {
  date: string;
  count: number;
  volume: number;
}

export interface TypeStat {
  type: string;
  count: number;
  volume: number;
}

export interface TopAgent {
  nom: string;
  agence: string;
  nbTransactions: number;
  volume: number;
}

export interface FloatJour {
  date: string;
  total: number;
}

export interface AlerteFloat {
  agentNom: string;
  agenceNom: string;
  balance: number;
  seuil: number;
}

export interface DashboardAnalytics {
  transactionsParJour: JourStat[];
  transactionsParType: TypeStat[];
  topAgents: TopAgent[];
  evolutionFloat: FloatJour[];
  alertesFloat: AlerteFloat[];
}

export const ANALYTICS_KEY = ['analytics', 'dashboard'] as const;

export function useAnalytics() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ANALYTICS_KEY,
    queryFn: async (): Promise<DashboardAnalytics> => {
      const res = await api.get('/analytics/dashboard');
      const raw = res.data?.data ?? res.data ?? {};
      return {
        transactionsParJour: raw.transactionsParJour ?? [],
        transactionsParType: raw.transactionsParType ?? [],
        topAgents: raw.topAgents ?? [],
        evolutionFloat: raw.evolutionFloat ?? [],
        alertesFloat: raw.alertesFloat ?? [],
      };
    },
    refetchInterval: 30_000,
    staleTime: 0,
    retry: 2,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isMock: false,
    refresh: () => queryClient.invalidateQueries({ queryKey: ANALYTICS_KEY }),
  };
}
