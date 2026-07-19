'use client';
// ============================================================
// LAYOUT DASHBOARD — GESTMONEY
// AppShell: Sidebar fixe/overlay + Topbar + BottomNav mobile
// ============================================================
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/ui/Topbar';
import { Sidebar } from '@/components/ui/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Onboarding } from '@/components/ui/Onboarding';
import { AssistantIA } from '@/components/ui/AssistantIA';
import { useAuthStore } from '@/store/authStore';

const COMPACT_KEY = 'gestmoney-sidebar-compact';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOuverte, setSidebarOuverte] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();

  // Charger la préférence compact depuis localStorage
  useEffect(() => {
    setSidebarCompact(localStorage.getItem(COMPACT_KEY) === '1');
  }, []);

  // Filet de sécurité : la relecture du storage par `persist` est synchrone,
  // elle a donc forcément eu lieu quand cet effet s'exécute. Si le drapeau
  // n'est pas levé (storage indisponible en navigation privée, quota, etc.),
  // on le lève ici pour ne jamais rester bloqué sur l'écran de chargement.
  useEffect(() => {
    if (!useAuthStore.getState().hasHydrated) {
      useAuthStore.getState().setHasHydrated(true);
    }
  }, []);

  // Toggle compact avec persistance
  const handleToggleCompact = () => {
    setSidebarCompact((prev) => {
      const next = !prev;
      localStorage.setItem(COMPACT_KEY, next ? '1' : '0');
      return next;
    });
  };

  // Rediriger si non authentifié (double sécurité côté client).
  // On attend que `persist` ait relu le localStorage : au premier rendu
  // `isAuthenticated` vaut toujours false, rediriger tout de suite éjecterait
  // vers /login un utilisateur pourtant connecté (au rechargement d'une page).
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Tant que la session n'est pas relue, on n'affiche ni le dashboard ni une
  // redirection : un court écran d'attente évite tout clignotement.
  if (!hasHydrated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-surface"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Chargement de votre session…</span>
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '3px solid rgba(26,29,46,0.15)',
            borderTopColor: '#F5B800',
            animation: 'gm-spin 0.7s linear infinite',
          }}
        />
        <style>{`@keyframes gm-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface">
      {/* ── Sidebar fixe desktop ───────────────────────────────── */}
      <Sidebar
        mode="fixe"
        compact={sidebarCompact}
        onToggleCompact={handleToggleCompact}
      />

      {/* ── Sidebar overlay mobile ─────────────────────────────── */}
      <Sidebar
        mode="overlay"
        ouvert={sidebarOuverte}
        onFermer={() => setSidebarOuverte(false)}
      />

      {/* ── Zone principale ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header sticky */}
        <Topbar onMenuClick={() => setSidebarOuverte(true)} />

        {/* Palettes & overlays globaux */}
        <CommandPalette />
        <Onboarding />
        <AssistantIA />

        {/* Contenu des pages */}
        <main className="flex-1 overflow-y-auto">
          {/*
            pb-16 md:pb-0 → espace pour la BottomNav sur mobile
            max-w-[1600px] → largeur max pour les grands écrans
          */}
          <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 pb-20 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* ── Navigation mobile bas de page ──────────────────────── */}
      <BottomNav />
    </div>
  );
}
