// ============================================================
// HOOK — STOCK & INVENTAIRE (React Query + API réelle)
// Endpoints backend : /stock/products, /stock/inventory,
// /stock/movements, /stock/alerts, /stock/valuation
// ⚠️ AUCUN fallback mock : si l'API échoue, l'erreur remonte
//    à la page qui affiche un état d'erreur / vide explicite.
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Types (miroir des interfaces du service NestJS) ─────────────────────────

export type CategorieProduit = 'SIM' | 'TERMINAL' | 'ACCESSOIRE' | 'CONSOMMABLE';

export type TypeMouvement = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export type MotifMouvement =
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'DAMAGE'
  | 'THEFT'
  | 'TRANSFER'
  | 'INVENTORY';

export interface Produit {
  id: string;
  name: string;
  sku: string;
  category: CategorieProduit;
  description?: string;
  unitPrice: number;
  alertThreshold: number;
  supplierId?: string;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LigneInventaire {
  productId: string;
  agencyId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  valorisation: number;
  lastMovementAt?: string;
  product?: Produit;
}

export interface MouvementStock {
  id: string;
  productId: string;
  agencyId: string;
  type: TypeMouvement;
  quantity: number;
  reason: MotifMouvement;
  notes?: string;
  reference?: string;
  performedBy?: string;
  createdAt: string;
}

export interface AlerteStock {
  productId: string;
  productName: string;
  agencyId: string;
  currentQuantity: number;
  threshold: number;
  severity: 'CRITICAL' | 'WARNING';
}

export interface ValorisationStock {
  totalValue: number;
  byCategory: Record<string, number>;
}

export interface ListePaginee<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** Corps attendu par POST /stock/movements/in et /out. */
export interface MouvementInput {
  productId: string;
  agencyId: string;
  quantity: number;
  reason: MotifMouvement;
  notes?: string;
  reference?: string;
}

// ─── Clés de cache ───────────────────────────────────────────────────────────

export const STOCK_KEYS = {
  all: ['stock'] as const,
  produits: (params?: unknown) => ['stock', 'produits', params ?? null] as const,
  inventaire: (params?: unknown) => ['stock', 'inventaire', params ?? null] as const,
  mouvements: (params?: unknown) => ['stock', 'mouvements', params ?? null] as const,
  alertes: () => ['stock', 'alertes'] as const,
  valorisation: () => ['stock', 'valorisation'] as const,
};

// ─── Normalisation (le backend renvoie {data,total,page,limit}) ──────────────

function versListe<T>(payload: unknown): ListePaginee<T> {
  if (Array.isArray(payload)) {
    return { data: payload as T[], total: payload.length, page: 1, limit: payload.length };
  }
  const p = (payload ?? {}) as Partial<ListePaginee<T>>;
  const data = Array.isArray(p.data) ? p.data : [];
  return {
    data,
    total: Number(p.total ?? data.length),
    page: Number(p.page ?? 1),
    limit: Number(p.limit ?? data.length),
  };
}

// ─── Requêtes ────────────────────────────────────────────────────────────────

export function useProduits(params?: {
  page?: number;
  limit?: number;
  category?: CategorieProduit;
  search?: string;
}) {
  return useQuery({
    queryKey: STOCK_KEYS.produits(params),
    queryFn: async (): Promise<ListePaginee<Produit>> => {
      const res = await api.get('/stock/products', { params });
      return versListe<Produit>(res.data);
    },
  });
}

export function useInventaire(params?: { agencyId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: STOCK_KEYS.inventaire(params),
    queryFn: async (): Promise<ListePaginee<LigneInventaire>> => {
      const res = await api.get('/stock/inventory', { params });
      return versListe<LigneInventaire>(res.data);
    },
  });
}

export function useMouvementsStock(params?: {
  productId?: string;
  agencyId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: STOCK_KEYS.mouvements(params),
    queryFn: async (): Promise<ListePaginee<MouvementStock>> => {
      const res = await api.get('/stock/movements', { params });
      return versListe<MouvementStock>(res.data);
    },
  });
}

export function useAlertesStock() {
  return useQuery({
    queryKey: STOCK_KEYS.alertes(),
    queryFn: async (): Promise<AlerteStock[]> => {
      const res = await api.get('/stock/alerts');
      return Array.isArray(res.data) ? (res.data as AlerteStock[]) : [];
    },
  });
}

export function useValorisationStock() {
  return useQuery({
    queryKey: STOCK_KEYS.valorisation(),
    queryFn: async (): Promise<ValorisationStock> => {
      const res = await api.get('/stock/valuation');
      const d = (res.data ?? {}) as Partial<ValorisationStock>;
      return { totalValue: Number(d.totalValue ?? 0), byCategory: d.byCategory ?? {} };
    },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

function useInvalidationStock() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: STOCK_KEYS.all });
}

export function useEntreeStock() {
  const invalider = useInvalidationStock();
  return useMutation({
    mutationFn: async (dto: MouvementInput): Promise<MouvementStock> => {
      const res = await api.post('/stock/movements/in', dto);
      return res.data as MouvementStock;
    },
    onSuccess: invalider,
  });
}

export function useSortieStock() {
  const invalider = useInvalidationStock();
  return useMutation({
    mutationFn: async (dto: MouvementInput): Promise<MouvementStock> => {
      const res = await api.post('/stock/movements/out', dto);
      return res.data as MouvementStock;
    },
    onSuccess: invalider,
  });
}

export interface ProduitInput {
  name: string;
  sku?: string;
  category: CategorieProduit;
  description?: string;
  unitPrice: number;
  alertThreshold?: number;
  supplierId?: string;
  unit?: string;
}

export function useCreerProduit() {
  const invalider = useInvalidationStock();
  return useMutation({
    mutationFn: async (dto: ProduitInput): Promise<Produit> => {
      const res = await api.post('/stock/products', dto);
      return res.data as Produit;
    },
    onSuccess: invalider,
  });
}

export function useModifierProduit() {
  const invalider = useInvalidationStock();
  return useMutation({
    mutationFn: async ({
      id,
      ...dto
    }: Partial<ProduitInput> & { id: string }): Promise<Produit> => {
      const res = await api.patch(`/stock/products/${id}`, dto);
      return res.data as Produit;
    },
    onSuccess: invalider,
  });
}
