import { create } from 'zustand';
import { transactionApi } from '../services/api';
import { offlineDb, PendingTransaction } from '../services/offline';
import { generateId } from '../utils/helpers';

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'CASH_IN' | 'CASH_OUT';
  amount: number;
  phone: string;
  operatorId: string;
  reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  commission: number;
  agentId: string;
  createdAt: string;
  synced?: boolean;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  pendingCount: number;
  fetchToday: () => Promise<void>;
  createTransaction: (data: Omit<Transaction, 'id' | 'reference' | 'status' | 'commission' | 'agentId' | 'createdAt' | 'synced'>) => Promise<Transaction | null>;
  syncPending: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  pendingCount: 0,

  fetchToday: async () => {
    set({ isLoading: true, error: null });
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await transactionApi.list({ date: today, limit: 50 });
      set({ transactions: data.data ?? data, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Impossible de charger les transactions' });
    }
  },

  createTransaction: async (input) => {
    const pending: PendingTransaction = {
      id: generateId(),
      type: input.type,
      amount: input.amount,
      phone: input.phone,
      operatorId: input.operatorId,
      createdAt: new Date().toISOString(),
    };

    // Save offline first
    await offlineDb.savePending(pending);
    await get().refreshPendingCount();

    try {
      const { data } = await transactionApi.create({
        type: pending.type,
        amount: pending.amount,
        phone: pending.phone,
        operatorId: pending.operatorId,
      });
      await offlineDb.markSynced(pending.id);
      set((state) => ({
        transactions: [data, ...state.transactions],
        pendingCount: Math.max(0, state.pendingCount - 1),
      }));
      return data as Transaction;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erreur réseau';
      await offlineDb.markError(pending.id, msg);
      // Return a local version so the UI can show it
      const local: Transaction = {
        id: pending.id,
        type: pending.type,
        amount: pending.amount,
        phone: pending.phone,
        operatorId: pending.operatorId,
        reference: pending.id,
        status: 'PENDING',
        commission: 0,
        agentId: '',
        createdAt: pending.createdAt,
        synced: false,
      };
      set((state) => ({ transactions: [local, ...state.transactions] }));
      return local;
    }
  },

  syncPending: async () => {
    const pending = await offlineDb.getPending();
    for (const tx of pending) {
      try {
        await transactionApi.create({
          type: tx.type,
          amount: tx.amount,
          phone: tx.phone,
          operatorId: tx.operatorId,
        });
        await offlineDb.markSynced(tx.id);
      } catch (err: any) {
        await offlineDb.markError(tx.id, err?.message ?? 'sync error');
      }
    }
    await get().refreshPendingCount();
    await get().fetchToday();
  },

  refreshPendingCount: async () => {
    const count = await offlineDb.getPendingCount();
    set({ pendingCount: count });
  },
}));
