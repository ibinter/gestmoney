// Export PDF côté client via window.print() — aucune dépendance externe.
// Génère un document HTML formaté GESTMONEY et ouvre le dialogue d'impression.
// L'utilisateur peut "Enregistrer en PDF" depuis la boîte de dialogue.

export interface ColonnePdf {
  titre: string;
  valeur: (row: Record<string, unknown>) => string | number;
  align?: 'left' | 'right' | 'center';
}

export interface OptionsPdf {
  titre: string;
  sousTitre?: string;
  periode?: string;
  societe?: string;
  auteur?: string;
  nomFichier?: string;
}

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', Arial, sans-serif; color: #111; background: #fff; font-size: 11px; }
  .page { padding: 32px 40px; max-width: 900px; margin: 0 auto; }

  /* En-tête */
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #111; }
  .logo-wrap { display: flex; align-items: center; gap: 10px; }
  .logo-icon { width: 40px; height: 40px; background: #111; border-radius: 10px; display: flex; align-items: center; justify-content: center; color:#fff; font-weight:900; font-size:22px; }
  .logo-text { font-size: 22px; font-weight: 900; letter-spacing: -0.04em; }
  .logo-text .y { color: #F5B800; }
  .logo-text .r { color: #C41E1E; }
  .logo-text .g { color: #1E8C32; }
  .header-info { text-align: right; }
  .header-info p { color: #555; font-size: 10px; margin-top: 2px; }
  .header-info strong { color: #111; }

  /* Titre rapport */
  .report-title { margin-bottom: 20px; }
  .report-title h1 { font-size: 18px; font-weight: 900; color: #111; }
  .report-title .meta { display: flex; gap: 16px; margin-top: 6px; flex-wrap: wrap; }
  .report-title .meta span { font-size: 10px; color: #666; background: #f4f4f4; padding: 2px 8px; border-radius: 999px; }

  /* KPIs */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { background: #f9f9f9; border: 1px solid #eee; border-radius: 10px; padding: 12px 14px; }
  .kpi label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #888; }
  .kpi .val { font-size: 18px; font-weight: 900; color: #111; margin-top: 2px; }
  .kpi .sub { font-size: 9px; color: #aaa; margin-top: 1px; }

  /* Tableau */
  .section-title { font-size: 13px; font-weight: 700; color: #111; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead tr { background: #111; color: #fff; }
  thead th { padding: 8px 10px; text-align: left; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; }
  thead th.right { text-align: right; }
  tbody tr:nth-child(even) { background: #f9f9f9; }
  tbody tr:hover { background: #f0f8f0; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; color: #333; }
  tbody td.right { text-align: right; font-variant-numeric: tabular-nums; }
  tfoot tr { background: #f4f4f4; font-weight: 700; }
  tfoot td { padding: 8px 10px; font-weight: 700; color: #111; }
  tfoot td.right { text-align: right; }

  /* Barre de progression */
  .bar-wrap { background: #eee; border-radius: 999px; height: 8px; overflow: hidden; margin-top: 4px; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #1E8C32, #F5B800); border-radius: 999px; }

  /* Pied de page */
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
  .footer p { font-size: 9px; color: #aaa; }
  .footer .ref { font-family: monospace; font-size: 9px; color: #ccc; }

  /* Sceau */
  .stamp { margin-top: 32px; display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #f9f9f9; border: 1px dashed #ccc; border-radius: 10px; }
  .stamp p { font-size: 9px; color: #888; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 20px; }
    thead tr { background: #111 !important; -webkit-print-color-adjust: exact; }
  }
`;

function entete(opts: OptionsPdf, now: Date): string {
  return `
    <div class="header">
      <div class="logo-wrap">
        <div class="logo-icon">G</div>
        <div class="logo-text">GEST<span class="y">M</span><span class="r">O</span>N<span class="g">EY</span></div>
      </div>
      <div class="header-info">
        <p><strong>Édité par</strong> IBIG Soft — ibigsoft.com</p>
        <p>Généré le ${now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
        ${opts.auteur ? `<p>Par : <strong>${opts.auteur}</strong></p>` : ''}
        ${opts.societe ? `<p>Société : <strong>${opts.societe}</strong></p>` : ''}
      </div>
    </div>
    <div class="report-title">
      <h1>${opts.titre}</h1>
      <div class="meta">
        ${opts.sousTitre ? `<span>${opts.sousTitre}</span>` : ''}
        ${opts.periode ? `<span>Période : ${opts.periode}</span>` : ''}
        <span>Ref. GM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}</span>
      </div>
    </div>
  `;
}

function piedPage(opts: OptionsPdf, now: Date): string {
  return `
    <div class="stamp">
      <div style="width:32px;height:32px;background:#111;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px;flex-shrink:0">G</div>
      <p>Document généré automatiquement par GESTMONEY · ${opts.societe ?? 'IBIG Soft'} · Ce document est confidentiel.</p>
    </div>
    <div class="footer">
      <p>GESTMONEY — La plateforme intelligente de gestion Mobile Money · ibigsoft.com</p>
      <p class="ref">GM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2,'0')}-${now.getTime().toString(36).toUpperCase()}</p>
    </div>
  `;
}

export function exporterPdf(
  donnees: Record<string, unknown>[],
  colonnes: ColonnePdf[],
  opts: OptionsPdf,
  kpis?: { label: string; valeur: string; sous?: string }[]
): void {
  const now = new Date();

  const kpiHtml = kpis && kpis.length > 0 ? `
    <div class="kpi-grid">
      ${kpis.map((k) => `
        <div class="kpi">
          <label>${k.label}</label>
          <div class="val">${k.valeur}</div>
          ${k.sous ? `<div class="sub">${k.sous}</div>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  const thead = colonnes.map((c) => `<th class="${c.align === 'right' ? 'right' : ''}">${c.titre}</th>`).join('');

  const tbody = donnees.map((row) =>
    `<tr>${colonnes.map((c) => `<td class="${c.align === 'right' ? 'right' : ''}">${c.valeur(row)}</td>`).join('')}</tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${opts.titre} — GESTMONEY</title>
  <style>${STYLE}</style>
</head>
<body>
  <div class="page">
    ${entete(opts, now)}
    ${kpiHtml}
    ${donnees.length > 0 ? `
      <p class="section-title">Données détaillées (${donnees.length} enregistrement${donnees.length > 1 ? 's' : ''})</p>
      <table>
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    ` : '<p style="color:#888;font-size:11px;margin-top:12px;">Aucune donnée pour la période sélectionnée.</p>'}
    ${piedPage(opts, now)}
  </div>
</body>
</html>`;

  imprimerHtml(html);
}

/**
 * Imprime un document HTML via un iframe caché. Fiable et JAMAIS bloqué par le
 * navigateur, contrairement à `window.open` (popup). L'utilisateur choisit
 * « Enregistrer en PDF » dans la boîte de dialogue d'impression.
 */
export function imprimerHtml(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;left:-9999px;top:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  // Laisser le temps au rendu (polices / mise en page) avant d'imprimer.
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      /* ignore */
    }
    // Retirer l'iframe bien après (ne pas annuler la boîte d'impression).
    setTimeout(() => iframe.remove(), 60000);
  }, 300);
}

// Export XLSX simplifié via SpreadsheetML (XML lisible par Excel)
export function exporterXlsx(
  donnees: Record<string, unknown>[],
  colonnes: ColonnePdf[],
  opts: OptionsPdf
): void {
  const now = new Date();
  const nomFeuille = opts.titre.slice(0, 31).replace(/[\\/*?[\]:]/g, '');

  const enteteRow = colonnes.map((c) =>
    `<Cell ss:StyleID="header"><Data ss:Type="String">${c.titre}</Data></Cell>`
  ).join('');

  const lignes = donnees.map((row) =>
    `<Row>${colonnes.map((c) => {
      const v = c.valeur(row);
      const type = typeof v === 'number' ? 'Number' : 'String';
      return `<Cell><Data ss:Type="${type}">${String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Data></Cell>`;
    }).join('')}</Row>`
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#111111" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="title">
   <Font ss:Bold="1" ss:Size="14"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${nomFeuille}">
  <Table>
   <Row><Cell ss:StyleID="title"><Data ss:Type="String">GESTMONEY — ${opts.titre}</Data></Cell></Row>
   ${opts.periode ? `<Row><Cell><Data ss:Type="String">Période : ${opts.periode}</Data></Cell></Row>` : ''}
   <Row><Cell><Data ss:Type="String">Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}</Data></Cell></Row>
   <Row></Row>
   <Row>${enteteRow}</Row>
   ${lignes}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${opts.nomFichier ?? opts.titre.toLowerCase().replace(/\s+/g,'_')}_${now.toISOString().slice(0,10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
