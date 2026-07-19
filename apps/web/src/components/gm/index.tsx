// =============================================================
// KIT UI GESTMONEY — reproduit fidèlement /mockup
// S'appuie sur les classes `gm-*` de src/styles/mockup-system.css.
// À utiliser pour toutes les pages du dashboard.
// =============================================================
'use client';
import React from 'react';
import { clsx } from 'clsx';

// ─── En-tête de page ──────────────────────────────────────────────────────────

export function GmPageHeader({
  titre,
  sousTitre,
  actions,
  fil,
}: {
  titre: React.ReactNode;
  sousTitre?: React.ReactNode;
  actions?: React.ReactNode;
  /** Fil d'ariane : ex. ['Accueil', 'Transactions'] */
  fil?: string[];
}) {
  return (
    <>
      {fil && fil.length > 0 && (
        <nav className="gm-breadcrumb" aria-label="Fil d'ariane">
          {fil.map((item, i) => (
            <span key={item}>
              {i > 0 && <span className="gm-breadcrumb-sep"> › </span>}
              {item}
            </span>
          ))}
        </nav>
      )}
      <div className="gm-page-header">
        <div>
          <h1 className="gm-page-title">{titre}</h1>
          {sousTitre && <p className="gm-page-sub">{sousTitre}</p>}
        </div>
        {actions && <div className="gm-page-actions">{actions}</div>}
      </div>
    </>
  );
}

// ─── Boutons ──────────────────────────────────────────────────────────────────

type GmButtonProps = {
  variante?: 'primary' | 'outline' | 'ghost';
  petit?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function GmButton({
  variante = 'primary',
  petit = false,
  className,
  children,
  ...rest
}: GmButtonProps) {
  return (
    <button
      className={clsx(
        'gm-btn',
        variante === 'primary' && 'gm-btn-primary',
        variante === 'outline' && 'gm-btn-outline',
        variante === 'ghost' && 'gm-btn-ghost',
        petit && 'gm-btn-sm',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── Carte module (anatomie exacte de la maquette) ────────────────────────────

export type GmTrend = {
  /** up = vert, down = rouge, warn = ambre */
  sens: 'up' | 'down' | 'warn';
  label: React.ReactNode;
  infobulle?: string;
};

export function GmCard({
  icone,
  titre,
  trend,
  actions,
  onClick,
  actif = false,
  className,
  children,
}: {
  icone?: React.ReactNode;
  titre?: React.ReactNode;
  trend?: GmTrend;
  actions?: React.ReactNode;
  onClick?: () => void;
  actif?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const cliquable = typeof onClick === 'function';
  return (
    <div
      className={clsx('gm-card', actif && 'gm-active', className)}
      onClick={onClick}
      role={cliquable ? 'button' : undefined}
      tabIndex={cliquable ? 0 : undefined}
      onKeyDown={
        cliquable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick!();
              }
            }
          : undefined
      }
      style={cliquable ? undefined : { cursor: 'default' }}
    >
      {(icone || titre || trend) && (
        <div className="gm-card-head">
          <div className="gm-card-icon-title">
            {icone && <div className="gm-card-icon">{icone}</div>}
            {titre && <div className="gm-card-title">{titre}</div>}
          </div>
          {trend && (
            <div
              className={clsx(
                'gm-card-trend',
                trend.sens === 'up' && 'gm-trend-up',
                trend.sens === 'down' && 'gm-trend-down',
                trend.sens === 'warn' && 'gm-trend-warn',
                trend.infobulle && 'gm-tooltip-wrap',
              )}
            >
              {trend.label}
              {trend.infobulle && <div className="gm-tooltip">{trend.infobulle}</div>}
            </div>
          )}
        </div>
      )}

      {children && <div className="gm-card-metrics">{children}</div>}

      {actions && <div className="gm-card-actions">{actions}</div>}
    </div>
  );
}

/** Chiffre principal d'une carte. */
export function GmMetric({
  valeur,
  label,
  infobulle,
}: {
  valeur: React.ReactNode;
  label?: React.ReactNode;
  infobulle?: string;
}) {
  return (
    <div className="gm-metric">
      <span className={clsx('gm-metric-value', infobulle && 'gm-tooltip-wrap')}>
        {valeur}
        {infobulle && <div className="gm-tooltip">{infobulle}</div>}
      </span>
      {label && <span className="gm-metric-label">{label}</span>}
    </div>
  );
}

/** Ligne secondaire d'une carte (icône + texte). */
export function GmMetricSub({
  icone,
  children,
}: {
  icone?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="gm-metric-sub">
      {icone && <span>{icone}</span>}
      <span>{children}</span>
    </div>
  );
}

/** Grille de cartes du dashboard. */
export function GmCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="gm-card-grid">{children}</div>;
}

// ─── Pastilles de statut ──────────────────────────────────────────────────────

export function GmStatusPill({
  statut,
  children,
}: {
  statut: 'success' | 'pending' | 'failed';
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        'gm-status-pill',
        statut === 'success' && 'gm-pill-success',
        statut === 'pending' && 'gm-pill-pending',
        statut === 'failed' && 'gm-pill-failed',
      )}
    >
      {children}
    </span>
  );
}

/** Badge de type d'opération (dépôt, retrait, cash in/out). */
export function GmBadge({
  type,
  children,
}: {
  type: 'depot' | 'retrait' | 'cashin' | 'cashout';
  children: React.ReactNode;
}) {
  return <span className={clsx('gm-badge', `gm-badge-${type}`)}>{children}</span>;
}

// ─── Tableau ──────────────────────────────────────────────────────────────────

export function GmTableWrap({ children }: { children: React.ReactNode }) {
  return <div className="gm-table-wrap">{children}</div>;
}

// ─── Titre de section ─────────────────────────────────────────────────────────

export function GmSectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="gm-section-title">
      <span>{children}</span>
      {action}
    </div>
  );
}
