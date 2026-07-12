'use client';
// ============================================================
// COMPOSANT STAT CARD — GESTMONEY
// Mini carte de statistique
// ============================================================
import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  titre: string;
  valeur: string | number;
  sousTexte?: string;
  variation?: number; // pourcentage, positif = hausse, négatif = baisse
  icone?: React.ReactNode;
  couleur?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
}

export function StatCard({
  titre,
  valeur,
  sousTexte,
  variation,
  icone,
  couleur = 'default',
  className,
}: StatCardProps) {
  const estHausse = variation !== undefined && variation >= 0;

  return (
    <div className={clsx('bg-white rounded-card shadow-card p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">{titre}</p>
          <p className={clsx('mt-1 text-2xl font-bold truncate', {
            'text-text-main': couleur === 'default',
            'text-primary': couleur === 'primary',
            'text-success': couleur === 'success',
            'text-danger': couleur === 'danger',
            'text-warning': couleur === 'warning',
          })}>
            {valeur}
          </p>
          {sousTexte && (
            <p className="mt-0.5 text-xs text-gray-500 truncate">{sousTexte}</p>
          )}
        </div>

        {/* Icône */}
        {icone && (
          <div className={clsx('flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ml-3', {
            'bg-primary/10 text-primary': couleur === 'primary' || couleur === 'default',
            'bg-green-100 text-success': couleur === 'success',
            'bg-red-100 text-danger': couleur === 'danger',
            'bg-yellow-100 text-warning': couleur === 'warning',
          })}>
            {icone}
          </div>
        )}
      </div>

      {/* Variation */}
      {variation !== undefined && (
        <div className={clsx('mt-3 flex items-center gap-1 text-xs font-medium', estHausse ? 'text-success' : 'text-danger')}>
          {estHausse ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{Math.abs(variation).toFixed(1)}% vs hier</span>
        </div>
      )}
    </div>
  );
}
