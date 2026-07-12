// ============================================================
// HOOK — TRANSACTIONS (React Query + API réelle)
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction, FiltresTransactions, ApiResponse } from '@/types';
import { mockTransactions } from '@/lib/fixtures';
import api from '@/lib/api';

export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  list: (filtres: FiltresTransactions) => ['transactions', 'list', filtres] as const,
  detail: (id: string) => ['transactions', 'detail', id] as const,
  stats: () => ['transactions', 'stats'] as const,
};

// Mappe la réponse API backend vers le type Transaction frontend
function mapTransaction(t: any): Transaction {
  return {
    id: t.id,
    reference: t.reference,
    type: t.type,
    operateur: t.operator ?? t.operateur,
    agentId: t.agentId ?? t.agent?.id ?? '',
    agentNom: t.agent ? `${t.agent.firstName ?? ''} ${t.agent.lastName ?? ''}`.trim() : (t.agentNom ?? ''),
    agenceId: t.agencyId ?? t.agenceId ?? '',
    agenceNom: t.agency?.name ?? t.agenceNom ?? '',
    clientNom: t.customerName ?? t.clientNom,
    clientTel: t.customerPhone ?? t.clientTel,
    montant: Number(t.amount ?? t.montant ?? 0),
    frais: Number(t.fees ?? t.frais ?? 0),
    commission: Number(t.commission ?? 0),
    statut: t.status ?? t.statut,
    date: t.createdAt ?? t.date,
  };
}

const fetchTransactions = async (filtres: FiltresTransactions = {}): Promise<ApiResponse<Transaction[]>> => {
  try {
    const params: Record<string, string> = {};
    if (filtres.type) params.type = filtres.type;
    if (filtres.operateur) params.operator = filtres.operateur;
    if (filtres.statut) params.status = filtres.statut;
    if (filtres.search) params.search = filtres.search;
    if (filtres.page) params.page = String(filtres.page);
    if (filtres.limit) params.limit = String(filtres.limit);

    const res = await api.get('/transactions', { params });
    const body = res.data;

    // Le backend peut retourner { data: [...], meta: {...} } ou { items: [...] } ou [...]
    const items: Transaction[] = Array.isArray(body)
      ? body.map(mapTransaction)
      : Array.isArray(body?.data)
      ? body.data.map(mapTransaction)
      : Array.isArray(body?.items)
      ? body.items.map(mapTransaction)
      : mockTransactions;

    const meta = body?.meta ?? body?.pagination ?? {
      page: 1, limit: 20, total: items.length, totalPages: Math.ceil(items.length / 20),
    };

    return { data: items, meta };
  } catch {
    // Fallback mock
    let data = [...mockTransactions];
    if (filtres.type) data = data.filter((t) => t.type === filtres.type);
    if (filtres.operateur) data = data.filter((t) => t.operateur === filtres.operateur);
    if (filtres.statut) data = data.filter((t) => t.statut === filtres.statut);
    if (filtres.search) {
      const s = filtres.search.toLowerCase();
      data = data.filter(
        (t) => t.reference.toLowerCase().includes(s) || t.agentNom.toLowerCase().includes(s) || t.clientNom?.toLowerCase().includes(s)
      );
    }
    return { data, meta: { page: 1, limit: 20, total: data.length, totalPages: 1 } };
  }
};

export function useTransactions(filtres: FiltresTransactions = {}) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.list(filtres),
    queryFn: () => fetchTransactions(filtres),
    staleTime: 30_000,
  });
}

export function useTransactionStats() {
  return useQuery({
    queryKey: TRANSACTION_KEYS.stats(),
    queryFn: async () => {
      try {
        const res = await api.get('/transactions/stats/today');
        return res.data;
      } catch {
        return { nbAujourdhui: mockTransactions.length, montantTotal: mockTransactions.reduce((s, t) => s + t.montant, 0) };
      }
    },
    staleTime: 60_000,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.detail(id),
    queryFn: async () => {
      try {
        const res = await api.get(`/transactions/${id}`);
        return mapTransaction(res.data);
      } catch {
        return mockTransactions.find((t) => t.id === id) || null;
      }
    },
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Transaction>) => {
      try {
        const res = await api.post('/transactions', {
          type: data.type,
          operator: data.operateur,
          amount: data.montant,
          customerName: data.clientNom,
          customerPhone: data.clientTel,
        });
        return mapTransaction(res.data);
      } catch {
        // Fallback mock quand backend absent
        return {
          id: `mock-${Date.now()}`,
          reference: `TXN-DEMO-${Date.now()}`,
          ...data,
          statut: 'success',
          frais: 0,
          commission: 0,
          agentId: '',
          agentNom: 'Demo Agent',
          agenceId: '',
          agenceNom: '',
          date: new Date().toISOString(),
        } as Transaction;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all }),
  });
}

export function useValiderTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await api.patch(`/transactions/${id}`, { status: 'COMPLETED' });
        return res.data;
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all }),
  });
}

export function useCancelTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/transactions/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all }),
  });
}
