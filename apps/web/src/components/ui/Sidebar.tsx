'use client';
// ============================================================
// SIDEBAR — GESTMONEY
// Rendu aligné sur la maquette mockup/index.html (classes gm-*)
// Mode fixe desktop (260px étendu / 64px compact) + overlay mobile
// Toggle compact mémorisé dans localStorage
// Navigation hiérarchique avec badges live et filtrage par rôle
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
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
  BookText,
  Package,
  SlidersHorizontal,
  ShieldAlert,
  CreditCard,
  Radio,
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
// Pages sensibles (comptabilité, administration, audit fraude). Aligné sur la
// garde de dashboard/administration et les @Roles(...) de l'API. Le filtrage
// ici n'est qu'un confort d'affichage : la sécurité réelle est côté NestJS.
const ROLES_BACKOFFICE: Role[] = [
  ...ROLES_MANAGER,
  'network_admin', 'NETWORK_ADMIN',
  'agency_manager', 'AGENCY_MANAGER',
];
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
      { href: '/dashboard/stock',    label: 'Stock',         icone: Package,    badgeKey: null },
      { href: '/dashboard/operateurs', label: 'Opérateurs',  icone: Radio,      badgeKey: null, roles: ROLES_BACKOFFICE },
    ],
  },
  {
    label: 'Finance & Analyse',
    items: [
      { href: '/dashboard/commissions',  label: 'Commissions',  icone: Coins,    badgeKey: null },
      { href: '/dashboard/performances', label: 'Performances', icone: TrendingUp, badgeKey: null },
      { href: '/dashboard/rapports',     label: 'Rapports & BI',icone: BarChart3,  badgeKey: null },
      { href: '/dashboard/comptabilite', label: 'Comptabilité', icone: BookText,   badgeKey: null, roles: ROLES_BACKOFFICE },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/dashboard/notifications', label: 'Notifications', icone: Bell,        badgeKey: 'notifs' },
      { href: '/dashboard/administration', label: 'Administration', icone: SlidersHorizontal, badgeKey: null, roles: ROLES_BACKOFFICE },
      { href: '/dashboard/ia-fraude',     label: 'Audit & Alertes', icone: ShieldAlert, badgeKey: null, roles: ROLES_BACKOFFICE },
      { href: '/dashboard/settings',      label: 'Paramètres',    icone: Settings,    badgeKey: null, roles: ROLES_MANAGER },
      { href: '/dashboard/abonnement',    label: 'Abonnement',    icone: CreditCard,  badgeKey: null },
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

  // L'overlay mobile est toujours en pleine largeur
  const compact = mode === 'overlay'
    ? false
    : (compactProp !== undefined ? compactProp : compactLocal);

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
    '/dashboard/stock':         t.nav.stock,
    '/dashboard/comptabilite':  t.nav.comptabilite,
    '/dashboard/administration': t.nav.administration,
    '/dashboard/ia-fraude':     t.nav.iaFraude,
    '/dashboard/abonnement':    t.nav.abonnement,
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

  const estActif = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  // Libellé de la section courante (bandeau "SECTION ACTIVE" de la maquette)
  const indexSectionActive = NAV_SECTIONS.findIndex((s) =>
    s.items.some((i) => estActif(i.href))
  );
  const contextLabel =
    indexSectionActive >= 0
      ? sectionLabels[indexSectionActive] ?? NAV_SECTIONS[indexSectionActive].label
      : sectionLabels[0];

  // ── Contenu sidebar ──────────────────────────────────────────────────────────
  const contenu = (
    <>
      {/* ── Entête : marque + toggle compact ─────────────────── */}
      <div
        className={clsx(
          'flex items-center h-16 flex-shrink-0 border-b border-white/[0.07]',
          compact ? 'justify-center px-2' : 'justify-between px-5'
        )}
      >
        {!compact && (
          <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
            <span className="w-8 h-8 rounded-[10px] bg-[color:var(--gm-primary)] flex items-center justify-center text-base">
              🪙
            </span>
            <span className="text-[15px] font-extrabold tracking-[-0.5px] text-white">
              GEST<span className="text-[color:var(--gm-primary)]">MONEY</span>
            </span>
          </Link>
        )}

        <div className={clsx('flex items-center', compact && 'w-full justify-center')}>
          {/* Bouton fermer overlay mobile */}
          {mode === 'overlay' && onFermer && (
            <button
              type="button"
              onClick={onFermer}
              className="text-white/60 hover:text-white p-1 rounded-lg"
              aria-label={t.sidebar.closeMenu}
            >
              <X size={18} />
            </button>
          )}

          {/* Toggle compact (desktop uniquement) */}
          {mode === 'fixe' && (
            <button
              type="button"
              onClick={toggleCompact}
              className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-auto"
              aria-label={compact ? t.sidebar.expandSidebar : t.sidebar.collapseSidebar}
              title={compact ? t.sidebar.expand : t.sidebar.collapse}
            >
              {compact ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Bandeau section active (maquette) ─────────────────── */}
      {!compact && <div className="gm-sidebar-context">{contextLabel}</div>}

      {/* ── Navigation ────────────────────────────────────────── */}
      {/* `minHeight: 0` est indispensable : dans un conteneur flex en colonne,
          un enfant `flex:1` garde `min-height:auto` et refuse de rétrécir sous
          la hauteur de son contenu — le défilement ne s'activerait jamais.
          En inline pour ne pas dépendre de l'ordre des couches CSS. */}
      <nav
        className="pb-2"
        style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }}
        aria-label={t.sidebar.mainNav}
      >
        {NAV_SECTIONS.map((section, si) => {
          const visibleItems = section.items.filter(canSeeItem);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              {!compact ? (
                <div className="gm-sidebar-section-title">
                  {sectionLabels[si] ?? section.label}
                </div>
              ) : (
                si > 0 && <div className="h-px bg-white/[0.07] mx-3 my-2" />
              )}

              {visibleItems.map(({ href, label, icone: Icone, badgeKey }) => {
                const actif = estActif(href);
                const badgeCount = badgeKey ? (liveBadges[badgeKey] ?? 0) : 0;
                const displayLabel = navLabels[href] ?? label;

                const lien = (
                  <Link
                    href={href}
                    onClick={mode === 'overlay' ? onFermer : undefined}
                    data-tour={`nav-${href.split('/').filter(Boolean).pop() ?? 'accueil'}`}
                    aria-current={actif ? 'page' : undefined}
                    aria-label={compact ? displayLabel : undefined}
                    title={compact ? displayLabel : undefined}
                    className={clsx(
                      'gm-sidebar-item relative',
                      actif && 'gm-active',
                      compact && '!justify-center !px-0 !mx-2'
                    )}
                  >
                    <span className="gm-si-icon inline-flex items-center">
                      <Icone size={16} aria-hidden="true" />
                    </span>

                    {!compact && (
                      <>
                        <span className="flex-1 truncate">{displayLabel}</span>
                        {badgeCount > 0 && (
                          <span
                            className={clsx(
                              'text-[10px] leading-none px-1.5 py-1 rounded-full font-bold min-w-[18px] text-center',
                              badgeKey === 'notifs'
                                ? 'bg-[color:var(--gm-danger)] text-white'
                                : 'bg-[color:var(--gm-primary)]/20 text-[color:var(--gm-primary)]'
                            )}
                          >
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </>
                    )}

                    {/* Badge compact */}
                    {compact && badgeCount > 0 && (
                      <span className="absolute top-0.5 right-1.5 min-w-[14px] h-[14px] px-0.5 bg-[color:var(--gm-danger)] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </Link>
                );

                return compact ? (
                  <Tooltip key={href} label={displayLabel}>{lien}</Tooltip>
                ) : (
                  <React.Fragment key={href}>{lien}</React.Fragment>
                );
              })}
            </div>
          );
        })}

        {/* ── Console SuperAdmin ─────────────────────────────── */}
        {isSuperAdmin && (
          <>
            {!compact && <div className="gm-sidebar-section-title">{t.nav.superAdminSection}</div>}
            {compact ? (
              <Tooltip label={t.nav.superadmin}>
                <Link
                  href="/superadmin"
                  onClick={mode === 'overlay' ? onFermer : undefined}
                  aria-current={pathname.startsWith('/superadmin') ? 'page' : undefined}
                  aria-label={t.nav.superadmin}
                  title={t.nav.superadmin}
                  className={clsx(
                    'gm-sidebar-item !justify-center !px-0 !mx-2',
                    pathname.startsWith('/superadmin') && 'gm-active'
                  )}
                >
                  <span className="gm-si-icon inline-flex items-center">
                    <Shield size={16} aria-hidden="true" />
                  </span>
                </Link>
              </Tooltip>
            ) : (
              <Link
                href="/superadmin"
                onClick={mode === 'overlay' ? onFermer : undefined}
                aria-current={pathname.startsWith('/superadmin') ? 'page' : undefined}
                className={clsx(
                  'gm-sidebar-item',
                  pathname.startsWith('/superadmin') && 'gm-active'
                )}
              >
                <span className="gm-si-icon inline-flex items-center">
                  <Shield size={16} aria-hidden="true" />
                </span>
                <span className="flex-1 truncate">{t.nav.superadmin}</span>
              </Link>
            )}
          </>
        )}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className={clsx('gm-sidebar-footer', compact && '!justify-center !px-0')}>
        <span aria-hidden="true">🪙</span>
        {!compact && <span>GESTMONEY v1.0 — IBIG SOFT</span>}
      </div>
    </>
  );

  // ── Overlay mobile ───────────────────────────────────────────────────────────
  if (mode === 'overlay') {
    return (
      <>
        {ouvert && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onFermer}
            aria-hidden="true"
          />
        )}
        <aside
          className={clsx(
            'gm-sidebar !flex lg:!hidden !fixed !top-0 !left-0 !h-full !w-[260px] !z-50 !overflow-hidden transition-transform duration-300 ease-in-out',
            ouvert ? 'translate-x-0' : '-translate-x-full'
          )}
          data-tour="sidebar"
          aria-label={t.sidebar.menu}
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
        'gm-sidebar !hidden lg:!flex flex-shrink-0 transition-all duration-300 ease-in-out',
        compact ? '!w-16' : '!w-[260px]'
      )}
      // Géométrie en style inline volontairement : le CSS porté de la maquette
      // (.gm-sidebar) et les utilitaires Tailwind en `!important` se
      // disputaient la hauteur et le positionnement, et l'ordre des couches
      // diffère entre dev et build de production — la sidebar s'étirait alors
      // à la hauteur de son contenu (~2500px), sans défilement possible.
      // L'inline tranche de façon déterministe des deux côtés.
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
        zIndex: 30,
      }}
      data-tour="sidebar"
      aria-label="Menu de navigation"
    >
      {contenu}
    </aside>
  );
}
