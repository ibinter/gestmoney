import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { EcritureCaisse } from '@/types';

const mockEcritures: EcritureCaisse[] = [
  { id: 'e1', type: 'entree', libelle: 'Depot client - Yao Kouassi', montant: 150_000, soldeApres: 12_500_000, categorie: 'depot', agentNom: 'Kofi Mensah', date: '2024-01-15T14:32:00', reference: 'TXN-001247' },
  { id: 'e2', type: 'sortie', libelle: 'Retrait client - Fatoumata Bah', montant: 75_000, soldeApres: 12_425_000, categorie: 'retrait', agentNom: 'Ama Diallo', date: '2024-01-15T14:28:00', reference: 'TXN-001246' },
  { id: 'e3', type: 'entree', libelle: 'Cash In - Wave', montant: 200_000, soldeApres: 12_625_000, categorie: 'cash_in', agentNom: 'Kofi Mensah', date: '2024-01-15T14:15:00', reference: 'TXN-001245' },
  { id: 'e4', type: 'sortie', libelle: 'Cash Out - Orange Money', montant: 50_000, soldeApres: 12_575_000, categorie: 'cash_out', agentNom: 'Sekou Toure', date: '2024-01-15T13:55:00', reference: 'TXN-001244' },
  { id: 'e5', type: 'entree', libelle: 'Depot client - Ibrahim Cisse', montant: 300_000, soldeApres: 12_875_000, categorie: 'depot', agentNom: 'Ama Diallo', date: '2024-01-15T13:30:00', reference: 'TXN-001243' },
  { id: 'e6', type: 'sortie', libelle: 'Frais bancaires', montant: 5_000, soldeApres: 12_870_000, categorie: 'frais', agentNom: 'Système', date: '2024-01-15T09:00:00', reference: 'SYS-000089' },
  { id: 'e7', type: 'entree', libelle: 'Approvisionnement caisse', montant: 500_000, soldeApres: 13_370_000, categorie: 'approvisionnement', agentNom: 'Système', date: '2024-01-15T08:00:00', reference: 'SYS-000088' },
  { id: 'e8', type: 'sortie', libelle: 'Retrait - Oumar Sylla', montant: 120_000, soldeApres: 13_250_000, categorie: 'retrait', agentNom: 'Kofi Mensah', date: '2024-01-14T17:45:00', reference: 'TXN-001242' },
];

export const SOLDE_OUVERTURE = 12_200_000;

function mapEcriture(e: Record<string, unknown>): EcritureCaisse {
  return {
    id: String(e.id ?? ''),
    type: e.type === 'credit' ? 'entree' : e.type === 'debit' ? 'sortie' : String(e.type ?? 'entree') as 'entree' | 'sortie',
    libelle: String(e.description ?? e.libelle ?? ''),
    montant: Number(e.amount ?? e.montant ?? 0),
    soldeApres: Number(e.balanceAfter ?? e.soldeApres ?? 0),
    categorie: String(e.category ?? e.categorie ?? ''),
    agentNom: String(e.agentName ?? e.agentNom ?? ''),
    date: String(e.createdAt ?? e.date ?? ''),
    reference: String(e.reference ?? ''),
  };
}

export function useEcritures(params?: Record<string, string>) {
  return useQuery<EcritureCaisse[]>({
    queryKey: ['caisse', 'ecritures', params],
    queryFn: async () => {
      try {
        const res = await api.get('/caisse/ecritures', { params });
        const raw: unknown[] = res.data?.data ?? res.data ?? [];
        return raw.map((e) => mapEcriture(e as Record<string, unknown>));
      } catch {
        return mockEcritures;
      }
    },
    staleTime: 15_000,
  });
}

export function useCaisseStats() {
  return useQuery({
    queryKey: ['caisse', 'stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/caisse/stats');
        return res.data;
      } catch {
        const entrees = mockEcritures.filter((e) => e.type === 'entree').reduce((s, e) => s + e.montant, 0);
        const sorties = mockEcritures.filter((e) => e.type === 'sortie').reduce((s, e) => s + e.montant, 0);
        return {
          soldeActuel: SOLDE_OUVERTURE + entrees - sorties,
          soldeOuverture: SOLDE_OUVERTURE,
          entreesJour: entrees,
          sortiesJour: sorties,
          nbEntrees: mockEcritures.filter((e) => e.type === 'entree').length,
          nbSorties: mockEcritures.filter((e) => e.type === 'sortie').length,
        };
      }
    },
    staleTime: 15_000,
  });
}

export function useAddEcriture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EcritureCaisse>) => api.post('/caisse/ecritures', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['caisse'] });
    },
  });
}
