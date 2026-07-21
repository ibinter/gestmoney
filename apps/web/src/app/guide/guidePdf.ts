// ============================================================
// GESTMONEY — Export PDF du Guide utilisateur
//
// Pourquoi window.print() plutôt que la lib maison @/lib/pdf ?
//   La lib maison (exportToPdf) est un moteur TABULAIRE : elle prend des
//   colonnes + lignes et produit un tableau paginé. Elle n'est pas adaptée
//   à un long document de PROSE multi-sections (titres, listes, encadrés).
//   Comme le permet le cahier des charges, on retient donc l'approche la
//   plus simple et la plus robuste : générer un document HTML formaté aux
//   couleurs GESTMONEY, l'ouvrir dans un nouvel onglet et déclencher
//   window.print() — exactement le même pattern que src/lib/exportPdf.ts.
//   L'utilisateur choisit « Enregistrer en PDF » depuis la boîte de dialogue.
//   Aucune dépendance ajoutée.
// ============================================================

import { renderGuideMarkdown, type GuideDoc } from './content';

export interface GuidePdfSection {
  /** Emoji d'illustration (repris devant le titre). */
  icone: string;
  doc: GuideDoc;
}

export interface GuidePdfOptions {
  /** Titre principal du document. */
  titre: string;
  /** Sous-titre / résumé du document. */
  sousTitre: string;
  /** Langue active ('fr' | 'en') — pilote les libellés générés. */
  lang: 'fr' | 'en';
  /** Sections à imprimer (dans l'ordre). */
  sections: GuidePdfSection[];
  /** Nom de fichier suggéré (sans extension). */
  nomFichier?: string;
}

const STYLE = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', Arial, Helvetica, sans-serif; color:#111; background:#fff; font-size:12px; line-height:1.55; }
  .page { padding: 32px 44px; max-width: 900px; margin: 0 auto; }

  /* En-tête */
  .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; padding-bottom:16px; border-bottom:3px solid #111; }
  .logo-wrap { display:flex; align-items:center; gap:10px; }
  .logo-icon { width:40px; height:40px; background:#111; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:22px; }
  .logo-text { font-size:22px; font-weight:900; letter-spacing:-0.04em; }
  .logo-text .y { color:#F5B800; } .logo-text .r { color:#C41E1E; } .logo-text .g { color:#1E8C32; }
  .header-info { text-align:right; }
  .header-info p { color:#555; font-size:10px; margin-top:2px; }
  .header-info strong { color:#111; }

  /* Titre document */
  .doc-title { margin-bottom:18px; }
  .doc-title h1 { font-size:22px; font-weight:900; color:#111; letter-spacing:-0.02em; }
  .doc-title p { color:#666; font-size:12px; margin-top:6px; }

  /* Sommaire */
  .toc { background:#f9f9f9; border:1px solid #eee; border-radius:12px; padding:16px 20px; margin-bottom:28px; }
  .toc h2 { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#888; margin-bottom:10px; }
  .toc ol { margin:0; padding-left:20px; columns:2; column-gap:28px; }
  .toc li { font-size:11px; color:#333; margin-bottom:4px; break-inside:avoid; }

  /* Sections */
  .section { margin-bottom:26px; break-inside:avoid; page-break-inside:avoid; }
  .section-head { display:flex; align-items:center; gap:10px; padding-bottom:8px; border-bottom:2px solid #1E8C32; margin-bottom:12px; }
  .section-num { width:26px; height:26px; flex-shrink:0; background:#111; color:#fff; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; }
  .section-head h2 { font-size:16px; font-weight:800; color:#111; }
  .section-resume { font-size:11px; color:#777; font-style:italic; margin:-6px 0 12px; }

  /* Corps markdown */
  .gm-guide-h2 { font-size:13px; font-weight:800; color:#111; margin:14px 0 6px; }
  .gm-guide-h3 { font-size:12px; font-weight:700; color:#1E8C32; margin:12px 0 4px; }
  .gm-guide-p  { font-size:11.5px; color:#333; margin:5px 0; }
  .gm-guide-ul, .gm-guide-ol { margin:6px 0 6px 20px; }
  .gm-guide-ul li, .gm-guide-ol li { font-size:11.5px; color:#333; margin-bottom:3px; }
  .gm-guide-ul li { list-style:disc; } .gm-guide-ol li { list-style:decimal; }
  .gm-guide-note { background:#f4faf5; border-left:3px solid #1E8C32; border-radius:6px; padding:8px 12px; margin:8px 0; font-size:11px; color:#245c30; }
  strong { font-weight:700; color:#111; }

  /* Pied de page */
  .stamp { margin-top:32px; display:flex; align-items:center; gap:10px; padding:12px 16px; background:#f9f9f9; border:1px dashed #ccc; border-radius:10px; }
  .stamp p { font-size:9px; color:#888; }
  .footer { margin-top:16px; padding-top:12px; border-top:1px solid #eee; display:flex; justify-content:space-between; align-items:center; }
  .footer p { font-size:9px; color:#aaa; }
  .footer .ref { font-family:monospace; font-size:9px; color:#ccc; }

  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page { padding:16px; }
    .section { page-break-inside:avoid; }
  }
`;

export function exporterGuidePdf(opts: GuidePdfOptions): void {
  const now = new Date();
  const isEn = opts.lang === 'en';
  const dateLocale = isEn ? 'en-GB' : 'fr-FR';

  const L = isEn
    ? {
        editedBy: 'Published by',
        generatedOn: 'Generated on',
        at: 'at',
        toc: 'Table of contents',
        confidential:
          'Document generated automatically by GESTMONEY · This document is a user guide.',
        footer:
          'GESTMONEY — The smart Mobile Money management platform · ibigsoft.com',
      }
    : {
        editedBy: 'Édité par',
        generatedOn: 'Généré le',
        at: 'à',
        toc: 'Sommaire',
        confidential:
          'Document généré automatiquement par GESTMONEY · Ce document est un guide utilisateur.',
        footer:
          'GESTMONEY — La plateforme intelligente de gestion Mobile Money · ibigsoft.com',
      };

  const ref = `GM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const toc = `
    <div class="toc">
      <h2>${L.toc}</h2>
      <ol>
        ${opts.sections.map((s) => `<li>${s.doc.titre}</li>`).join('')}
      </ol>
    </div>`;

  const sections = opts.sections
    .map(
      (s, i) => `
      <section class="section">
        <div class="section-head">
          <div class="section-num">${i + 1}</div>
          <h2>${s.icone} ${s.doc.titre}</h2>
        </div>
        <p class="section-resume">${s.doc.resume}</p>
        ${renderGuideMarkdown(s.doc.contenu)}
      </section>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="${opts.lang}">
<head>
  <meta charset="UTF-8" />
  <title>${opts.titre} — GESTMONEY</title>
  <style>${STYLE}</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo-wrap">
        <div class="logo-icon">G</div>
        <div class="logo-text">GEST<span class="y">M</span><span class="r">O</span>N<span class="g">EY</span></div>
      </div>
      <div class="header-info">
        <p><strong>${L.editedBy}</strong> IBIG Soft — ibigsoft.com</p>
        <p>${L.generatedOn} ${now.toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })} ${L.at} ${now.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>

    <div class="doc-title">
      <h1>${opts.titre}</h1>
      <p>${opts.sousTitre}</p>
    </div>

    ${toc}
    ${sections}

    <div class="stamp">
      <div style="width:32px;height:32px;background:#111;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px;flex-shrink:0">G</div>
      <p>${L.confidential}</p>
    </div>
    <div class="footer">
      <p>${L.footer}</p>
      <p class="ref">${ref}</p>
    </div>
  </div>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'width=920,height=720');
  if (w) {
    w.onbeforeunload = () => URL.revokeObjectURL(url);
  } else {
    // Fallback si la popup est bloquée : téléchargement direct du HTML imprimable.
    const a = document.createElement('a');
    a.href = url;
    a.download = `${opts.nomFichier ?? 'gestmoney_guide'}_${now.toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}
