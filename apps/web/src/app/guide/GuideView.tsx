'use client';
// ============================================================
// GESTMONEY — Guide utilisateur (vue client)
// Route : /guide
// Rend le guide structuré par module, bilingue via useI18n(),
// avec un sommaire ancré et un bouton « Télécharger en PDF ».
// ============================================================
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { GUIDE_MODULES, GUIDE_BODY_CSS, renderGuideMarkdown } from './content';
import { exporterGuidePdf } from './guidePdf';

const UI = {
  fr: {
    back: "← Retour à l'accueil",
    kicker: 'Documentation',
    title: 'Guide utilisateur',
    subtitle:
      'Tout ce qu’il faut savoir pour utiliser GESTMONEY, module par module.',
    toc: 'Sommaire',
    downloadPdf: 'Télécharger le guide en PDF',
    casTitle: 'Besoin d’exemples concrets ?',
    casText: 'Consultez les cas pratiques : des scénarios pas-à-pas prêts à suivre.',
    casLink: 'Voir les cas pratiques →',
    pdfTitle: 'Guide utilisateur GESTMONEY',
    pdfSubtitle:
      'Documentation complète, module par module — édité par IBIG Soft.',
    rights: 'Tous droits réservés.',
  },
  en: {
    back: '← Back to home',
    kicker: 'Documentation',
    title: 'User guide',
    subtitle:
      'Everything you need to use GESTMONEY, module by module.',
    toc: 'Contents',
    downloadPdf: 'Download the guide as PDF',
    casTitle: 'Need concrete examples?',
    casText: 'Check the practical cases: ready-to-follow step-by-step scenarios.',
    casLink: 'See the practical cases →',
    pdfTitle: 'GESTMONEY User Guide',
    pdfSubtitle:
      'Complete documentation, module by module — published by IBIG Soft.',
    rights: 'All rights reserved.',
  },
};

export function GuideView() {
  const { lang } = useI18n();
  const ui = lang === 'en' ? UI.en : UI.fr;

  const handlePdf = () => {
    exporterGuidePdf({
      titre: ui.pdfTitle,
      sousTitre: ui.pdfSubtitle,
      lang,
      nomFichier: lang === 'en' ? 'gestmoney_user_guide' : 'gestmoney_guide_utilisateur',
      sections: GUIDE_MODULES.map((m) => ({
        icone: m.icone,
        doc: lang === 'en' ? m.en : m.fr,
      })),
    });
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-green-600 hover:underline">{ui.back}</Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-green-600">{ui.kicker}</p>
          <h1 className="text-4xl font-black mt-2 text-gray-900 dark:text-white">{ui.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">{ui.subtitle}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePdf}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition-opacity"
            >
              <span aria-hidden>⬇</span> {ui.downloadPdf}
            </button>
            <Link
              href="/guide/cas-pratiques"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-green-500 hover:text-green-700 dark:hover:text-green-400 transition-colors"
            >
              {ui.casLink}
            </Link>
          </div>
        </div>

        {/* Sommaire */}
        <nav className="mb-12 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-4">{ui.toc}</h2>
          <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {GUIDE_MODULES.map((m, i) => {
              const doc = lang === 'en' ? m.en : m.fr;
              return (
                <li key={m.id}>
                  <a
                    href={`#${m.id}`}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400"
                  >
                    <span className="text-gray-400 tabular-nums w-5 text-right">{i + 1}.</span>
                    <span aria-hidden>{m.icone}</span>
                    <span className="font-medium">{doc.titre}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Modules */}
        <div className="space-y-12">
          {GUIDE_MODULES.map((m, i) => {
            const doc = lang === 'en' ? m.en : m.fr;
            return (
              <section key={m.id} id={m.id} className="scroll-mt-20">
                <div className="flex items-center gap-3 pb-3 mb-4 border-b-2 border-green-500/70">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-900 dark:bg-white text-sm font-black text-white dark:text-gray-900">
                    {i + 1}
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    <span aria-hidden className="mr-2">{m.icone}</span>{doc.titre}
                  </h2>
                </div>
                <p className="text-sm italic text-gray-500 dark:text-gray-400 mb-5">{doc.resume}</p>
                <div
                  className="gm-guide-body"
                  dangerouslySetInnerHTML={{ __html: renderGuideMarkdown(doc.contenu) }}
                />
              </section>
            );
          })}
        </div>

        {/* Renvoi vers les cas pratiques */}
        <div className="mt-16 rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 p-6">
          <h2 className="text-lg font-bold text-green-800 dark:text-green-300">{ui.casTitle}</h2>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400/90">{ui.casText}</p>
          <Link href="/guide/cas-pratiques" className="mt-3 inline-block text-sm font-semibold text-green-700 dark:text-green-400 hover:underline">
            {ui.casLink}
          </Link>
        </div>

        {/* Pied de page */}
        <p className="mt-12 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} GESTMONEY. {ui.rights}<br />
          IBIG Soft — IBIG SARL – Intermark Business International Group<br />
          <a href="https://ibigsoft.com" className="hover:underline" target="_blank" rel="noopener noreferrer">ibigsoft.com</a>
        </p>
      </div>

      {/* Styles du corps markdown (portée locale au guide via .gm-guide-body, aucune modif du CSS global) */}
      <style dangerouslySetInnerHTML={{ __html: GUIDE_BODY_CSS }} />
    </main>
  );
}
