'use client';
// ============================================================
// PAGE COMMISSIONS — GESTMONEY
// Présentation fidèle à /mockup/commissions.html (classes gm-*).
// Toutes les valeurs proviennent des données réelles (useCommissions).
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { useCommissions, useValiderCommissions, usePayerCommissions } from '@/hooks/useCommissions';
import { Commission } from '@/types';
import { formatMontant, formatDate } from '@/lib/formatters';
import { exporterCsv } from '@/lib/exportCsv';
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

type Onglet = 'agents' | 'historique' | 'objectifs';

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
  // Repli sur fixtures : on l'affiche, jamais de faux montants silencieux.
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

  // Logique de traitement groupé — inchangée
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

  const exporter = () =>
    exporterCsv(
      commissions,
      [
        { titre: t.commissions.csv.agent, valeur: (c) => c.agentNom },
        { titre: t.commissions.csv.agence, valeur: (c) => c.agenceNom },
        { titre: t.commissions.csv.periode, valeur: (c) => c.periode },
        { titre: t.commissions.csv.transactions, valeur: (c) => c.nbTransactions },
        { titre: t.commissions.csv.montantTransactions, valeur: (c) => c.montantTransactions },
        { titre: t.commissions.csv.taux, valeur: (c) => c.tauxCommission },
        { titre: t.commissions.csv.commission, valeur: (c) => c.montantCommission },
        { titre: t.commissions.csv.statut, valeur: (c) => STATUT_LABELS[c.statut] ?? c.statut },
        { titre: t.commissions.csv.datePaiement, valeur: (c) => (c.datePaiement ? formatDate(c.datePaiement) : '') },
      ],
      'commissions',
    );

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

  return (
    <>
      <GmPageHeader
        fil={[`🏠 ${t.common.home}`, t.commissions.breadcrumb]}
        titre={t.commissions.title}
        sousTitre={t.commissions.subtitle}
        actions={
          <>
            <GmButton variante="outline" petit onClick={exporter}>
              {t.commissions.exportCsv}
            </GmButton>
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

      {/* L'API commissions est injoignable : les montants ci-dessous sont des
          données de démonstration. Ne jamais les présenter comme réels. */}
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

      {/* STATS — valeurs calculées sur les données réelles */}
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
        <button
          className={`gm-tab-btn${onglet === 'agents' ? ' gm-active' : ''}`}
          onClick={() => setOnglet('agents')}
        >
          {t.commissions.tabs.agents}
        </button>
        <button
          className={`gm-tab-btn${onglet === 'historique' ? ' gm-active' : ''}`}
          onClick={() => setOnglet('historique')}
        >
          {t.commissions.tabs.historique}
        </button>
        <button
          className={`gm-tab-btn${onglet === 'objectifs' ? ' gm-active' : ''}`}
          onClick={() => setOnglet('objectifs')}
        >
          {t.commissions.tabs.objectifs}
        </button>
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
              <option value="2024-01">{t.commissions.periodOptions.m202401}</option>
              <option value="2024-02">{t.commissions.periodOptions.m202402}</option>
              <option value="2024-03">{t.commissions.periodOptions.m202403}</option>
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
            <GmButton variante="outline" petit onClick={exporter}>
              {t.commissions.exportCsv}
            </GmButton>
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
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                  {topAgent.agentNom || '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gm-text-2)', marginBottom: 4 }}>
                  {topAgent.agenceNom || '—'}
                </div>
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

      {/* MODALE DE CONFIRMATION — montants réels de la sélection */}
      <div
        className={`gm-modal-overlay${modalOuverte ? ' gm-open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalOuverte(false);
        }}
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
