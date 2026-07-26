'use client';
// ============================================================
// AlertesFloatSection — Agents avec float sous le seuil
// Badge rouge + bouton "Recharger" → /dashboard/float
// ============================================================
import React from 'react';
import { useRouter } from 'next/navigation';
import type { AlerteFloat } from '@/hooks/useAnalytics';

interface Props {
  alertes: AlerteFloat[];
}

export function AlertesFloatSection({ alertes }: Props) {
  const router = useRouter();

  if (alertes.length === 0) {
    return (
      <div className="gm-section-card" style={{ marginBottom: 24 }}>
        <div className="gm-section-head">
          <div>
            <div className="gm-section-title">Alertes float</div>
            <div className="gm-section-sub">Agents dont le float est sous le seuil minimum</div>
          </div>
        </div>
        <div style={{
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 10,
          color: 'var(--gm-success, #009E00)',
          fontSize: 13,
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <span>Tous les agents ont un float suffisant.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="gm-section-card" style={{ marginBottom: 24 }}>
      <div className="gm-section-head">
        <div>
          <div className="gm-section-title">
            Alertes float
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              marginLeft: 10,
              background: '#fee2e2', color: '#dc2626',
              fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 20,
            }}>
              {alertes.length} agent{alertes.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="gm-section-sub">Agents dont le float est sous le seuil minimum</div>
        </div>
        <button
          onClick={() => router.push('/dashboard/float')}
          style={{
            padding: '7px 16px', borderRadius: 9,
            background: 'var(--gm-primary, #009E00)', color: '#fff',
            fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Gérer les floats
        </button>
      </div>
      <div style={{ padding: '0 12px 16px' }}>
        {alertes.map((alerte, i) => {
          const pct = alerte.seuil > 0 ? Math.round((alerte.balance / alerte.seuil) * 100) : 0;
          const critique = pct < 30;
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 12,
                padding: '12px 16px',
                margin: '8px 0',
                background: critique ? '#fff5f5' : '#fffbf0',
                border: `1.5px solid ${critique ? '#fecaca' : '#fde68a'}`,
                borderRadius: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gm-text)' }}>
                    {alerte.agentNom}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                    {alerte.agenceNom}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 15, fontWeight: 800,
                    color: critique ? '#dc2626' : '#d97706',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {alerte.balance.toLocaleString('fr-FR')} XOF
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>
                    Seuil : {alerte.seuil.toLocaleString('fr-FR')} XOF · {pct}%
                  </div>
                </div>
                <button
                  onClick={() => router.push('/dashboard/float')}
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    background: critique ? '#dc2626' : '#d97706',
                    color: '#fff',
                    fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}
                >
                  Recharger
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
