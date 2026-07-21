'use client';
// ============================================================
// GESTMONEY — Rendu d'un document légal (client)
// Sélectionne la langue via le contexte i18n (useI18n) et rend
// le markdown simplifié. Affiche, sur CHAQUE page, l'avertissement
// « à faire valider par un juriste » exigé par le §7.33.
// ============================================================
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import type { LegalEntry } from './content';

// Markdown → HTML minimal (## titres, - listes, **gras**, paragraphes)
function renderMarkdown(content: string): string {
  const lines = content.trim().split('\n');
  const html: string[] = [];
  for (const line of lines) {
    if (line.startsWith('## ')) {
      html.push(`<h2 class="text-xl font-bold mt-8 mb-3 text-gray-900 dark:text-white">${line.slice(3)}</h2>`);
    } else if (line.startsWith('### ')) {
      html.push(`<h3 class="text-base font-semibold mt-5 mb-2 text-gray-800 dark:text-gray-100">${line.slice(4)}</h3>`);
    } else if (line.startsWith('- ')) {
      html.push(`<li class="ml-4 list-disc text-gray-600 dark:text-gray-300">${line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`);
    } else if (line.trim() === '') {
      html.push('<br />');
    } else {
      html.push(`<p class="text-gray-600 dark:text-gray-300 leading-relaxed">${line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-800 dark:text-gray-100">$1</strong>')}</p>`);
    }
  }
  return html.join('\n');
}

const UI = {
  fr: {
    back: '← Documents légaux',
    home: 'Accueil',
    updated: 'Dernière mise à jour : juillet 2026',
    disclaimerTitle: 'Avertissement',
    disclaimer:
      "Ce document est un modèle fourni à titre informatif. Il doit être relu et validé par un professionnel du droit avant toute utilisation en production. Les informations marquées « à compléter » doivent être renseignées avec les données réelles de l'éditeur.",
    rights: 'Tous droits réservés.',
  },
  en: {
    back: '← Legal documents',
    home: 'Home',
    updated: 'Last updated: July 2026',
    disclaimerTitle: 'Disclaimer',
    disclaimer:
      'This document is a template provided for information purposes. It must be reviewed and validated by a legal professional before any production use. Information marked "to be completed" must be filled in with the publisher\'s actual data.',
    rights: 'All rights reserved.',
  },
};

export function LegalArticle({ entry }: { entry: LegalEntry }) {
  const { lang } = useI18n();
  const doc = lang === 'en' ? entry.en : entry.fr;
  const ui = lang === 'en' ? UI.en : UI.fr;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/legal" className="text-sm text-green-600 hover:underline">{ui.back}</Link>
          <Link href="/" className="text-sm text-gray-400 hover:underline ml-4">{ui.home}</Link>
        </div>

        <article>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{doc.titre}</h1>
          <p className="text-xs text-gray-400 mb-6">
            GESTMONEY — IBIG Soft · {ui.updated}
          </p>

          {/* Avertissement juridique — visible sur chaque page (§7.33) */}
          <div
            role="note"
            className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <strong className="block mb-1">⚠️ {ui.disclaimerTitle}</strong>
            {ui.disclaimer}
          </div>

          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.contenu) }}
          />
        </article>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} GESTMONEY. {ui.rights}<br />
            IBIG Soft — IBIG SARL – Intermark Business International Group<br />
            <a href="https://ibigsoft.com" className="hover:underline" target="_blank" rel="noopener noreferrer">ibigsoft.com</a>
            {' · '}
            <a href="https://ibigpartners.com/" className="hover:underline" target="_blank" rel="noopener noreferrer">ibigpartners.com</a>
          </p>
        </div>
      </div>
    </main>
  );
}
