'use client';
// ============================================================
// COMPOSANT DASHBOARD CARD — GESTMONEY
// Grande carte réutilisable pour le dashboard principal
// ============================================================
import React from 'react';
import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Stat {
  label: string;
  valeur: string | number;
  couleur?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
}

interface Action {
  label: string;
  onClick: () => void;
  variante?: 'primary' | 'secondary' | 'ghost' | 'outline';
}

interface DashboardCardProps {
  icone: string;
  titre: string;
  stats: Stat[];
  actions?: Action[];
  couleur?: string; // Couleur accent de l'icône
  onClick?: () => void;
  badge?: string;
  alerte?: boolean;
  className?: string;
}

export function DashboardCard({
  icone,
  titre,
  stats,
  actions = [],
  couleur = '#F5B800',
  onClick,
  badge,
  alerte = false,
  className,
}: DashboardCardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-card shadow-card p-5 flex flex-col gap-4',
        'hover:shadow-card-hover transition-shadow duration-200',
        onClick && 'cursor-pointer',
        alerte && 'ring-2 ring-warning/40',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Icône */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: couleur + '20' }}
          >
            {icone}
          </div>
          <div>
            <h3 className="font-semibold text-text-main text-sm leading-tight">{titre}</h3>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block font-medium"
                style={{ backgroundColor: couleur + '20', color: couleur }}>
                {badge}
              </span>
            )}
          </div>
        </div>
        {onClick && <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className={clsx(i === 0 && stats.length === 1 && 'col-span-2')}>
            <p className="text-xs text-gray-500 truncate">{stat.label}</p>
            <p className={clsx('text-sm font-bold mt-0.5 truncate', {
              'text-text-main': !stat.couleur || stat.couleur === 'default',
              'text-success': stat.couleur === 'success',
              'text-danger': stat.couleur === 'danger',
              'text-warning': stat.couleur === 'warning',
              'text-primary': stat.couleur === 'primary',
            })}>
              {stat.valeur}
            </p>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-50">
          {actions.map((action, i) => (
            <Button
              key={i}
              taille="sm"
              variante={action.variante || 'ghost'}
              onClick={(e) => { e.stopPropagation(); action.onClick(); }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
