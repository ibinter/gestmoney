'use client';
import React from 'react';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  Building2,
  Users,
  Coins,
  BarChart3,
  ChevronRight,
  X,
  Vault,
  UserRound,
  Bell,
  Settings,
  User,
} from 'lucide-react';
import { useNotificationCount } from '@/hooks/useNotifications';
import { useDashboardStore } from '@/store/dashboardStore';

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icone: LayoutDashboard, badgeKey: null },
      { href: '/dashboard/transactions', label: 'Transactions', icone: ArrowLeftRight, badgeKey: 'txEnAttente' },
      { href: '/dashboard/float', label: 'Gestion Float', icone: Wallet, badgeKey: 'floatAlertes' },
      { href: '/dashboard/caisse', label: 'Caisse', icone: Vault, badgeKey: null },
    ],
  },
  {
    label: 'Réseau',
    items: [
      { href: '/dashboard/agences', label: 'Agences & PDV', icone: Building2, badgeKey: null },
      { href: '/dashboard/agents', label: 'Agents', icone: Users, badgeKey: null },
      { href: '/dashboard/clients', label: 'Clients', icone: UserRound, badgeKey: null },
    ],
  },
  {
    label: 'Finance & Analyse',
    items: [
      { href: '/dashboard/commissions', label: 'Commissions', icone: Coins, badgeKey: null },
      { href: '/dashboard/performances', label: 'Performances', icone: TrendingUp, badgeKey: null },
      { href: '/dashboard/rapports', label: 'Rapports & BI', icone: BarChart3, badgeKey: null },
    ],
  },
  {
    label: 'Compte',
    items: [
      { href: '/dashboard/notifications', label: 'Notifications', icone: Bell, badgeKey: 'notifs' },
      { href: '/dashboard/settings', label: 'Paramètres', icone: Settings, badgeKey: null },
      { href: '/dashboard/profile', label: 'Mon profil', icone: User, badgeKey: null },
    ],
  },
];

interface SidebarProps {
  ouvert?: boolean;
  onFermer?: () => void;
  mode?: 'fixe' | 'overlay';
}

export function Sidebar({ ouvert = true, onFermer, mode = 'fixe' }: SidebarProps) {
  const pathname = usePathname();
  const { data: nbNotifs = 0 } = useNotificationCount();
  const { stats } = useDashboardStore();

  const liveBadges: Record<string, number> = {
    notifs: nbNotifs,
    txEnAttente: stats.transactions.enAttente,
    floatAlertes: stats.float.alertes,
  };

  const contenu = (
    <nav className="flex flex-col h-full">
      {/* Logo header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-0">
          <Logo variante="compact" theme="sombre" />
        </div>
        {mode === 'overlay' && onFermer && (
          <button onClick={onFermer} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={clsx('space-y-0.5', si > 0 && 'mt-4')}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
              {section.label}
            </p>
            {section.items.map(({ href, label, icone: Icone, badgeKey }) => {
              const actif = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
              const badgeCount = badgeKey ? (liveBadges[badgeKey] ?? 0) : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={mode === 'overlay' ? onFermer : undefined}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    actif
                      ? 'bg-primary text-sidebar shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icone size={18} className="flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badgeCount > 0 && !actif && (
                    <span className={clsx(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center',
                      badgeKey === 'notifs' ? 'bg-red-500 text-white' : 'bg-warning/20 text-warning'
                    )}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                  {actif && <ChevronRight size={14} className="opacity-60" />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
        <p className="text-[10px] text-gray-500 text-center">
          v1.0 &copy; 2024 IBIG SOFT
        </p>
      </div>
    </nav>
  );

  if (mode === 'overlay') {
    return (
      <>
        {ouvert && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onFermer} />
        )}
        <aside
          className={clsx(
            'fixed top-0 left-0 h-full w-64 bg-sidebar z-50 transition-transform duration-300 lg:hidden',
            ouvert ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {contenu}
        </aside>
      </>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar flex-shrink-0">
      {contenu}
    </aside>
  );
}
