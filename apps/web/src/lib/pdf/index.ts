/**
 * GESTMONEY — Moteur d'export PDF universel
 * index.ts — Point d'entrée public
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  GUIDE RAPIDE — Ajouter un export PDF en 5 minutes                     │
 * │                                                                         │
 * │  1. Importez exportToPdf et les types nécessaires :                     │
 * │       import { exportToPdf, ColumnType, ColumnPriority }                │
 * │         from '@/lib/pdf';                                               │
 * │                                                                         │
 * │  2. Définissez vos colonnes :                                           │
 * │       const colonnes: ColumnDefinition[] = [                            │
 * │         { key: 'id',      label: 'Référence', type: ColumnType.ID,     │
 * │           priority: ColumnPriority.REQUIRED },                          │
 * │         { key: 'nom',     label: 'Nom',       type: ColumnType.NAME }, │
 * │         { key: 'montant', label: 'Montant',   type: ColumnType.AMOUNT, │
 * │           align: 'right' },                                             │
 * │         { key: 'date',    label: 'Date',      type: ColumnType.DATE }, │
 * │         { key: 'statut',  label: 'Statut',    type: ColumnType.STATUS},│
 * │       ];                                                                │
 * │                                                                         │
 * │  3. Appelez exportToPdf :                                               │
 * │       exportToPdf({                                                     │
 * │         title: 'Transactions du mois',                                  │
 * │         columns: colonnes,                                              │
 * │         rows: data,           // Record<string, unknown>[]              │
 * │         options: {                                                      │
 * │           period: 'Juillet 2025',                                       │
 * │           company: 'Ma Société',                                        │
 * │           kpis: [                                                       │
 * │             { label: 'Total', value: '125 000 XOF', accent: 'green' }, │
 * │           ],                                                            │
 * │         },                                                              │
 * │       });                                                               │
 * │                                                                         │
 * │  4. C'est tout ! Le moteur choisit automatiquement :                    │
 * │       - orientation portrait / paysage                                  │
 * │       - taille de police adaptée                                        │
 * │       - largeur de chaque colonne                                       │
 * │       - pagination et rééquilibrage de la dernière page                 │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

// ---------------------------------------------------------------------------
// Exports publics
// ---------------------------------------------------------------------------

// Types et interfaces
export type {
  ColumnDefinition,
  CellStyle,
  DataRow,
  DocumentExportDefinition,
  DocumentLayoutAnalysis,
  ExportOptions,
  KpiDefinition,
  ResolvedLayout,
  ColumnWidthResult,
} from './types';

export {
  ColumnPriority,
  ColumnType,
  PageFormat,
  PageOrientation,
} from './types';

// Moteurs internes (pour usage avancé)
export { PdfLayoutEngine } from './PdfLayoutEngine';
export { ColumnWidthCalculator } from './ColumnWidthCalculator';
export { PdfDocumentRenderer } from './PdfDocumentRenderer';

// ---------------------------------------------------------------------------
// Fonction principale — c'est celle-ci que vous utilisez
// ---------------------------------------------------------------------------

import { ColumnType, ColumnPriority, DocumentExportDefinition } from './types';
import { PdfDocumentRenderer } from './PdfDocumentRenderer';

/**
 * Exporte les données en PDF via la boîte de dialogue d'impression du navigateur.
 *
 * Le moteur analyse automatiquement le contenu pour choisir la mise en page
 * optimale : orientation, format, polices, largeurs de colonnes, pagination.
 *
 * @param definition  Définition complète de l'export
 *
 * @example
 * exportToPdf({
 *   title: 'Rapport des paiements',
 *   columns: [
 *     { key: 'ref',     label: 'Référence', type: ColumnType.ID },
 *     { key: 'montant', label: 'Montant',   type: ColumnType.AMOUNT, align: 'right' },
 *     { key: 'date',    label: 'Date',      type: ColumnType.DATE },
 *     { key: 'statut',  label: 'Statut',    type: ColumnType.STATUS },
 *   ],
 *   rows: paiements,
 *   options: { period: 'Juillet 2025', company: 'IBIG Soft' },
 * });
 */
export function exportToPdf(definition: DocumentExportDefinition): void {
  // Validation minimale
  if (!definition.title?.trim()) {
    throw new Error('[exportToPdf] Le titre du document est obligatoire.');
  }
  if (!Array.isArray(definition.columns) || definition.columns.length === 0) {
    throw new Error('[exportToPdf] Au moins une colonne est requise.');
  }
  if (!Array.isArray(definition.rows)) {
    throw new Error('[exportToPdf] Les données (rows) doivent être un tableau.');
  }

  PdfDocumentRenderer.render(definition);
}

// ---------------------------------------------------------------------------
// Helpers prêts à l'emploi pour les modules GESTMONEY
// ---------------------------------------------------------------------------

/**
 * Colonnes prédéfinies pour les modules courants.
 * Importez et étendez selon vos besoins.
 *
 * @example
 * import { PRESET_COLUMNS } from '@/lib/pdf';
 * exportToPdf({ columns: PRESET_COLUMNS.transaction, ... });
 */
export const PRESET_COLUMNS = {
  /** Colonnes standard pour un tableau de transactions Mobile Money */
  transaction: [
    { key: 'reference',   label: 'Référence',   type: ColumnType.ID,     priority: ColumnPriority.REQUIRED, nowrap: true },
    { key: 'date',        label: 'Date',         type: ColumnType.DATE,   priority: ColumnPriority.REQUIRED },
    { key: 'expediteur',  label: 'Expéditeur',   type: ColumnType.NAME,   priority: ColumnPriority.HIGH },
    { key: 'destinataire',label: 'Destinataire', type: ColumnType.NAME,   priority: ColumnPriority.HIGH },
    { key: 'montant',     label: 'Montant (XOF)',type: ColumnType.AMOUNT, priority: ColumnPriority.REQUIRED, align: 'right' as const },
    { key: 'frais',       label: 'Frais',        type: ColumnType.AMOUNT, priority: ColumnPriority.MEDIUM,   align: 'right' as const },
    { key: 'statut',      label: 'Statut',       type: ColumnType.STATUS, priority: ColumnPriority.REQUIRED },
    { key: 'canal',       label: 'Canal',        type: ColumnType.CODE,   priority: ColumnPriority.LOW },
  ],

  /** Colonnes standard pour un tableau de comptes/clients */
  compte: [
    { key: 'id',          label: 'ID',           type: ColumnType.ID,     priority: ColumnPriority.REQUIRED, nowrap: true },
    { key: 'nom',         label: 'Nom',          type: ColumnType.NAME,   priority: ColumnPriority.REQUIRED },
    { key: 'telephone',   label: 'Téléphone',    type: ColumnType.PHONE,  priority: ColumnPriority.REQUIRED },
    { key: 'email',       label: 'Email',        type: ColumnType.EMAIL,  priority: ColumnPriority.MEDIUM },
    { key: 'solde',       label: 'Solde (XOF)',  type: ColumnType.AMOUNT, priority: ColumnPriority.REQUIRED, align: 'right' as const },
    { key: 'statut',      label: 'Statut',       type: ColumnType.STATUS, priority: ColumnPriority.REQUIRED },
    { key: 'dateCreation',label: 'Créé le',      type: ColumnType.DATE,   priority: ColumnPriority.LOW },
  ],

  /** Colonnes standard pour un rapport de licences/offres */
  licence: [
    { key: 'societe',     label: 'Société',      type: ColumnType.NAME,   priority: ColumnPriority.REQUIRED },
    { key: 'offre',       label: 'Offre',        type: ColumnType.TEXT,   priority: ColumnPriority.REQUIRED },
    { key: 'montant',     label: 'Montant',      type: ColumnType.AMOUNT, priority: ColumnPriority.REQUIRED, align: 'right' as const },
    { key: 'dateDebut',   label: 'Début',        type: ColumnType.DATE,   priority: ColumnPriority.HIGH },
    { key: 'dateFin',     label: 'Fin',          type: ColumnType.DATE,   priority: ColumnPriority.HIGH },
    { key: 'statut',      label: 'Statut',       type: ColumnType.STATUS, priority: ColumnPriority.REQUIRED },
  ],
} as const;

// ColumnType et ColumnPriority sont importés plus haut pour PRESET_COLUMNS
// et re-exportés via `export { ColumnType, ColumnPriority } from './types'`
