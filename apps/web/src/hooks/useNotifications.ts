'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export type TypeNotification = 'alerte' | 'transaction' | 'float' | 'ia' | 'systeme';

export interface Notification {
  id: string;
  type: TypeNotification;
  titre: string;
  description: string;
  lue: boolean;
  date: string;
  lien?: string;
}

export interface FiltresNotifications {
  type?: TypeNotification;
  lue?: boolean;
  page?: number;
  limit?: number;
}

// Fallback local utilisé uniquement quand l'API est indisponible
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'm1', type: 'alerte', titre: 'Seuil float critique', description: 'Le float Orange Money est en dessous du seuil critique (150 000 XOF)', lue: false, date: new Date(Date.now() - 5 * 60 * 1000).toISOString(), lien: '/float' },
  { id: 'm2', type: 'transaction', titre: 'Transaction approuvée', description: 'Retrait MTN MoMo de 50 000 XOF par l\'agent Koné Mamadou validé', lue: false, date: new Date(Date.now() - 18 * 60 * 1000).toISOString(), lien: '/transactions' },
  { id: 'm3', type: 'ia', titre: 'Recommandation IA', description: 'Pic de demande prévu demain entre 10h et 14h — rechargement conseillé', lue: false, date: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: 'm4', type: 'float', titre: 'Float Wave rechargé', description: 'Réapprovisionnement de 500 000 XOF sur Wave effectué avec succès', lue: true, date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), lien: '/float' },
  { id: 'm5', type: 'systeme', titre: 'Mise à jour planifiée', description: 'Maintenance système prévue le 15 juil. de 02h à 04h (heure de Dakar)', lue: true, date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
];

function normalizeNotification(raw: Record<string, unknown>): Notification {
  return {
    id: String(raw.id ?? ''),
    type: (raw.type ?? raw.category ?? 'systeme') as TypeNotification,
    titre: String(raw.titre ?? raw.title ?? raw.message ?? ''),
    description: String(raw.description ?? raw.body ?? raw.content ?? ''),
    lue: Boolean(raw.lue ?? raw.read ?? raw.readAt),
    date: String(raw.date ?? raw.createdAt ?? new Date().toISOString()),
    lien: raw.lien ? String(raw.lien) : raw.link ? String(raw.link) : undefined,
  };
}

async function fetchNotificationsFromApi(filtres?: FiltresNotifications): Promise<{
  data: Notification[];
  total: number;
  totalPages: number;
}> {
  const params: Record<string, unknown> = {};
  if (filtres?.type) params.type = filtres.type;
  if (filtres?.lue !== undefined) params.read = filtres.lue;
  if (filtres?.page) params.page = filtres.page;
  if (filtres?.limit) params.limit = filtres.limit;

  const res = await api.get('/notifications/history', { params });
  const raw = res.data?.data ?? res.data ?? [];
  const items = Array.isArray(raw) ? raw : [];
  const total = res.data?.total ?? items.length;
  const limit = filtres?.limit ?? 10;

  return {
    data: items.map((n: Record<string, unknown>) => normalizeNotification(n)),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// Fallback mock paginé (API indisponible)
function fetchMockNotifications(filtres?: FiltresNotifications) {
  let filtered = [...MOCK_NOTIFICATIONS];
  if (filtres?.type) filtered = filtered.filter((n) => n.type === filtres.type);
  if (filtres?.lue !== undefined) filtered = filtered.filter((n) => n.lue === filtres.lue);
  const page = filtres?.page ?? 1;
  const limit = filtres?.limit ?? 10;
  const start = (page - 1) * limit;
  return {
    data: filtered.slice(start, start + limit),
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / limit),
  };
}

export function useNotifications(filtres?: FiltresNotifications) {
  return useQuery({
    queryKey: ['notifications', filtres],
    queryFn: async () => {
      try {
        return await fetchNotificationsFromApi(filtres);
      } catch {
        return fetchMockNotifications(filtres);
      }
    },
    staleTime: 30_000,
  });
}

export function useNotificationCount() {
  return useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/notifications/history', { params: { limit: 100 } });
        const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        return items.filter((n: Record<string, unknown>) => !n.read && !n.readAt).length;
      } catch {
        return MOCK_NOTIFICATIONS.filter((n) => !n.lue).length;
      }
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.patch(`/notifications/${id}/read`);
      } catch {
        // pas de fallback local — la notification sera rechargée depuis l'API au prochain polling
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await api.patch('/notifications/read-all');
      } catch {
        // silent
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/notifications/${id}`);
      } catch {
        // silent
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });
}
