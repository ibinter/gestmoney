'use client';
// ============================================================
// COMPOSANT CLOCHE NOTIFICATIONS — GESTMONEY
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  useNotificationCount,
  useNotifications,
  useMarkAsRead,
  type TypeNotification,
} from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/formatters';

const TYPE_ICONS: Record<TypeNotification, string> = {
  alerte: '🔔',
  transaction: '💳',
  float: '⚠️',
  ia: '🤖',
  systeme: '⚙️',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: count = 0 } = useNotificationCount();
  const { data } = useNotifications({ limit: 5 });
  const notifications = data?.data ?? [];
  const markAsRead = useMarkAsRead();

  // Fermer si clic en dehors
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAsRead.mutate(id);
  };

  return (
    <div ref={ref} className="relative">
      {/* Bouton cloche */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${count > 0 ? `, ${count} non lues` : ''}`}
        aria-expanded={open}
        className="relative p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-gray-100 transition-colors"
      >
        <Bell size={22} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-text-main text-sm">Notifications</span>
            {count > 0 && (
              <span className="text-xs text-text-muted">{count} non lue{count > 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Liste */}
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted text-sm">
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={clsx(
                    'px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors',
                    !notif.lue && 'bg-yellow-50/60'
                  )}
                >
                  <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">
                    {TYPE_ICONS[notif.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-sm font-medium truncate', !notif.lue ? 'text-text-main' : 'text-text-muted')}>
                      {notif.titre}
                    </p>
                    <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{notif.description}</p>
                    <p className="text-xs text-text-muted mt-1">{formatRelativeTime(notif.date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {!notif.lue && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" aria-hidden="true" />
                        <button
                          onClick={(e) => handleMarkRead(notif.id, e)}
                          aria-label="Marquer comme lue"
                          className="text-[10px] text-primary hover:underline whitespace-nowrap"
                        >
                          Lu
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-sm text-primary font-medium hover:underline"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
