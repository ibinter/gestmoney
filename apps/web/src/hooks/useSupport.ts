import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Hooks Support (tickets) — branchés sur l'API réelle NestJS (`/support/*`).
 * Même pattern que `hooks/useCrm.ts` : useQuery / useMutation, `unwrap`,
 * invalidation via queryClient. Aucune donnée fictive : une base vide renvoie
 * une liste vide, que la page affiche en tant qu'état vide.
 *
 * Les enums renvoyés par l'API sont en MAJUSCULES (statut / priorité). Le
 * mapping vers les valeurs attendues par les configs de la page est réalisé
 * côté page (voir `mapTicket`), afin de préserver le design existant.
 */

// ─── Enums API (MAJUSCULES) ──────────────────────────────────────────────────
export type PrioriteApi = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
export type StatutApi =
  | 'NOUVEAU'
  | 'OUVERT'
  | 'EN_COURS'
  | 'ATTENTE_CLIENT'
  | 'ESCALADE'
  | 'RESOLU'
  | 'FERME';

// ─── Formes renvoyées par l'API ──────────────────────────────────────────────
export interface ApiTicket {
  id: string;
  numero: string;
  objet: string;
  description: string;
  categorie: string | null;
  priorite: PrioriteApi;
  statut: StatutApi;
  nbMessages: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMessage {
  id: string;
  contenu: string;
  interne: boolean;
  auteurId: string | null;
  auteurNom: string | null;
  pieceJointe?: string | null;
  pieceJointeNom?: string | null;
  createdAt: string;
}

export type ApiTicketDetail = ApiTicket & { messages: ApiMessage[] };

export interface SupportStats {
  total: number;
  ouverts: number;
  enCours: number;
  resolus: number;
}

// Payload de création — champs autorisés uniquement (l'API rejette les champs
// inconnus via forbidNonWhitelisted).
export interface CreateTicketInput {
  objet: string;
  description: string;
  categorie?: string;
  priorite?: PrioriteApi;
}

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function unwrap<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw?.data)) return raw.data as T[];
  return [];
}

const KEYS = {
  tickets: (p?: Record<string, string>) => ['support', 'tickets', p] as const,
  ticket: (id: string) => ['support', 'ticket', id] as const,
  stats: ['support', 'tickets', 'stats'] as const,
};

// ─── Lecture ─────────────────────────────────────────────────────────────────
export function useTickets(params?: Record<string, string>) {
  return useQuery({
    queryKey: KEYS.tickets(params),
    queryFn: async (): Promise<ApiTicket[]> => {
      const res = await api.get<Paginated<ApiTicket>>('/support/tickets', { params });
      return unwrap<ApiTicket>(res.data);
    },
    staleTime: 30_000,
  });
}

export function useTicket(id: string | null | undefined) {
  return useQuery({
    queryKey: KEYS.ticket(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<ApiTicketDetail> => {
      const res = await api.get<ApiTicketDetail>(`/support/tickets/${id}`);
      return res.data;
    },
    staleTime: 15_000,
  });
}

export function useSupportStats() {
  return useQuery({
    queryKey: KEYS.stats,
    queryFn: async (): Promise<SupportStats> => {
      const res = await api.get<SupportStats>('/support/tickets/stats');
      return res.data;
    },
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────
export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTicketInput): Promise<ApiTicket> => {
      const res = await api.post<ApiTicket>('/support/tickets', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  });
}

export function useEnvoyerMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contenu,
      pieceJointe,
      pieceJointeNom,
    }: {
      id: string;
      contenu: string;
      pieceJointe?: string;
      pieceJointeNom?: string;
    }): Promise<ApiMessage> => {
      const res = await api.post<ApiMessage>(`/support/tickets/${id}/messages`, {
        contenu,
        ...(pieceJointe ? { pieceJointe, pieceJointeNom } : {}),
      });
      return res.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.ticket(id) });
      qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },
  });
}

export function useChangerStatutTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: StatutApi }): Promise<ApiTicket> => {
      const res = await api.patch<ApiTicket>(`/support/tickets/${id}/statut`, { statut });
      return res.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.ticket(id) });
      qc.invalidateQueries({ queryKey: ['support'] });
    },
  });
}
