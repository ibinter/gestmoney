/**
 * GESTMONEY — Moteur d'export PDF universel
 * ColumnWidthCalculator.ts
 *
 * Calcule la largeur optimale de chaque colonne en tenant compte :
 *   - du type sémantique (id, name, email, amount…)
 *   - du contenu réel (percentile 90 des valeurs)
 *   - des contraintes min/max définies par la colonne
 *   - du facteur flex pour la distribution de l'espace restant
 *
 * Unité : points PDF (1 pt = 1/72 inch ≈ 0.353 mm)
 */

import {
  ColumnDefinition,
  ColumnType,
  ColumnWidthResult,
  DataRow,
} from './types';

// ---------------------------------------------------------------------------
// Constantes par type sémantique
// Toutes les valeurs sont en points PDF.
// ---------------------------------------------------------------------------

interface TypeConstraint {
  min: number;
  max: number;
  flex: number;
  align: 'left' | 'center' | 'right';
  nowrap: boolean;
}

const TYPE_CONSTRAINTS: Record<ColumnType, TypeConstraint> = {
  [ColumnType.ID]: {
    min: 60,
    max: 100,
    flex: 1,
    align: 'left',
    nowrap: true,
  },
  [ColumnType.NAME]: {
    min: 80,
    max: 180,
    flex: 2.5,
    align: 'left',
    nowrap: false,
  },
  [ColumnType.EMAIL]: {
    min: 130,
    max: 250,
    flex: 3,
    align: 'left',
    nowrap: false,
  },
  [ColumnType.PHONE]: {
    min: 85,
    max: 120,
    flex: 1,
    align: 'left',
    nowrap: true,
  },
  [ColumnType.DATE]: {
    min: 75,
    max: 120,
    flex: 1,
    align: 'center',
    nowrap: true,
  },
  [ColumnType.AMOUNT]: {
    min: 65,
    max: 110,
    flex: 1,
    align: 'right',
    nowrap: true,
  },
  [ColumnType.STATUS]: {
    min: 55,
    max: 90,
    flex: 1,
    align: 'center',
    nowrap: true,
  },
  [ColumnType.DESCRIPTION]: {
    min: 150,
    max: 350,
    flex: 4,
    align: 'left',
    nowrap: false,
  },
  [ColumnType.CODE]: {
    min: 40,
    max: 70,
    flex: 1,
    align: 'center',
    nowrap: true,
  },
  [ColumnType.BOOLEAN]: {
    min: 40,
    max: 60,
    flex: 1,
    align: 'center',
    nowrap: true,
  },
  [ColumnType.TEXT]: {
    min: 70,
    max: 200,
    flex: 2,
    align: 'left',
    nowrap: false,
  },
};

/** Largeur approximative d'un caractère en pt à 9pt (calibrage Inter/Helvetica) */
const CHAR_WIDTH_PT = 5.2;

/** Padding interne de la cellule (gauche + droite) en pt */
const CELL_PADDING_PT = 8;

// ---------------------------------------------------------------------------
// Fonctions utilitaires
// ---------------------------------------------------------------------------

/**
 * Calcule le percentile `p` d'un tableau de nombres.
 * Utilisé pour mesurer le contenu réel sans être biaisé par les outliers.
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

/**
 * Estime la largeur en pt nécessaire pour afficher `text` en police 9pt.
 */
function estimateTextWidthPt(text: string): number {
  return text.length * CHAR_WIDTH_PT + CELL_PADDING_PT;
}

/**
 * Formate une valeur brute en chaîne lisible pour l'estimation de largeur.
 * N'applique pas de formatage métier complet — sert uniquement à mesurer.
 */
function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') return value.toLocaleString('fr-FR');
  return String(value);
}

// ---------------------------------------------------------------------------
// Classe principale
// ---------------------------------------------------------------------------

export class ColumnWidthCalculator {
  /**
   * Calcule les largeurs optimales pour une liste de colonnes.
   *
   * @param columns  Définitions des colonnes
   * @param rows     Données réelles (utilisées pour mesurer le contenu)
   * @param usableWidthPt  Largeur utilisable de la page en pt
   * @returns        Tableau de résultats prêt à passer au renderer
   */
  static calculate(
    columns: ColumnDefinition[],
    rows: DataRow[],
    usableWidthPt: number
  ): ColumnWidthResult[] {
    // 1. Résoudre les contraintes de chaque colonne
    const resolved = columns.map((col) => this.resolveConstraints(col));

    // 2. Mesurer le contenu réel (percentile 90)
    const contentWidths = this.measureContent(columns, rows);

    // 3. Calculer les largeurs initiales (basées sur le contenu + min/max)
    const initialWidths = resolved.map((r, i) => {
      const col = columns[i];
      const headerWidth = estimateTextWidthPt(col.label) + 4; // petit padding sup pour bold
      const contentWidth = contentWidths[col.key] ?? r.min;
      // La largeur initiale est le max(header, contenu_p90) clampé entre min et max
      return Math.min(r.max, Math.max(r.min, headerWidth, contentWidth));
    });

    // 4. Vérifier si on tient dans l'espace disponible
    const totalInitial = initialWidths.reduce((s, w) => s + w, 0);

    let finalWidths: number[];

    if (totalInitial <= usableWidthPt) {
      // Cas A : on a de l'espace libre → le distribuer selon le flex
      finalWidths = this.distributeExtraSpace(
        initialWidths,
        resolved,
        usableWidthPt - totalInitial
      );
    } else {
      // Cas B : on déborde → réduire les colonnes flexibles
      finalWidths = this.shrinkToFit(
        initialWidths,
        resolved,
        usableWidthPt
      );
    }

    // 5. Construire les résultats
    return columns.map((col, i) => {
      const r = resolved[i];
      return {
        key: col.key,
        label: col.label,
        widthPt: Math.round(finalWidths[i]),
        align: col.align ?? r.align,
        nowrap: col.nowrap ?? r.nowrap,
        type: col.type ?? ColumnType.TEXT,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Méthodes privées
  // ---------------------------------------------------------------------------

  /** Fusionne les contraintes du type sémantique avec les overrides de la colonne */
  private static resolveConstraints(col: ColumnDefinition): TypeConstraint {
    const base = TYPE_CONSTRAINTS[col.type ?? ColumnType.TEXT];
    return {
      min: col.minWidth ?? base.min,
      max: col.maxWidth ?? base.max,
      flex: col.flex ?? base.flex,
      align: col.align ?? base.align,
      nowrap: col.nowrap ?? base.nowrap,
    };
  }

  /**
   * Mesure la largeur au percentile 90 du contenu de chaque colonne.
   * Limite l'échantillon aux 500 premières lignes pour la performance.
   */
  private static measureContent(
    columns: ColumnDefinition[],
    rows: DataRow[]
  ): Record<string, number> {
    const sample = rows.slice(0, 500);
    const result: Record<string, number> = {};

    for (const col of columns) {
      const widths: number[] = sample.map((row) => {
        const raw = row[col.key];
        const str = col.format ? col.format(raw, row) : toDisplayString(raw);
        return estimateTextWidthPt(str);
      });
      result[col.key] = percentile(widths, 90);
    }

    return result;
  }

  /**
   * Distribue l'espace libre entre les colonnes selon leur facteur flex.
   * Une colonne déjà à son max ne reçoit pas de flex supplémentaire.
   */
  private static distributeExtraSpace(
    widths: number[],
    constraints: TypeConstraint[],
    extra: number
  ): number[] {
    const result = [...widths];
    let remaining = extra;
    let iterations = 0;

    while (remaining > 0.5 && iterations < 10) {
      iterations++;
      // Colonnes capables de recevoir plus d'espace
      const eligible = constraints
        .map((c, i) => ({ i, c, gap: c.max - result[i] }))
        .filter((e) => e.gap > 0);

      if (eligible.length === 0) break;

      const totalFlex = eligible.reduce((s, e) => s + e.c.flex, 0);
      let distributed = 0;

      for (const e of eligible) {
        const share = (e.c.flex / totalFlex) * remaining;
        const actual = Math.min(share, e.gap);
        result[e.i] += actual;
        distributed += actual;
      }

      remaining -= distributed;
    }

    return result;
  }

  /**
   * Réduit les colonnes pour tenir dans l'espace disponible.
   * Les colonnes avec le flex le plus élevé réduisent en premier.
   * Les colonnes à leur min ne réduisent plus.
   */
  private static shrinkToFit(
    widths: number[],
    constraints: TypeConstraint[],
    target: number
  ): number[] {
    const result = [...widths];
    let overflow = result.reduce((s, w) => s + w, 0) - target;
    let iterations = 0;

    while (overflow > 0.5 && iterations < 20) {
      iterations++;
      const reducible = constraints
        .map((c, i) => ({ i, c, gap: result[i] - c.min }))
        .filter((e) => e.gap > 0);

      if (reducible.length === 0) break;

      const totalFlex = reducible.reduce((s, e) => s + e.c.flex, 0);
      let reduced = 0;

      for (const e of reducible) {
        const share = (e.c.flex / totalFlex) * overflow;
        const actual = Math.min(share, e.gap);
        result[e.i] -= actual;
        reduced += actual;
      }

      overflow -= reduced;
    }

    return result;
  }
}
