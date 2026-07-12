// Utilitaire export CSV côté client — aucune dépendance externe

export interface CsvColonne<T> {
  titre: string;
  valeur: (row: T) => string | number;
}

export function exporterCsv<T>(donnees: T[], colonnes: CsvColonne<T>[], nomFichier: string): void {
  const entete = colonnes.map((c) => `"${c.titre}"`).join(';');
  const lignes = donnees.map((row) =>
    colonnes.map((c) => {
      const v = c.valeur(row);
      const s = String(v ?? '').replace(/"/g, '""');
      return `"${s}"`;
    }).join(';')
  );

  const bom = '﻿'; // BOM UTF-8 pour Excel
  const contenu = bom + [entete, ...lignes].join('\r\n');
  const blob = new Blob([contenu], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${nomFichier}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
