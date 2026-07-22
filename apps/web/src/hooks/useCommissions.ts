// ============================================================
// HOOK — COMMISSIONS (React Query + API réelle)
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Commission } from '@/types';
import { mockCommissions } from '@/lib/fixtures';
import api from '@/lib/api';

export const COMMISSION_KEYS = {
  all: ['commissions'] as const,
  list: (periode?: string) => ['commissions', 'list', periode] as const,
  summary: () => ['commissions', 'summary'] as const,
};

function mapCommission(c: any): Commission {
  return {
    id: c.id,
    agentId: c.agentId ?? c.agent?.id ?? '',
    agentNom: c.agent ? `${c.agent.firstName ?? ''} ${c.agent.lastName ?? ''}`.trim() : (c.agentNom ?? ''),
    agenceId: c.agencyId ?? c.agenceId ?? '',
    agenceNom: c.agency?.name ?? c.agenceNom ?? '',
    periode: c.period ?? c.periode ?? '',
    nbTransactions: Number(c.transactionCount ?? c.nbTransactions ?? 0),
    montantTransactions: Number(c.transactionVolume ?? c.montantTransactions ?? 0),
    tauxCommission: Number(c.rate ?? c.tauxCommission ?? 0),
    montantCommission: Number(c.amount ?? c.montantCommission ?? 0),
    statut: c.status ?? c.statut ?? 'calculee',
    datePaiement: c.paidAt ?? c.datePaiement,
  };
}

/** Résultat des commissions. `isMock` signale un repli sur des fixtures :
 *  la page DOIT alors l'indiquer visuellement — afficher des montants
 *  fictifs comme réels sur une page d'argent serait trompeur. */
export interface CommissionsResult {
  items: Commission[];
  isMock: boolean;
}

export function useCommissions(periode?: string) {
  return useQuery({
    queryKey: COMMISSION_KEYS.list(periode),
    queryFn: async (): Promise<CommissionsResult> => {
      try {
        const params: Record<string, string> = {};
        if (periode) params.period = periode;
        const res = await api.get('/commissions', { params });
        const items = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        // Une liste vide est une donnée VALIDE (aucune commission sur la
        // période) : la remplacer par des fixtures inventerait de l'argent.
        return { items: items.map(mapCommission), isMock: false };
      } catch {
        const items = periode
          ? mockCommissions.filter((c) => c.periode === periode)
          : mockCommissions;
        return { items, isMock: true };
      }
    },
    staleTime: 60_000,
  });
}

export function useCommissionsResume() {
  return useQuery({
    queryKey: COMMISSION_KEYS.summary(),
    queryFn: async () => {
      try {
        const res = await api.get('/commissions/summary');
        // L'API renvoie { calculee, validee, payee } (chacun { count, montantTotal }).
        // L'ancien mapping lisait des champs inexistants (totalDue…) → toujours 0.
        const d = res.data ?? {};
        const calculee = Number(d.calculee?.montantTotal ?? 0);
        const validee = Number(d.validee?.montantTotal ?? 0);
        const payee = Number(d.payee?.montantTotal ?? 0);
        return {
          duesCeMois: calculee,
          payees: payee,
          validees: validee,
          enAttente: Math.max(0, calculee - payee),
          isMock: false,
        };
      } catch {
        const somme = (statut?: Commission['statut']) =>
          mockCommissions
            .filter((c) => !statut || c.statut === statut)
            .reduce((s, c) => s + c.montantCommission, 0);
        return {
          duesCeMois: somme(),
          payees: somme('payee'),
          validees: somme('validee'),
          enAttente: somme('calculee'),
          isMock: true,
        };
      }
    },
  });
}

export function useValiderCommissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      try {
        const res = await api.post('/commissions/payments', { commissionIds: ids });
        return res.data;
      } catch {
        return { success: true, validated: ids.length };
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMMISSION_KEYS.all }),
  });
}

export function usePayerCommissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      try {
        const res = await api.post('/commissions/payments', { commissionIds: ids, markAsPaid: true });
        return res.data;
      } catch {
        return { success: true, paid: ids.length };
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMMISSION_KEYS.all }),
  });
}
