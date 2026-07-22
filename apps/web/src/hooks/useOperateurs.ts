import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Hooks Opérateurs Mobile Money — branchés sur l'API réelle NestJS
 * (`/networks`). Le CRUD est déjà construit côté API :
 *   - GET    /networks       → Operateur[] (tableau direct, sans enveloppe)
 *   - POST   /networks       → Operateur
 *   - PATCH  /networks/:id   → Operateur
 *   - DELETE /networks/:id   → { deleted: true } ou 409 si l'opérateur est
 *                              référencé (transactions / agences / float…).
 * Aucune donnée fictive : une base vide renvoie une liste vide.
 */

// ─── Type aligné sur le schéma API ───────────────────────────────────────────
export interface Operateur {
  id: string;
  operatorCode: string;
  name: string;
  country: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  nbTransactions: number;
  nbAgences: number;
  nbFloat: number;
  createdAt: string;
  updatedAt: string;
}

// Renvoie toujours un tableau, quelle que soit la forme de la réponse
// (tableau direct attendu, mais on tolère une éventuelle enveloppe).
function unwrap<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw?.data)) return raw.data as T[];
  return [];
}

const KEYS = {
  all: ['operateurs'] as const,
};

// ─── Lecture ─────────────────────────────────────────────────────────────────
export function useOperateurs() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: async (): Promise<Operateur[]> => {
      const res = await api.get('/networks');
      return unwrap<Operateur>(res.data);
    },
    staleTime: 30_000,
  });
}

// ─── Création ────────────────────────────────────────────────────────────────
export interface CreateOperateurInput {
  operatorCode: string;
  name: string;
  country: string;
  currency?: string;
  status?: Operateur['status'];
}

export function useCreateOperateur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOperateurInput): Promise<Operateur> => {
      const res = await api.post<Operateur>('/networks', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

// ─── Modification ────────────────────────────────────────────────────────────
export interface UpdateOperateurInput {
  id: string;
  operatorCode?: string;
  name?: string;
  country?: string;
  currency?: string;
  status?: Operateur['status'];
}

export function useUpdateOperateur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...champs }: UpdateOperateurInput): Promise<Operateur> => {
      const res = await api.patch<Operateur>(`/networks/${id}`, champs);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

// ─── Suppression ─────────────────────────────────────────────────────────────
// L'API renvoie 409 (+ message) si l'opérateur est référencé. La page relaie
// alors `err.response.data.message` à l'utilisateur.
export function useDeleteOperateur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ deleted: boolean }> => {
      const res = await api.delete(`/networks/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
