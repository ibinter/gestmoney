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

// ─── Traduction du vocabulaire front (fr, minuscule) ⇆ contrat API (DTO) ──────
// L'API attend le type/opérateur/statut dans SON vocabulaire (DEPOT, ORANGE_MONEY,
// COMPLETED…). Envoyer les valeurs front brutes (« depot », « orange_money »,
// « success ») déclenchait des 400 (forbidNonWhitelisted / enum invalide).

const TYPE_FRONT_TO_API: Record<string, string> = {
  depot: 'DEPOT',
  retrait: 'RETRAIT',
  cash_in: 'CASH_IN',
  cash_out: 'CASH_OUT',
  transfert: 'TRANSFERT',
  paiement: 'PAIEMENT_MARCHAND',
};

// API → front : d'abord le type métier d'origine (metadata.uiType = DTO FR),
// sinon l'enum Prisma (DEPOSIT/WITHDRAWAL…).
const TYPE_API_TO_FRONT: Record<string, string> = {
  DEPOT: 'depot', RETRAIT: 'retrait', CASH_IN: 'cash_in', CASH_OUT: 'cash_out',
  TRANSFERT: 'transfert', PAIEMENT_MARCHAND: 'paiement',
  DEPOSIT: 'depot', WITHDRAWAL: 'retrait', TRANSFER: 'transfert', PAYMENT: 'paiement',
  REVERSAL: 'retrait', ADJUSTMENT: 'depot',
};

const OP_FRONT_TO_API: Record<string, string> = {
  orange_money: 'ORANGE_MONEY', mtn_momo: 'MTN_MOMO', wave: 'WAVE',
  moov: 'MOOV_MONEY', airtel: 'AIRTEL_MONEY',
};
const OP_API_TO_FRONT: Record<string, string> = {
  ORANGE_MONEY: 'orange_money', MTN_MOMO: 'mtn_momo', WAVE: 'wave',
  MOOV_MONEY: 'moov', AIRTEL_MONEY: 'airtel',
};

const STATUT_FRONT_TO_API: Record<string, string> = {
  success: 'COMPLETED', pending: 'PENDING', failed: 'FAILED', cancelled: 'CANCELLED',
};
const STATUT_API_TO_FRONT: Record<string, string> = {
  PENDING: 'pending', PROCESSING: 'pending', COMPLETED: 'success',
  FAILED: 'failed', CANCELLED: 'cancelled', REVERSED: 'cancelled',
};

// Mappe la réponse API backend vers le type Transaction frontend
function mapTransaction(t: any): Transaction {
  const apiType = t.metadata?.uiType ?? t.type;
  return {
    id: t.id,
    reference: t.reference,
    type: (TYPE_API_TO_FRONT[apiType] ?? t.type ?? 'depot') as Transaction['type'],
    operateur: (OP_API_TO_FRONT[t.operatorCode ?? t.operator] ?? t.operateur ?? 'orange_money') as Transaction['operateur'],
    agentId: t.agentId ?? t.agent?.id ?? '',
    agentNom: t.agent
      ? (`${t.agent.firstName ?? ''} ${t.agent.lastName ?? ''}`.trim() || t.agent.agentCode || '')
      : (t.agentNom ?? ''),
    agenceId: t.agencyId ?? t.agenceId ?? '',
    agenceNom: t.agency?.name ?? t.agenceNom ?? '',
    clientNom: t.receiverName ?? t.customerName ?? t.clientNom,
    clientTel: t.receiverPhone ?? t.customerPhone ?? t.clientTel,
    montant: Number(t.amount ?? t.montant ?? 0),
    frais: Number(t.fee ?? t.fees ?? t.frais ?? 0),
    commission: Number(t.commission ?? 0),
    statut: (STATUT_API_TO_FRONT[t.status] ?? t.statut ?? 'pending') as Transaction['statut'],
    date: t.createdAt ?? t.date,
  };
}

const fetchTransactions = async (filtres: FiltresTransactions = {}): Promise<ApiResponse<Transaction[]>> => {
  try {
    const params: Record<string, string> = {};
    // Noms de paramètres et vocabulaire attendus par QueryTransactionDto.
    if (filtres.type) params.type = TYPE_FRONT_TO_API[filtres.type] ?? filtres.type;
    if (filtres.operateur) params.operateur = OP_FRONT_TO_API[filtres.operateur] ?? filtres.operateur;
    if (filtres.statut) params.statut = STATUT_FRONT_TO_API[filtres.statut] ?? filtres.statut;
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
        // Charge utile conforme à CreateTransactionDto (vocabulaire API).
        const res = await api.post('/transactions', {
          type: TYPE_FRONT_TO_API[data.type ?? ''] ?? data.type,
          operateur: OP_FRONT_TO_API[data.operateur ?? ''] ?? data.operateur,
          montant: data.montant,
          clientNom: data.clientNom || undefined,
          clientPhone: data.clientTel || undefined,
          // agentId optionnel : si fourni (ex. admin choisissant l'agent),
          // sinon le backend le déduit de l'utilisateur connecté.
          agentId: data.agentId || undefined,
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
      // Route dédiée : POST /transactions/:id/complete (émet l'évènement
      // COMPLETED → calcul de commission). L'ancien PATCH /transactions/:id
      // n'existait pas (404 silencieux) : la validation ne faisait rien.
      const res = await api.post(`/transactions/${id}/complete`);
      return res.data;
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
