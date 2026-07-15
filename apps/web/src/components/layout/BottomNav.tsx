'use client';
// ============================================================
// NAVIGATION BAS DE PAGE MOBILE — GESTMONEY
// Visible uniquement < 768px (md:hidden)
// Inclut un bouton "Plus" ouvrant un drawer avec menu complet
// ============================================================
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Bell,
  User,
  MoreHorizontal,
  X,
  Building2,
  Wallet,
  Vault,
  Coins,
  TrendingUp,
  BarChart3,
  Settings,
  HelpCircle,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useNotificationCount } from '@/hooks/useNotifications';
import { useAuthStore } from '@/store/authStore';

// Les 5 items principaux de la barre
const PRIMARY_ITEMS = [
  { href: '/dashboard',              label: 'Accueil',      icon: LayoutDashboard, badge: false },
  { href: '/dashboard/transactions', label: 'Opérations',   icon: ArrowLeftRight,  badge: false },
  { href: '/dashboard/agents',       label: 'Agents',       icon: Users,           badge: false },
  { href: '/dashboard/notifications',label: 'Alertes',      icon: Bell,            badge: true  },
  { href: '/dashboard/profile',      label: 'Profil',       icon: User,            badge: false },
];

// Menu "Plus" complet
const MORE_ITEMS = [
  { href: '/dashboard/agences',     label: 'Agences',      icon: Building2    },
  { href: '/dashboard/float',       label: 'Float',        icon: Wallet       },
  { href: '/dashboard/caisse',      label: 'Caisse',       icon: Vault        },
  { href: '/dashboard/clients',     label: 'Clients',      icon: User         },
  { href: '/dashboard/commissions', label: 'Commissions',  icon: Coins        },
  { href: '/dashboard/performances',label: 'Perfs',        icon: TrendingUp   },
  { href: '/dashboard/rapports',    label: 'Rapports',     icon: BarChart3    },
  { href: '/dashboard/settings',    label: 'Paramètres',   icon: Settings     },
  { href: '/dashboard/support',     label: 'Support',      icon: MessageSquare},
  { href: '/dashboard/aide',        label: 'Aide',         icon: HelpCircle   },
];

export function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: nbNotifs = 0 } = useNotificationCount();
  const { user } = useAuthStore();
  const isSuperAdmin =
    user?.role === 'SUPER_ADMIN' || user?.role === 'super_admin';

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <>
      {/* ── Drawer "Plus" ─────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel */}
          <div className="fixed bottom-[56px] left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl z-50 md:hidden">
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-sm font-semibold text-text-main">
                Toutes les fonctions
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Grid items */}
            <div className="grid grid-cols-4 gap-1 px-3 pb-4">
              {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-colors',
                    isActive(href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
                  )}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-medium text-center leading-tight">
                    {label}
                  </span>
                </Link>
              ))}

              {/* Console SuperAdmin */}
              {isSuperAdmin && (
                <Link
                  href="/superadmin"
                  onClick={() => setDrawerOpen(false)}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-colors col-span-4',
                    isActive('/superadmin')
                      ? 'bg-[#FFD000]/20 text-[#111]'
                      : 'text-[#FFD000] hover:bg-[#FFD000]/10 border border-[#FFD000]/30'
                  )}
                >
                  <Shield size={20} />
                  <span className="text-[10px] font-medium">Console Super Admin</span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Barre de navigation principale ─────────────────────── */}
      <nav
        aria-label="Navigation principale mobile"
        className="fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/10 z-30 flex md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PRIMARY_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(href);
          const badgeCount = badge ? nbNotifs : 0;

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'text-[#009E00]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <div className="relative">
                <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}

        {/* Bouton "Plus" */}
        <button
          onClick={() => setDrawerOpen((v) => !v)}
          className={clsx(
            'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
            drawerOpen ? 'text-[#009E00]' : 'text-gray-400 hover:text-gray-600'
          )}
          aria-label="Plus de fonctions"
          aria-expanded={drawerOpen}
        >
          {drawerOpen ? (
            <X size={21} strokeWidth={2.2} />
          ) : (
            <MoreHorizontal size={21} strokeWidth={1.8} />
          )}
          <span className="text-[10px] font-medium leading-none">Plus</span>
        </button>
      </nav>
    </>
  );
}
