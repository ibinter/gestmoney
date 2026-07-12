import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  hauteur?: number | string;
  largeur?: number | string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ className, hauteur, largeur, rounded = 'md' }: SkeletonProps) {
  const roundedClass = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={clsx('animate-pulse bg-gray-200', roundedClass, className)}
      style={{
        height: hauteur !== undefined ? hauteur : undefined,
        width: largeur !== undefined ? largeur : undefined,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-card shadow-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton hauteur={20} largeur={120} />
        <Skeleton hauteur={32} largeur={32} rounded="lg" />
      </div>
      <Skeleton hauteur={14} largeur="60%" />
      <div className="space-y-2 pt-1">
        <Skeleton hauteur={12} />
        <Skeleton hauteur={12} largeur="80%" />
        <Skeleton hauteur={12} largeur="70%" />
        <Skeleton hauteur={12} largeur="50%" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton hauteur={32} className="flex-1" />
        <Skeleton hauteur={32} className="flex-1" />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr>
      {[80, 140, 100, 80, 60].map((w, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton hauteur={14} largeur={w} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonLigne({ lignes = 1 }: { lignes?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lignes }).map((_, i) => (
        <Skeleton key={i} hauteur={14} largeur={i % 3 === 0 ? '100%' : i % 3 === 1 ? '80%' : '60%'} />
      ))}
    </div>
  );
}
