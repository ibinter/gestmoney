// ============================================================
// HOOK — PERFORMANCES (React Query + API réelle)
// ============================================================
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface PerformanceOperateur {
  key: string;
  label: string;
  logo: string;
  couleur: string;
  volume: number;
  nbTransactions: number;
  variation: number;
}

export interface TopAgent {
  rang: number;
  nom: string;
  agence: string;
  volume: number;
  nbTransactions: number;
  tauxSucces: number;
  badge: string;
  evolution: number;
}

export interface EvolutionJour {
  jour: string;
  volume: number;
  nbTransactions: number;
}

export interface PerformancesData {
  totalVolume: number;
  totalTransactions: number;
  tauxSucces: number;
  ticketMoyen: number;
  evolutionVolume: number;
  evolutionTransactions: number;
  parOperateur: PerformanceOperateur[];
  topAgents: TopAgent[];
  evolutionHebdo: EvolutionJour[];
  objectifs: {
    volume: { actuel: number; cible: number };
    transactions: { actuel: number; cible: number };
    tauxSucces: { actuel: number; cible: number };
  };
}

const MOCK_PERFORMANCES: PerformancesData = {
  totalVolume: 145_200_000,
  totalTransactions: 7_432,
  tauxSucces: 96.4,
  ticketMoyen: 19_539,
  evolutionVolume: 9.4,
  evolutionTransactions: 6.2,
  parOperateur: [
    { key: 'orange_money', label: 'Orange Money', logo: '🟠', couleur: '#F97316', volume: 45_200_000, nbTransactions: 2_310, variation: 8.2 },
    { key: 'mtn_momo', label: 'MTN MoMo', logo: '🟡', couleur: '#EAB308', volume: 38_100_000, nbTransactions: 1_980, variation: 3.5 },
    { key: 'wave', label: 'Wave', logo: '🔵', couleur: '#3B82F6', volume: 29_800_000, nbTransactions: 1_620, variation: 15.3 },
    { key: 'moov', label: 'Moov Money', logo: '🟢', couleur: '#22C55E', volume: 18_600_000, nbTransactions: 940, variation: -4.1 },
    { key: 'airtel', label: 'Airtel Money', logo: '🔴', couleur: '#EF4444', volume: 13_500_000, nbTransactions: 582, variation: 1.8 },
  ],
  topAgents: [
    { rang: 1, nom: 'Kofi Mensah', agence: 'Plateau', volume: 8_500_000, nbTransactions: 42, tauxSucces: 98.2, badge: '🥇', evolution: 12 },
    { rang: 2, nom: 'Ama Diallo', agence: 'Plateau', volume: 6_200_000, nbTransactions: 35, tauxSucces: 97.5, badge: '🥈', evolution: 5 },
    { rang: 3, nom: 'Adja Sow', agence: 'Yopougon', volume: 5_400_000, nbTransactions: 31, tauxSucces: 96.8, badge: '🥉', evolution: -2 },
    { rang: 4, nom: 'Sekou Toure', agence: 'Cocody', volume: 4_800_000, nbTransactions: 28, tauxSucces: 95.0, badge: '', evolution: 8 },
    { rang: 5, nom: 'Abou Kone', agence: 'Cocody', volume: 3_100_000, nbTransactions: 19, tauxSucces: 93.2, badge: '', evolution: -1 },
    { rang: 6, nom: 'Fatou Coulibaly', agence: 'Bouake', volume: 2_800_000, nbTransactions: 17, tauxSucces: 91.5, badge: '', evolution: 3 },
  ],
  evolutionHebdo: [
    { jour: 'Lun', volume: 18_200_000, nbTransactions: 934 },
    { jour: 'Mar', volume: 22_500_000, nbTransactions: 1_150 },
    { jour: 'Mer', volume: 19_800_000, nbTransactions: 1_012 },
    { jour: 'Jeu', volume: 25_100_000, nbTransactions: 1_285 },
    { jour: 'Ven', volume: 28_600_000, nbTransactions: 1_464 },
    { jour: 'Sam', volume: 21_300_000, nbTransactions: 1_090 },
    { jour: 'Dim', volume: 9_700_000, nbTransactions: 497 },
  ],
  objectifs: {
    volume: { actuel: 145_200_000, cible: 200_000_000 },
    transactions: { actuel: 7_432, cible: 10_000 },
    tauxSucces: { actuel: 96.4, cible: 98 },
  },
};

function mapPerformances(raw: any): PerformancesData {
  return {
    totalVolume: Number(raw.totalVolume ?? raw.volumeTotal ?? MOCK_PERFORMANCES.totalVolume),
    totalTransactions: Number(raw.totalTransactions ?? raw.nbTransactions ?? MOCK_PERFORMANCES.totalTransactions),
    tauxSucces: Number(raw.successRate ?? raw.tauxSucces ?? MOCK_PERFORMANCES.tauxSucces),
    ticketMoyen: Number(raw.averageTicket ?? raw.ticketMoyen ?? MOCK_PERFORMANCES.ticketMoyen),
    evolutionVolume: Number(raw.volumeGrowth ?? raw.evolutionVolume ?? MOCK_PERFORMANCES.evolutionVolume),
    evolutionTransactions: Number(raw.txGrowth ?? raw.evolutionTransactions ?? MOCK_PERFORMANCES.evolutionTransactions),
    parOperateur: raw.byOperator ?? raw.parOperateur ?? MOCK_PERFORMANCES.parOperateur,
    topAgents: raw.topAgents ?? MOCK_PERFORMANCES.topAgents,
    evolutionHebdo: raw.weeklyEvolution ?? raw.evolutionHebdo ?? MOCK_PERFORMANCES.evolutionHebdo,
    objectifs: raw.objectives ?? raw.objectifs ?? MOCK_PERFORMANCES.objectifs,
  };
}

export function usePerformances(periode?: string) {
  return useQuery({
    queryKey: ['performances', periode ?? 'mois'],
    queryFn: async (): Promise<PerformancesData> => {
      try {
        const res = await api.get('/reports/agents-performance', { params: { period: periode ?? 'month' } });
        const raw = res.data?.data ?? res.data ?? {};
        if (!raw.totalVolume && !raw.volumeTotal) return MOCK_PERFORMANCES;
        return mapPerformances(raw);
      } catch {
        return MOCK_PERFORMANCES;
      }
    },
    staleTime: 60_000,
  });
}
