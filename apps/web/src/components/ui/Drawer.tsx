'use client';
// ============================================================
// COMPOSANT DRAWER — GESTMONEY
// ============================================================
import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

type DrawerWidth = 'sm' | 'md' | 'lg';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: DrawerWidth;
}

const WIDTH_CLASSES: Record<DrawerWidth, string> = {
  sm: 'w-80',
  md: 'w-96',
  lg: 'w-[560px]',
};

export function Drawer({ isOpen, onClose, title, children, width = 'md' }: DrawerProps) {
  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Bloquer le scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black transition-opacity duration-300',
          isOpen ? 'opacity-40 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          'fixed top-0 right-0 z-50 h-full bg-white shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-in-out',
          WIDTH_CLASSES[width],
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          {title && (
            <h2 className="text-lg font-semibold text-text-main">{title}</h2>
          )}
          <button
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="ml-auto p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  );
}
