'use client';
// ============================================================
// COMPOSANT MONTANT DEVISE — GESTMONEY
// Affiche un montant avec tooltip de conversion multi-devise
// Usage : <MontantDevise montant={150000} devise="XOF" showConversion />
// ============================================================
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface TauxChange {
  deviseBase: string;
  deviseCible: string;
  taux: number;
}

// Cache module-level pour éviter des appels répétés
let _tauxCache: TauxChange[] | null = null;
let _tauxPromise: Promise<TauxChange[]> | null = null;

async function getTousTaux(): Promise<TauxChange[]> {
  if (_tauxCache) return _tauxCache;
  if (!_tauxPromise) {
    _tauxPromise = apiFetch<TauxChange[]>('/devises/taux')
      .then((data) => { _tauxCache = data; return data; })
      .catch(() => []);
  }
  return _tauxPromise;
}

function convertir(montant: number, deviseSource: string, deviseCible: string, taux: TauxChange[]): number | null {
  if (deviseSource === deviseCible) return montant;
  const direct = taux.find(
    (t) => t.deviseBase === deviseSource && t.deviseCible === deviseCible,
  );
  if (direct) return parseFloat((montant * direct.taux).toFixed(2));
  const inverse = taux.find(
    (t) => t.deviseBase === deviseCible && t.deviseCible === deviseSource,
  );
  if (inverse && inverse.taux !== 0)
    return parseFloat((montant / inverse.taux).toFixed(2));
  return null;
}

function formaterMontant(montant: number, devise: string): string {
  return `${montant.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${devise}`;
}

interface Props {
  montant: number;
  devise?: string;
  showConversion?: boolean;
  className?: string;
}

export function MontantDevise({ montant, devise = 'XOF', showConversion = false, className }: Props) {
  const [taux, setTaux] = useState<TauxChange[]>([]);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    if (showConversion) {
      getTousTaux().then(setTaux);
    }
  }, [showConversion]);

  const affichagePrincipal = formaterMontant(montant, devise);

  if (!showConversion) {
    return <span className={className}>{affichagePrincipal}</span>;
  }

  // Construire la liste de conversions pour le tooltip
  const autresDevises = ['EUR', 'USD', 'GBP'].filter((d) => d !== devise);
  const conversions = autresDevises
    .map((d) => {
      const val = convertir(montant, devise, d, taux);
      return val !== null ? formaterMontant(val, d) : null;
    })
    .filter(Boolean) as string[];

  const tooltipTexte = conversions.length > 0 ? `≈ ${conversions.join(' / ')}` : '';

  return (
    <span className={`relative inline-block ${className ?? ''}`}>
      <span
        className={tooltipTexte ? 'cursor-help underline decoration-dotted decoration-text-3' : ''}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        {affichagePrincipal}
      </span>
      {tooltipTexte && tooltipVisible && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50
                     whitespace-nowrap rounded-lg bg-gray-900 text-white text-xs px-2 py-1 shadow-lg"
        >
          {tooltipTexte}
        </span>
      )}
    </span>
  );
}

export default MontantDevise;
