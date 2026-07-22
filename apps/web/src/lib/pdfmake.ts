// ============================================================
// GESTMONEY — Génération de VRAIS PDF via pdfmake (binaire PDF réel).
//
// Contrairement à window.print() (impression HTML → le navigateur ajoute
// ses propres en-têtes URL/date/titre dans les marges), pdfmake produit
// un fichier PDF authentique, brandé, paginé, téléchargé directement.
// La bibliothèque est chargée À LA DEMANDE (dynamic import) pour ne pas
// alourdir le bundle principal.
// ============================================================
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';

export const BRAND = {
  noir: '#111111',
  jaune: '#F5B800',
  rouge: '#C41E1E',
  vert: '#1E8C32',
  gris: '#666666',
  grisClair: '#F4F4F4',
  callout: '#FFF8E1',
};

let cache: any = null;

/** Charge pdfmake + les polices embarquées (une seule fois). */
export async function loadPdfMake(): Promise<any> {
  if (cache) return cache;
  const mod: any = await import('pdfmake/build/pdfmake');
  const fonts: any = await import('pdfmake/build/vfs_fonts');
  const pdfMake: any = mod.default ?? mod;
  const vfs: any = fonts.default ?? fonts;
  // Selon la version : vfs est soit la map directe, soit { pdfMake: { vfs } }.
  pdfMake.vfs = vfs?.pdfMake?.vfs ?? vfs;
  cache = pdfMake;
  return pdfMake;
}

/** Bandeau d'en-tête répété sur chaque page (dans le PDF, pas le navigateur). */
export function enTete(sousTitre: string): TDocumentDefinitions['header'] {
  return (currentPage: number): Content => {
    if (currentPage === 1) return { text: '' };
    return {
      margin: [40, 18, 40, 0],
      columns: [
        { text: 'GESTMONEY', bold: true, fontSize: 10, color: BRAND.noir },
        { text: sousTitre, alignment: 'right', fontSize: 8, color: BRAND.gris },
      ],
    };
  };
}

/** Pied de page avec pagination. */
export function pied(mention: string): TDocumentDefinitions['footer'] {
  return (currentPage: number, pageCount: number): Content => ({
    margin: [40, 8, 40, 0],
    columns: [
      { text: mention, fontSize: 8, color: BRAND.gris },
      {
        text: `${currentPage} / ${pageCount}`,
        alignment: 'right',
        fontSize: 8,
        color: BRAND.gris,
      },
    ],
  });
}

/** Logo GESTMONEY en texte coloré (le PDF n'embarque pas d'image externe). */
export function logoTitre(): Content {
  return {
    text: [
      { text: 'GEST', color: BRAND.noir },
      { text: 'M', color: BRAND.jaune },
      { text: 'O', color: BRAND.rouge },
      { text: 'N', color: BRAND.vert },
      { text: 'EY', color: BRAND.noir },
    ],
    bold: true,
    fontSize: 22,
  };
}

/** Styles partagés des documents. */
export const STYLES_PDF: TDocumentDefinitions['styles'] = {
  h1: { fontSize: 22, bold: true, color: BRAND.noir, margin: [0, 0, 0, 4] },
  h2: { fontSize: 14, bold: true, color: BRAND.noir, margin: [0, 12, 0, 4] },
  h3: { fontSize: 11, bold: true, color: '#333333', margin: [0, 8, 0, 3] },
  p: { fontSize: 10, color: '#222222', margin: [0, 0, 0, 6] },
  li: { fontSize: 10, color: '#222222' },
  petit: { fontSize: 8, color: BRAND.gris },
};

// ── Callout (encadré astuce / avertissement) ──────────────────────────────
const layoutCallout = {
  fillColor: () => BRAND.callout,
  hLineWidth: () => 0,
  vLineWidth: () => 0,
  paddingLeft: () => 10,
  paddingRight: () => 10,
  paddingTop: () => 7,
  paddingBottom: () => 7,
};

/** Parse le **gras** inline → runs pdfmake. */
function inline(texte: string): any {
  if (!texte.includes('**')) return texte;
  const parts = texte.split('**');
  return {
    text: parts.map((p, i) => (i % 2 === 1 ? { text: p, bold: true } : p)),
  };
}

/**
 * Convertit le markdown simplifié du guide (## ### - 1. **gras** > callout)
 * en contenu pdfmake. Regroupe les listes consécutives.
 */
export function markdownVersPdf(md: string): Content[] {
  const out: Content[] = [];
  let ul: any[] = [];
  let ol: any[] = [];

  const vider = () => {
    if (ul.length) {
      out.push({ ul: ul.map((x) => inline(x)), style: 'li', margin: [0, 2, 0, 6] } as Content);
      ul = [];
    }
    if (ol.length) {
      out.push({ ol: ol.map((x) => inline(x)), style: 'li', margin: [0, 2, 0, 6] } as Content);
      ol = [];
    }
  };

  for (const brut of md.split('\n')) {
    const ligne = brut.replace(/\s+$/, '');
    if (/^### /.test(ligne)) {
      vider();
      out.push({ text: ligne.slice(4), style: 'h3' });
    } else if (/^## /.test(ligne)) {
      vider();
      out.push({ text: ligne.slice(3), style: 'h2' });
    } else if (/^-\s+/.test(ligne)) {
      if (ol.length) vider();
      ul.push(ligne.replace(/^-\s+/, ''));
    } else if (/^\d+\.\s+/.test(ligne)) {
      if (ul.length) vider();
      ol.push(ligne.replace(/^\d+\.\s+/, ''));
    } else if (/^>\s+/.test(ligne)) {
      vider();
      out.push({
        table: { widths: ['*'], body: [[{ text: inline(ligne.replace(/^>\s+/, '')), fontSize: 10, color: '#5a4a00' }]] },
        layout: layoutCallout,
        margin: [0, 4, 0, 8],
      } as Content);
    } else if (ligne.trim() === '') {
      vider();
    } else {
      vider();
      out.push({ text: inline(ligne), style: 'p' } as Content);
    }
  }
  vider();
  return out;
}

/** Génère et télécharge un PDF à partir d'une définition pdfmake. */
export async function telechargerPdf(
  doc: TDocumentDefinitions,
  nomFichier: string,
): Promise<void> {
  const pdfMake = await loadPdfMake();
  pdfMake.createPdf(doc).download(`${nomFichier}.pdf`);
}
