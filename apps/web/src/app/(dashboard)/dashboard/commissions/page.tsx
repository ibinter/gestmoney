'use client';
// ============================================================
// PAGE COMMISSIONS — GESTMONEY
// Onglets : agents | historique | objectifs | plans | tableau
// ============================================================
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCommissions, useValiderCommissions, usePayerCommissions } from '@/hooks/useCommissions';
import { Commission } from '@/types';
import { formatMontant, formatDate } from '@/lib/formatters';
import { GmExportMenu } from '@/components/gm/GmExportMenu';
import { GmPageHeader, GmButton, GmTableWrap } from '@/components/gm';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

const statutLabels = (t: Translations): Record<string, string> => ({
  calculee: t.commissions.statutLabels.calculee,
  validee: t.commissions.statutLabels.validee,
  payee: t.commissions.statutLabels.payee,
});

const statutPill = (t: Translations): Record<string, { cls: string; label: string }> => ({
  calculee: { cls: 'gm-pill-pending', label: t.commissions.pills.pending },
  validee: { cls: 'gm-pill-validated', label: t.commissions.pills.validated },
  payee: { cls: 'gm-pill-paid', label: t.commissions.pills.paid },
});

const AVATAR_COLORS = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#be185d', '#b45309'];

function couleurAvatar(cle: string): string {
  let h = 0;
  for (let i = 0; i < cle.length; i++) h = (h * 31 + cle.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
}

function initiales(nom: string): string {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

type Onglet = 'agents' | 'historique' | 'objectifs' | 'plans' | 'tableau';

// ── Hook données plans ─────────────────────────────────────────────────────────
function usePlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/commissions/plans', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : []);
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  return { plans, loading, refetch: fetchPlans };
}

// ── Hook tableau du mois ───────────────────────────────────────────────────────
function useTableau(mois: number, annee: number) {
  const [tableau, setTableau] = useState<{ lignes: any[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/commissions/tableau?mois=${mois}&annee=${annee}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setTableau(d))
      .catch(() => setTableau(null))
      .finally(() => setLoading(false));
  }, [mois, annee]);

  return { tableau, loading };
}

// ── Simulateur (appel API) ─────────────────────────────────────────────────────
async function simulerApi(
  planId: string,
  volumeMensuel: number,
  montantTransaction: number,
): Promise<{ tauxAgent: number; commissionBrute: number; plafondMensuel: number | null } | null> {
  try {
    const res = await fetch(`/api/v1/commissions/plans/${planId}/simuler`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volumeMensuel, montantTransaction }),
    });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

// ── Composant onglet Plans ─────────────────────────────────────────────────────
function OngletPlans({ t }: { t: Translations }) {
  const { plans, loading, refetch } = usePlans();
  const [planOuvert, setPlanOuvert] = useState<string | null>(null);
  const [ajoutPalier, setAjoutPalier] = useState<{
    volumeMin: string; volumeMax: string; tauxAgent: string; tauxReseau: string;
  }>({ volumeMin: '', volumeMax: '', tauxAgent: '', tauxReseau: '0' });
  const [simVolume, setSimVolume] = useState('');
  const [simMontant, setSimMontant] = useState('');
  const [simResultat, setSimResultat] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const tp = t.commissions.plans;

  const handleAddPalier = async (planId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/commissions/plans/${planId}/volume-paliers`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volumeMin: Number(ajoutPalier.volumeMin),
          volumeMax: ajoutPalier.volumeMax ? Number(ajoutPalier.volumeMax) : undefined,
          tauxAgent: Number(ajoutPalier.tauxAgent),
          tauxReseau: Number(ajoutPalier.tauxReseau),
        }),
      });
      if (res.ok) {
        setMsg(tp.palierSaved);
        setAjoutPalier({ volumeMin: '', volumeMax: '', tauxAgent: '', tauxReseau: '0' });
        await refetch();
        setTimeout(() => setMsg(''), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSimuler = async (planId: string) => {
    const result = await simulerApi(planId, Number(simVolume), Number(simMontant));
    setSimResultat(result);
  };

  if (loading) return (
    <div style={{ padding: 32, color: 'var(--gm-text-2)', textAlign: 'center' }}>
      {t.commissions.tableau.loading}
    </div>
  );

  if (plans.length === 0) return (
    <div style={{ padding: 32, color: 'var(--gm-text-2)', textAlign: 'center' }}>
      {tp.empty}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
      {msg && <div style={{ color: 'var(--gm-success)', fontWeight: 600, fontSize: 13 }}>✅ {msg}</div>}
      {plans.map((plan) => {
        const ouvert = planOuvert === plan.id;
        return (
          <div key={plan.id} className="gm-chart-card" style={{ padding: '16px 20px' }}>
            {/* En-tête plan */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{plan.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--gm-text-2)', marginTop: 2 }}>
                  {plan.operateur} · {tp.typeCalcul} : <strong>{plan.typeCalcul}</strong>
                  {plan.plafondMensuelAgent != null && (
                    <> · {tp.plafondMensuel} : <strong>{formatMontant(plan.plafondMensuelAgent)}</strong></>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`gm-status-pill ${plan.active ? 'gm-pill-paid' : 'gm-pill-pending'}`}>
                  {plan.active ? '✅ Actif' : '⏸ Inactif'}
                </span>
                <GmButton variante="outline" petit onClick={() => setPlanOuvert(ouvert ? null : plan.id)}>
                  {ouvert ? '▲ Fermer' : '▼ Détails'}
                </GmButton>
              </div>
            </div>

            {ouvert && (
              <div style={{ marginTop: 16 }}>
                {/* Paliers volume */}
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{tp.palierHeader}</div>
                {plan.volumePaliers && plan.volumePaliers.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--gm-bg-2)' }}>
                          <th style={{ padding: '6px 12px', textAlign: 'right' }}>{tp.colVolumeMin}</th>
                          <th style={{ padding: '6px 12px', textAlign: 'right' }}>{tp.colVolumeMax}</th>
                          <th style={{ padding: '6px 12px', textAlign: 'right' }}>{tp.colTauxAgent}</th>
                          <th style={{ padding: '6px 12px', textAlign: 'right' }}>{tp.colTauxReseau}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.volumePaliers.map((p: any) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--gm-border)' }}>
                            <td style={{ padding: '6px 12px', textAlign: 'right' }}>{formatMontant(p.volumeMin)}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                              {p.volumeMax != null ? formatMontant(p.volumeMax) : tp.unlimitedMax}
                            </td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', color: 'var(--gm-primary)', fontWeight: 700 }}>
                              {p.tauxAgent}%
                            </td>
                            <td style={{ padding: '6px 12px', textAlign: 'right' }}>{p.tauxReseau}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--gm-text-2)', marginBottom: 12 }}>{tp.noPaliers}</div>
                )}

                {/* Ajout palier */}
                <div style={{ marginTop: 14, background: 'var(--gm-bg-2)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>{tp.addPalier}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                    {[
                      { label: tp.colVolumeMin, key: 'volumeMin', placeholder: '0' },
                      { label: tp.colVolumeMax, key: 'volumeMax', placeholder: '∞' },
                      { label: tp.colTauxAgent + ' (%)', key: 'tauxAgent', placeholder: '1.5' },
                      { label: tp.colTauxReseau + ' (%)', key: 'tauxReseau', placeholder: '0' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>{label}</label>
                        <input
                          type="number"
                          placeholder={placeholder}
                          value={(ajoutPalier as any)[key]}
                          onChange={(e) => setAjoutPalier((prev) => ({ ...prev, [key]: e.target.value }))}
                          style={{
                            width: 110, padding: '5px 8px', borderRadius: 6,
                            border: '1px solid var(--gm-border)', fontSize: 13,
                            background: 'var(--gm-bg)', color: 'var(--gm-text)',
                          }}
                        />
                      </div>
                    ))}
                    <GmButton
                      variante="primary"
                      petit
                      disabled={saving || !ajoutPalier.volumeMin || !ajoutPalier.tauxAgent}
                      onClick={() => handleAddPalier(plan.id)}
                    >
                      {saving ? '…' : '+ Ajouter'}
                    </GmButton>
                  </div>
                </div>

                {/* Simulateur */}
                <div style={{ marginTop: 14, background: 'var(--gm-bg-2)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>🧮 {tp.simulator}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                    {[
                      { label: tp.simVolume, val: simVolume, set: setSimVolume },
                      { label: tp.simMontant, val: simMontant, set: setSimMontant },
                    ].map(({ label, val, set }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>{label}</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={val}
                          onChange={(e) => { set(e.target.value); setSimResultat(null); }}
                          style={{
                            width: 150, padding: '5px 8px', borderRadius: 6,
                            border: '1px solid var(--gm-border)', fontSize: 13,
                            background: 'var(--gm-bg)', color: 'var(--gm-text)',
                          }}
                        />
                      </div>
                    ))}
                    <GmButton
                      variante="outline"
                      petit
                      disabled={!simVolume || !simMontant}
                      onClick={() => handleSimuler(plan.id)}
                    >
                      {tp.simBtn}
                    </GmButton>
                  </div>
                  {simResultat && (
                    <div style={{ marginTop: 10, fontSize: 13 }}>
                      <strong>{tp.simResult} :</strong>{' '}
                      <span style={{ color: 'var(--gm-primary)', fontWeight: 700, fontSize: 16 }}>
                        {formatMontant(simResultat.commissionBrute)}
                      </span>
                      {' '}(taux agent {simResultat.tauxAgent}%
                      {simResultat.plafondMensuel != null
                        ? ` · plafond ${formatMontant(simResultat.plafondMensuel)}/mois`
                        : ''})
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Composant onglet Tableau du mois ──────────────────────────────────────────
function OngletTableau({ t }: { t: Translations }) {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const { tableau, loading } = useTableau(mois, annee);
  const tt = t.commissions.tableau;

  const handleExportCsv = () => {
    window.open(`/api/v1/commissions/export-csv?mois=${mois}&annee=${annee}`, '_blank');
  };

  const MOIS_LABELS = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
  ];

  return (
    <div>
      <div className="gm-actions-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--gm-text-2)' }}>{tt.selectMonth}</label>
          <select
            value={mois}
            onChange={(e) => setMois(+e.target.value)}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--gm-border)', fontSize: 13 }}
          >
            {MOIS_LABELS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <label style={{ fontSize: 13, color: 'var(--gm-text-2)' }}>{tt.selectYear}</label>
          <select
            value={annee}
            onChange={(e) => setAnnee(+e.target.value)}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--gm-border)', fontSize: 13 }}
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="gm-actions-bar-right">
          <GmButton variante="outline" petit onClick={handleExportCsv}>
            {tt.exportCsv}
          </GmButton>
        </div>
      </div>

      <GmTableWrap>
        <table>
          <thead>
            <tr>
              <th>{tt.colAgent}</th>
              <th style={{ textAlign: 'right' }}>{tt.colVolume}</th>
              <th>{tt.colPalier}</th>
              <th style={{ textAlign: 'right' }}>{tt.colBrute}</th>
              <th style={{ textAlign: 'center' }}>{tt.colPlafond}</th>
              <th style={{ textAlign: 'right' }}>{tt.colNette}</th>
              <th style={{ textAlign: 'center' }}>Bulletin</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--gm-text-2)' }}>
                  {tt.loading}
                </td>
              </tr>
            )}
            {!loading && (!tableau || tableau.lignes.length === 0) && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--gm-text-2)' }}>
                  {tt.empty}
                </td>
              </tr>
            )}
            {!loading && tableau?.lignes.map((l: any) => (
              <tr key={l.agentId}>
                <td>
                  <div className="gm-avatar-cell">
                    <div className="gm-avatar" style={{ background: couleurAvatar(l.agentId) }}>
                      {initiales(l.agentCode)}
                    </div>
                    <div>
                      <strong>{l.agentCode}</strong>
                      {l.phone && <div style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>{l.phone}</div>}
                    </div>
                  </div>
                </td>
                <td className="gm-amount-cell" style={{ textAlign: 'right' }}>
                  {formatMontant(l.volumeMensuel)}
                </td>
                <td style={{ fontSize: 12 }}>{l.typeCalcul}</td>
                <td className="gm-amount-cell" style={{ textAlign: 'right', color: 'var(--gm-text-2)' }}>
                  {formatMontant(l.commissionBrute)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {l.plafondAtteint
                    ? <span style={{ color: 'var(--gm-warning)', fontWeight: 700 }}>{tt.yes}</span>
                    : <span style={{ color: 'var(--gm-text-2)' }}>{tt.no}</span>}
                </td>
                <td className="gm-amount-cell" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gm-success)' }}>
                  {formatMontant(l.commissionNette)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    title="Bulletin de paie PDF"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/hr/agents/${l.agentId}/bulletin/${annee}/${mois}/pdf`,
                          { credentials: 'include' },
                        );
                        if (!res.ok) return;
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                      } catch { /* silencieux */ }
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 5,
                      border: '1px solid var(--gm-primary)',
                      background: 'transparent',
                      color: 'var(--gm-primary)',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Bulletin PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {tableau && tableau.lignes.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: 700, borderTop: '2px solid var(--gm-border)' }}>
                <td colSpan={6} style={{ padding: '10px 12px', textAlign: 'right' }}>
                  {tt.total}
                </td>
                <td className="gm-amount-cell" style={{ textAlign: 'right', color: 'var(--gm-primary)', fontSize: 15 }}>
                  {formatMontant(tableau.total)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </GmTableWrap>
    </div>
  );
}

// ── Graphique 6 mois (barres CSS) ─────────────────────────────────────────────
function Graphique6Mois({ commissions, t }: { commissions: Commission[]; t: Translations }) {
  const th = t.commissions.historique;
  const MOIS_COURTS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

  const donnees = useMemo(() => {
    const now = new Date();
    const points: { label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = `${MOIS_COURTS[d.getMonth()]} ${y}`;
      const total = commissions
        .filter((c) => {
          const [cy, cm] = (c.periode || '').split('-').map(Number);
          return cy === y && cm === m;
        })
        .reduce((s, c) => s + c.montantCommission, 0);
      points.push({ label, total });
    }
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commissions]);

  const max = Math.max(...donnees.map((d) => d.total), 1);

  if (donnees.every((d) => d.total === 0)) {
    return <div style={{ fontSize: 13, color: 'var(--gm-text-2)', padding: 20 }}>{th.noData}</div>;
  }

  return (
    <div className="gm-chart-card">
      <div className="gm-chart-title">{th.chartTitle}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, marginTop: 16, padding: '0 8px' }}>
        {donnees.map((d) => {
          const pct = Math.round((d.total / max) * 100);
          return (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 10, color: 'var(--gm-text-2)', fontWeight: 600 }}>
                {d.total > 0 ? formatMontant(d.total) : '—'}
              </div>
              <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max(pct, 4)}%`,
                    background: pct > 80
                      ? 'var(--gm-success)'
                      : pct > 40
                      ? 'var(--gm-primary)'
                      : 'var(--gm-border)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.4s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: 'var(--gm-text-2)', textAlign: 'center' }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function CommissionsPage() {
  const t = useT();
  const STATUT_LABELS = statutLabels(t);
  const STATUT_PILL = statutPill(t);
  const [filtrePeriode, setFiltrePeriode] = useState('');
  const [selectionnees, setSelectionnees] = useState<string[]>([]);
  const [succes, setSucces] = useState('');
  const [page, setPage] = useState(1);
  const [onglet, setOnglet] = useState<Onglet>('agents');
  const [modalOuverte, setModalOuverte] = useState(false);
  const LIMIT = 20;

  const { data: resultat, isLoading } = useCommissions(filtrePeriode || undefined);
  const commissions = resultat?.items ?? [];
  const donneesFictives = resultat?.isMock ?? false;

  const totalPages = Math.ceil(commissions.length / LIMIT);
  const commissionsPage = commissions.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => setPage(1), [filtrePeriode]);
  const valider = useValiderCommissions();
  const payer = usePayerCommissions();

  const enCours = valider.isPending || payer.isPending;

  const handleValider = async (ids: string[]) => {
    await valider.mutateAsync(ids);
    setSelectionnees([]);
    setSucces(`${ids.length} ${t.commissions.messages.validatedSuffix}`);
    setTimeout(() => setSucces(''), 3000);
  };

  const handlePayer = async (ids: string[]) => {
    await payer.mutateAsync(ids);
    setSelectionnees([]);
    setSucces(`${ids.length} ${t.commissions.messages.paidSuffix}`);
    setTimeout(() => setSucces(''), 3000);
  };

  const aValider = commissions.filter((c) => selectionnees.includes(c.id) && c.statut === 'calculee').map((c) => c.id);
  const aPayer = commissions.filter((c) => selectionnees.includes(c.id) && c.statut === 'validee').map((c) => c.id);

  const traiterSelection = async () => {
    setModalOuverte(false);
    if (aValider.length) await handleValider(aValider);
    if (aPayer.length) await handlePayer(aPayer);
  };

  const totalCalculees = commissions.filter((c) => c.statut === 'calculee').reduce((s, c) => s + c.montantCommission, 0);
  const totalValidees = commissions.filter((c) => c.statut === 'validee').reduce((s, c) => s + c.montantCommission, 0);
  const totalPayees = commissions.filter((c) => c.statut === 'payee').reduce((s, c) => s + c.montantCommission, 0);
  const nbCalculees = commissions.filter((c) => c.statut === 'calculee').length;
  const nbValidees = commissions.filter((c) => c.statut === 'validee').length;
  const nbPayees = commissions.filter((c) => c.statut === 'payee').length;
  const totalGeneral = totalCalculees + totalValidees + totalPayees;
  const nbAgents = new Set(commissions.map((c) => c.agentId || c.agentNom).filter(Boolean)).size;
  const pctPaye = totalGeneral > 0 ? Math.round((totalPayees / totalGeneral) * 100) : 0;

  const montantSelection = commissions
    .filter((c) => selectionnees.includes(c.id))
    .reduce((s, c) => s + c.montantCommission, 0);

  const historique = useMemo(
    () =>
      commissions
        .filter((c) => c.statut === 'payee')
        .slice()
        .sort((a, b) => (b.datePaiement ?? '').localeCompare(a.datePaiement ?? '')),
    [commissions],
  );

  const topAgent = useMemo(
    () =>
      commissions.reduce<Commission | null>(
        (best, c) => (best === null || c.montantCommission > best.montantCommission ? c : best),
        null,
      ),
    [commissions],
  );

  const colonnesExport = [
    { titre: t.commissions.csv.agent, valeur: (c: Commission) => c.agentNom },
    { titre: t.commissions.csv.agence, valeur: (c: Commission) => c.agenceNom },
    { titre: t.commissions.csv.periode, valeur: (c: Commission) => c.periode },
    { titre: t.commissions.csv.transactions, valeur: (c: Commission) => c.nbTransactions },
    { titre: t.commissions.csv.montantTransactions, valeur: (c: Commission) => c.montantTransactions },
    { titre: t.commissions.csv.taux, valeur: (c: Commission) => c.tauxCommission },
    { titre: t.commissions.csv.commission, valeur: (c: Commission) => c.montantCommission },
    { titre: t.commissions.csv.statut, valeur: (c: Commission) => STATUT_LABELS[c.statut] ?? c.statut },
    { titre: t.commissions.csv.datePaiement, valeur: (c: Commission) => (c.datePaiement ? formatDate(c.datePaiement) : '') },
  ];

  const toutesPageSelectionnees =
    commissionsPage.length > 0 && commissionsPage.every((c) => selectionnees.includes(c.id));

  const basculerToutPage = (coche: boolean) => {
    const ids = commissionsPage.map((c) => c.id);
    setSelectionnees((prev) =>
      coche ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)),
    );
  };

  const basculerLigne = (id: string, coche: boolean) =>
    setSelectionnees((prev) => (coche ? [...prev, id] : prev.filter((x) => x !== id)));

  const ONGLETS: { key: Onglet; label: string }[] = [
    { key: 'agents', label: t.commissions.tabs.agents },
    { key: 'historique', label: t.commissions.tabs.historique },
    { key: 'objectifs', label: t.commissions.tabs.objectifs },
    { key: 'plans', label: t.commissions.tabs.plans },
    { key: 'tableau', label: t.commissions.tabs.tableau },
  ];

  return (
    <>
      <GmPageHeader
        fil={[`🏠 ${t.common.home}`, t.commissions.breadcrumb]}
        titre={t.commissions.title}
        sousTitre={t.commissions.subtitle}
        actions={
          <>
            <GmExportMenu
              titre="Commissions"
              donnees={commissions}
              colonnes={colonnesExport}
              nomFichier="commissions"
            />
            <GmButton
              variante="primary"
              petit
              disabled={selectionnees.length === 0 || enCours}
              style={{ opacity: selectionnees.length === 0 ? 0.5 : 1 }}
              onClick={() => setModalOuverte(true)}
            >
              {t.commissions.processSelection}
            </GmButton>
          </>
        }
      />

      {donneesFictives && (
        <div
          className="gm-alert-banner"
          role="status"
          style={{
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.35)',
          }}
        >
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <strong>{t.commissions.demoTitle}</strong> {t.commissions.demoBody}
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="gm-stats-row">
        <div className="gm-stat-card gm-total">
          <div className="gm-stat-value">{formatMontant(totalGeneral)}</div>
          <div className="gm-stat-label">{t.commissions.stats.total}</div>
          <div className="gm-stat-sub">{commissions.length} {t.commissions.stats.commissionsSuffix}</div>
        </div>
        <div className="gm-stat-card gm-success">
          <div className="gm-stat-value">{formatMontant(totalPayees)}</div>
          <div className="gm-stat-label">{t.commissions.stats.paid}</div>
          <div className="gm-stat-sub">
            {nbPayees} {t.commissions.stats.commissionsSuffix}{totalGeneral > 0 ? ` — ${pctPaye}% ${t.commissions.stats.pctOfTotalSuffix}` : ''}
          </div>
        </div>
        <div className="gm-stat-card gm-amount">
          <div className="gm-stat-value">{formatMontant(totalValidees)}</div>
          <div className="gm-stat-label">{t.commissions.stats.validated}</div>
          <div className="gm-stat-sub">{nbValidees} {t.commissions.stats.commissionsSuffix}</div>
        </div>
        <div className="gm-stat-card gm-pending">
          <div className="gm-stat-value">{formatMontant(totalCalculees)}</div>
          <div className="gm-stat-label">{t.commissions.stats.pendingValidation}</div>
          <div className="gm-stat-sub">{nbCalculees} {t.commissions.stats.commissionsSuffix}</div>
        </div>
        <div className="gm-stat-card">
          <div className="gm-stat-value">{nbAgents || '—'}</div>
          <div className="gm-stat-label">{t.commissions.stats.agentsConcerned}</div>
          <div className="gm-stat-sub">
            {filtrePeriode ? `${t.commissions.stats.periodPrefix} ${filtrePeriode}` : t.commissions.stats.allPeriods}
          </div>
        </div>
      </div>

      {/* ONGLETS */}
      <div className="gm-tabs-bar">
        {ONGLETS.map(({ key, label }) => (
          <button
            key={key}
            className={`gm-tab-btn${onglet === key ? ' gm-active' : ''}`}
            onClick={() => setOnglet(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {succes && (
        <div className="gm-actions-bar" style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
          ✅ {succes}
        </div>
      )}

      {/* ONGLET : COMMISSIONS AGENTS */}
      <div className={`gm-tab-content${onglet === 'agents' ? ' gm-active' : ''}`}>
        <div className="gm-actions-bar">
          <div className="gm-filter-group" style={{ maxWidth: 200, flex: 'none' }}>
            <select value={filtrePeriode} onChange={(e) => setFiltrePeriode(e.target.value)}>
              <option value="">{t.commissions.periodOptions.all}</option>
              {Array.from({ length: 6 }).map((_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const noms = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
                return <option key={v} value={v}>{`${noms[d.getMonth()]} ${d.getFullYear()}`}</option>;
              })}
            </select>
          </div>
          {selectionnees.length > 0 && (
            <span className="gm-selected-count">
              <strong>
                {selectionnees.length} {t.commissions.toolbar.selectedSuffix} — {formatMontant(montantSelection)}
              </strong>
            </span>
          )}
          <GmButton
            variante="outline"
            petit
            disabled={commissionsPage.length === 0}
            onClick={() => basculerToutPage(true)}
          >
            {t.commissions.toolbar.selectAll}
          </GmButton>
          <GmButton
            variante="outline"
            petit
            disabled={aValider.length === 0 || enCours}
            style={{ opacity: aValider.length === 0 ? 0.5 : 1 }}
            onClick={() => handleValider(aValider)}
          >
            {t.commissions.toolbar.validate} ({aValider.length})
          </GmButton>
          <GmButton
            variante="primary"
            petit
            disabled={aPayer.length === 0 || enCours}
            style={{ opacity: aPayer.length === 0 ? 0.5 : 1 }}
            onClick={() => setModalOuverte(true)}
          >
            {t.commissions.toolbar.pay} ({aPayer.length})
          </GmButton>
          <div className="gm-actions-bar-right">
            {selectionnees.length > 0 && (
              <GmButton variante="ghost" petit onClick={() => setSelectionnees([])}>
                {t.commissions.toolbar.deselect}
              </GmButton>
            )}
            <GmExportMenu
              titre="Commissions"
              donnees={commissions}
              colonnes={colonnesExport}
              nomFichier="commissions"
            />
          </div>
        </div>

        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th className="gm-cb">
                  <input
                    type="checkbox"
                    checked={toutesPageSelectionnees}
                    onChange={(e) => basculerToutPage(e.target.checked)}
                    aria-label={t.commissions.toolbar.selectAllAria}
                  />
                </th>
                <th>{t.commissions.columns.agent}</th>
                <th>{t.commissions.columns.agence}</th>
                <th>{t.commissions.columns.periode}</th>
                <th style={{ textAlign: 'right' }}>{t.commissions.columns.transactions}</th>
                <th style={{ textAlign: 'right' }}>{t.commissions.columns.volTransactions}</th>
                <th style={{ textAlign: 'right' }}>{t.commissions.columns.taux}</th>
                <th style={{ textAlign: 'right' }}>{t.commissions.columns.commission}</th>
                <th>{t.commissions.columns.datePaiement}</th>
                <th>{t.commissions.columns.statut}</th>
                <th>{t.commissions.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 28, color: 'var(--gm-text-2)' }}>
                    {t.commissions.table.loading}
                  </td>
                </tr>
              )}
              {!isLoading && commissionsPage.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 28, color: 'var(--gm-text-2)' }}>
                    {t.commissions.table.empty}
                  </td>
                </tr>
              )}
              {!isLoading &&
                commissionsPage.map((c) => {
                  const selectionnee = selectionnees.includes(c.id);
                  const pill = STATUT_PILL[c.statut] ?? { cls: 'gm-pill-pending', label: c.statut };
                  return (
                    <tr key={c.id} className={selectionnee ? 'gm-selected' : undefined}>
                      <td className="gm-cb">
                        <input
                          type="checkbox"
                          checked={selectionnee}
                          onChange={(e) => basculerLigne(c.id, e.target.checked)}
                          aria-label={`${t.commissions.toolbar.selectRowAria} ${c.agentNom}`}
                        />
                      </td>
                      <td>
                        <div className="gm-avatar-cell">
                          <div
                            className="gm-avatar"
                            style={{ background: couleurAvatar(c.agentId || c.agentNom || c.id) }}
                          >
                            {initiales(c.agentNom)}
                          </div>
                          <strong>{c.agentNom || '—'}</strong>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{c.agenceNom || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--gm-text-2)' }}>
                        {c.periode || '—'}
                      </td>
                      <td className="gm-amount-cell" style={{ textAlign: 'right' }}>
                        {c.nbTransactions.toLocaleString('fr-FR')}
                      </td>
                      <td
                        className="gm-amount-cell"
                        style={{ textAlign: 'right', color: 'var(--gm-text-2)', fontWeight: 500 }}
                      >
                        {formatMontant(c.montantTransactions)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--gm-primary)', fontWeight: 700 }}>
                        {c.tauxCommission} %
                      </td>
                      <td className="gm-amount-cell" style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatMontant(c.montantCommission)}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                        {c.datePaiement ? formatDate(c.datePaiement) : '—'}
                      </td>
                      <td>
                        <span className={`gm-status-pill ${pill.cls}`}>{pill.label}</span>
                      </td>
                      <td>
                        <div className="gm-action-btns">
                          {c.statut === 'calculee' && (
                            <button
                              className="gm-action-btn"
                              onClick={() => handleValider([c.id])}
                              disabled={valider.isPending}
                            >
                              {t.commissions.table.validate}
                            </button>
                          )}
                          {c.statut === 'validee' && (
                            <button
                              className="gm-action-btn"
                              onClick={() => handlePayer([c.id])}
                              disabled={payer.isPending}
                            >
                              {t.commissions.table.pay}
                            </button>
                          )}
                          {c.statut === 'payee' && (
                            <span style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          <div className="gm-pagination">
            <div className="gm-pag-info">
              {commissions.length} {t.commissions.stats.commissionsSuffix} — {t.common.page} {page} / {totalPages || 1}
            </div>
            <div className="gm-pag-controls">
              <button className="gm-pag-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`gm-pag-btn${p === page ? ' gm-active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="gm-pag-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </GmTableWrap>
      </div>

      {/* ONGLET : HISTORIQUE DES PAIEMENTS */}
      <div className={`gm-tab-content${onglet === 'historique' ? ' gm-active' : ''}`}>
        {/* Graphique 6 mois */}
        <div style={{ marginBottom: 20 }}>
          <Graphique6Mois commissions={commissions} t={t} />
        </div>

        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th>{t.commissions.columns.datePaiement}</th>
                <th>{t.commissions.columns.agent}</th>
                <th>{t.commissions.columns.agence}</th>
                <th>{t.commissions.columns.periode}</th>
                <th style={{ textAlign: 'right' }}>{t.commissions.columns.montant}</th>
                <th>{t.commissions.columns.statut}</th>
              </tr>
            </thead>
            <tbody>
              {historique.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 28, color: 'var(--gm-text-2)' }}>
                    {t.commissions.table.emptyHistory}
                  </td>
                </tr>
              )}
              {historique.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                    {c.datePaiement ? formatDate(c.datePaiement) : '—'}
                  </td>
                  <td>
                    <div className="gm-avatar-cell">
                      <div
                        className="gm-avatar"
                        style={{ background: couleurAvatar(c.agentId || c.agentNom || c.id) }}
                      >
                        {initiales(c.agentNom)}
                      </div>
                      <strong>{c.agentNom || '—'}</strong>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{c.agenceNom || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--gm-text-2)' }}>
                    {c.periode || '—'}
                  </td>
                  <td
                    className="gm-amount-cell"
                    style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gm-success)' }}
                  >
                    {formatMontant(c.montantCommission)}
                  </td>
                  <td>
                    <span className="gm-status-pill gm-pill-paid">{t.commissions.pills.paid}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GmTableWrap>
      </div>

      {/* ONGLET : OBJECTIFS */}
      <div className={`gm-tab-content${onglet === 'objectifs' ? ' gm-active' : ''}`}>
        <div className="gm-charts-grid">
          <div className="gm-chart-card">
            <div className="gm-chart-title">{t.commissions.objectifs.progressTitle}</div>
            <div className="gm-chart-sub">{t.commissions.objectifs.progressSub}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gm-primary)', marginBottom: 6 }}>
              {totalGeneral > 0 ? `${pctPaye}%` : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gm-text-2)', marginBottom: 12 }}>
              {formatMontant(totalPayees)} / {formatMontant(totalGeneral)}
            </div>
            <div className="gm-progress-bar">
              <div className="gm-progress-fill" style={{ width: `${pctPaye}%` }} />
            </div>
          </div>

          <div className="gm-chart-card">
            <div className="gm-chart-title">{t.commissions.objectifs.topTitle}</div>
            <div className="gm-chart-sub">
              {filtrePeriode ? `${t.commissions.stats.periodPrefix} ${filtrePeriode}` : t.commissions.stats.allPeriods}
            </div>
            {topAgent ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{topAgent.agentNom || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--gm-text-2)', marginBottom: 4 }}>{topAgent.agenceNom || '—'}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gm-primary)' }}>
                  {formatMontant(topAgent.montantCommission)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gm-text-2)', marginTop: 4 }}>
                  {formatMontant(topAgent.montantTransactions)} {t.commissions.objectifs.volumeSuffix}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--gm-text-2)' }}>—</div>
            )}
          </div>

          <div className="gm-chart-card">
            <div className="gm-chart-title">{t.commissions.objectifs.repartitionTitle}</div>
            <div className="gm-chart-sub">{commissions.length} {t.commissions.stats.commissionsSuffix}</div>
            <div className="gm-tariff-tier">
              <span className="gm-tariff-range">{t.commissions.objectifs.pendingLabel} ({nbCalculees})</span>
              <span className="gm-tariff-rate">{formatMontant(totalCalculees)}</span>
            </div>
            <div className="gm-tariff-tier">
              <span className="gm-tariff-range">{t.commissions.objectifs.validatedLabel} ({nbValidees})</span>
              <span className="gm-tariff-rate">{formatMontant(totalValidees)}</span>
            </div>
            <div className="gm-tariff-tier">
              <span className="gm-tariff-range">{t.commissions.objectifs.paidLabel} ({nbPayees})</span>
              <span className="gm-tariff-rate">{formatMontant(totalPayees)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ONGLET : PLANS TARIFAIRES */}
      <div className={`gm-tab-content${onglet === 'plans' ? ' gm-active' : ''}`}>
        <OngletPlans t={t} />
      </div>

      {/* ONGLET : TABLEAU DU MOIS */}
      <div className={`gm-tab-content${onglet === 'tableau' ? ' gm-active' : ''}`}>
        <OngletTableau t={t} />
      </div>

      {/* MODALE DE CONFIRMATION */}
      <div
        className={`gm-modal-overlay${modalOuverte ? ' gm-open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setModalOuverte(false); }}
      >
        <div className="gm-modal">
          <div className="gm-modal-header">
            <div className="gm-modal-title">{t.commissions.modal.title}</div>
            <button className="gm-modal-close" onClick={() => setModalOuverte(false)} aria-label={t.commissions.modal.close}>
              ✕
            </button>
          </div>
          <div className="gm-modal-body">
            <p style={{ fontSize: 13, color: 'var(--gm-text-2)', marginBottom: 16 }}>
              {t.commissions.modal.intro}
            </p>
            <div className="gm-modal-summary-row">
              <span>{t.commissions.modal.rowSelected}</span>
              <span style={{ fontWeight: 600 }}>{selectionnees.length}</span>
            </div>
            <div className="gm-modal-summary-row">
              <span>{t.commissions.modal.rowToValidate}</span>
              <span style={{ fontWeight: 600 }}>{aValider.length}</span>
            </div>
            <div className="gm-modal-summary-row">
              <span>{t.commissions.modal.rowToPay}</span>
              <span style={{ fontWeight: 600 }}>{aPayer.length}</span>
            </div>
            <div className="gm-modal-summary-row">
              <span style={{ fontSize: 14 }}>{t.commissions.modal.rowTotal}</span>
              <span style={{ color: 'var(--gm-success)' }}>{formatMontant(montantSelection)}</span>
            </div>
          </div>
          <div className="gm-modal-footer">
            <GmButton variante="outline" onClick={() => setModalOuverte(false)}>
              {t.common.cancel}
            </GmButton>
            <GmButton
              variante="primary"
              disabled={enCours || (aValider.length === 0 && aPayer.length === 0)}
              onClick={traiterSelection}
            >
              {enCours ? t.commissions.modal.processing : t.commissions.modal.confirm}
            </GmButton>
          </div>
        </div>
      </div>
    </>
  );
}
