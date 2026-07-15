/**
 * GESTMONEY — Moteur d'export PDF universel
 * types.ts — Interfaces et énumérations partagées
 *
 * Pour ajouter un nouvel export en 5 minutes :
 *   1. Importez `exportToPdf` depuis `@/lib/pdf`
 *   2. Définissez vos colonnes avec `ColumnDefinition[]`
 *   3. Appelez `exportToPdf({ title, columns, rows, options })`
 *   C'est tout.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Types sémantiques de colonnes — pilotent la largeur et le formatage auto */
export enum ColumnType {
  /** Identifiant / référence courte (ex : GM-00123) */
  ID = 'id',
  /** Prénom, nom, raison sociale */
  NAME = 'name',
  /** Adresse e-mail */
  EMAIL = 'email',
  /** Numéro de téléphone / Mobile Money */
  PHONE = 'phone',
  /** Date ou datetime */
  DATE = 'date',
  /** Montant monétaire */
  AMOUNT = 'amount',
  /** Statut / état (actif, suspendu…) */
  STATUS = 'status',
  /** Texte long descriptif */
  DESCRIPTION = 'description',
  /** Code court (pays, devise, type…) */
  CODE = 'code',
  /** Booléen (oui/non) */
  BOOLEAN = 'boolean',
  /** Colonne générique sans contrainte particulière */
  TEXT = 'text',
}

/** Priorité d'affichage quand l'espace est insuffisant */
export enum ColumnPriority {
  /** Toujours visible même si la page déborde */
  REQUIRED = 1,
  /** Affiché par défaut, masqué si vraiment nécessaire */
  HIGH = 2,
  /** Affiché si l'espace le permet */
  MEDIUM = 3,
  /** Masqué en premier si la page est trop étroite */
  LOW = 4,
}

/** Format de page ISO */
export enum PageFormat {
  A4 = 'a4',
  A3 = 'a3',
  LETTER = 'letter',
}

/** Orientation de la page */
export enum PageOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

// ---------------------------------------------------------------------------
// Interfaces de définition d'export
// ---------------------------------------------------------------------------

/**
 * Définition d'une colonne du tableau PDF.
 *
 * @example
 * const col: ColumnDefinition = {
 *   key: 'montant',
 *   label: 'Montant (XOF)',
 *   type: ColumnType.AMOUNT,
 *   align: 'right',
 *   priority: ColumnPriority.REQUIRED,
 * };
 */
export interface ColumnDefinition {
  /** Clé dans l'objet de données (ex : 'montant', 'dateCreation') */
  key: string;
  /** Libellé affiché dans l'en-tête du tableau */
  label: string;
  /** Type sémantique — détermine les contraintes de largeur par défaut */
  type?: ColumnType;
  /** Priorité d'affichage quand l'espace manque */
  priority?: ColumnPriority;
  /** Jamais de retour à la ligne dans cette colonne */
  nowrap?: boolean;
  /** Facteur de flexibilité (>1 = colonne reçoit plus d'espace libre) */
  flex?: number;
  /** Largeur minimale en points PDF (72 pt = 1 inch ≈ 25.4 mm) */
  minWidth?: number;
  /** Largeur maximale en points PDF */
  maxWidth?: number;
  /** Alignement du contenu */
  align?: 'left' | 'center' | 'right';
  /** Formateur personnalisé — remplace la valeur brute de la cellule */
  format?: (value: unknown, row: DataRow) => string;
  /** Couleur de fond conditionnelle (ex : rouge si montant < 0) */
  cellStyle?: (value: unknown, row: DataRow) => Partial<CellStyle> | undefined;
}

/** Style optionnel d'une cellule */
export interface CellStyle {
  fillColor: [number, number, number]; // RGB
  textColor: [number, number, number]; // RGB
  fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic';
}

/** Ligne de données brute — peut contenir n'importe quel type */
export type DataRow = Record<string, unknown>;

/**
 * Indicateur clé de performance affiché au-dessus du tableau.
 *
 * @example
 * { label: 'Total transactions', value: '1 248', sub: '+12% ce mois' }
 */
export interface KpiDefinition {
  label: string;
  value: string | number;
  /** Sous-texte optionnel (variation, unité…) */
  sub?: string;
  /** Couleur d'accentuation du KPI ('green' | 'red' | 'yellow' | 'blue') */
  accent?: 'green' | 'red' | 'yellow' | 'blue' | 'neutral';
}

/**
 * Options de personnalisation de l'export.
 * Toutes les propriétés sont optionnelles — des valeurs sensées sont choisies
 * automatiquement si elles sont omises.
 */
export interface ExportOptions {
  /** Format de page (défaut : A4) */
  format?: PageFormat;
  /** Orientation (défaut : calculée automatiquement) */
  orientation?: PageOrientation;
  /** Nom du fichier téléchargé sans extension (défaut : titre normalisé) */
  filename?: string;
  /** Nom de la société / organisation */
  company?: string;
  /** Auteur du document */
  author?: string;
  /** Période couverte par le rapport (ex : 'Janvier – Juin 2025') */
  period?: string;
  /** Sous-titre du rapport */
  subtitle?: string;
  /** KPIs à afficher au-dessus du tableau */
  kpis?: KpiDefinition[];
  /** Afficher une ligne de totaux en pied de tableau */
  showTotals?: boolean;
  /** Colonnes à inclure dans le total (type AMOUNT uniquement) */
  totalColumns?: string[];
  /** Marges en mm [top, right, bottom, left] — calculées auto si omis */
  margins?: [number, number, number, number];
  /** Taille de police corps — calculée auto si omis */
  fontSize?: number;
  /** Hauteur de ligne en mm — calculée auto si omis */
  rowHeight?: number;
  /** Ouvrir un aperçu dans un onglet plutôt que télécharger directement */
  previewInTab?: boolean;
}

/**
 * Définition complète d'un export PDF.
 * C'est l'unique objet que vous passez à `exportToPdf()`.
 *
 * @example
 * exportToPdf({
 *   title: 'Liste des transactions',
 *   columns: colonnes,
 *   rows: donnees,
 *   options: { period: 'Juillet 2025', company: 'IBIG Soft' },
 * });
 */
export interface DocumentExportDefinition {
  /** Titre principal du rapport */
  title: string;
  /** Définitions des colonnes du tableau */
  columns: ColumnDefinition[];
  /** Données à afficher */
  rows: DataRow[];
  /** Options de mise en page et de style */
  options?: ExportOptions;
}

// ---------------------------------------------------------------------------
// Interfaces internes du moteur de mise en page
// ---------------------------------------------------------------------------

/** Analyse du contenu produite par PdfLayoutEngine */
export interface DocumentLayoutAnalysis {
  /** Nombre de colonnes */
  columnCount: number;
  /** Largeur totale estimée du contenu (somme des min-widths) en pt */
  estimatedContentWidthPt: number;
  /** Largeur maximale estimée du contenu (somme des max-widths) en pt */
  maxContentWidthPt: number;
  /** Longueur maximale d'une valeur par colonne (percentile 90, en caractères) */
  contentP90ByColumn: Record<string, number>;
  /** Nombre de lignes de données */
  rowCount: number;
  /** Ratio largeur_contenu / largeur_page_A4_portrait */
  widthPressure: number;
  /** Orientation recommandée */
  recommendedOrientation: PageOrientation;
  /** Format recommandé */
  recommendedFormat: PageFormat;
}

/** Résultat du calcul de largeur de colonne */
export interface ColumnWidthResult {
  key: string;
  label: string;
  widthPt: number;
  align: 'left' | 'center' | 'right';
  nowrap: boolean;
  type: ColumnType;
}

/** Paramètres de mise en page résolus */
export interface ResolvedLayout {
  orientation: PageOrientation;
  format: PageFormat;
  /** Marges [top, right, bottom, left] en mm */
  margins: [number, number, number, number];
  /** Taille police corps en pt */
  fontSize: number;
  /** Taille police en-tête colonne en pt */
  headerFontSize: number;
  /** Hauteur de ligne en mm */
  rowHeightMm: number;
  /** Largeur utilisable en mm (page - marges gauche/droite) */
  usableWidthMm: number;
  /** Largeur utilisable en pt */
  usableWidthPt: number;
  /** Hauteur utilisable en mm (page - marges haut/bas - header/footer) */
  usableHeightMm: number;
  /** Largeurs de colonnes calculées */
  columns: ColumnWidthResult[];
}
