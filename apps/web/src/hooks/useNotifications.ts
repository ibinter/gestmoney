'use client';
// ============================================================
// HOOK NOTIFICATIONS — GESTMONEY
// ============================================================
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

// ——————————————————————————————————————
// Données mockées
// ——————————————————————————————————————
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'alerte',
    titre: 'Seuil float critique',
    description: 'Le float Orange Money est en dessous du seuil critique (150 000 XOF)',
    lue: false,
    date: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lien: '/float',
  },
  {
    id: '2',
    type: 'transaction',
    titre: 'Transaction approuvée',
    description: 'Retrait MTN MoMo de 50 000 XOF par l\'agent Koné Mamadou validé',
    lue: false,
    date: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    lien: '/transactions',
  },
  {
    id: '3',
    type: 'ia',
    titre: 'Recommandation IA',
    description: 'Pic de demande prévu demain entre 10h et 14h — rechargement conseillé',
    lue: false,
    date: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'float',
    titre: 'Float Wave rechargé',
    description: 'Réapprovisionnement de 500 000 XOF sur Wave effectué avec succès',
    lue: true,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lien: '/float',
  },
  {
    id: '5',
    type: 'systeme',
    titre: 'Mise à jour planifiée',
    description: 'Maintenance système prévue le 15 juil. de 02h à 04h (heure de Dakar)',
    lue: true,
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    type: 'transaction',
    titre: 'Transaction échouée',
    description: 'Dépôt Airtel Money de 25 000 XOF refusé — solde insuffisant',
    lue: true,
    date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    lien: '/transactions',
  },
  {
    id: '7',
    type: 'alerte',
    titre: 'Tentative de fraude détectée',
    description: 'Activité inhabituelle sur le compte de l\'agent Diallo Ibrahim — vérification requise',
    lue: false,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lien: '/agents',
  },
  {
    id: '8',
    type: 'systeme',
    titre: 'Rapport mensuel disponible',
    description: 'Le rapport de juin 2026 est prêt à être téléchargé',
    lue: true,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lien: '/reporting',
  },
];

// Simuler un store local mutable
let notificationsStore = [...MOCK_NOTIFICATIONS];

const fetchNotifications = async (filtres?: FiltresNotifications): Promise<{
  data: Notification[];
  total: number;
  totalPages: number;
}> => {
  await new Promise((r) => setTimeout(r, 300));
  let filtered = [...notificationsStore];

  if (filtres?.type) filtered = filtered.filter((n) => n.type === filtres.type);
  if (filtres?.lue !== undefined) filtered = filtered.filter((n) => n.lue === filtres.lue);

  const page = filtres?.page ?? 1;
  const limit = filtres?.limit ?? 10;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return {
    data: paginated,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / limit),
  };
};

// ——————————————————————————————————————
// Hook: liste paginée
// ——————————————————————————————————————
export function useNotifications(filtres?: FiltresNotifications) {
  return useQuery({
    queryKey: ['notifications', filtres],
    queryFn: () => fetchNotifications(filtres),
    staleTime: 30_000,
  });
}

// ——————————————————————————————————————
// Hook: count non lues (polling 30s)
// ——————————————————————————————————————
export function useNotificationCount() {
  return useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/notifications/history', { params: { limit: 10 } });
        const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        const nonLues = items.filter((n: any) => !n.read && !n.readAt).length;
        return nonLues;
      } catch {
        return notificationsStore.filter((n) => !n.lue).length;
      }
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

// ——————————————————————————————————————
// Hook: marquer une notification lue
// ——————————————————————————————————————
export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 150));
      notificationsStore = notificationsStore.map((n) =>
        n.id === id ? { ...n, lue: true } : n
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });
}

// ——————————————————————————————————————
// Hook: tout marquer comme lu
// ——————————————————————————————————————
export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 200));
      notificationsStore = notificationsStore.map((n) => ({ ...n, lue: true }));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });
}

// ——————————————————————————————————————
// Hook: supprimer une notification
// ——————————————————————————————————————
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 150));
      notificationsStore = notificationsStore.filter((n) => n.id !== id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });
}
