/**
 * GESTMONEY — Moteur d'export PDF universel
 * PdfDocumentRenderer.ts
 *
 * Renderer HTML/Print pour l'export PDF.
 *
 * Stratégie : génère un document HTML complet avec des styles @media print
 * optimisés, puis ouvre la boîte de dialogue d'impression du navigateur.
 * L'utilisateur enregistre en PDF depuis l'aperçu avant impression.
 *
 * Avantages de cette approche :
 *   - Aucune dépendance externe (pas besoin de jsPDF)
 *   - Rendu parfait des accents et caractères UTF-8
 *   - Largeurs de colonnes précises via CSS table-layout: fixed
 *   - Header compact automatique via @page et CSS print
 *   - Fonctionne sur tous les navigateurs modernes
 *
 * Si vous avez besoin d'un vrai fichier .pdf sans interaction utilisateur,
 * installez jsPDF + jspdf-autotable et activez le renderer alternatif
 * en passant `options.useJsPdf = true` (nécessite: npm i jspdf jspdf-autotable).
 */

import {
  DataRow,
  DocumentExportDefinition,
  KpiDefinition,
  ResolvedLayout,
} from './types';
import { PdfLayoutEngine } from './PdfLayoutEngine';

// ---------------------------------------------------------------------------
// Palette GESTMONEY
// ---------------------------------------------------------------------------
const COLOR = {
  black: '#111111',
  white: '#FFFFFF',
  accent: '#F5B800',   // jaune
  red: '#C41E1E',
  green: '#1E8C32',
  muted: '#888888',
  light: '#F4F4F4',
  border: '#E8E8E8',
  rowEven: '#F9F9F9',
  rowHover: '#F0F8F0',
};

// ---------------------------------------------------------------------------
// Fonctions de rendu HTML
// ---------------------------------------------------------------------------

function buildStyles(layout: ResolvedLayout): string {
  const { fontSize, headerFontSize, rowHeightMm, columns } = layout;
  const rowHeightPx = Math.round(rowHeightMm * 3.7795); // mm → px approximatif

  const colStyles = columns
    .map(
      (c, i) =>
        `td:nth-child(${i + 1}), th:nth-child(${i + 1}) { width: ${c.widthPt}pt; text-align: ${c.align}; white-space: ${c.nowrap ? 'nowrap' : 'normal'}; }`
    )
    .join('\n  ');

  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      font-size: ${fontSize}pt;
      color: ${COLOR.black};
      background: ${COLOR.white};
      -webkit-font-smoothing: antialiased;
    }

    .page-wrap {
      max-width: ${layout.orientation === 'landscape' ? '277mm' : '190mm'};
      margin: 0 auto;
      padding: ${layout.margins[0]}mm ${layout.margins[1]}mm ${layout.margins[2]}mm ${layout.margins[3]}mm;
    }

    /* ── Header première page ── */
    .header-main {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 10pt;
      border-bottom: 2.5pt solid ${COLOR.black};
      margin-bottom: 10pt;
    }
    .logo-wrap { display: flex; align-items: center; gap: 8pt; }
    .logo-icon {
      width: 32pt; height: 32pt;
      background: ${COLOR.black};
      border-radius: 8pt;
      display: flex; align-items: center; justify-content: center;
      color: ${COLOR.white};
      font-weight: 900;
      font-size: 18pt;
    }
    .logo-text { font-size: 18pt; font-weight: 900; letter-spacing: -0.04em; line-height: 1; }
    .logo-text .y { color: ${COLOR.accent}; }
    .logo-text .r { color: ${COLOR.red}; }
    .logo-text .g { color: ${COLOR.green}; }
    .header-meta { text-align: right; font-size: 7.5pt; color: ${COLOR.muted}; line-height: 1.5; }
    .header-meta strong { color: ${COLOR.black}; }

    /* ── Titre rapport ── */
    .report-title { margin-bottom: 10pt; }
    .report-title h1 { font-size: 14pt; font-weight: 900; }
    .report-title .pills {
      display: flex; gap: 6pt; flex-wrap: wrap; margin-top: 4pt;
    }
    .report-title .pill {
      font-size: 7pt; color: ${COLOR.muted};
      background: ${COLOR.light};
      padding: 1.5pt 6pt; border-radius: 99pt;
    }

    /* ── KPIs ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100pt, 1fr));
      gap: 8pt;
      margin-bottom: 12pt;
    }
    .kpi {
      background: ${COLOR.light};
      border: 1pt solid ${COLOR.border};
      border-radius: 6pt;
      padding: 7pt 10pt;
    }
    .kpi label { font-size: 7pt; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: ${COLOR.muted}; }
    .kpi .kpi-val { font-size: 15pt; font-weight: 900; color: ${COLOR.black}; margin-top: 1pt; }
    .kpi .kpi-sub { font-size: 7pt; color: #AAAAAA; margin-top: 1pt; }
    .kpi.green .kpi-val { color: ${COLOR.green}; }
    .kpi.red   .kpi-val { color: ${COLOR.red}; }
    .kpi.yellow .kpi-val { color: ${COLOR.accent}; }
    .kpi.blue  .kpi-val { color: #1E5C8C; }

    /* ── Tableau ── */
    .section-title {
      font-size: 9pt; font-weight: 700;
      margin: 10pt 0 5pt;
      padding-bottom: 4pt;
      border-bottom: 1pt solid ${COLOR.border};
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: ${fontSize}pt;
    }

    thead tr {
      background: ${COLOR.black};
      color: ${COLOR.white};
    }
    thead th {
      padding: 5pt 4pt;
      font-weight: 700;
      font-size: ${headerFontSize}pt;
      text-transform: uppercase;
      letter-spacing: .05em;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
    }

    tbody tr { height: ${rowHeightPx}px; }
    tbody tr:nth-child(even) { background: ${COLOR.rowEven}; }
    tbody td {
      padding: 3pt 4pt;
      border-bottom: 0.5pt solid ${COLOR.border};
      color: #333333;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
      line-height: 1.3;
    }
    tbody td.nowrap { white-space: nowrap; }

    tfoot tr { background: ${COLOR.light}; }
    tfoot td {
      padding: 5pt 4pt;
      font-weight: 700;
      font-size: ${fontSize}pt;
      border-top: 1.5pt solid ${COLOR.black};
    }

    /* Largeurs de colonnes individuelles */
    ${colStyles}

    /* ── Footer ── */
    .footer {
      margin-top: 10pt;
      padding-top: 6pt;
      border-top: 0.5pt solid ${COLOR.border};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer p { font-size: 7pt; color: ${COLOR.muted}; }
    .footer .ref { font-family: monospace; font-size: 7pt; color: #CCCCCC; }

    .stamp {
      margin-top: 10pt;
      display: flex;
      align-items: center;
      gap: 8pt;
      padding: 8pt 12pt;
      background: ${COLOR.light};
      border: 0.75pt dashed #CCCCCC;
      border-radius: 6pt;
    }
    .stamp-icon {
      width: 24pt; height: 24pt;
      background: ${COLOR.black};
      border-radius: 5pt;
      display: flex; align-items: center; justify-content: center;
      color: ${COLOR.white}; font-weight: 900; font-size: 13pt;
      flex-shrink: 0;
    }
    .stamp p { font-size: 7.5pt; color: ${COLOR.muted}; }

    /* ── Header compact (pages suivantes) ── */
    .header-compact {
      display: none; /* masqué en mode écran, affiché à l'impression via @page */
    }

    /* ── @media print ── */
    @media print {
      @page {
        size: ${layout.format === 'a3' ? 'A3' : layout.format === 'letter' ? 'letter' : 'A4'} ${layout.orientation};
        margin: ${layout.margins[0]}mm ${layout.margins[1]}mm ${layout.margins[2]}mm ${layout.margins[3]}mm;
      }

      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

      .page-wrap { padding: 0; max-width: none; }

      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }

      tbody tr { page-break-inside: avoid; }

      thead tr {
        background: ${COLOR.black} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      tbody tr:nth-child(even) {
        background: ${COLOR.rowEven} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;
}

function renderHeader(def: DocumentExportDefinition, now: Date): string {
  const opts = def.options ?? {};
  return `
    <div class="header-main">
      <div class="logo-wrap">
        <div class="logo-icon">G</div>
        <div class="logo-text">GEST<span class="y">M</span><span class="r">O</span>N<span class="g">EY</span></div>
      </div>
      <div class="header-meta">
        ${opts.company ? `<p><strong>${opts.company}</strong></p>` : '<p><strong>IBIG Soft · ibigsoft.com</strong></p>'}
        <p>Généré le ${now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
           à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
        ${opts.author ? `<p>Par : <strong>${opts.author}</strong></p>` : ''}
      </div>
    </div>
    <div class="report-title">
      <h1>${def.title}</h1>
      <div class="pills">
        ${opts.subtitle ? `<span class="pill">${opts.subtitle}</span>` : ''}
        ${opts.period ? `<span class="pill">Période : ${opts.period}</span>` : ''}
        <span class="pill">${def.rows.length.toLocaleString('fr-FR')} enregistrement${def.rows.length > 1 ? 's' : ''}</span>
        <span class="pill">Réf. GM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}</span>
      </div>
    </div>
  `;
}

function renderKpis(kpis: KpiDefinition[]): string {
  if (kpis.length === 0) return '';
  return `
    <div class="kpi-grid">
      ${kpis
        .map(
          (k) => `
        <div class="kpi${k.accent && k.accent !== 'neutral' ? ` ${k.accent}` : ''}">
          <label>${k.label}</label>
          <div class="kpi-val">${k.value}</div>
          ${k.sub ? `<div class="kpi-sub">${k.sub}</div>` : ''}
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function renderTable(
  def: DocumentExportDefinition,
  layout: ResolvedLayout
): string {
  const { columns } = layout;

  // En-tête du tableau
  const thead = columns
    .map((c) => `<th style="text-align:${c.align}">${c.label}</th>`)
    .join('');

  // Corps du tableau
  const tbody = def.rows
    .map((row) => {
      const cells = columns
        .map((col) => {
          const colDef = def.columns.find((d) => d.key === col.key);
          const raw = row[col.key];
          const str = colDef?.format
            ? colDef.format(raw, row)
            : raw === null || raw === undefined
            ? ''
            : typeof raw === 'boolean'
            ? raw
              ? 'Oui'
              : 'Non'
            : String(raw);

          // Style conditionnel
          let cellStyle = '';
          if (colDef?.cellStyle) {
            const s = colDef.cellStyle(raw, row);
            if (s) {
              if (s.fillColor)
                cellStyle += `background:rgb(${s.fillColor.join(',')});`;
              if (s.textColor)
                cellStyle += `color:rgb(${s.textColor.join(',')});`;
              if (s.fontStyle && s.fontStyle !== 'normal') {
                if (s.fontStyle.includes('bold')) cellStyle += 'font-weight:700;';
                if (s.fontStyle.includes('italic')) cellStyle += 'font-style:italic;';
              }
            }
          }

          const nowrapClass = col.nowrap ? ' class="nowrap"' : '';
          const inlineStyle = cellStyle ? ` style="${cellStyle}"` : '';
          return `<td${nowrapClass}${inlineStyle}>${escapeHtml(str)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  // Ligne de totaux (optionnelle)
  let tfoot = '';
  if (def.options?.showTotals && def.options.totalColumns?.length) {
    const totalCells = columns
      .map((col) => {
        if (def.options?.totalColumns?.includes(col.key)) {
          const sum = def.rows.reduce((s, row) => {
            const v = row[col.key];
            return s + (typeof v === 'number' ? v : 0);
          }, 0);
          return `<td style="text-align:right">${sum.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}</td>`;
        }
        return `<td></td>`;
      })
      .join('');
    tfoot = `<tfoot><tr>${totalCells}</tr></tfoot>`;
  }

  const colgroup = columns
    .map((c) => `<col style="width:${c.widthPt}pt">`)
    .join('');

  return `
    <p class="section-title">Données détaillées (${def.rows.length.toLocaleString('fr-FR')} ligne${def.rows.length > 1 ? 's' : ''})</p>
    <table>
      <colgroup>${colgroup}</colgroup>
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
      ${tfoot}
    </table>
  `;
}

function renderFooter(def: DocumentExportDefinition, now: Date): string {
  const opts = def.options ?? {};
  const ref = `GM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${now.getTime().toString(36).toUpperCase()}`;
  return `
    <div class="stamp">
      <div class="stamp-icon">G</div>
      <p>Document généré automatiquement par GESTMONEY · ${opts.company ?? 'IBIG Soft'} · Ce document est confidentiel et non opposable.</p>
    </div>
    <div class="footer">
      <p>GESTMONEY — La plateforme intelligente de gestion Mobile Money · ibigsoft.com</p>
      <p class="ref">${ref}</p>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Renderer principal
// ---------------------------------------------------------------------------

export class PdfDocumentRenderer {
  /**
   * Génère et ouvre le document PDF.
   *
   * Ouvre une nouvelle fenêtre avec le HTML formaté et déclenche
   * automatiquement la boîte de dialogue d'impression.
   */
  static render(def: DocumentExportDefinition): void {
    const now = new Date();
    const layout = PdfLayoutEngine.resolveLayout(
      def.columns,
      def.rows,
      def.options
    );

    const html = this.buildHtml(def, layout, now);
    this.openPrintWindow(html, def, now);
  }

  /**
   * Construit le HTML complet du document.
   * Exposé séparément pour faciliter les tests unitaires.
   */
  static buildHtml(
    def: DocumentExportDefinition,
    layout: ResolvedLayout,
    now: Date
  ): string {
    const opts = def.options ?? {};
    const kpiHtml = opts.kpis?.length ? renderKpis(opts.kpis) : '';
    const tableHtml =
      def.rows.length > 0
        ? renderTable(def, layout)
        : '<p style="color:#888;margin-top:12pt">Aucune donnée disponible.</p>';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(def.title)} — GESTMONEY</title>
  <style>${buildStyles(layout)}</style>
</head>
<body>
  <div class="page-wrap">
    ${renderHeader(def, now)}
    ${kpiHtml}
    ${tableHtml}
    ${renderFooter(def, now)}
  </div>
  <script>
    // Déclenche l'impression dès que les ressources (polices) sont prêtes
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function() {
        setTimeout(function() { window.print(); }, 150);
      });
    } else {
      window.onload = function() {
        setTimeout(function() { window.print(); }, 300);
      };
    }
  </script>
</body>
</html>`;
  }

  /** Ouvre la fenêtre d'impression, avec fallback téléchargement HTML */
  private static openPrintWindow(
    html: string,
    def: DocumentExportDefinition,
    now: Date
  ): void {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const w = window.open(url, '_blank', 'width=1024,height=768');
    if (w) {
      w.onbeforeunload = () => URL.revokeObjectURL(url);
    } else {
      // Popup bloquée → téléchargement du fichier HTML
      const opts = def.options ?? {};
      const slug =
        opts.filename ??
        def.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}_${now.toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    }
  }
}
