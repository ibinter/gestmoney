'use client';
// ============================================================
// COMPOSANT BADGE — GESTMONEY
// ============================================================
import React from 'react';
import { clsx } from 'clsx';

type Couleur = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  couleur?: Couleur;
  children: React.ReactNode;
  className?: string;
  point?: boolean; // Affiche un point coloré avant le texte
}

export function Badge({ couleur = 'neutral', children, className, point = false }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-green-100 text-green-700': couleur === 'success',
          'bg-yellow-100 text-yellow-700': couleur === 'warning',
          'bg-red-100 text-red-700': couleur === 'danger',
          'bg-blue-100 text-blue-700': couleur === 'info',
          'bg-gray-100 text-gray-600': couleur === 'neutral',
        },
        className
      )}
    >
      {point && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', {
            'bg-green-500': couleur === 'success',
            'bg-yellow-500': couleur === 'warning',
            'bg-red-500': couleur === 'danger',
            'bg-blue-500': couleur === 'info',
            'bg-gray-400': couleur === 'neutral',
          })}
        />
      )}
      {children}
    </span>
  );
}

// Mapping statut → couleur badge
export function badgeStatutTransaction(statut: string): Couleur {
  const map: Record<string, Couleur> = {
    success: 'success',
    pending: 'warning',
    failed: 'danger',
    cancelled: 'neutral',
  };
  return map[statut] || 'neutral';
}

export function badgeStatutFloat(statut: string): Couleur {
  const map: Record<string, Couleur> = {
    ok: 'success',
    alerte: 'warning',
    critique: 'danger',
  };
  return map[statut] || 'neutral';
}

export function badgeStatutCommission(statut: string): Couleur {
  const map: Record<string, Couleur> = {
    calculee: 'info',
    validee: 'warning',
    payee: 'success',
  };
  return map[statut] || 'neutral';
}
