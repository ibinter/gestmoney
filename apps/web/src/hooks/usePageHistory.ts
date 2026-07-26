'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const HISTORY_KEY = 'gestmoney-page-history';
const MAX_ENTRIES = 10;

/**
 * usePageHistory — enregistre silencieusement le chemin courant dans
 * localStorage pour que la page /offline puisse proposer des raccourcis
 * vers les dernières pages visitées.
 *
 * Ne stocke que des chemins (pas de token, pas de données métier).
 * Seules les routes /dashboard/* sont conservées.
 */
export function usePageHistory() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !pathname.startsWith('/dashboard')) return;

    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const history: string[] = raw ? JSON.parse(raw) : [];

      // Dédoublonner + mettre la page courante en tête
      const updated = [pathname, ...history.filter((p) => p !== pathname)].slice(
        0,
        MAX_ENTRIES
      );
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // localStorage indisponible (navigation privée, quota) — on ignore
    }
  }, [pathname]);
}
