'use client';
// ============================================================
// APP SHELL — GESTMONEY
// Composant de layout interne réutilisable.
// Assemble: Sidebar + Topbar + BottomNav + Zone contenu.
// Peut être utilisé directement dans des layouts imbriqués.
// ============================================================
import React, { useState, useEffect } from 'react';
import { Topbar } from '@/components/ui/Topbar';
import { Sidebar } from '@/components/ui/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';

const COMPACT_KEY = 'gestmoney-sidebar-compact';

interface AppShellProps {
  children: React.ReactNode;
  /** Masquer la sidebar (ex: pages plein écran) */
  hideSidebar?: boolean;
  /** Masquer la bottomNav (ex: pages avec leur propre nav) */
  hideBottomNav?: boolean;
  /** Largeur max du contenu */
  maxWidth?: string;
}

export function AppShell({
  children,
  hideSidebar = false,
  hideBottomNav = false,
  maxWidth = '1600px',
}: AppShellProps) {
  const [sidebarOuverte, setSidebarOuverte] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(false);

  useEffect(() => {
    setSidebarCompact(localStorage.getItem(COMPACT_KEY) === '1');
  }, []);

  const handleToggleCompact = () => {
    setSidebarCompact((prev) => {
      const next = !prev;
      localStorage.setItem(COMPACT_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar desktop */}
      {!hideSidebar && (
        <Sidebar
          mode="fixe"
          compact={sidebarCompact}
          onToggleCompact={handleToggleCompact}
        />
      )}

      {/* Sidebar overlay mobile */}
      {!hideSidebar && (
        <Sidebar
          mode="overlay"
          ouvert={sidebarOuverte}
          onFermer={() => setSidebarOuverte(false)}
        />
      )}

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOuverte(true)} />

        <main className="flex-1 overflow-y-auto">
          <div
            className="mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 pb-20 md:pb-6"
            style={{ maxWidth }}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Navigation mobile */}
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
