import { create } from 'zustand';
import { DashboardStats, RecommandationIA } from '@/types';
import { mockDashboardStats, mockRecommandationIA } from '@/lib/fixtures';
import api from '@/lib/api';

interface DashboardStore {
  stats: DashboardStats;
  recommandationIA: RecommandationIA | null;
  isLoading: boolean;
  lastUpdated: string | null;
  setStats: (stats: DashboardStats) => void;
  setRecommandationIA: (rec: RecommandationIA | null) => void;
  dismissRecommandation: () => void;
  refreshStats: () => Promise<void>;
}

function mapStats(raw: Record<string, unknown>): DashboardStats {
  return {
    transactions: {
      nbAujourdhui: Number((raw.transactions as Record<string, unknown>)?.todayCount ?? (raw.transactions as Record<string, unknown>)?.nbAujourdhui ?? 0),
      montantAujourdhui: Number((raw.transactions as Record<string, unknown>)?.todayAmount ?? (raw.transactions as Record<string, unknown>)?.montantAujourdhui ?? 0),
      variationPct: Number((raw.transactions as Record<string, unknown>)?.variationPct ?? 0),
      enAttente: Number((raw.transactions as Record<string, unknown>)?.pending ?? (raw.transactions as Record<string, unknown>)?.enAttente ?? 0),
    },
    caisse: {
      soldeActuel: Number((raw.caisse as Record<string, unknown>)?.balance ?? (raw.caisse as Record<string, unknown>)?.soldeActuel ?? 0),
      entrees: Number((raw.caisse as Record<string, unknown>)?.entrees ?? 0),
      sorties: Number((raw.caisse as Record<string, unknown>)?.sorties ?? 0),
      ecart: Number((raw.caisse as Record<string, unknown>)?.ecart ?? 0),
    },
    float: {
      soldes: (raw.float as Record<string, unknown>)?.soldes as DashboardStats['float']['soldes'] ?? mockDashboardStats.float.soldes,
      alertes: Number((raw.float as Record<string, unknown>)?.alertes ?? 0),
    },
    performances: {
      chiffreAffaires: Number((raw.performances as Record<string, unknown>)?.revenue ?? (raw.performances as Record<string, unknown>)?.chiffreAffaires ?? 0),
      objectif: Number((raw.performances as Record<string, unknown>)?.target ?? (raw.performances as Record<string, unknown>)?.objectif ?? 0),
      progressionPct: Number((raw.performances as Record<string, unknown>)?.progressionPct ?? 0),
      topAgent: (raw.performances as Record<string, unknown>)?.topAgent as DashboardStats['performances']['topAgent'] ?? mockDashboardStats.performances.topAgent,
    },
    agences: {
      nbActives: Number((raw.agences as Record<string, unknown>)?.activeCount ?? (raw.agences as Record<string, unknown>)?.nbActives ?? 0),
      nbTotal: Number((raw.agences as Record<string, unknown>)?.total ?? (raw.agences as Record<string, unknown>)?.nbTotal ?? 0),
      nbAgentsEnLigne: Number((raw.agences as Record<string, unknown>)?.onlineAgents ?? (raw.agences as Record<string, unknown>)?.nbAgentsEnLigne ?? 0),
      nbAgentsTotal: Number((raw.agences as Record<string, unknown>)?.totalAgents ?? (raw.agences as Record<string, unknown>)?.nbAgentsTotal ?? 0),
    },
    clients: {
      nbTotal: Number((raw.clients as Record<string, unknown>)?.total ?? (raw.clients as Record<string, unknown>)?.nbTotal ?? 0),
      nouveaux: Number((raw.clients as Record<string, unknown>)?.new ?? (raw.clients as Record<string, unknown>)?.nouveaux ?? 0),
      actifs: Number((raw.clients as Record<string, unknown>)?.active ?? (raw.clients as Record<string, unknown>)?.actifs ?? 0),
    },
    commissions: {
      duesCeMois: Number((raw.commissions as Record<string, unknown>)?.dueThisMonth ?? (raw.commissions as Record<string, unknown>)?.duesCeMois ?? 0),
      payees: Number((raw.commissions as Record<string, unknown>)?.paid ?? (raw.commissions as Record<string, unknown>)?.payees ?? 0),
      enAttente: Number((raw.commissions as Record<string, unknown>)?.pending ?? (raw.commissions as Record<string, unknown>)?.enAttente ?? 0),
    },
    rapports: {
      dernierRapport: String((raw.rapports as Record<string, unknown>)?.lastReport ?? (raw.rapports as Record<string, unknown>)?.dernierRapport ?? ''),
      alertes: ((raw.rapports as Record<string, unknown>)?.alertes ?? []) as string[],
    },
  };
}

const EMPTY_STATS: DashboardStats = {
  transactions: { nbAujourdhui: 0, montantAujourdhui: 0, variationPct: 0, enAttente: 0 },
  caisse: { soldeActuel: 0, entrees: 0, sorties: 0, ecart: 0 },
  float: { soldes: [], alertes: 0 },
  performances: { chiffreAffaires: 0, objectif: 0, progressionPct: 0, topAgent: null },
  agences: { nbActives: 0, nbTotal: 0, nbAgentsEnLigne: 0, nbAgentsTotal: 0 },
  clients: { nbTotal: 0, nouveaux: 0, actifs: 0 },
  commissions: { duesCeMois: 0, payees: 0, enAttente: 0 },
  rapports: { dernierRapport: '', alertes: [] },
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: EMPTY_STATS,
  recommandationIA: null,
  isLoading: true,
  lastUpdated: null,

  setStats: (stats) => set({ stats, lastUpdated: new Date().toISOString() }),
  setRecommandationIA: (rec) => set({ recommandationIA: rec }),
  dismissRecommandation: () => set({ recommandationIA: null }),

  refreshStats: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/dashboard/stats');
      const raw = res.data?.data ?? res.data ?? {};
      set({
        stats: mapStats(raw as Record<string, unknown>),
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch {
      // Backend absent : fallback sur données démo
      set({ stats: mockDashboardStats, recommandationIA: mockRecommandationIA, isLoading: false, lastUpdated: new Date().toISOString() });
    }
  },
}));
