/**
 * GESTMONEY — Moteur d'export PDF universel
 * PdfLayoutEngine.ts
 *
 * Orchestre l'analyse du contenu et le choix des paramètres de mise en page.
 * C'est le "cerveau" qui décide orientation, format, marges, polices, pagination.
 */

import {
  ColumnDefinition,
  DataRow,
  DocumentLayoutAnalysis,
  ExportOptions,
  PageFormat,
  PageOrientation,
  ResolvedLayout,
} from './types';
import { ColumnWidthCalculator } from './ColumnWidthCalculator';

// ---------------------------------------------------------------------------
// Dimensions des formats de page (en mm)
// [largeur_portrait, hauteur_portrait]
// ---------------------------------------------------------------------------
const PAGE_SIZES: Record<PageFormat, [number, number]> = {
  [PageFormat.A4]: [210, 297],
  [PageFormat.A3]: [297, 420],
  [PageFormat.LETTER]: [215.9, 279.4],
};

/** Conversion mm → pt (1 mm = 72/25.4 pt ≈ 2.835 pt) */
const MM_TO_PT = 72 / 25.4;

/** Seuil de pression pour basculer en paysage (ratio colonnes/page_portrait) */
const LANDSCAPE_THRESHOLD = 0.85;

/** Hauteur réservée au header principal (première page) en mm */
const HEADER_MAIN_HEIGHT_MM = 38;

/** Hauteur réservée au header compact (pages suivantes) en mm */
const HEADER_COMPACT_HEIGHT_MM = 12;

/** Hauteur réservée au footer en mm */
const FOOTER_HEIGHT_MM = 10;

// ---------------------------------------------------------------------------
// Classe principale
// ---------------------------------------------------------------------------

export class PdfLayoutEngine {
  /**
   * ÉTAPE 1 — Analyse le contenu pour prendre des décisions éclairées.
   *
   * @param columns  Définitions des colonnes
   * @param rows     Données réelles
   * @returns        Analyse structurée du document
   */
  static analyzeContent(
    columns: ColumnDefinition[],
    rows: DataRow[]
  ): DocumentLayoutAnalysis {
    // Largeur de référence A4 portrait en pt
    const refWidthPt = PAGE_SIZES[PageFormat.A4][0] * MM_TO_PT;
    // Marges compact portrait : 12mm de chaque côté
    const refUsable = refWidthPt - 2 * 12 * MM_TO_PT;

    // Calculer les largeurs de colonnes à titre d'estimation
    const colWidths = ColumnWidthCalculator.calculate(columns, rows, refUsable);

    const estimatedTotal = colWidths.reduce((s, c) => s + c.widthPt, 0);
    const minTotal = colWidths.reduce((s) => s + s, 0); // dummy, calculé depuis types

    // Percentile 90 par colonne (en caractères)
    const contentP90: Record<string, number> = {};
    const sample = rows.slice(0, 500);
    for (const col of columns) {
      const lengths = sample.map((r) => {
        const v = r[col.key];
        if (v === null || v === undefined) return 0;
        return String(v).length;
      });
      const sorted = [...lengths].sort((a, b) => a - b);
      const idx = Math.ceil(0.9 * sorted.length) - 1;
      contentP90[col.key] = sorted[Math.max(0, idx)] ?? 0;
    }

    const widthPressure = estimatedTotal / refUsable;
    const recommendedOrientation =
      widthPressure > LANDSCAPE_THRESHOLD
        ? PageOrientation.LANDSCAPE
        : PageOrientation.PORTRAIT;

    // Passer en A3 si même le paysage A4 est insuffisant
    const recommendedFormat =
      widthPressure > 1.6 ? PageFormat.A3 : PageFormat.A4;

    return {
      columnCount: columns.length,
      estimatedContentWidthPt: estimatedTotal,
      maxContentWidthPt: minTotal,
      contentP90ByColumn: contentP90,
      rowCount: rows.length,
      widthPressure,
      recommendedOrientation,
      recommendedFormat,
    };
  }

  /**
   * ÉTAPE 2 — Choisit les meilleurs paramètres de mise en page.
   *
   * Tient compte des options utilisateur (orientation forcée, format…)
   * et des recommandations de l'analyse.
   */
  static selectBestLayout(
    analysis: DocumentLayoutAnalysis,
    options?: ExportOptions
  ): Pick<ResolvedLayout, 'orientation' | 'format' | 'margins' | 'fontSize' | 'headerFontSize' | 'rowHeightMm'> {
    const orientation = options?.orientation ?? analysis.recommendedOrientation;
    const format = options?.format ?? analysis.recommendedFormat;

    // Marges adaptatives (mm) [top, right, bottom, left]
    let margins: [number, number, number, number];
    if (options?.margins) {
      margins = options.margins;
    } else if (orientation === PageOrientation.LANDSCAPE) {
      margins = [10, 10, 10, 10];
    } else {
      // Portrait : un peu plus de marge haut/bas pour le header/footer
      margins = [12, 12, 12, 12];
    }

    // Taille de police selon la pression de largeur
    let fontSize: number;
    if (options?.fontSize) {
      fontSize = options.fontSize;
    } else if (analysis.widthPressure > 1.2) {
      fontSize = 7.5;
    } else if (analysis.widthPressure > 0.9) {
      fontSize = 8.5;
    } else {
      fontSize = 9.5;
    }
    // Clamp entre 7.5 et 10.5
    fontSize = Math.min(10.5, Math.max(7.5, fontSize));

    const headerFontSize = Math.max(6.5, fontSize - 1);

    // Hauteur de ligne (mm)
    const rowHeightMm = options?.rowHeight ?? (fontSize <= 8 ? 5.5 : 6.5);

    return { orientation, format, margins, fontSize, headerFontSize, rowHeightMm };
  }

  /**
   * ÉTAPE 3 — Calcule le layout complet (colonnes + pagination).
   *
   * C'est la méthode principale à appeler depuis le renderer.
   */
  static resolveLayout(
    columns: ColumnDefinition[],
    rows: DataRow[],
    options?: ExportOptions
  ): ResolvedLayout {
    const analysis = this.analyzeContent(columns, rows);
    const layout = this.selectBestLayout(analysis, options);

    const [pageW, pageH] = PAGE_SIZES[layout.format];
    const [mt, mr, mb, ml] = layout.margins;

    // Largeur utilisable
    const usableWidthMm =
      layout.orientation === PageOrientation.LANDSCAPE
        ? pageH - ml - mr  // paysage : la largeur est la hauteur de la page
        : pageW - ml - mr;
    const usableWidthPt = usableWidthMm * MM_TO_PT;

    // Hauteur utilisable (première page — la plus petite à cause du grand header)
    const usableHeightMm =
      (layout.orientation === PageOrientation.LANDSCAPE ? pageW : pageH)
      - mt
      - mb
      - HEADER_MAIN_HEIGHT_MM
      - FOOTER_HEIGHT_MM;

    const colWidths = ColumnWidthCalculator.calculate(columns, rows, usableWidthPt);

    return {
      ...layout,
      usableWidthMm,
      usableWidthPt,
      usableHeightMm,
      columns: colWidths,
    };
  }

  /**
   * ÉTAPE 4 — Calcule la pagination : quelles lignes vont sur quelle page.
   *
   * Prend en compte que la première page a moins d'espace (grand header).
   *
   * @returns Tableau de groupes de lignes, un groupe par page
   */
  static calculatePagination(
    rows: DataRow[],
    layout: ResolvedLayout
  ): DataRow[][] {
    const rowHeightPt = layout.rowHeightMm * MM_TO_PT;
    const headerRowHeightPt = (layout.rowHeightMm + 1) * MM_TO_PT; // header colonne légèrement plus haut

    // Hauteur dispo pour les données sur la 1re page (header principal = grand)
    const firstPageUsablePt =
      (layout.usableHeightMm - HEADER_COMPACT_HEIGHT_MM) * MM_TO_PT;
    // Hauteur dispo sur les pages suivantes (header compact)
    const otherPageUsablePt =
      (layout.usableHeightMm
        + HEADER_MAIN_HEIGHT_MM
        - HEADER_COMPACT_HEIGHT_MM
        - FOOTER_HEIGHT_MM) * MM_TO_PT;

    const pages: DataRow[][] = [];
    let remaining = [...rows];
    let isFirstPage = true;

    while (remaining.length > 0) {
      const pageHeight = isFirstPage ? firstPageUsablePt : otherPageUsablePt;
      const rowsPerPage = Math.max(
        1,
        Math.floor((pageHeight - headerRowHeightPt) / rowHeightPt)
      );
      pages.push(remaining.slice(0, rowsPerPage));
      remaining = remaining.slice(rowsPerPage);
      isFirstPage = false;
    }

    return this.balanceLastPages(pages);
  }

  /**
   * ÉTAPE 5 — Rééquilibre les deux dernières pages si la dernière est trop vide.
   *
   * Si la dernière page contient moins de 30% des lignes de l'avant-dernière,
   * on redistribue équitablement entre les deux.
   */
  static balanceLastPages(pages: DataRow[][]): DataRow[][] {
    if (pages.length < 2) return pages;

    const last = pages[pages.length - 1];
    const secondToLast = pages[pages.length - 2];

    // Seuil : la dernière page a moins de 30% des lignes de l'avant-dernière
    if (last.length < secondToLast.length * 0.3) {
      const combined = [...secondToLast, ...last];
      const half = Math.ceil(combined.length / 2);
      const balanced = [
        ...pages.slice(0, -2),
        combined.slice(0, half),
        combined.slice(half),
      ];
      // Ne garder que les pages non vides
      return balanced.filter((p) => p.length > 0);
    }

    return pages;
  }

  /** Convertit mm en pt */
  static mmToPt(mm: number): number {
    return mm * MM_TO_PT;
  }

  /** Retourne les dimensions [width, height] en mm selon orientation */
  static getPageDimensions(
    format: PageFormat,
    orientation: PageOrientation
  ): [number, number] {
    const [w, h] = PAGE_SIZES[format];
    return orientation === PageOrientation.LANDSCAPE ? [h, w] : [w, h];
  }
}
