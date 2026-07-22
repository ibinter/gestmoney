'use client';
// ============================================================
// GESTMONEY — Lexique / Glossaire (vue client)
// Route : /guide/lexique  (PUBLIC — autorisé via le préfixe /guide)
// Affiche les termes bilingues via useI18n(), avec recherche,
// tri alphabétique et regroupement par 1re lettre (ancres A, B…).
// ============================================================
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { LEXIQUE, type LexiqueEntry } from './lexique';

const UI = {
  fr: {
    back: '← Retour au guide',
    kicker: 'Documentation',
    title: 'Lexique',
    subtitle:
      'Les termes clés du Mobile Money et de GESTMONEY, expliqués simplement.',
    search: 'Rechercher un terme ou une définition…',
    count: (n: number) => `${n} terme${n > 1 ? 's' : ''}`,
    empty: 'Aucun terme ne correspond à votre recherche.',
    rights: 'Tous droits réservés.',
  },
  en: {
    back: '← Back to the guide',
    kicker: 'Documentation',
    title: 'Glossary',
    subtitle:
      'The key terms of Mobile Money and GESTMONEY, explained simply.',
    search: 'Search a term or a definition…',
    count: (n: number) => `${n} term${n > 1 ? 's' : ''}`,
    empty: 'No term matches your search.',
    rights: 'All rights reserved.',
  },
};

// Normalise pour la recherche et le tri (minuscules + sans accents).
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function LexiqueView({
  basePath = '/guide',
}: { basePath?: string } = {}) {
  const { lang } = useI18n();
  const ui = lang === 'en' ? UI.en : UI.fr;
  const [query, setQuery] = useState('');

  // Termes filtrés puis triés alphabétiquement selon la langue courante.
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const pick = (e: LexiqueEntry) => (lang === 'en' ? e.en : e.fr);
    return LEXIQUE.filter((e) => {
      if (!q) return true;
      const { terme, definition } = pick(e);
      return normalize(terme).includes(q) || normalize(definition).includes(q);
    }).sort((a, b) => normalize(pick(a).terme).localeCompare(normalize(pick(b).terme)));
  }, [query, lang]);

  // Regroupement par 1re lettre.
  const groups = useMemo(() => {
    const map = new Map<string, LexiqueEntry[]>();
    for (const e of filtered) {
      const terme = lang === 'en' ? e.en.terme : e.fr.terme;
      const letter = normalize(terme).charAt(0).toUpperCase() || '#';
      const key = /[A-Z]/.test(letter) ? letter : '#';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, lang]);

  const letters = groups.map(([l]) => l);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="mb-10">
          <Link href={basePath} className="text-sm text-green-600 hover:underline">{ui.back}</Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-green-600">{ui.kicker}</p>
          <h1 className="text-4xl font-black mt-2 text-gray-900 dark:text-white">{ui.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">{ui.subtitle}</p>
        </div>

        {/* Recherche */}
        <div className="mb-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ui.search}
            aria-label={ui.search}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{ui.count(filtered.length)}</p>
        </div>

        {/* Index alphabétique (ancres) */}
        {letters.length > 1 && (
          <nav className="mb-10 flex flex-wrap gap-1.5">
            {letters.map((l) => (
              <a
                key={l}
                href={`#lettre-${l}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-green-500 hover:text-green-700 dark:hover:text-green-400 transition-colors"
              >
                {l}
              </a>
            ))}
          </nav>
        )}

        {/* Entrées regroupées */}
        {filtered.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-16">{ui.empty}</p>
        ) : (
          <div className="space-y-10">
            {groups.map(([letter, entries]) => (
              <section key={letter} id={`lettre-${letter}`} className="scroll-mt-20">
                <h2 className="mb-4 flex items-center gap-3 text-2xl font-black text-green-600">
                  {letter}
                  <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                </h2>
                <dl className="space-y-5">
                  {entries.map((e) => {
                    const { terme, definition } = lang === 'en' ? e.en : e.fr;
                    return (
                      <div
                        key={e.id}
                        id={e.id}
                        className="scroll-mt-20 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-5"
                      >
                        <dt className="text-base font-bold text-gray-900 dark:text-white">{terme}</dt>
                        <dd className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{definition}</dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
          </div>
        )}

        {/* Pied de page */}
        <p className="mt-16 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} GESTMONEY. {ui.rights}<br />
          IBIG Soft — IBIG SARL – Intermark Business International Group<br />
          <a href="https://ibigsoft.com" className="hover:underline" target="_blank" rel="noopener noreferrer">ibigsoft.com</a>
        </p>
      </div>
    </main>
  );
}
