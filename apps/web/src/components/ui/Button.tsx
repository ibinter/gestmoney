'use client';
// ============================================================
// COMPOSANT BUTTON — GESTMONEY
// ============================================================
import React from 'react';
import { clsx } from 'clsx';

type Variante = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Taille = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  taille?: Taille;
  loading?: boolean;
  icone?: React.ReactNode;
  iconePosition?: 'gauche' | 'droite';
  fullWidth?: boolean;
}

export function Button({
  children,
  variante = 'primary',
  taille = 'md',
  loading = false,
  icone,
  iconePosition = 'gauche',
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const classes = clsx(
    // Base
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    // Taille
    {
      'px-3 py-1.5 text-xs': taille === 'sm',
      'px-4 py-2.5 text-sm': taille === 'md',
      'px-6 py-3 text-base': taille === 'lg',
    },
    // Variante
    {
      'bg-primary text-sidebar hover:bg-primary-500 focus:ring-primary shadow-sm active:scale-95':
        variante === 'primary',
      'bg-sidebar text-white hover:bg-opacity-90 focus:ring-sidebar shadow-sm':
        variante === 'secondary',
      'bg-danger text-white hover:bg-red-600 focus:ring-danger shadow-sm':
        variante === 'danger',
      'bg-transparent text-text-main hover:bg-gray-100 focus:ring-gray-300':
        variante === 'ghost',
      'border-2 border-primary text-primary hover:bg-primary hover:text-sidebar focus:ring-primary':
        variante === 'outline',
    },
    // Full width
    fullWidth && 'w-full',
    // Désactivé / loading
    (disabled || loading) && 'opacity-60 cursor-not-allowed pointer-events-none',
    className
  );

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        icone && iconePosition === 'gauche' && <span>{icone}</span>
      )}
      {children}
      {!loading && icone && iconePosition === 'droite' && <span>{icone}</span>}
    </button>
  );
}
