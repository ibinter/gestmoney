'use client';
// ============================================================
// COMPOSANT CARD — GESTMONEY
// ============================================================
import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export function Card({ children, className, onClick, hover = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-card shadow-card',
        hover && 'cursor-pointer hover:shadow-card-hover transition-shadow duration-200',
        onClick && 'cursor-pointer',
        {
          'p-4': padding === 'sm',
          'p-6': padding === 'md',
          'p-8': padding === 'lg',
          'p-0': padding === 'none',
        },
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Variante avec header/body séparés
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx('text-base font-semibold text-text-main', className)}>{children}</h3>
  );
}
