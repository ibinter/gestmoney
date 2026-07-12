'use client';
// ============================================================
// COMPOSANT TABLE — GESTMONEY
// Avec tri, sélection multiple, état vide
// ============================================================
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Colonne<T> {
  key: keyof T | string;
  titre: string;
  rendu?: (valeur: unknown, ligne: T) => React.ReactNode;
  triable?: boolean;
  largeur?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T extends { id: string }> {
  colonnes: Colonne<T>[];
  donnees: T[];
  loading?: boolean;
  selectionnable?: boolean;
  selectionnees?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (ligne: T) => void;
  messageVide?: string;
}

export function Table<T extends { id: string }>({
  colonnes,
  donnees,
  loading = false,
  selectionnable = false,
  selectionnees = [],
  onSelectionChange,
  onRowClick,
  messageVide = 'Aucune donnée disponible',
}: TableProps<T>) {
  const [triColonne, setTriColonne] = useState<string | null>(null);
  const [triDirection, setTriDirection] = useState<'asc' | 'desc'>('asc');

  // Gestion du tri
  const handleTri = (key: string) => {
    if (triColonne === key) {
      setTriDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setTriColonne(key);
      setTriDirection('asc');
    }
  };

  // Sélection tout
  const toggleTout = () => {
    if (selectionnees.length === donnees.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(donnees.map((d) => d.id));
    }
  };

  const toggleLigne = (id: string) => {
    if (selectionnees.includes(id)) {
      onSelectionChange?.(selectionnees.filter((s) => s !== id));
    } else {
      onSelectionChange?.([...selectionnees, id]);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        {/* En-tête */}
        <thead>
          <tr className="bg-surface border-b border-gray-100">
            {selectionnable && (
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectionnees.length === donnees.length && donnees.length > 0}
                  onChange={toggleTout}
                  className="rounded accent-primary"
                />
              </th>
            )}
            {colonnes.map((col) => (
              <th
                key={String(col.key)}
                className={clsx(
                  'px-4 py-3 font-semibold text-gray-600 whitespace-nowrap',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  col.triable && 'cursor-pointer select-none hover:text-text-main',
                  col.largeur
                )}
                style={col.largeur ? { width: col.largeur } : undefined}
                onClick={() => col.triable && handleTri(String(col.key))}
              >
                <div className={clsx('flex items-center gap-1', col.align === 'right' && 'justify-end', col.align === 'center' && 'justify-center')}>
                  {col.titre}
                  {col.triable && (
                    <span className="text-gray-400">
                      {triColonne === String(col.key) ? (
                        triDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ChevronsUpDown size={14} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Corps */}
        <tbody className="bg-white divide-y divide-gray-50">
          {loading ? (
            // Skeleton loading
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {selectionnable && <td className="px-4 py-3"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></td>}
                {colonnes.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : donnees.length === 0 ? (
            <tr>
              <td colSpan={colonnes.length + (selectionnable ? 1 : 0)} className="px-4 py-12 text-center text-gray-500">
                {messageVide}
              </td>
            </tr>
          ) : (
            donnees.map((ligne) => (
              <tr
                key={ligne.id}
                className={clsx(
                  'hover:bg-surface/50 transition-colors',
                  onRowClick && 'cursor-pointer',
                  selectionnees.includes(ligne.id) && 'bg-primary/5'
                )}
                onClick={() => onRowClick?.(ligne)}
              >
                {selectionnable && (
                  <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleLigne(ligne.id); }}>
                    <input type="checkbox" checked={selectionnees.includes(ligne.id)} onChange={() => toggleLigne(ligne.id)} className="rounded accent-primary" />
                  </td>
                )}
                {colonnes.map((col) => {
                  const valeur = (ligne as Record<string, unknown>)[String(col.key)];
                  return (
                    <td
                      key={String(col.key)}
                      className={clsx(
                        'px-4 py-3 text-text-main',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      )}
                    >
                      {col.rendu ? col.rendu(valeur, ligne) : String(valeur ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
