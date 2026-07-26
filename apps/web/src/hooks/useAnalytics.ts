// ============================================================
// HOOK useAnalytics — GESTMONEY
// Récupère les données analytiques du dashboard (30 derniers jours)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
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

// Données mockées pour fallback / développement
const MOCK_ANALYTICS: DashboardAnalytics = {
  transactionsParJour: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    return {
      date: d.toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 80) + 40,
      volume: Math.floor(Math.random() * 3000000) + 500000,
    };
  }),
  transactionsParType: [
    { type: 'DEPOT', count: 320, volume: 8500000 },
    { type: 'RETRAIT', count: 215, volume: 5200000 },
    { type: 'TRANSFERT', count: 87, volume: 3100000 },
    { type: 'PAIEMENT', count: 54, volume: 980000 },
  ],
  topAgents: [
    { nom: 'Diallo Moussa', agence: 'Agence Plateau', nbTransactions: 48, volume: 2450000 },
    { nom: 'Touré Fatima', agence: 'Agence Yopougon', nbTransactions: 35, volume: 1820000 },
    { nom: 'Camara Jean', agence: 'Agence Cocody', nbTransactions: 29, volume: 1345000 },
    { nom: 'Koné Ali', agence: 'Agence Marcory', nbTransactions: 22, volume: 980000 },
    { nom: 'Bamba Sékou', agence: 'Agence Treichville', nbTransactions: 18, volume: 720000 },
  ],
  evolutionFloat: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    return {
      date: d.toISOString().slice(0, 10),
      total: Math.floor(4000000 + Math.sin(i / 4) * 800000 + i * 20000),
    };
  }),
  alertesFloat: [
    { agentNom: 'Koné Ali', agenceNom: 'Agence Marcory', balance: 45000, seuil: 100000 },
    { agentNom: 'Bamba Sékou', agenceNom: 'Agence Treichville', balance: 12000, seuil: 100000 },
  ],
};

export function useAnalytics() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isMock, setIsMock] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await api.get('/analytics/dashboard');
      const raw = res.data?.data ?? res.data ?? {};
      setData(raw as DashboardAnalytics);
      setIsMock(false);
    } catch {
      // Fallback sur données mock si backend inaccessible
      setData(MOCK_ANALYTICS);
      setIsMock(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, isLoading, isError, isMock, refresh: fetchAnalytics };
}
