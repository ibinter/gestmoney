'use client';
// ============================================================
// SectionAnalytiques — Conteneur principal des graphiques
// Chargé de manière indépendante (Suspense-like via état local)
// Visible uniquement pour ADMIN / SUPER_ADMIN / MANAGER
// ============================================================
import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { GraphiqueTransactions } from './GraphiqueTransactions';
import { GraphiqueRepartitionTypes } from './GraphiqueRepartitionTypes';
import { TableauTopAgents } from './TableauTopAgents';
import { AlertesFloatSection } from './AlertesFloatSection';

function SkeletonGraphique({ hauteur = 200 }: { hauteur?: number }) {
  return (
    <div
      className="gm-section-card"
      style={{
        marginBottom: 24,
        height: hauteur,
        background: 'linear-gradient(90deg, var(--gm-border, #f0f0f0) 25%, var(--gm-surface, #fafafa) 50%, var(--gm-border, #f0f0f0) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
        borderRadius: 16,
      }}
    />
  );
}

export function SectionAnalytiques() {
  const { data, isLoading, isMock, refresh } = useAnalytics();

  if (isLoading) {
    return (
      <div style={{ marginTop: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gm-text)', margin: 0 }}>
            📊 Analytiques — 30 derniers jours
          </h2>
        </div>
        <SkeletonGraphique hauteur={260} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <SkeletonGraphique hauteur={200} />
          <SkeletonGraphique hauteur={200} />
        </div>
        <SkeletonGraphique hauteur={160} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ marginTop: 24 }}>
      {/* En-tête de section */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gm-text)', margin: 0 }}>
          📊 Analytiques — 30 derniers jours
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMock && (
            <span style={{
              fontSize: 11, color: 'var(--gm-warning, #d97706)',
              background: '#fffbf0', padding: '2px 10px',
              borderRadius: 20, border: '1px solid #fde68a',
            }}>
              Demo
            </span>
          )}
          <button
            onClick={() => refresh()}
            style={{
              padding: '5px 12px', borderRadius: 8,
              border: '1.5px solid var(--gm-border, #e5e7eb)',
              background: 'transparent', color: 'var(--gm-text-2)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Graphique courbe transactions 30 jours */}
      <GraphiqueTransactions data={data.transactionsParJour} />

      {/* Deux colonnes : types + top agents */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <GraphiqueRepartitionTypes data={data.transactionsParType} />
        <TableauTopAgents agents={data.topAgents} />
      </div>

      {/* Alertes float */}
      <AlertesFloatSection alertes={data.alertesFloat} />
    </div>
  );
}
