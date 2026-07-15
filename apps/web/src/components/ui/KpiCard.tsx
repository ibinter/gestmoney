'use client';
// ============================================================
// KPI CARD — GESTMONEY
// Carte KPI réutilisable avec skeleton, delta et variantes
// ============================================================
import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { Skeleton } from './Skeleton';

export type KpiVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

interface KpiCardProps {
  titre: string;
  valeur: string | number;
  /** Delta en pourcentage, ex: +12.5 ou -3.2 */
  delta?: number;
  /** Libellé du delta, ex: "vs hier" */
  deltaLabel?: string;
  icone?: LucideIcon;
  /** Emoji ou texte court si pas d'icône Lucide */
  emoji?: string;
  variante?: KpiVariant;
  isLoading?: boolean;
  /** Sous-titre / description */
  sousTitre?: string;
  /** Clic sur la carte */
  onClick?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<KpiVariant, { bg: string; icon: string; badge: string }> = {
  success:  { bg: 'bg-[#009E00]/10', icon: 'text-[#009E00]',  badge: 'bg-[#009E00]/15 text-[#009E00]' },
  warning:  { bg: 'bg-[#FFD000]/10', icon: 'text-[#B89A00]',  badge: 'bg-[#FFD000]/20 text-[#806B00]' },
  danger:   { bg: 'bg-[#E60000]/10', icon: 'text-[#E60000]',  badge: 'bg-[#E60000]/15 text-[#E60000]' },
  neutral:  { bg: 'bg-gray-100',     icon: 'text-gray-500',    badge: 'bg-gray-100 text-gray-600' },
  primary:  { bg: 'bg-[#009E00]/10', icon: 'text-[#009E00]',  badge: 'bg-[#009E00]/15 text-[#009E00]' },
};

export function KpiCard({
  titre,
  valeur,
  delta,
  deltaLabel = 'vs hier',
  icone: Icone,
  emoji,
  variante = 'neutral',
  isLoading = false,
  sousTitre,
  onClick,
  className,
}: KpiCardProps) {
  const styles = VARIANT_STYLES[variante];
  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;

  if (isLoading) {
    return (
      <div className={clsx('bg-white dark:bg-[hsl(0_0%_12%)] rounded-card shadow-card p-4 space-y-3', className)}>
        <div className="flex items-center justify-between">
          <Skeleton hauteur={14} largeur={100} />
          <Skeleton hauteur={36} largeur={36} rounded="lg" />
        </div>
        <Skeleton hauteur={28} largeur={140} />
        <Skeleton hauteur={12} largeur={80} />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'bg-white dark:bg-[hsl(0_0%_12%)] rounded-card shadow-card p-4 flex flex-col gap-3',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {titre}
        </span>
        {(Icone || emoji) && (
          <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', styles.bg)}>
            {Icone
              ? <Icone size={18} className={styles.icon} />
              : <span className="text-base leading-none">{emoji}</span>
            }
          </div>
        )}
      </div>

      {/* Valeur principale */}
      <div>
        <p className="text-2xl font-bold text-text-main leading-tight tabular-nums">{valeur}</p>
        {sousTitre && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sousTitre}</p>
        )}
      </div>

      {/* Delta */}
      {delta !== undefined && (
        <div className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit', styles.badge,
          isPositive && 'bg-[#009E00]/15 text-[#009E00]',
          isNegative && 'bg-[#E60000]/15 text-[#E60000]',
          !isPositive && !isNegative && 'bg-gray-100 text-gray-600',
        )}>
          {isPositive ? <TrendingUp size={11} /> : isNegative ? <TrendingDown size={11} /> : <Minus size={11} />}
          <span>{isPositive ? '+' : ''}{delta.toFixed(1)}% {deltaLabel}</span>
        </div>
      )}
    </div>
  );
}
