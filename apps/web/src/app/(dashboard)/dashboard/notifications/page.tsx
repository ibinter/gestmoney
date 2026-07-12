'use client';
// ============================================================
// PAGE NOTIFICATIONS — GESTMONEY
// ============================================================
import React, { useState } from 'react';
import { Bell, Settings, Check, Trash2, CheckCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  type TypeNotification,
} from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/formatters';

type Filtre = 'toutes' | 'non_lues' | 'alerte' | 'transaction' | 'systeme';

const FILTRES: { key: Filtre; label: string }[] = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'non_lues', label: 'Non lues' },
  { key: 'alerte', label: 'Alertes' },
  { key: 'transaction', label: 'Transactions' },
  { key: 'systeme', label: 'Système' },
];

const TYPE_ICONS: Record<TypeNotification, string> = {
  alerte: '🔔',
  transaction: '💳',
  float: '⚠️',
  ia: '🤖',
  systeme: '⚙️',
};

const TYPE_COLORS: Record<TypeNotification, string> = {
  alerte: 'bg-red-100 text-red-600',
  transaction: 'bg-blue-100 text-blue-600',
  float: 'bg-orange-100 text-orange-600',
  ia: 'bg-purple-100 text-purple-600',
  systeme: 'bg-gray-100 text-gray-600',
};

export default function NotificationsPage() {
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const [page, setPage] = useState(1);
  const LIMIT = 6;

  const queryFiltres = {
    ...(filtre === 'non_lues' ? { lue: false } : {}),
    ...(filtre !== 'toutes' && filtre !== 'non_lues'
      ? { type: filtre as TypeNotification }
      : {}),
    page,
    limit: LIMIT,
  };

  const { data, isLoading } = useNotifications(queryFiltres);
  const { data: allNonLues } = useNotifications({ lue: false, limit: 100 });

  const notifications = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const nonLuesCount = allNonLues?.total ?? 0;

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotif = useDeleteNotification();

  const handleFiltreChange = (f: Filtre) => {
    setFiltre(f);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Notifications</h1>
          <p className="text-sm text-text-muted mt-1">
            Gérez vos alertes et messages du système
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variante="ghost"
            taille="sm"
            icone={<CheckCheck size={16} />}
            onClick={() => markAllAsRead.mutate()}
            loading={markAllAsRead.isPending}
            disabled={nonLuesCount === 0}
          >
            Tout marquer lu
          </Button>
          <Button
            variante="outline"
            taille="sm"
            icone={<Settings size={16} />}
          >
            Paramètres
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {FILTRES.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFiltreChange(f.key)}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 flex items-center gap-2',
              filtre === f.key
                ? 'bg-sidebar text-white'
                : 'bg-white text-text-muted hover:text-text-main border border-gray-200'
            )}
          >
            {f.label}
            {f.key === 'non_lues' && nonLuesCount > 0 && (
              <span className={clsx(
                'text-xs font-bold px-1.5 py-0.5 rounded-full',
                filtre === 'non_lues' ? 'bg-white text-sidebar' : 'bg-red-500 text-white'
              )}>
                {nonLuesCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-card shadow-card divide-y divide-gray-100">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-text-muted">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : notifications.length === 0 ? (
          /* État vide */
          <div className="py-20 flex flex-col items-center gap-4 text-text-muted">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell size={36} className="text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-text-main">Aucune notification</p>
              <p className="text-sm mt-1">
                {filtre === 'non_lues'
                  ? 'Toutes vos notifications ont été lues.'
                  : 'Aucune notification dans cette catégorie.'}
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={clsx(
                'flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group',
                !notif.lue && 'bg-blue-50/30'
              )}
            >
              {/* Icône */}
              <div className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0',
                TYPE_COLORS[notif.type]
              )}
                aria-hidden="true"
              >
                {TYPE_ICONS[notif.type]}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={clsx(
                    'text-sm font-semibold',
                    !notif.lue ? 'text-text-main' : 'text-text-muted'
                  )}>
                    {notif.titre}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {!notif.lue && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" aria-label="Non lue" />
                    )}
                    <span className="text-xs text-text-muted whitespace-nowrap">
                      {formatRelativeTime(notif.date)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-text-muted mt-1 line-clamp-2">{notif.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notif.lue && (
                  <button
                    onClick={() => markAsRead.mutate(notif.id)}
                    aria-label="Marquer comme lue"
                    className="p-2 rounded-lg text-text-muted hover:text-green-600 hover:bg-green-50 transition-colors"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotif.mutate(notif.id)}
                  aria-label="Supprimer la notification"
                  className="p-2 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-text-muted hover:text-text-main hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Précédent
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={clsx(
                'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                p === page
                  ? 'bg-sidebar text-white'
                  : 'border border-gray-200 text-text-muted hover:bg-gray-50'
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-text-muted hover:text-text-main hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
