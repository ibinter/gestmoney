'use client';
// ============================================================
// NOTIFICATION CENTER — GESTMONEY
// Icône cloche + dropdown in-app dans la topbar
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  useNotifications,
  useNotificationCount,
  useMarkAsRead,
  useMarkAllAsRead,
  type Notification,
} from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/formatters';

const TYPE_ICONS: Record<string, string> = {
  alerte: '🔔',
  transaction: '💳',
  float: '⚠️',
  ia: '🤖',
  systeme: '⚙️',
  support: '🎫',
  licence: '📋',
  default: '📢',
};

const TYPE_COLORS: Record<string, string> = {
  alerte: 'bg-red-100 text-red-600',
  transaction: 'bg-blue-100 text-blue-600',
  float: 'bg-orange-100 text-orange-600',
  ia: 'bg-purple-100 text-purple-600',
  systeme: 'bg-gray-100 text-gray-600',
  support: 'bg-teal-100 text-teal-600',
  licence: 'bg-indigo-100 text-indigo-600',
  default: 'bg-gray-100 text-gray-500',
};

function NotifItem({ notif, onMarkRead }: { notif: Notification; onMarkRead: (id: string) => void }) {
  const icon = TYPE_ICONS[notif.type] ?? TYPE_ICONS.default;
  const color = TYPE_COLORS[notif.type] ?? TYPE_COLORS.default;

  const inner = (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer',
        !notif.lue && 'bg-blue-50/40 dark:bg-blue-900/10',
      )}
      onClick={() => { if (!notif.lue) onMarkRead(notif.id); }}
    >
      {/* Icône type */}
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0', color)}>
        {icon}
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={clsx('text-sm font-semibold truncate', !notif.lue ? 'text-text-main' : 'text-text-muted')}>
            {notif.titre}
          </p>
          <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0">
            {formatRelativeTime(notif.date)}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.description}</p>
      </div>

      {/* Point non-lu */}
      {!notif.lue && (
        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" aria-label="Non lue" />
      )}
    </div>
  );

  if (notif.lien) {
    return <Link href={notif.lien} className="block no-underline">{inner}</Link>;
  }
  return inner;
}

export function NotificationCenter() {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: nbNonLues = 0, refetch: refetchCount } = useNotificationCount();
  const { data, refetch } = useNotifications({ limit: 8 });
  const notifications = data?.data ?? [];

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Fermer au clic extérieur
  useEffect(() => {
    if (!ouvert) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ouvert]);

  // Rafraîchir à l'ouverture
  useEffect(() => {
    if (ouvert) {
      void refetch();
      void refetchCount();
    }
  }, [ouvert, refetch, refetchCount]);

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAll = () => {
    markAllAsRead.mutate();
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bouton cloche */}
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="gm-notif-btn"
        data-tour="notifications-btn"
        aria-label={`Notifications${nbNonLues > 0 ? ` (${nbNonLues} non lues)` : ''}`}
        aria-expanded={ouvert}
        aria-haspopup="true"
      >
        <span aria-hidden="true">🔔</span>
        {nbNonLues > 0 && (
          <span className="gm-notif-badge">{nbNonLues > 9 ? '9+' : nbNonLues}</span>
        )}
      </button>

      {/* Dropdown */}
      {ouvert && (
        <>
          {/* Overlay invisible pour fermeture mobile */}
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOuvert(false)} />

          <div
            className="absolute right-0 top-full mt-2 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[color:var(--gm-card)] rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
            role="dialog"
            aria-label="Centre de notifications"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-text-main">Notifications</span>
                {nbNonLues > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                    {nbNonLues}
                  </span>
                )}
              </div>
              {nbNonLues > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="text-xs text-[color:var(--gm-primary)] hover:underline font-medium"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {/* Liste */}
            <div className="divide-y divide-gray-50 dark:divide-white/5 max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-text-muted">
                  <span className="text-3xl" aria-hidden="true">🔔</span>
                  <p className="text-sm font-medium">Aucune notification</p>
                  <p className="text-xs">Vous êtes à jour !</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <NotifItem
                    key={notif.id}
                    notif={notif}
                    onMarkRead={handleMarkRead}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/10 text-center">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOuvert(false)}
                className="text-xs text-[color:var(--gm-primary)] hover:underline font-medium no-underline"
              >
                Voir toutes les notifications →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
