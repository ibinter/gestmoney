'use client';
// ============================================================
// GraphiqueRepartitionTypes — Barres horizontales par type
// Répartition des transactions par type avec % et volume
// ============================================================
import React from 'react';
import type { TypeStat } from '@/hooks/useAnalytics';

interface Props {
  data: TypeStat[];
}

const COULEURS: Record<string, string> = {
  DEPOT: '#009E00',
  RETRAIT: '#F5B800',
  TRANSFERT: '#1DA7E8',
  PAIEMENT: '#9333ea',
  CASH_IN: '#00A651',
  CASH_OUT: '#E60000',
};

function getCouleur(type: string): string {
  return COULEURS[type.toUpperCase()] ?? '#6b7280';
}

function libelleType(type: string): string {
  const labels: Record<string, string> = {
    DEPOT: 'Dépôt',
    RETRAIT: 'Retrait',
    TRANSFERT: 'Transfert',
    PAIEMENT: 'Paiement',
    CASH_IN: 'Cash In',
    CASH_OUT: 'Cash Out',
  };
  return labels[type.toUpperCase()] ?? type;
}

export function GraphiqueRepartitionTypes({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const maxVolume = Math.max(...data.map((d) => d.volume), 1);

  return (
    <div className="gm-section-card" style={{ marginBottom: 24 }}>
      <div className="gm-section-head">
        <div>
          <div className="gm-section-title">Répartition par type d'opération</div>
          <div className="gm-section-sub">30 derniers jours · volume en XOF</div>
        </div>
      </div>
      <div style={{ padding: '8px 20px 20px' }}>
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const barPct = Math.round((item.volume / maxVolume) * 100);
          const couleur = getCouleur(item.type);
          return (
            <div key={item.type} style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-block', width: 10, height: 10,
                    borderRadius: '50%', background: couleur, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gm-text)' }}>
                    {libelleType(item.type)}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: couleur,
                    background: `${couleur}18`,
                    padding: '1px 7px', borderRadius: 20,
                  }}>
                    {pct}%
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gm-text)', fontVariantNumeric: 'tabular-nums' }}>
                    {item.volume.toLocaleString('fr-FR')} XOF
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>
                    {item.count} transactions
                  </div>
                </div>
              </div>
              <div style={{
                height: 8, borderRadius: 4,
                background: 'var(--gm-border, #f0f0f0)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${barPct}%`,
                  background: couleur,
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
