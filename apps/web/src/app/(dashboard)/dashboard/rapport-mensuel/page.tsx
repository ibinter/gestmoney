'use client';
// ============================================================
// RAPPORT MENSUEL — GESTMONEY
// Graphiques comparatifs, tendances et analyse des performances
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { GmPageHeader, GmButton } from '@/components/gm';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatMois {
  moisActuel: number;
  moisPrecedent: number;
  variation: number;
  tendance: 'hausse' | 'baisse' | 'stable';
}

interface Comparaison {
  transactions: StatMois;
  volume: StatMois;
  commissions: StatMois;
  nouveauxClients: StatMois;
  topOperateur: string;
  topAgent: { nom: string; volume: number };
  floatMoyen: number;
}

interface Evolution {
  mois: string;
  transactions: number;
  volume: number;
  commissions: number;
  clients: number;
}

interface StatOperateur {
  operateur: string;
  transactions: number;
  volume: number;
  partPourcentage: number;
  evolution: number;
}

interface PerfAgence {
  agence: { id: string; nom: string };
  transactions: number;
  volume: number;
  agents: number;
  floatMoyen: number;
  rang: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('fr-FR');
}

function fmtM(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return fmt(n);
}

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const COULEURS_OP = ['#009E00', '#F5B800', '#1DA7E8', '#FF6B00', '#8B5CF6', '#EF4444'];

// ─── KPI Card avec flèche de tendance ─────────────────────────────────────────

function KpiCard({
  titre,
  valeur,
  variation,
  tendance,
  icone,
  unite = '',
}: {
  titre: string;
  valeur: string;
  variation: number;
  tendance: 'hausse' | 'baisse' | 'stable';
  icone: string;
  unite?: string;
}) {
  const couleur = tendance === 'hausse' ? '#16a34a' : tendance === 'baisse' ? '#dc2626' : '#6b7280';
  const fleche  = tendance === 'hausse' ? '▲' : tendance === 'baisse' ? '▼' : '→';

  return (
    <div style={{
      background: 'var(--gm-surface)',
      border: '1.5px solid var(--gm-border)',
      borderRadius: 14,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{icone}</span>
        <span style={{ fontSize: 13, color: 'var(--gm-text-2)', fontWeight: 500 }}>{titre}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--gm-text)', fontVariantNumeric: 'tabular-nums' }}>
        {valeur}{unite && <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4, color: 'var(--gm-text-2)' }}>{unite}</span>}
      </div>
      <div style={{ fontSize: 13, color: couleur, fontWeight: 600 }}>
        {fleche} {variation >= 0 ? '+' : ''}{variation.toFixed(1)}% <span style={{ fontWeight: 400, color: 'var(--gm-text-2)' }}>vs mois précédent</span>
      </div>
    </div>
  );
}

// ─── Tooltip customisé ────────────────────────────────────────────────────────

function TooltipCustom({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--gm-surface)',
      border: '1px solid var(--gm-border)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      boxShadow: '0 4px 16px rgba(0,0,0,.1)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name} : <strong>{typeof p.value === 'number' && p.name?.toLowerCase().includes('volume')
            ? `${fmtM(p.value)} XOF`
            : fmt(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ h = 200 }: { h?: number }) {
  return (
    <div style={{
      height: h,
      background: 'linear-gradient(90deg, var(--gm-border) 25%, var(--gm-surface) 50%, var(--gm-border) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      borderRadius: 14,
    }} />
  );
}

// ─── Sélecteur mois/année ─────────────────────────────────────────────────────

function SelecteurPeriode({
  mois, annee, onChange,
}: {
  mois: number; annee: number;
  onChange: (m: number, a: number) => void;
}) {
  const now = new Date();
  const annees = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <select
        value={mois}
        onChange={(e) => onChange(parseInt(e.target.value, 10), annee)}
        style={{
          fontSize: 13, padding: '6px 10px', borderRadius: 8,
          border: '1.5px solid var(--gm-border)',
          background: 'var(--gm-bg)', color: 'var(--gm-text-1)',
          cursor: 'pointer',
        }}
      >
        {MOIS_LABELS.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={annee}
        onChange={(e) => onChange(mois, parseInt(e.target.value, 10))}
        style={{
          fontSize: 13, padding: '6px 10px', borderRadius: 8,
          border: '1.5px solid var(--gm-border)',
          background: 'var(--gm-bg)', color: 'var(--gm-text-1)',
          cursor: 'pointer',
        }}
      >
        {annees.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ titre, sous, children }: { titre: string; sous?: string; children: React.ReactNode }) {
  return (
    <div className="gm-section-card" style={{ marginBottom: 24 }}>
      <div className="gm-section-head">
        <div>
          <div className="gm-section-title">{titre}</div>
          {sous && <div className="gm-section-sub">{sous}</div>}
        </div>
      </div>
      <div style={{ padding: '8px 20px 20px' }}>{children}</div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function RapportMensuelPage() {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());

  const [comparaison, setComparaison] = useState<Comparaison | null>(null);
  const [evolution, setEvolution]     = useState<Evolution[]>([]);
  const [operateurs, setOperateurs]   = useState<StatOperateur[]>([]);
  const [agences, setAgences]         = useState<PerfAgence[]>([]);
  const [loading, setLoading]         = useState(true);
  const [erreur, setErreur]           = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const [comp, evo, ops, ags] = await Promise.all([
        api.get(`/analytics/comparaison?mois=${mois}&annee=${annee}`).then((r) => r.data),
        api.get(`/analytics/evolution-6-mois`).then((r) => r.data),
        api.get(`/analytics/par-operateur?mois=${mois}&annee=${annee}`).then((r) => r.data),
        api.get(`/analytics/performance-agences?mois=${mois}&annee=${annee}`).then((r) => r.data),
      ]);
      setComparaison(comp);
      setEvolution(evo);
      setOperateurs(ops);
      setAgences(ags);
    } catch (e: any) {
      setErreur(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [mois, annee]);

  useEffect(() => { charger(); }, [charger]);

  const moisLabel = MOIS_LABELS[mois - 1] ?? '';

  const exporterPdf = () => {
    window.print();
  };

  const exporterHtml = () => {
    window.open(`/api/v1/analytics/rapport-mensuel?annee=${annee}&mois=${mois}`, '_blank');
  };

  return (
    <>
      <GmPageHeader
        titre={`📊 Rapport mensuel — ${moisLabel} ${annee}`}
        sousTitre="Analyse comparative des performances, tendances et classements"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <SelecteurPeriode mois={mois} annee={annee} onChange={(m, a) => { setMois(m); setAnnee(a); }} />
            <GmButton petit variante="outline" onClick={() => charger()}>
              🔄 Actualiser
            </GmButton>
            <GmButton petit variante="outline" onClick={exporterHtml}>
              ⬇ Exporter HTML
            </GmButton>
            <GmButton petit onClick={exporterPdf}>
              🖨 Exporter PDF
            </GmButton>
          </div>
        }
      />

      {erreur && (
        <div style={{
          padding: '20px 24px', marginBottom: 24,
          background: '#fef2f2', border: '1.5px solid #fecaca',
          borderRadius: 14, color: '#dc2626', fontSize: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>⚠️</span>
          <div>
            <strong>Impossible de charger les données</strong> — {erreur}
            <button
              onClick={() => charger()}
              style={{ marginLeft: 12, fontSize: 12, color: '#dc2626', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* ── Section 1 — KPI comparaison M vs M-1 ───────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gm-text)', marginBottom: 16 }}>
          1. Comparaison {moisLabel} {annee} vs mois précédent
        </h2>
        {loading || !comparaison ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} h={120} />)}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
              <KpiCard
                titre="Transactions"
                valeur={fmt(comparaison.transactions.moisActuel)}
                variation={comparaison.transactions.variation}
                tendance={comparaison.transactions.tendance}
                icone="💳"
              />
              <KpiCard
                titre="Volume traité"
                valeur={fmtM(comparaison.volume.moisActuel)}
                variation={comparaison.volume.variation}
                tendance={comparaison.volume.tendance}
                icone="💵"
                unite="XOF"
              />
              <KpiCard
                titre="Commissions"
                valeur={fmtM(comparaison.commissions.moisActuel)}
                variation={comparaison.commissions.variation}
                tendance={comparaison.commissions.tendance}
                icone="💰"
                unite="XOF"
              />
              <KpiCard
                titre="Nouveaux clients"
                valeur={fmt(comparaison.nouveauxClients.moisActuel)}
                variation={comparaison.nouveauxClients.variation}
                tendance={comparaison.nouveauxClients.tendance}
                icone="👤"
              />
            </div>
            {/* Insights */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12,
            }}>
              {[
                { label: 'Top opérateur du mois', valeur: comparaison.topOperateur, icone: '📡' },
                { label: 'Meilleur agent', valeur: comparaison.topAgent.nom, sous: `${fmtM(comparaison.topAgent.volume)} XOF`, icone: '🏆' },
                { label: 'Float moyen', valeur: `${fmtM(comparaison.floatMoyen)} XOF`, icone: '🏦' },
              ].map(({ label, valeur, sous, icone }) => (
                <div key={label} style={{
                  background: 'var(--gm-surface)', border: '1.5px solid var(--gm-border)',
                  borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center',
                }}>
                  <span style={{ fontSize: 24 }}>{icone}</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gm-text-2)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gm-text)' }}>{valeur}</div>
                    {sous && <div style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>{sous}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Section 2 — Évolution 6 mois ────────────────────────────────────── */}
      <Section
        titre="2. Évolution sur 6 mois glissants"
        sous="Transactions, volume et commissions — tendances sur la période récente"
      >
        {loading || evolution.length === 0 ? (
          <Skeleton h={260} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={evolution} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gm-border)" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'var(--gm-text-2)' }} />
              <YAxis yAxisId="tx" tick={{ fontSize: 10, fill: 'var(--gm-text-2)' }} width={36} />
              <YAxis yAxisId="vol" orientation="right" tickFormatter={fmtM} tick={{ fontSize: 10, fill: 'var(--gm-text-2)' }} width={52} />
              <Tooltip content={<TooltipCustom />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Line yAxisId="tx"  type="monotone" dataKey="transactions" stroke="#009E00" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Transactions" />
              <Line yAxisId="vol" type="monotone" dataKey="volume"       stroke="#F5B800" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Volume (XOF)" />
              <Line yAxisId="vol" type="monotone" dataKey="commissions"  stroke="#1DA7E8" strokeWidth={2}   dot={{ r: 3 }} activeDot={{ r: 5 }} name="Commissions (XOF)" strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* ── Section 3 — Répartition par opérateur ───────────────────────────── */}
      <Section
        titre="3. Répartition par opérateur"
        sous={`Volume et part de marché — ${moisLabel} ${annee}`}
      >
        {loading || operateurs.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Skeleton h={220} />
            <Skeleton h={220} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
            {/* PieChart */}
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={operateurs}
                    dataKey="volume"
                    nameKey="operateur"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ operateur, partPourcentage }) => `${operateur} ${partPourcentage}%`}
                    labelLine={false}
                  >
                    {operateurs.map((_, i) => (
                      <Cell key={i} fill={COULEURS_OP[i % COULEURS_OP.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${fmtM(v)} XOF`, 'Volume']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Tableau */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Opérateur', 'Tx', 'Volume', 'Part', 'Évol.'].map((h) => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid var(--gm-border)', fontWeight: 600, color: 'var(--gm-text-2)', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {operateurs.map((op, i) => {
                    const eColor = op.evolution >= 0 ? '#16a34a' : '#dc2626';
                    return (
                      <tr key={op.operateur} style={{ borderBottom: '1px solid var(--gm-border)' }}>
                        <td style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: COULEURS_OP[i % COULEURS_OP.length], display: 'inline-block', flexShrink: 0 }} />
                          <strong style={{ color: 'var(--gm-text)' }}>{op.operateur}</strong>
                        </td>
                        <td style={{ padding: '8px 10px', fontVariantNumeric: 'tabular-nums' }}>{fmt(op.transactions)}</td>
                        <td style={{ padding: '8px 10px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtM(op.volume)}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--gm-text-2)' }}>{op.partPourcentage}%</td>
                        <td style={{ padding: '8px 10px', color: eColor, fontWeight: 600 }}>
                          {op.evolution >= 0 ? '▲' : '▼'} {Math.abs(op.evolution)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      {/* ── Section 4 — Classement des agences ──────────────────────────────── */}
      <Section
        titre="4. Classement des agences"
        sous={`Agences triées par volume traité — ${moisLabel} ${annee}`}
      >
        {loading || agences.length === 0 ? (
          <Skeleton h={200} />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, agences.length * 42)}>
            <BarChart
              data={agences.map((a) => ({ nom: a.agence.nom, volume: a.volume, transactions: a.transactions }))}
              layout="vertical"
              margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gm-border)" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtM} tick={{ fontSize: 10, fill: 'var(--gm-text-2)' }} />
              <YAxis type="category" dataKey="nom" tick={{ fontSize: 11, fill: 'var(--gm-text)' }} width={120} />
              <Tooltip formatter={(v: any) => [`${fmtM(v)} XOF`, 'Volume']} />
              <Bar dataKey="volume" fill="#009E00" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* ── Section 5 — Top 5 agents ─────────────────────────────────────────── */}
      {!loading && agences.length > 0 && (
        <Section
          titre="5. Détail des agences"
          sous="Classement complet avec agents et float"
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Rang', 'Agence', 'Transactions', 'Volume (XOF)', 'Agents actifs', 'Float moyen'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--gm-border)', fontWeight: 600, color: 'var(--gm-text-2)', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agences.map((ag) => (
                  <tr key={ag.agence.id} style={{ borderBottom: '1px solid var(--gm-border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: ag.rang <= 3 ? '#F5B800' : 'var(--gm-text-2)', fontSize: 16 }}>
                      {ag.rang === 1 ? '🥇' : ag.rang === 2 ? '🥈' : ag.rang === 3 ? '🥉' : `#${ag.rang}`}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--gm-text)' }}>{ag.agence.nom}</td>
                    <td style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums' }}>{fmt(ag.transactions)}</td>
                    <td style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtM(ag.volume)}</td>
                    <td style={{ padding: '10px 12px' }}>{ag.agents}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--gm-text-2)' }}>{fmtM(ag.floatMoyen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Style impression */}
      <style>{`
        @media print {
          .gm-sidebar, .gm-topbar, header, nav, button, select { display: none !important; }
          body { background: white !important; }
          .gm-section-card { break-inside: avoid; }
        }
      `}</style>
    </>
  );
}
