'use client';
// ============================================================
// COMPOSANT MODAL — GESTMONEY
// ============================================================
import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  ouvert: boolean;
  onFermer: () => void;
  titre?: string;
  children: React.ReactNode;
  taille?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({ ouvert, onFermer, titre, children, taille = 'md', className }: ModalProps) {
  // Fermeture avec touche Échap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
    };
    if (ouvert) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [ouvert, onFermer]);

  // Bloque le scroll du body quand ouvert
  useEffect(() => {
    if (ouvert) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [ouvert]);

  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onFermer}
      />
      {/* Contenu */}
      <div
        className={clsx(
          'relative bg-white rounded-card shadow-2xl w-full animate-in fade-in zoom-in-95 duration-200',
          {
            'max-w-sm': taille === 'sm',
            'max-w-md': taille === 'md',
            'max-w-lg': taille === 'lg',
            'max-w-2xl': taille === 'xl',
          },
          className
        )}
      >
        {/* Header */}
        {titre && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-text-main">{titre}</h2>
            <button
              onClick={onFermer}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
