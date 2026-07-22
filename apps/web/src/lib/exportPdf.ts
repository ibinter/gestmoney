// Export PDF (vrai fichier PDF via pdfmake) + XLSX (SpreadsheetML) côté client.
// Le PDF est un fichier binaire authentique, brandé et paginé — SANS les
// en-têtes du navigateur (URL/date) que produisait l'ancienne impression HTML.
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  BRAND,
  STYLES_PDF,
  logoTitre,
  pied,
  telechargerPdf,
} from './pdfmake';

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

const alignement = (c: ColonnePdf): 'left' | 'right' | 'center' =>
  c.align === 'right' ? 'right' : c.align === 'center' ? 'center' : 'left';

/**
 * Génère et télécharge un VRAI PDF (tableau de données brandé GESTMONEY).
 */
export async function exporterPdf(
  donnees: Record<string, unknown>[],
  colonnes: ColonnePdf[],
  opts: OptionsPdf,
  kpis?: { label: string; valeur: string; sous?: string }[],
): Promise<void> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const content: Content[] = [
    {
      columns: [
        logoTitre(),
        {
          text: `Édité par IBIG Soft — ibigsoft.com\nGénéré le ${dateStr}`,
          alignment: 'right',
          fontSize: 8,
          color: BRAND.gris,
          margin: [0, 8, 0, 0],
        },
      ],
    },
    {
      canvas: [
        { type: 'line', x1: 0, y1: 6, x2: 515, y2: 6, lineWidth: 2, lineColor: BRAND.noir },
      ],
      margin: [0, 6, 0, 14],
    },
    { text: opts.titre, style: 'h1', fontSize: 18, margin: [0, 0, 0, 2] },
  ];

  const meta = [opts.sousTitre, opts.periode ? `Période : ${opts.periode}` : '']
    .filter(Boolean)
    .join('  ·  ');
  if (meta) {
    content.push({ text: meta, color: BRAND.gris, fontSize: 9, margin: [0, 0, 0, 10] });
  }

  if (kpis && kpis.length > 0) {
    content.push({
      columns: kpis.map((k) => ({
        width: '*',
        stack: [
          { text: k.label.toUpperCase(), fontSize: 7, color: BRAND.gris, bold: true },
          { text: k.valeur, fontSize: 14, bold: true, color: BRAND.noir, margin: [0, 1, 0, 0] },
          ...(k.sous ? [{ text: k.sous, fontSize: 7, color: '#aaaaaa' }] : []),
        ],
        margin: [0, 0, 8, 0],
      })),
      columnGap: 8,
      margin: [0, 4, 0, 14],
    } as Content);
  }

  if (donnees.length > 0) {
    const header = colonnes.map((c) => ({
      text: c.titre,
      bold: true,
      color: '#ffffff',
      fontSize: 8,
      alignment: alignement(c),
    }));
    const body = donnees.map((row) =>
      colonnes.map((c) => ({
        text: String(c.valeur(row) ?? ''),
        fontSize: 8,
        alignment: alignement(c),
        color: '#333333',
      })),
    );
    content.push({
      table: {
        headerRows: 1,
        widths: colonnes.map(() => '*'),
        body: [header, ...body],
      },
      layout: {
        fillColor: (rowIndex: number) =>
          rowIndex === 0 ? BRAND.noir : rowIndex % 2 === 0 ? '#f7f7f7' : null,
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#eeeeee',
        paddingTop: () => 5,
        paddingBottom: () => 5,
        paddingLeft: () => 7,
        paddingRight: () => 7,
      },
    } as Content);
    content.push({
      text: `${donnees.length} enregistrement${donnees.length > 1 ? 's' : ''}`,
      style: 'petit',
      margin: [0, 6, 0, 0],
    });
  } else {
    content.push({
      text: 'Aucune donnée pour la période sélectionnée.',
      color: BRAND.gris,
      fontSize: 10,
      margin: [0, 8, 0, 0],
    });
  }

  const doc: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: colonnes.length > 6 ? 'landscape' : 'portrait',
    pageMargins: [30, 30, 30, 40],
    info: { title: opts.titre, author: 'GESTMONEY — IBIG Soft' },
    footer: pied(`GESTMONEY — ${opts.titre}`),
    content,
    styles: STYLES_PDF,
    defaultStyle: { fontSize: 9, color: '#222222' },
  };

  const nom = opts.nomFichier ?? opts.titre.toLowerCase().replace(/\s+/g, '_');
  await telechargerPdf(doc, `${nom}_${now.toISOString().slice(0, 10)}`);
}

// Export XLSX simplifié via SpreadsheetML (XML lisible par Excel)
export function exporterXlsx(
  donnees: Record<string, unknown>[],
  colonnes: ColonnePdf[],
  opts: OptionsPdf,
): void {
  const now = new Date();
  const nomFeuille = opts.titre.slice(0, 31).replace(/[\\/*?[\]:]/g, '');

  const enteteRow = colonnes
    .map(
      (c) =>
        `<Cell ss:StyleID="header"><Data ss:Type="String">${c.titre}</Data></Cell>`,
    )
    .join('');

  const lignes = donnees
    .map(
      (row) =>
        `<Row>${colonnes
          .map((c) => {
            const v = c.valeur(row);
            const type = typeof v === 'number' ? 'Number' : 'String';
            return `<Cell><Data ss:Type="${type}">${String(v ?? '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')}</Data></Cell>`;
          })
          .join('')}</Row>`,
    )
    .join('\n');

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
  a.download = `${opts.nomFichier ?? opts.titre.toLowerCase().replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
