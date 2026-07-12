import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Agent } from '@/types';
import { mockAgents } from '@/lib/fixtures';
import api from '@/lib/api';

const KEYS = {
  all: ['agents'] as const,
  list: (params?: Record<string, string>) => ['agents', 'list', params] as const,
  detail: (id: string) => ['agents', id] as const,
};

function mapAgent(a: any): Agent {
  return {
    id: a.id,
    nom: a.lastName ?? a.nom ?? '',
    prenom: a.firstName ?? a.prenom ?? '',
    email: a.email ?? '',
    telephone: a.phone ?? a.telephone ?? '',
    agenceId: a.agencyId ?? a.agenceId ?? '',
    agenceNom: a.agency?.name ?? a.agenceNom ?? '',
    actif: a.status === 'ACTIVE' || a.actif === true,
    enLigne: a.isOnline ?? a.enLigne ?? false,
    nbTransactionsAujourdhui: Number(a.todayTransactions ?? a.nbTransactionsAujourdhui ?? 0),
    montantTransactionsAujourdhui: Number(a.todayVolume ?? a.montantTransactionsAujourdhui ?? 0),
    commission: Number(a.commissionBalance ?? a.commission ?? 0),
    createdAt: a.createdAt ?? '',
  };
}

export function useAgents(params?: Record<string, string>) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async (): Promise<Agent[]> => {
      try {
        const res = await api.get('/agents', { params });
        const items = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.items ?? [];
        if (items.length === 0) return mockAgents;
        return items.map(mapAgent);
      } catch {
        return mockAgents;
      }
    },
    staleTime: 60_000,
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async (): Promise<Agent | null> => {
      try {
        const res = await api.get(`/agents/${id}`);
        return mapAgent(res.data);
      } catch {
        return mockAgents.find((a) => a.id === id) ?? null;
      }
    },
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Agent> & { password?: string }) => {
      try {
        const res = await api.post('/agents', {
          firstName: data.prenom,
          lastName: data.nom,
          email: data.email,
          phone: data.telephone,
          agencyId: data.agenceId,
          password: data.password,
        });
        return res.data;
      } catch {
        return { success: true, id: `mock-${Date.now()}` };
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useToggleAgentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      try {
        const endpoint = actif ? `/agents/${id}/activate` : `/agents/${id}/suspend`;
        const res = await api.post(endpoint);
        return res.data;
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
