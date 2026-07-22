// ============================================================
// GESTMONEY — Export PDF du Guide utilisateur (VRAI PDF via pdfmake)
//
// Génère un fichier PDF authentique (téléchargé directement), brandé et
// paginé, SANS les en-têtes du navigateur (URL/date/titre) que produisait
// l'ancienne approche window.print(). pdfmake est chargé à la demande.
// ============================================================
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { GuideDoc } from './content';
import { LEXIQUE } from './lexique';
import {
  BRAND,
  STYLES_PDF,
  enTete,
  logoTitre,
  markdownVersPdf,
  pied,
  telechargerPdf,
} from '@/lib/pdfmake';

export interface GuidePdfSection {
  /** Emoji d'illustration (non rendu dans le PDF — police sans emoji). */
  icone: string;
  doc: GuideDoc;
}

export interface GuidePdfOptions {
  titre: string;
  sousTitre: string;
  lang: 'fr' | 'en';
  sections: GuidePdfSection[];
  nomFichier?: string;
}

export async function exporterGuidePdf(opts: GuidePdfOptions): Promise<void> {
  const L =
    opts.lang === 'en'
      ? { toc: 'Contents', lexique: 'Glossary' }
      : { toc: 'Sommaire', lexique: 'Lexique' };
  const dateStr = new Date().toLocaleDateString(
    opts.lang === 'en' ? 'en-GB' : 'fr-FR',
  );

  const content: Content[] = [
    // ── Couverture ──
    {
      columns: [
        logoTitre(),
        {
          text: dateStr,
          alignment: 'right',
          fontSize: 9,
          color: BRAND.gris,
          margin: [0, 12, 0, 0],
        },
      ],
    },
    {
      canvas: [
        { type: 'line', x1: 0, y1: 6, x2: 515, y2: 6, lineWidth: 2, lineColor: BRAND.noir },
      ],
      margin: [0, 6, 0, 16],
    },
    { text: opts.titre, style: 'h1', fontSize: 26, margin: [0, 12, 0, 4] },
    { text: opts.sousTitre, color: BRAND.gris, fontSize: 12, margin: [0, 0, 0, 18] },

    // ── Sommaire ──
    { text: L.toc, style: 'h2', margin: [0, 8, 0, 6] },
    {
      ol: opts.sections.map((s) => s.doc.titre),
      style: 'li',
      margin: [0, 0, 0, 4],
    },
  ];

  // ── Sections (chaque module sur une nouvelle page) ──
  opts.sections.forEach((s) => {
    content.push({
      text: s.doc.titre,
      style: 'h1',
      fontSize: 18,
      pageBreak: 'before',
      margin: [0, 0, 0, 2],
    });
    if (s.doc.resume) {
      content.push({
        text: s.doc.resume,
        italics: true,
        color: BRAND.gris,
        fontSize: 10,
        margin: [0, 0, 0, 8],
      });
    }
    content.push(...markdownVersPdf(s.doc.contenu));
  });

  // ── Lexique (glossaire) en fin de document ──
  content.push({
    text: L.lexique,
    style: 'h1',
    fontSize: 18,
    pageBreak: 'before',
    margin: [0, 0, 0, 8],
  });
  [...LEXIQUE]
    .sort((a, b) => a[opts.lang].terme.localeCompare(b[opts.lang].terme))
    .forEach((e) => {
      content.push({ text: e[opts.lang].terme, style: 'h3', margin: [0, 6, 0, 1] });
      content.push({ text: e[opts.lang].definition, style: 'p', margin: [0, 0, 0, 4] });
    });

  const doc: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 45],
    info: { title: opts.titre, author: 'GESTMONEY — IBIG Soft' },
    header: enTete(opts.sousTitre),
    footer: pied(`GESTMONEY — ${opts.titre}`),
    content,
    styles: STYLES_PDF,
    defaultStyle: { fontSize: 10, lineHeight: 1.3, color: '#222222' },
  };

  await telechargerPdf(doc, opts.nomFichier ?? 'gestmoney_guide');
}
