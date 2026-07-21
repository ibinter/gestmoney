'use client';
// ============================================================
// GESTMONEY — Cas pratiques (vue client)
// Route : /guide/cas-pratiques
// Scénarios pas-à-pas (contexte → étapes → résultat), bilingues,
// avec un bouton « Télécharger en PDF ».
// ============================================================
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { GUIDE_CAS, GUIDE_BODY_CSS, renderGuideMarkdown } from './content';
import { exporterGuidePdf } from './guidePdf';

const UI = {
  fr: {
    backGuide: '← Guide utilisateur',
    home: 'Accueil',
    kicker: 'Pas à pas',
    title: 'Cas pratiques',
    subtitle:
      'Des scénarios concrets pour réaliser les opérations courantes de A à Z.',
    downloadPdf: 'Télécharger les cas pratiques en PDF',
    pdfTitle: 'Cas pratiques GESTMONEY',
    pdfSubtitle:
      'Scénarios pas-à-pas des opérations courantes — édité par IBIG Soft.',
    rights: 'Tous droits réservés.',
  },
  en: {
    backGuide: '← User guide',
    home: 'Home',
    kicker: 'Step by step',
    title: 'Practical cases',
    subtitle:
      'Concrete scenarios to carry out common operations from start to finish.',
    downloadPdf: 'Download the practical cases as PDF',
    pdfTitle: 'GESTMONEY Practical Cases',
    pdfSubtitle:
      'Step-by-step scenarios for common operations — published by IBIG Soft.',
    rights: 'All rights reserved.',
  },
};

export function CasPratiques() {
  const { lang } = useI18n();
  const ui = lang === 'en' ? UI.en : UI.fr;

  const handlePdf = () => {
    exporterGuidePdf({
      titre: ui.pdfTitle,
      sousTitre: ui.pdfSubtitle,
      lang,
      nomFichier: lang === 'en' ? 'gestmoney_practical_cases' : 'gestmoney_cas_pratiques',
      sections: GUIDE_CAS.map((c) => ({
        icone: c.icone,
        doc: lang === 'en' ? c.en : c.fr,
      })),
    });
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/guide" className="text-sm text-green-600 hover:underline">{ui.backGuide}</Link>
            <Link href="/" className="text-sm text-gray-400 hover:underline">{ui.home}</Link>
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-green-600">{ui.kicker}</p>
          <h1 className="text-4xl font-black mt-2 text-gray-900 dark:text-white">{ui.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">{ui.subtitle}</p>

          <button
            type="button"
            onClick={handlePdf}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition-opacity"
          >
            <span aria-hidden>⬇</span> {ui.downloadPdf}
          </button>
        </div>

        {/* Cas */}
        <div className="space-y-8">
          {GUIDE_CAS.map((c, i) => {
            const doc = lang === 'en' ? c.en : c.fr;
            return (
              <section
                key={c.id}
                id={c.id}
                className="scroll-mt-20 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30 p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-900 dark:bg-white text-sm font-black text-white dark:text-gray-900">
                    {i + 1}
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white leading-snug">
                      <span aria-hidden className="mr-2">{c.icone}</span>{doc.titre}
                    </h2>
                    <p className="text-sm italic text-gray-500 dark:text-gray-400 mt-1">{doc.resume}</p>
                  </div>
                </div>
                <div
                  className="gm-guide-body mt-4"
                  dangerouslySetInnerHTML={{ __html: renderGuideMarkdown(doc.contenu) }}
                />
              </section>
            );
          })}
        </div>

        {/* Pied de page */}
        <p className="mt-12 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} GESTMONEY. {ui.rights}<br />
          IBIG Soft — IBIG SARL – Intermark Business International Group<br />
          <a href="https://ibigsoft.com" className="hover:underline" target="_blank" rel="noopener noreferrer">ibigsoft.com</a>
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: GUIDE_BODY_CSS }} />
    </main>
  );
}
