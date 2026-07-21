'use client';
// ============================================================
// GmExportMenu — menu d'export unifié CSV / Excel / PDF
//
// Un seul jeu de colonnes (`{ titre, valeur, align? }`) alimente les trois
// formats via les libs maison : exporterCsv, exporterXlsx (SpreadsheetML) et
// exporterPdf (window.print). Se pose dans la barre d'actions d'une page à
// données à la place de l'ancien bouton « Export CSV » unique.
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { exporterCsv } from '@/lib/exportCsv';
import { exporterPdf, exporterXlsx, ColonnePdf } from '@/lib/exportPdf';

export interface ColonneExport<T> {
  titre: string;
  valeur: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
}

type Format = 'csv' | 'excel' | 'pdf';

interface GmExportMenuProps<T> {
  /** Titre du document (en-tête PDF/Excel + nom de fichier par défaut). */
  titre: string;
  /** Les lignes à exporter (déjà filtrées/mappées comme à l'écran). */
  donnees: T[];
  /** Colonnes : réutilise celles de l'export CSV existant. */
  colonnes: ColonneExport<T>[];
  nomFichier?: string;
  periode?: string;
  /** KPIs optionnels affichés en tête du PDF. */
  kpis?: { label: string; valeur: string; sous?: string }[];
  /** Libellé du bouton (par défaut « Exporter »). */
  label?: string;
  /** Formats proposés (par défaut les trois). */
  formats?: Format[];
}

export function GmExportMenu<T>({
  titre,
  donnees,
  colonnes,
  nomFichier,
  periode,
  kpis,
  label = 'Exporter',
  formats = ['csv', 'excel', 'pdf'],
}: GmExportMenuProps<T>) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const surClic = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false);
    };
    const surEchap = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false);
    document.addEventListener('mousedown', surClic);
    document.addEventListener('keydown', surEchap);
    return () => {
      document.removeEventListener('mousedown', surClic);
      document.removeEventListener('keydown', surEchap);
    };
  }, [ouvert]);

  const fichier = nomFichier ?? titre.toLowerCase().replace(/\s+/g, '_');
  const vide = !donnees || donnees.length === 0;

  // ColonnePdf attend `(row: Record<string, unknown>)` — on réadapte le typage.
  const colPdf: ColonnePdf[] = colonnes.map((c) => ({
    titre: c.titre,
    align: c.align,
    valeur: (row) => c.valeur(row as T),
  }));
  const opts = { titre, periode, nomFichier: fichier };

  const exporter = (f: Format) => {
    setOuvert(false);
    if (vide) return;
    if (f === 'csv') exporterCsv(donnees, colonnes, fichier);
    else if (f === 'excel') exporterXlsx(donnees as Record<string, unknown>[], colPdf, opts);
    else exporterPdf(donnees as Record<string, unknown>[], colPdf, opts, kpis);
  };

  const tousFormats: { f: Format; icone: string; libelle: string }[] = [
    { f: 'csv', icone: '📄', libelle: 'CSV' },
    { f: 'excel', icone: '📊', libelle: 'Excel' },
    { f: 'pdf', icone: '📕', libelle: 'PDF' },
  ];
  const items = tousFormats.filter((i) => formats.includes(i.f));

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="gm-btn gm-btn-export"
        onClick={() => setOuvert((o) => !o)}
        disabled={vide}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        title={vide ? 'Aucune donnée à exporter' : label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: 600,
          borderRadius: 8,
          border: '1px solid #d1d5db',
          background: '#fff',
          color: '#111',
          cursor: vide ? 'not-allowed' : 'pointer',
          opacity: vide ? 0.5 : 1,
        }}
      >
        📥 {label} <span style={{ fontSize: 10 }}>▾</span>
      </button>

      {ouvert && !vide && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 50,
            minWidth: 156,
            overflow: 'hidden',
          }}
        >
          {items.map((i) => (
            <button
              key={i.f}
              type="button"
              role="menuitem"
              onClick={() => exporter(i.f)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '9px 14px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                color: '#111',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span aria-hidden="true">{i.icone}</span> {i.libelle}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
