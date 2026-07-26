'use client';
// ============================================================
// TableauTopAgents — Top 5 agents par volume (30 jours)
// Rang | Nom | Agence | Nb tx | Volume | Barre progression
// ============================================================
import React from 'react';
import type { TopAgent } from '@/hooks/useAnalytics';
import { GmTableWrap } from '@/components/gm';

interface Props {
  agents: TopAgent[];
}

const MEDAILLES = ['🥇', '🥈', '🥉', '4', '5'];

export function TableauTopAgents({ agents }: Props) {
  const maxVolume = Math.max(...agents.map((a) => a.volume), 1);

  if (agents.length === 0) {
    return (
      <div className="gm-section-card" style={{ marginBottom: 24 }}>
        <div className="gm-section-head">
          <div className="gm-section-title">Top agents — 30 derniers jours</div>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--gm-text-2)' }}>
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  return (
    <div className="gm-section-card" style={{ marginBottom: 24 }}>
      <div className="gm-section-head">
        <div>
          <div className="gm-section-title">Top agents — 30 derniers jours</div>
          <div className="gm-section-sub">Classés par volume traité</div>
        </div>
      </div>
      <GmTableWrap>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Agent</th>
                <th>Agence</th>
                <th style={{ textAlign: 'right' }}>Transactions</th>
                <th style={{ textAlign: 'right' }}>Volume</th>
                <th style={{ minWidth: 120 }}>Performance</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, i) => {
                const barPct = Math.round((agent.volume / maxVolume) * 100);
                return (
                  <tr key={i}>
                    <td style={{ fontSize: 18, textAlign: 'center' }}>
                      {MEDAILLES[i] ?? String(i + 1)}
                    </td>
                    <td>
                      <strong style={{ fontSize: 13 }}>{agent.nom}</strong>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                      {agent.agence}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 600 }}>
                      {agent.nbTransactions}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 700, color: 'var(--gm-primary, #009E00)' }}>
                      {agent.volume.toLocaleString('fr-FR')}
                      <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--gm-text-2)', marginLeft: 3 }}>XOF</span>
                    </td>
                    <td>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <div style={{
                          flex: 1, height: 6, borderRadius: 3,
                          background: 'var(--gm-border, #f0f0f0)', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', width: `${barPct}%`,
                            background: 'var(--gm-primary, #009E00)',
                            borderRadius: 3,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--gm-text-2)', minWidth: 28, textAlign: 'right' }}>
                          {barPct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GmTableWrap>
    </div>
  );
}
