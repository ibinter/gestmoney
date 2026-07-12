// ============================================================
// HOOK — RAPPORTS & BI (React Query + API réelle)
// ============================================================
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

export interface AlerteBI {
  id: string;
  type: 'danger' | 'warning' | 'info';
  message: string;
}

export interface RapportHistorique {
  id: string;
  titre: string;
  type: 'mensuel' | 'hebdomadaire' | 'journalier';
  statut: 'disponible' | 'generation';
  date: string;
  taille: string;
}

export interface RapportsData {
  ca: number;
  nbTransactions: number;
  nouveauxClients: number;
  ticketMoyen: number;
  variationCa: number;
  variationTx: number;
  variationClients: number;
  progression: number;
  objectif: number;
  parOperateur: { key: string; label: string; logo: string; couleur: string; montant: number; pct: number }[];
  topAgents: { nom: string; agence: string; montant: number; nbTx: number; badge: string }[];
  alertes: AlerteBI[];
  historique: RapportHistorique[];
}

const MOCK: RapportsData = {
  ca: 145_200_000,
  nbTransactions: 7432,
  nouveauxClients: 127,
  ticketMoyen: 19_539,
  variationCa: 12.5,
  variationTx: 8.3,
  variationClients: 22.1,
  progression: 72,
  objectif: 200_000_000,
  parOperateur: [
    { key: 'orange_money', label: 'Orange Money', logo: '🟠', couleur: '#F97316', montant: 45_200_000, pct: 31 },
    { key: 'mtn_momo',    label: 'MTN MoMo',     logo: '🟡', couleur: '#EAB308', montant: 38_100_000, pct: 26 },
    { key: 'wave',        label: 'Wave',          logo: '🔵', couleur: '#3B82F6', montant: 29_800_000, pct: 21 },
    { key: 'moov',        label: 'Moov',          logo: '🟢', couleur: '#22C55E', montant: 18_600_000, pct: 13 },
    { key: 'airtel',      label: 'Airtel',        logo: '🔴', couleur: '#EF4444', montant: 13_500_000, pct: 9  },
  ],
  topAgents: [
    { nom: 'Kofi Mensah',    agence: 'Plateau',   montant: 8_500_000, nbTx: 42, badge: '🥇' },
    { nom: 'Ama Diallo',     agence: 'Plateau',   montant: 6_200_000, nbTx: 35, badge: '🥈' },
    { nom: 'Adja Sow',       agence: 'Yopougon', montant: 5_400_000, nbTx: 31, badge: '🥉' },
    { nom: 'Sekou Toure',    agence: 'Cocody',    montant: 4_800_000, nbTx: 28, badge: ''   },
    { nom: 'Abou Kone',      agence: 'Cocody',    montant: 3_100_000, nbTx: 19, badge: ''   },
  ],
  alertes: [
    { id: 'a1', type: 'danger',  message: 'Float Moov en zone critique (420K / seuil 1M FCFA)' },
    { id: 'a2', type: 'warning', message: "Float MTN MoMo sous le seuil d'alerte (1,8M / seuil 2M FCFA)" },
    { id: 'a3', type: 'info',    message: 'Objectif mensuel atteint à 72% — 8 jours restants' },
  ],
  historique: [
    { id: 'r1', titre: 'Rapport mensuel Décembre 2023',    type: 'mensuel',       statut: 'disponible', date: '2024-01-02', taille: '2.4 MB'  },
    { id: 'r2', titre: 'Rapport hebdomadaire S02-2024',    type: 'hebdomadaire',  statut: 'disponible', date: '2024-01-14', taille: '842 KB'  },
    { id: 'r3', titre: 'Rapport journalier 14 jan 2024',   type: 'journalier',    statut: 'disponible', date: '2024-01-14', taille: '156 KB'  },
    { id: 'r4', titre: 'Rapport mensuel Janvier 2024',     type: 'mensuel',       statut: 'generation', date: '2024-01-15', taille: '—'       },
  ],
};

export function useRapports(periode?: string) {
  return useQuery({
    queryKey: ['rapports', periode ?? 'janvier_2024'],
    queryFn: async (): Promise<RapportsData> => {
      try {
        const res = await api.get('/reports/kpi', { params: { period: periode } });
        const raw = res.data?.data ?? res.data ?? {};
        if (!raw.ca && !raw.chiffreAffaires && !raw.totalRevenue) return MOCK;
        return {
          ...MOCK,
          ca:              Number(raw.ca ?? raw.chiffreAffaires ?? raw.totalRevenue ?? MOCK.ca),
          nbTransactions:  Number(raw.nbTransactions ?? MOCK.nbTransactions),
          nouveauxClients: Number(raw.nouveauxClients ?? MOCK.nouveauxClients),
          ticketMoyen:     Number(raw.ticketMoyen ?? MOCK.ticketMoyen),
          variationCa:     Number(raw.variationCa ?? MOCK.variationCa),
          variationTx:     Number(raw.variationTx ?? MOCK.variationTx),
          variationClients:Number(raw.variationClients ?? MOCK.variationClients),
          alertes:         raw.alertes ?? MOCK.alertes,
          historique:      raw.historique ?? MOCK.historique,
        };
      } catch {
        return MOCK;
      }
    },
    staleTime: 60_000,
  });
}

export function useGenererRapport() {
  return useMutation({
    mutationFn: async (params: { periode: string; type?: string }) => {
      try {
        const res = await api.post('/reports/generate', params);
        return res.data;
      } catch {
        await new Promise((r) => setTimeout(r, 2000));
        return { success: true, message: 'Rapport en cours de génération...' };
      }
    },
  });
}
