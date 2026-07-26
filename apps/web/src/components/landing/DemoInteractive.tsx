'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// ─── Constantes couleurs ────────────────────────────────────────────────────
const VERT = '#009E00';
const FOND = '#0a2e15';
const OR = '#FFD000';

// ─── Données réalistes ──────────────────────────────────────────────────────
const AGENTS = [
  { initiales: 'AK', nom: 'Abdoulaye Konaté', agence: 'Agence Cocody', float: '3 420 000', statut: 'Actif', op: 'Orange Money' },
  { initiales: 'FD', nom: 'Fatoumata Diallo', agence: 'Agence Plateau', float: '1 875 000', statut: 'Actif', op: 'MTN MoMo' },
  { initiales: 'MK', nom: 'Mamadou Kouyaté', agence: 'Agence Yopougon', float: '920 000', statut: 'Alerte', op: 'Wave' },
  { initiales: 'AO', nom: 'Aminata Ouédraogo', agence: 'Agence Abobo', float: '2 150 000', statut: 'Actif', op: 'Orange Money' },
  { initiales: 'KA', nom: 'Kouassi Assoumou', agence: 'Agence Marcory', float: '450 000', statut: 'Inactif', op: 'Moov Money' },
];

const TXS_INIT = [
  { id: 'TXN-8812', type: 'Dépôt', montant: '150 000', op: 'Orange Money', agent: 'A. Konaté', heure: '09:42', statut: 'OK' },
  { id: 'TXN-8811', type: 'Retrait', montant: '85 000', op: 'MTN MoMo', agent: 'F. Diallo', heure: '09:38', statut: 'OK' },
  { id: 'TXN-8810', type: 'Transfert', montant: '200 000', op: 'Wave', agent: 'M. Kouyaté', heure: '09:31', statut: 'OK' },
];

const TX_POOL = [
  { type: 'Dépôt', montant: '45 000', op: 'Orange Money', agent: 'A. Konaté' },
  { type: 'Retrait', montant: '120 000', op: 'MTN MoMo', agent: 'F. Diallo' },
  { type: 'Dépôt', montant: '75 500', op: 'Wave', agent: 'A. Ouédraogo' },
  { type: 'Transfert', montant: '320 000', op: 'Orange Money', agent: 'K. Assoumou' },
  { type: 'Dépôt', montant: '18 000', op: 'Moov Money', agent: 'M. Kouyaté' },
];

const BARS_DATA = [38, 52, 45, 67, 71, 58, 83, 76, 89, 94, 88, 100];
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
const RAPPORT_DATA = [185, 212, 198, 245, 268, 310]; // millions FCFA
const PODIUM = [
  { place: 1, nom: 'Abdoulaye Konaté', score: '4 850 tx', agence: 'Agence Cocody' },
  { place: 2, nom: 'Fatoumata Diallo', score: '3 920 tx', agence: 'Agence Plateau' },
  { place: 3, nom: 'Aminata Ouédraogo', score: '3 210 tx', agence: 'Agence Abobo' },
];

const SCREENS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'agents', label: 'Agents', icon: '👤' },
  { id: 'live', label: 'Live', icon: '⚡' },
  { id: 'rapport', label: 'Rapport', icon: '📈' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString('fr-FR'); }

function StatutBadge({ s }: { s: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    Actif: { bg: '#f0fdf4', color: VERT },
    Alerte: { bg: '#fffbeb', color: '#d97706' },
    Inactif: { bg: '#f9fafb', color: '#9ca3af' },
    OK: { bg: '#f0fdf4', color: VERT },
    Dépôt: { bg: '#f0fdf4', color: VERT },
    Retrait: { bg: '#fef2f2', color: '#dc2626' },
    Transfert: { bg: '#eff6ff', color: '#3b82f6' },
  };
  const c = colors[s] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>
      {s}
    </span>
  );
}

// ─── Écran 1 : Dashboard ────────────────────────────────────────────────────
function ScreenDashboard({ txCount }: { txCount: number }) {
  const kpis = [
    { label: 'Transactions', val: fmt(txCount), icon: '💳', color: VERT },
    { label: 'Volume total', val: '485 M FCFA', icon: '💰', color: '#0369a1' },
    { label: 'Agents actifs', val: '34', icon: '👤', color: '#d97706' },
    { label: 'Agences', val: '12', icon: '🏪', color: '#7C3AED' },
  ];
  const maxBar = Math.max(...BARS_DATA);
  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: '#f8fef9', border: `1.5px solid ${k.color}22`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{k.icon}</span>
              <span style={{ fontSize: 10, color: VERT, fontWeight: 700, background: '#f0fdf4', borderRadius: 999, padding: '2px 8px' }}>Live</span>
            </div>
            <p style={{ fontSize: 'clamp(16px,3vw,22px)', fontWeight: 900, color: '#111', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{k.val}</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0', fontWeight: 600 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Mini graphique barres */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#374151', margin: '0 0 12px' }}>Transactions / semaine</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 56 }}>
          {BARS_DATA.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{
                width: '100%', borderRadius: '3px 3px 0 0',
                height: `${(v / maxBar) * 100}%`,
                background: i === BARS_DATA.length - 1 ? VERT : `${VERT}55`,
                transition: 'height .4s ease',
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>S1</span>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>S12</span>
        </div>
      </div>

      {/* 3 dernières transactions */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: FOND, padding: '10px 14px' }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: 0 }}>Dernières transactions</p>
        </div>
        <div>
          {TXS_INIT.map((tx, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
              <StatutBadge s={tx.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.id} · {tx.op}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{tx.heure} · {tx.agent}</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: tx.type === 'Retrait' ? '#dc2626' : VERT, whiteSpace: 'nowrap' }}>
                {tx.type === 'Retrait' ? '-' : '+'}{tx.montant} F
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Écran 2 : Agents ───────────────────────────────────────────────────────
function ScreenAgents() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: 0 }}>Réseau d'agents (34)</p>
        <span style={{ fontSize: 11, color: VERT, fontWeight: 700, background: '#f0fdf4', borderRadius: 999, padding: '3px 10px' }}>+2 ce mois</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {AGENTS.map((a, i) => (
          <div key={i}
            onClick={() => setSelected(selected === i ? null : i)}
            style={{
              background: selected === i ? '#f0fdf4' : '#fff',
              border: `1.5px solid ${selected === i ? VERT : '#e5e7eb'}`,
              borderRadius: 12, padding: '10px 12px', cursor: 'pointer',
              transition: 'all .2s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Avatar initiales */}
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${VERT}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: VERT }}>{a.initiales}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nom}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{a.agence}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#111', margin: 0 }}>{a.float} F</p>
                <StatutBadge s={a.statut} />
              </div>
            </div>
            {/* Modal détail inline */}
            {selected === i && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #d1fae5', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 2px', fontWeight: 700 }}>Opérateur principal</p>
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#111', margin: 0 }}>{a.op}</p>
                </div>
                <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 2px', fontWeight: 700 }}>Float disponible</p>
                  <p style={{ fontSize: 12, fontWeight: 800, color: a.statut === 'Alerte' ? '#d97706' : VERT, margin: 0 }}>{a.float} FCFA</p>
                </div>
                <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', gridColumn: '1/-1' }}>
                  <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 2px', fontWeight: 700 }}>Transactions ce mois</p>
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#111', margin: 0 }}>
                    {[312, 248, 187, 203, 94][i]} transactions · {['98.4%', '97.1%', '95.8%', '99.0%', '91.2%'][i]} succès
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: '12px 0 0' }}>
        Cliquez sur un agent pour voir le détail
      </p>
    </div>
  );
}

// ─── Écran 3 : Live transactions ────────────────────────────────────────────
function ScreenLive({ txCount, setTxCount }: { txCount: number; setTxCount: (fn: (n: number) => number) => void }) {
  const [txs, setTxs] = useState(() => TXS_INIT.map((t, i) => ({ ...t, key: i, isNew: false })));
  const [toast, setToast] = useState<string | null>(null);
  const counterRef = useRef(TXS_INIT.length);

  useEffect(() => {
    let poolIdx = 0;
    const interval = setInterval(() => {
      const src = TX_POOL[poolIdx % TX_POOL.length];
      poolIdx++;
      const now = new Date();
      const heure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      counterRef.current++;
      const newTx = {
        id: `TXN-88${10 + counterRef.current}`,
        type: src.type,
        montant: src.montant,
        op: src.op,
        agent: src.agent,
        heure,
        statut: 'OK',
        key: counterRef.current * 100 + poolIdx,
        isNew: true,
      };

      setTxs(prev => [newTx, ...prev.slice(0, 4)]);
      setTxCount(n => n + 1);
      setToast(`${src.type} ${src.montant} FCFA — ${src.op}`);
      setTimeout(() => {
        setTxs(prev => prev.map(t => t.key === newTx.key ? { ...t, isNew: false } : t));
      }, 1200);
      setTimeout(() => setToast(null), 2800);
    }, 3000);
    return () => clearInterval(interval);
  }, [setTxCount]);

  return (
    <div style={{ padding: '20px 16px', position: 'relative' }}>
      {/* En-tête live */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 0 3px rgba(34,197,94,0.25)', animation: 'pulse 1.5s infinite' }} />
        <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: 0 }}>Flux en direct</p>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 900, color: VERT, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(txCount)} tx aujourd'hui
        </span>
      </div>

      {/* Tableau */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: FOND, padding: '8px 14px', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)' }}>Transaction</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)' }}>Type</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)', textAlign: 'right' }}>Montant</span>
        </div>
        {txs.map((tx) => (
          <div key={tx.key} style={{
            display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8,
            padding: '10px 14px', alignItems: 'center',
            borderBottom: '1px solid #f3f4f6',
            background: tx.isNew ? '#fefce8' : '#fff',
            transition: 'background 1.2s ease',
          }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#111', margin: 0 }}>{tx.id}</p>
              <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>{tx.op} · {tx.heure}</p>
            </div>
            <StatutBadge s={tx.type} />
            <span style={{ fontSize: 13, fontWeight: 900, color: tx.type === 'Retrait' ? '#dc2626' : VERT, textAlign: 'right' }}>
              {tx.type === 'Retrait' ? '-' : '+'}{tx.montant} F
            </span>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 16, right: 16, left: 16,
          background: FOND, color: '#fff', borderRadius: 12,
          padding: '12px 16px', fontSize: 13, fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideUp .3s ease',
          zIndex: 10,
        }}>
          <span style={{ color: '#22c55e', flexShrink: 0 }}>✅</span>
          <span style={{ flex: 1 }}>Nouvelle transaction — {toast}</span>
        </div>
      )}
    </div>
  );
}

// ─── Écran 4 : Rapport ──────────────────────────────────────────────────────
function ScreenRapport() {
  const maxVal = Math.max(...RAPPORT_DATA);
  const svgW = 300;
  const svgH = 100;
  const pts = RAPPORT_DATA.map((v, i) => {
    const x = (i / (RAPPORT_DATA.length - 1)) * (svgW - 20) + 10;
    const y = svgH - 20 - ((v / maxVal) * (svgH - 30));
    return `${x},${y}`;
  }).join(' ');
  const areaPath = `M10,${svgH - 20} ` + RAPPORT_DATA.map((v, i) => {
    const x = (i / (RAPPORT_DATA.length - 1)) * (svgW - 20) + 10;
    const y = svgH - 20 - ((v / maxVal) * (svgH - 30));
    return `L${x},${y}`;
  }).join(' ') + ` L${svgW - 10},${svgH - 20} Z`;

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Graphique SVG */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#374151', margin: 0 }}>Volume mensuel (M FCFA)</p>
          <span style={{ fontSize: 11, color: VERT, fontWeight: 700 }}>+67% YTD</span>
        </div>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', display: 'block' }} aria-hidden>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={VERT} stopOpacity="0.25" />
              <stop offset="100%" stopColor={VERT} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grille */}
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1="10" y1={svgH - 20 - f * (svgH - 30)} x2={svgW - 10} y2={svgH - 20 - f * (svgH - 30)} stroke="#e5e7eb" strokeWidth="1" />
          ))}
          {/* Axe X */}
          <line x1="10" y1={svgH - 20} x2={svgW - 10} y2={svgH - 20} stroke="#e5e7eb" strokeWidth="1" />
          {/* Aire */}
          <path d={areaPath} fill="url(#areaGrad)" />
          {/* Ligne */}
          <polyline points={pts} fill="none" stroke={VERT} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {/* Points */}
          {RAPPORT_DATA.map((v, i) => {
            const x = (i / (RAPPORT_DATA.length - 1)) * (svgW - 20) + 10;
            const y = svgH - 20 - ((v / maxVal) * (svgH - 30));
            return <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke={VERT} strokeWidth="2" />;
          })}
          {/* Labels mois */}
          {MONTHS.map((m, i) => {
            const x = (i / (MONTHS.length - 1)) * (svgW - 20) + 10;
            return <text key={i} x={x} y={svgH - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{m}</text>;
          })}
        </svg>
      </div>

      {/* Podium top 3 */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: FOND, padding: '8px 14px' }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: 0 }}>Top agents — juin</p>
        </div>
        {PODIUM.map((p) => (
          <div key={p.place} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: p.place < 3 ? '1px solid #f3f4f6' : 'none' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>
              {p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : '🥉'}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: 0 }}>{p.nom}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{p.agence}</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: VERT }}>{p.score}</span>
          </div>
        ))}
      </div>

      {/* Résumé chiffres */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Commissions versées', val: '12,4 M FCFA', icon: '💵' },
          { label: 'Taux de succès', val: '98,7 %', icon: '✅' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#f8fef9', border: `1.5px solid ${VERT}22`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <span style={{ fontSize: 20 }}>{k.icon}</span>
            <p style={{ fontSize: 14, fontWeight: 900, color: '#111', margin: '4px 0 2px', fontVariantNumeric: 'tabular-nums' }}>{k.val}</p>
            <p style={{ fontSize: 10, color: '#6b7280', margin: 0, fontWeight: 600 }}>{k.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────
export function DemoInteractive() {
  const [screen, setScreen] = useState(0);
  const [txCount, setTxCount] = useState(1247);

  const prev = useCallback(() => setScreen(s => Math.max(0, s - 1)), []);
  const next = useCallback(() => setScreen(s => Math.min(SCREENS.length - 1, s + 1)), []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
      {/* Cadre "mock navigateur" */}
      <div style={{
        width: '100%',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}>
        {/* Barre navigateur simulée */}
        <div style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Boutons trafic light */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c, opacity: 0.8 }} />
            ))}
          </div>
          {/* URL bar */}
          <div style={{
            flex: 1, background: '#fff', border: '1px solid #d1d5db',
            borderRadius: 8, padding: '5px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
            maxWidth: 420, margin: '0 auto',
          }}>
            <span style={{ fontSize: 11, color: VERT }}>🔒</span>
            <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
              gestmoney.ibigsoft.com/dashboard
            </span>
          </div>
        </div>

        {/* Sidebar + contenu */}
        <div style={{ display: 'flex', minHeight: 520 }}>
          {/* Mini sidebar */}
          <div style={{ background: FOND, width: 54, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, gap: 4 }}>
            {/* Logo */}
            <div style={{ width: 32, height: 32, borderRadius: 8, background: OR, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>G</span>
            </div>
            {SCREENS.map((s, i) => (
              <button key={i} onClick={() => setScreen(i)} title={s.label} style={{
                width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: screen === i ? 'rgba(255,255,255,0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, transition: 'all .2s',
              }}>
                {s.icon}
              </button>
            ))}
          </div>

          {/* Zone principale */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {/* Header interne */}
            <div style={{ background: FOND, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0 }}>{SCREENS[screen].label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', margin: 0 }}>Agence principale — Abidjan</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: OR, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#111' }}>A</div>
              </div>
            </div>

            {/* Contenu de l'écran actif */}
            <div style={{ overflowY: 'auto', maxHeight: 460 }}>
              {screen === 0 && <ScreenDashboard txCount={txCount} />}
              {screen === 1 && <ScreenAgents />}
              {screen === 2 && <ScreenLive txCount={txCount} setTxCount={setTxCount} />}
              {screen === 3 && <ScreenRapport />}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation entre écrans */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={prev} disabled={screen === 0} style={{
          padding: '9px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb',
          background: '#fff', color: '#374151', fontWeight: 700, fontSize: 14,
          cursor: screen === 0 ? 'not-allowed' : 'pointer', opacity: screen === 0 ? 0.4 : 1,
          transition: 'all .2s', fontFamily: 'inherit',
        }}>
          ← Précédent
        </button>

        {/* Indicateur de progression */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {SCREENS.map((s, i) => (
            <button key={i} onClick={() => setScreen(i)} title={s.label} style={{
              border: 'none', cursor: 'pointer', padding: 0,
              width: i === screen ? 24 : 8,
              height: 8, borderRadius: 999,
              background: i === screen ? VERT : '#d1d5db',
              transition: 'all .3s ease',
            }} />
          ))}
        </div>

        <button onClick={next} disabled={screen === SCREENS.length - 1} style={{
          padding: '9px 20px', borderRadius: 10, border: 'none',
          background: screen === SCREENS.length - 1 ? '#e5e7eb' : VERT,
          color: screen === SCREENS.length - 1 ? '#9ca3af' : '#fff',
          fontWeight: 700, fontSize: 14,
          cursor: screen === SCREENS.length - 1 ? 'not-allowed' : 'pointer',
          transition: 'all .2s', fontFamily: 'inherit',
        }}>
          Suivant →
        </button>
      </div>

      {/* Étiquettes des écrans */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {SCREENS.map((s, i) => (
          <button key={i} onClick={() => setScreen(i)} style={{
            padding: '6px 14px', borderRadius: 999, border: `1.5px solid ${i === screen ? VERT : '#e5e7eb'}`,
            background: i === screen ? '#f0fdf4' : '#fff',
            color: i === screen ? VERT : '#6b7280',
            fontWeight: i === screen ? 800 : 600, fontSize: 13, cursor: 'pointer',
            transition: 'all .2s', fontFamily: 'inherit',
          }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* CTA finaux */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', paddingTop: 8 }}>
        <Link href="/register" style={{
          padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 900,
          background: OR, color: '#111', textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(255,208,0,0.45)',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          transition: 'transform .15s, box-shadow .15s',
        }}>
          ⚡ Démarrer l'essai gratuit 14 jours
        </Link>
        <a href="#fonctionnalites" style={{
          padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
          background: '#fff', border: `1.5px solid ${VERT}`, color: VERT,
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
          boxShadow: '0 2px 10px rgba(0,158,0,0.08)',
        }}>
          Voir toutes les fonctionnalités →
        </a>
      </div>

      {/* Animations keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.25); }
          50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0.10); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
