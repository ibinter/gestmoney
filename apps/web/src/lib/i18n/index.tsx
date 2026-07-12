'use client';
// ============================================================
// GESTMONEY — Système i18n FR/EN
// Usage :  const t = useT();  →  t.nav.dashboard, t.common.save…
// Le hook useT() est stable — pas de re-render inutile.
// ============================================================
import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from 'react';
import { fr, type Translations } from './fr';
import { en } from './en';

export type Lang = 'fr' | 'en';

const DICTS: Record<Lang, Translations> = { fr, en };
const STORAGE_KEY = 'gestmoney-lang';

// ── Context ───────────────────────────────────────────────────────────────

interface I18nCtx {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
}

const Ctx = createContext<I18nCtx>({
  lang: 'fr',
  t: fr,
  setLang: () => {},
  toggleLang: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  // Lire la préférence sauvegardée au montage (côté client seulement)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === 'en' || saved === 'fr') setLangState(saved);
    } catch { /* SSR */ }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* SSR */ }
    // Mettre à jour l'attribut lang du document pour l'accessibilité
    if (typeof document !== 'undefined') document.documentElement.lang = l;
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'fr' ? 'en' : 'fr');
  }, [lang, setLang]);

  return (
    <Ctx.Provider value={{ lang, t: DICTS[lang], setLang, toggleLang }}>
      {children}
    </Ctx.Provider>
  );
}

// ── Hook principal ────────────────────────────────────────────────────────

/** Retourne les traductions pour la langue active. */
export function useT(): Translations {
  return useContext(Ctx).t;
}

/** Retourne l'objet i18n complet (lang + setLang + toggleLang). */
export function useI18n(): I18nCtx {
  return useContext(Ctx);
}

// ── Composant switcher ────────────────────────────────────────────────────

export function LangSwitch({ className }: { className?: string }) {
  const { lang, toggleLang, t } = useContext(Ctx);

  return (
    <button
      onClick={toggleLang}
      aria-label={`Switch language — ${t.topbar.langSwitch}`}
      title={t.topbar.langSwitch}
      className={className}
    >
      <span className="font-semibold text-xs tracking-wide leading-none">
        {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
      </span>
    </button>
  );
}

// ── Utilitaire date localisée ─────────────────────────────────────────────

export function useDateLocale(): string {
  return useContext(Ctx).t.dateLocale;
}
