'use client';
// ============================================================
// GESTMONEY — Index des documents légaux (client)
// Liste les 18 pages, catégorisées et traduites via useI18n.
// ============================================================
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { LEGAL_CATEGORIES, LEGAL_CONTENT } from './content';

const UI = {
  fr: {
    back: "← Retour à l'accueil",
    title: 'Documents légaux',
    subtitle:
      'GESTMONEY — Édité par IBIG Soft, une marque de IBIG SARL – Intermark Business International Group.',
    rights: 'Tous droits réservés.',
  },
  en: {
    back: '← Back to home',
    title: 'Legal documents',
    subtitle:
      'GESTMONEY — Published by IBIG Soft, a brand of IBIG SARL – Intermark Business International Group.',
    rights: 'All rights reserved.',
  },
};

export function LegalIndex() {
  const { lang } = useI18n();
  const ui = lang === 'en' ? UI.en : UI.fr;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link href="/" className="text-sm text-green-600 hover:underline">{ui.back}</Link>
          <h1 className="text-3xl font-black mt-4 text-gray-900 dark:text-white">{ui.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{ui.subtitle}</p>
        </div>

        <div className="space-y-8">
          {LEGAL_CATEGORIES.map((cat) => (
            <section key={cat.fr}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
                {lang === 'en' ? cat.en : cat.fr}
              </h2>
              <ul className="space-y-2">
                {cat.slugs.map((slug) => {
                  const entry = LEGAL_CONTENT[slug];
                  const titre = lang === 'en' ? entry.en.titre : entry.fr.titre;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/legal/${slug}`}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors group"
                      >
                        <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-400">
                          {titre}
                        </span>
                        <span className="text-gray-400 group-hover:text-green-500">→</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} GESTMONEY. {ui.rights}<br />
          <a href="https://ibigsoft.com" className="hover:underline" target="_blank" rel="noopener noreferrer">ibigsoft.com</a>
        </p>
      </div>
    </main>
  );
}
