'use client';
// ============================================================
// TOPBAR — GESTMONEY
// Rendu aligné sur la maquette mockup/index.html (classes gm-*)
// Marque + recherche globale + date + notifications + profil
// ============================================================
import React, { useState } from 'react';
import { ChevronDown, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LangSwitch, useT } from '@/lib/i18n';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useNotificationCount } from '@/hooks/useNotifications';
import { clsx } from 'clsx';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const { data: nbNonLues = 0 } = useNotificationCount();
  const router = useRouter();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const t = useT();

  const dateNow = new Intl.DateTimeFormat(t.dateLocale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handleLogout = () => {
    logout();
    setMenuOuvert(false);
    router.push('/login');
  };

  const ouvrirRecherche = () =>
    window.dispatchEvent(new CustomEvent('open-command-palette'));

  const initiales = user ? `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}` : 'U';

  return (
    <header className="gm-topbar !static !z-30 !px-4 sm:!px-6 flex-shrink-0">
      {/* Burger mobile */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-1 rounded-[10px] text-[color:var(--gm-text-2)] hover:bg-[color:var(--gm-bg)] transition-colors flex-shrink-0"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      {/* Marque */}
      <Link href="/dashboard" className="gm-topbar-brand" aria-label="GESTMONEY — accueil">
        <div className="gm-topbar-icon" aria-hidden="true">🪙</div>
        <div className="gm-topbar-name">
          GEST<span>MONEY</span>
        </div>
      </Link>

      {/* Recherche globale (ouvre la palette de commandes) */}
      <div className="gm-topbar-search">
        <span className="gm-search-icon" aria-hidden="true">🔍</span>
        <input
          id="cmd-k-trigger"
          type="text"
          readOnly
          value=""
          onClick={ouvrirRecherche}
          onFocus={ouvrirRecherche}
          placeholder={t.topbar.search}
          aria-label={t.topbar.search}
          className="cursor-pointer"
        />
      </div>

      {/* Zone droite */}
      <div className="gm-topbar-right">
        <div className="gm-topbar-date capitalize">{dateNow}</div>

        <LangSwitch className="hidden md:flex items-center px-2.5 py-1.5 rounded-[10px] border-[1.5px] border-[color:var(--gm-border)] text-xs font-semibold text-[color:var(--gm-text-2)] hover:border-[color:var(--gm-primary)] transition-colors" />

        <ThemeToggle />

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="gm-notif-btn"
          aria-label={`${t.nav.notifications}${nbNonLues > 0 ? ` (${nbNonLues} non lues)` : ''}`}
        >
          <span aria-hidden="true">🔔</span>
          {nbNonLues > 0 && (
            <span className="gm-notif-badge">{nbNonLues > 9 ? '9+' : nbNonLues}</span>
          )}
        </Link>

        {/* Profil */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOuvert((v) => !v)}
            className="gm-profile-btn"
            aria-haspopup="menu"
            aria-expanded={menuOuvert}
            aria-label="Menu utilisateur"
          >
            <div className="gm-profile-avatar uppercase">{initiales}</div>
            <div className="gm-profile-info hidden md:block text-left">
              <div className="gm-profile-name">
                {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
              </div>
              <div className="gm-profile-agency capitalize">{user?.role ?? 'admin'}</div>
            </div>
            <span className="gm-profile-chevron">
              <ChevronDown
                size={12}
                className={clsx('transition-transform', menuOuvert && 'rotate-180')}
                aria-hidden="true"
              />
            </span>
          </button>

          {menuOuvert && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOuvert(false)} />
              <div
                className="gm-profile-dropdown gm-open !absolute !top-full !right-0 !mt-2 !w-52 z-50"
                role="menu"
              >
                <Link
                  href="/dashboard/profile"
                  role="menuitem"
                  onClick={() => setMenuOuvert(false)}
                  className="gm-profile-dd-item no-underline text-[color:var(--gm-text)]"
                >
                  <span aria-hidden="true">👤</span> {t.topbar.myProfile}
                </Link>
                <Link
                  href="/dashboard/settings"
                  role="menuitem"
                  onClick={() => setMenuOuvert(false)}
                  className="gm-profile-dd-item no-underline text-[color:var(--gm-text)]"
                >
                  <span aria-hidden="true">⚙️</span> {t.topbar.settings}
                </Link>
                <Link
                  href="/dashboard/performances"
                  role="menuitem"
                  onClick={() => setMenuOuvert(false)}
                  className="gm-profile-dd-item no-underline text-[color:var(--gm-text)]"
                >
                  <span aria-hidden="true">📊</span> {t.nav.performances}
                </Link>
                <div className="gm-profile-dd-item !text-[color:var(--gm-text-2)] justify-between">
                  <span className="text-xs">{t.settings.language}</span>
                  <LangSwitch className="text-xs font-semibold text-[color:var(--gm-text)]" />
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="gm-profile-dd-item w-full text-left"
                >
                  <span aria-hidden="true">🚪</span> {t.topbar.logout}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
