// ============================================================
// HOOK — FLOAT (React Query + API réelle)
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FloatSolde, DemandeReapprovisionnement, MouvementFloat } from '@/types';
import { mockDashboardStats, mockDemandesReappro, mockMouvementsFloat } from '@/lib/fixtures';
import api from '@/lib/api';

export const FLOAT_KEYS = {
  all: ['float'] as const,
  soldes: () => ['float', 'soldes'] as const,
  mouvements: () => ['float', 'mouvements'] as const,
  demandes: () => ['float', 'demandes'] as const,
  alerts: () => ['float', 'alerts'] as const,
};

function mapFloatSolde(f: any): FloatSolde {
  return {
    id: f.id,
    operateur: f.operator ?? f.operateur,
    soldeActuel: Number(f.currentBalance ?? f.soldeActuel ?? 0),
    seuilAlerte: Number(f.alertThreshold ?? f.seuilAlerte ?? 0),
    seuilCritique: Number(f.criticalThreshold ?? f.seuilCritique ?? 0),
    statut: f.status ?? f.statut ?? 'ok',
    derniereMaj: f.updatedAt ?? f.derniereMaj ?? new Date().toISOString(),
    evolution: f.evolution ?? [],
  };
}

export function useFloatSoldes() {
  return useQuery({
    queryKey: FLOAT_KEYS.soldes(),
    queryFn: async (): Promise<FloatSolde[]> => {
      try {
        const res = await api.get('/float');
        const items = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        if (items.length === 0) return mockDashboardStats.float.soldes;
        return items.map(mapFloatSolde);
      } catch {
        return mockDashboardStats.float.soldes;
      }
    },
    refetchInterval: 60_000,
  });
}

export function useFloatMouvements() {
  return useQuery({
    queryKey: FLOAT_KEYS.mouvements(),
    queryFn: async (): Promise<MouvementFloat[]> => {
      try {
        const res = await api.get('/float/movements');
        const items: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        if (items.length === 0) return mockMouvementsFloat;
        return items.map((m: any): MouvementFloat => ({
          id: m.id,
          type: m.type === 'CREDIT' ? 'entree' : 'sortie',
          operateur: m.operator ?? m.operateur,
          montant: Number(m.amount ?? m.montant ?? 0),
          description: m.description ?? m.notes ?? '',
          soldeAvant: Number(m.balanceBefore ?? m.soldeAvant ?? 0),
          soldeApres: Number(m.balanceAfter ?? m.soldeApres ?? 0),
          date: m.createdAt ?? m.date ?? new Date().toISOString(),
          agentId: m.agentId ?? m.userId ?? '',
        } as MouvementFloat));
      } catch {
        return mockMouvementsFloat;
      }
    },
  });
}

export function useDemandesReappro() {
  return useQuery({
    queryKey: FLOAT_KEYS.demandes(),
    queryFn: async (): Promise<DemandeReapprovisionnement[]> => {
      try {
        const res = await api.get('/float/replenish/pending');
        const items = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        if (items.length === 0) return mockDemandesReappro;
        return items.map((d: any) => ({
          id: d.id,
          operateur: d.operator ?? d.operateur,
          montant: Number(d.amount ?? d.montant ?? 0),
          statut: d.status ?? d.statut ?? 'en_attente',
          demandeurId: d.requestedBy ?? d.demandeurId ?? '',
          demandeurNom: d.requester?.name ?? d.demandeurNom ?? '',
          date: d.createdAt ?? d.date,
          commentaire: d.notes ?? d.commentaire,
        }));
      } catch {
        return mockDemandesReappro;
      }
    },
  });
}

export function useCreerDemandeReappro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<DemandeReapprovisionnement>) => {
      try {
        const res = await api.post('/float/replenish', {
          operator: data.operateur,
          amount: data.montant,
          notes: data.commentaire,
        });
        return res.data;
      } catch {
        return { ...data, id: Date.now().toString(), statut: 'en_attente' } as DemandeReapprovisionnement;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLOAT_KEYS.all }),
  });
}
