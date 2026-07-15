'use client';
// ============================================================
// SIDEBAR — GESTMONEY
// Mode fixe desktop (w-64 étendu / w-16 compact) + overlay mobile
// Toggle compact mémorisé dans localStorage
// Navigation hiérarchique avec badges live et filtrage par rôle
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
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
  Shield,
  HelpCircle,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useNotificationCount } from '@/hooks/useNotifications';
import { useDashboardStore } from '@/store/dashboardStore';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';

// ── Rôles ─────────────────────────────────────────────────────────────────────
type Role = string;

const ROLES_ADMIN: Role[]  = ['SUPER_ADMIN', 'super_admin', 'admin', 'ADMIN'];
const ROLES_MANAGER: Role[] = [...ROLES_ADMIN, 'superviseur', 'SUPERVISEUR', 'MANAGER'];
const ROLES_AGENT: Role[]   = [...ROLES_MANAGER, 'agent', 'AGENT'];
// Tout le monde voit les éléments sans restriction

// ── Définition navigation ──────────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icone: React.ElementType;
  badgeKey?: string | null;
  roles?: Role[]; // undefined = visible par tous
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',              label: 'Tableau de bord', icone: LayoutDashboard,  badgeKey: null },
      { href: '/dashboard/transactions', label: 'Transactions',    icone: ArrowLeftRight,   badgeKey: 'txEnAttente' },
      { href: '/dashboard/float',        label: 'Gestion Float',   icone: Wallet,           badgeKey: 'floatAlertes' },
      { href: '/dashboard/caisse',       label: 'Caisse',          icone: Vault,            badgeKey: null },
    ],
  },
  {
    label: 'Réseau',
    items: [
      { href: '/dashboard/agences',  label: 'Agences & PDV', icone: Building2,  badgeKey: null },
      { href: '/dashboard/agents',   label: 'Agents',        icone: Users,      badgeKey: null },
      { href: '/dashboard/clients',  label: 'Clients',       icone: UserRound,  badgeKey: null },
    ],
  },
  {
    label: 'Finance & Analyse',
    items: [
      { href: '/dashboard/commissions',  label: 'Commissions',  icone: Coins,    badgeKey: null },
      { href: '/dashboard/performances', label: 'Performances', icone: TrendingUp, badgeKey: null },
      { href: '/dashboard/rapports',     label: 'Rapports & BI',icone: BarChart3,  badgeKey: null },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/dashboard/notifications', label: 'Notifications', icone: Bell,        badgeKey: 'notifs' },
      { href: '/dashboard/settings',      label: 'Paramètres',    icone: Settings,    badgeKey: null, roles: ROLES_MANAGER },
      { href: '/dashboard/profile',       label: 'Mon profil',    icone: User,        badgeKey: null },
      { href: '/dashboard/support',       label: 'Support',       icone: MessageSquare, badgeKey: null },
      { href: '/dashboard/aide',          label: "Centre d'aide", icone: HelpCircle,  badgeKey: null },
    ],
  },
];

// ── Tooltip compact ────────────────────────────────────────────────────────────
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  return (
    <div
      className="relative"
      onMouseEnter={() => { timer.current = setTimeout(() => setVisible(true), 300); }}
      onMouseLeave={() => { clearTimeout(timer.current); setVisible(false); }}
    >
      {children}
      {visible && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface SidebarProps {
  ouvert?: boolean;
  onFermer?: () => void;
  mode?: 'fixe' | 'overlay';
  compact?: boolean;
  onToggleCompact?: () => void;
}

const STORAGE_KEY = 'gestmoney-sidebar-compact';

export function Sidebar({
  ouvert = true,
  onFermer,
  mode = 'fixe',
  compact: compactProp,
  onToggleCompact,
}: SidebarProps) {
  const pathname    = usePathname();
  const { data: nbNotifs = 0 } = useNotificationCount();
  const { stats }   = useDashboardStore();
  const { user }    = useAuthStore();
  const t           = useT();

  // Gestion compact interne (si non contrôlé de l'extérieur)
  const [compactLocal, setCompactLocal] = useState(false);
  useEffect(() => {
    if (compactProp === undefined) {
      setCompactLocal(localStorage.getItem(STORAGE_KEY) === '1');
    }
  }, [compactProp]);

  const compact = compactProp !== undefined ? compactProp : compactLocal;
  const toggleCompact = () => {
    if (onToggleCompact) {
      onToggleCompact();
    } else {
      const next = !compactLocal;
      setCompactLocal(next);
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'super_admin';
  const userRole     = user?.role ?? '';

  const liveBadges: Record<string, number> = {
    notifs:       nbNotifs,
    txEnAttente:  stats.transactions.enAttente,
    floatAlertes: stats.float.alertes,
  };

  // Labels traduits
  const navLabels: Record<string, string> = {
    '/dashboard':               t.nav.dashboard,
    '/dashboard/transactions':  t.nav.transactions,
    '/dashboard/float':         t.nav.float,
    '/dashboard/caisse':        t.nav.caisse,
    '/dashboard/agences':       t.nav.agences,
    '/dashboard/agents':        t.nav.agents,
    '/dashboard/clients':       t.nav.clients,
    '/dashboard/commissions':   t.nav.commissions,
    '/dashboard/performances':  t.nav.performances,
    '/dashboard/rapports':      t.nav.rapports,
    '/dashboard/notifications': t.nav.notifications,
    '/dashboard/settings':      t.nav.settings,
    '/dashboard/profile':       t.nav.profile,
    '/dashboard/support':       t.nav.support,
    '/dashboard/aide':          t.nav.aide,
  };

  const sectionLabels = [t.nav.principal, t.nav.reseau, t.nav.finance, t.nav.compte];

  // Filtrage par rôle
  const canSeeItem = (item: NavItem) =>
    !item.roles || item.roles.includes(userRole);

  // ── Contenu sidebar ──────────────────────────────────────────────────────────
  const contenu = (
    <nav className="flex flex-col h-full overflow-hidden">
      {/* ── Logo & toggle compact ─────────────────────────────── */}
      <div
        className={clsx(
          'h-16 flex items-center border-b border-white/10 flex-shrink-0 transition-all duration-300',
          compact ? 'justify-center px-2' : 'justify-between px-5'
        )}
      >
        {!compact && (
          <div className="flex items-center overflow-hidden">
            <Logo variante="compact" theme="sombre" />
          </div>
        )}

        <div className={clsx('flex items-center', compact && 'justify-center w-full')}>
          {/* Bouton fermer overlay mobile */}
          {mode === 'overlay' && onFermer && (
            <button
              onClick={onFermer}
              className="text-gray-400 hover:text-white p-1 rounded-lg"
              aria-label="Fermer le menu"
            >
              <X size={18} />
            </button>
          )}

          {/* Toggle compact (desktop uniquement) */}
          {mode === 'fixe' && (
            <button
              onClick={toggleCompact}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-auto"
              aria-label={compact ? 'Étendre la sidebar' : 'Réduire la sidebar'}
              title={compact ? 'Étendre' : 'Réduire'}
            >
              {compact
                ? <PanelLeftOpen size={16} />
                : <PanelLeftClose size={16} />
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────── */}
      <div className="flex-1 px-2 py-3 overflow-y-auto space-y-1 scrollbar-thin">
        {NAV_SECTIONS.map((section, si) => {
          const visibleItems = section.items.filter(canSeeItem);
          if (visibleItems.length === 0) return null;

          return (
            <div key={si} className={clsx('space-y-0.5', si > 0 && 'mt-3')}>
              {/* Label de section (masqué en compact) */}
              {!compact && (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                  {sectionLabels[si] ?? section.label}
                </p>
              )}
              {compact && si > 0 && (
                <div className="h-px bg-white/10 mx-2 mb-2" />
              )}

              {visibleItems.map(({ href, label, icone: Icone, badgeKey }) => {
                const actif = href === '/dashboard'
                  ? pathname === href
                  : pathname.startsWith(href);
                const badgeCount = badgeKey ? (liveBadges[badgeKey] ?? 0) : 0;
                const displayLabel = navLabels[href] ?? label;

                const linkContent = (
                  <Link
                    href={href}
                    onClick={mode === 'overlay' ? onFermer : undefined}
                    className={clsx(
                      'flex items-center rounded-xl text-sm font-medium transition-all duration-150 relative group',
                      compact
                        ? 'justify-center w-10 h-10 mx-auto'
                        : 'gap-3 px-3 py-2.5',
                      actif
                        ? 'bg-primary text-sidebar shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <Icone size={18} className="flex-shrink-0" />

                    {!compact && (
                      <>
                        <span className="flex-1 truncate">{displayLabel}</span>
                        {badgeCount > 0 && !actif && (
                          <span className={clsx(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center',
                            badgeKey === 'notifs'
                              ? 'bg-red-500 text-white'
                              : 'bg-warning/20 text-warning'
                          )}>
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                        {actif && <ChevronRight size={14} className="opacity-60 flex-shrink-0" />}
                      </>
                    )}

                    {/* Badge compact */}
                    {compact && badgeCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </Link>
                );

                return compact ? (
                  <Tooltip key={href} label={displayLabel}>
                    {linkContent}
                  </Tooltip>
                ) : (
                  <div key={href}>{linkContent}</div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Console SuperAdmin ─────────────────────────────────── */}
      {isSuperAdmin && (
        <div className={clsx('px-2 pb-2', compact && 'flex justify-center')}>
          {compact ? (
            <Tooltip label="Console Super Admin">
              <Link
                href="/superadmin"
                onClick={mode === 'overlay' ? onFermer : undefined}
                className={clsx(
                  'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 border',
                  pathname.startsWith('/superadmin')
                    ? 'bg-[#FFD000] text-[#111] border-[#FFD000]'
                    : 'text-[#FFD000] border-[#FFD000]/30 hover:bg-[#FFD000]/10'
                )}
              >
                <Shield size={16} />
              </Link>
            </Tooltip>
          ) : (
            <Link
              href="/superadmin"
              onClick={mode === 'overlay' ? onFermer : undefined}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border',
                pathname.startsWith('/superadmin')
                  ? 'bg-[#FFD000] text-[#111] border-[#FFD000]'
                  : 'text-[#FFD000] border-[#FFD000]/30 hover:bg-[#FFD000]/10'
              )}
            >
              <Shield size={16} className="flex-shrink-0" />
              <span>{t.nav.superadmin}</span>
            </Link>
          )}
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className={clsx(
        'border-t border-white/10 flex-shrink-0',
        compact ? 'py-3 flex justify-center' : 'px-4 py-3'
      )}>
        {compact ? (
          <div className="w-6 h-1 rounded-full bg-white/20" />
        ) : (
          <p className="text-[10px] text-gray-500 text-center">
            v1.0 &copy; 2026 IBIG SOFT
          </p>
        )}
      </div>
    </nav>
  );

  // ── Overlay mobile ───────────────────────────────────────────────────────────
  if (mode === 'overlay') {
    return (
      <>
        {ouvert && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onFermer}
            aria-hidden="true"
          />
        )}
        <aside
          className={clsx(
            'fixed top-0 left-0 h-full w-64 bg-sidebar z-50 transition-transform duration-300 ease-in-out lg:hidden',
            ouvert ? 'translate-x-0' : '-translate-x-full'
          )}
          aria-label="Menu de navigation"
        >
          {contenu}
        </aside>
      </>
    );
  }

  // ── Fixe desktop ─────────────────────────────────────────────────────────────
  return (
    <aside
      className={clsx(
        'hidden lg:flex flex-col bg-sidebar flex-shrink-0 transition-all duration-300 ease-in-out',
        compact ? 'w-16' : 'w-64'
      )}
      aria-label="Menu de navigation"
    >
      {contenu}
    </aside>
  );
}
