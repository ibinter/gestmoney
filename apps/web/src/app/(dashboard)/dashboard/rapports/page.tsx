'use client';
import React, { useMemo, useState } from 'react';
import { formatMontant, formatDate } from '@/lib/formatters';
import { useRapports, useGenererRapport, RapportHistorique } from '@/hooks/useRapports';
import { exporterCsv } from '@/lib/exportCsv';
import { exporterXlsx } from '@/lib/exportPdf';
import { exportToPdf, ColumnType } from '@/lib/pdf';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';
import {
  GmPageHeader,
  GmButton,
  GmSectionTitle,
  GmTableWrap,
} from '@/components/gm';

const periodes = (t: Translations) => [
  { value: 'janvier_2024',     label: t.rapports.periods.janvier_2024      },
  { value: 'decembre_2023',    label: t.rapports.periods.decembre_2023     },
  { value: 'trimestre_4_2023', label: t.rapports.periods.trimestre_4_2023  },
];

const typesRapport = (t: Translations) => [
  { value: 'journalier',   label: t.rapports.typesRapport.journalier   },
  { value: 'hebdomadaire', label: t.rapports.typesRapport.hebdomadaire },
  { value: 'mensuel',      label: t.rapports.typesRapport.mensuel      },
];

const libellesType = (t: Translations): Record<RapportHistorique['type'], string> =>
  t.rapports.typeLabels;

/** Circonférence du donut (r = 45). */
const DONUT_R = 45;
const DONUT_C = 2 * Math.PI * DONUT_R;

export default function RapportsPage() {
  const [periode, setPeriode] = useState('janvier_2024');
  const { data, isLoading } = useRapports(periode);
  const genererRapport = useGenererRapport();
  const t = useT();
  const PERIODES = periodes(t);
  const TYPES_RAPPORT = typesRapport(t);
  const LIBELLES_TYPE = libellesType(t);

  const [succesGen, setSuccesGen] = useState('');
  const [rapport_courant, setRapportCourant] = useState<RapportHistorique | null>(null);

  // Présentation : modale de génération + filtres du tableau
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [typeGen, setTypeGen] = useState('mensuel');
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('tous');

  const COLONNES_OPERATEURS = [
    { titre: t.rapports.exports.report,      valeur: () => rapport_courant?.titre ?? '' },
    { titre: t.rapports.exports.operator,    valeur: (op: Record<string, unknown>) => String(op.label ?? '') },
    { titre: t.rapports.exports.amountFcfa,  valeur: (op: Record<string, unknown>) => Number(op.montant ?? 0), align: 'right' as const },
    { titre: t.rapports.exports.pctOfTotal,  valeur: (op: Record<string, unknown>) => Number(op.pct ?? 0),     align: 'right' as const },
  ];

  const handleTelecharger = (rapport: RapportHistorique) => {
    setRapportCourant(rapport);
    exporterCsv(
      parOperateur.map((op) => ({ ...op, periode: rapport.titre })),
      [
        { titre: t.rapports.exports.report,     valeur: () => rapport.titre },
        { titre: t.rapports.exports.operator,   valeur: (op) => op.label },
        { titre: t.rapports.exports.amountFcfa, valeur: (op) => op.montant },
        { titre: t.rapports.exports.pctOfTotal, valeur: (op) => op.pct },
      ],
      rapport.titre.toLowerCase().replace(/\s+/g, '_')
    );
  };

  const handleTelechargerPdf = (rapport: RapportHistorique) => {
    setRapportCourant(rapport);
    // Si le backend a généré un fichier, on le télécharge directement
    if (rapport.fileUrl) {
      window.open(rapport.fileUrl, '_blank');
      return;
    }
    const kpis = [
      { label: t.rapports.kpi.revenue,    valeur: formatMontant(ca) },
      { label: t.rapports.kpi.transactions, valeur: nbTransactions.toLocaleString('fr-FR') },
      { label: t.rapports.kpi.newClients, valeur: nouveauxClients.toString() },
      { label: t.rapports.kpi.avgTicket,  valeur: formatMontant(ticketMoyen) },
    ];
    exportToPdf({
      title: rapport.titre,
      columns: [
        { key: 'label',   label: t.rapports.exports.operator,   type: ColumnType.NAME },
        { key: 'montant', label: t.rapports.exports.amountFcfa, type: ColumnType.AMOUNT, align: 'right' },
        { key: 'pct',     label: t.rapports.exports.pctOfTotal, type: ColumnType.AMOUNT, align: 'right' },
      ],
      rows: parOperateur.map((op) => ({ ...op }) as Record<string, unknown>),
      options: {
        subtitle: t.rapports.exports.monthlyReport,
        period: rapport.titre,
        filename: rapport.titre.toLowerCase().replace(/\s+/g, '_'),
        kpis: kpis.map((k) => ({ label: k.label, value: k.valeur })),
      },
    });
  };

  const handleTelechargerXlsx = (rapport: RapportHistorique) => {
    setRapportCourant(rapport);
    exporterXlsx(
      parOperateur.map((op) => ({ ...op }) as Record<string, unknown>),
      COLONNES_OPERATEURS,
      { titre: rapport.titre, sousTitre: t.rapports.exports.monthlyReport, periode: rapport.titre, nomFichier: rapport.titre.toLowerCase().replace(/\s+/g,'_') }
    );
  };

  const handleExportPdfGlobal = () => {
    const kpis = [
      { label: t.rapports.kpi.revenue,      valeur: formatMontant(ca) },
      { label: t.rapports.kpi.transactions, valeur: nbTransactions.toLocaleString('fr-FR') },
      { label: t.rapports.kpi.newClients,   valeur: nouveauxClients.toString() },
      { label: t.rapports.kpi.avgTicket,    valeur: formatMontant(ticketMoyen) },
    ];
    exportToPdf({
      title: `${t.rapports.exports.report} ${PERIODES.find(p => p.value === periode)?.label ?? periode}`,
      columns: [
        { key: 'label',   label: t.rapports.exports.operator,   type: ColumnType.NAME },
        { key: 'montant', label: t.rapports.exports.amountFcfa, type: ColumnType.AMOUNT, align: 'right' },
        { key: 'pct',     label: t.rapports.exports.pctOfTotal, type: ColumnType.AMOUNT, align: 'right' },
      ],
      rows: parOperateur.map((op) => ({ ...op }) as Record<string, unknown>),
      options: {
        subtitle: t.rapports.exports.bi,
        period: PERIODES.find(p => p.value === periode)?.label,
        kpis: kpis.map((k) => ({ label: k.label, value: k.valeur })),
      },
    });
  };

  const handleGenerer = async () => {
    await genererRapport.mutateAsync({ periode, type: typeGen });
    setModaleOuverte(false);
    setSuccesGen(t.rapports.generation.queued);
    setTimeout(() => setSuccesGen(''), 4000);
  };

  const ca              = data?.ca              ?? 0;
  const nbTransactions  = data?.nbTransactions  ?? 0;
  const nouveauxClients = data?.nouveauxClients ?? 0;
  const ticketMoyen     = data?.ticketMoyen     ?? 0;
  const objectif        = data?.objectif        ?? 200_000_000;
  const progression     = data?.progression     ?? 0;
  const parOperateur    = data?.parOperateur    ?? [];
  const topAgents       = data?.topAgents       ?? [];
  const alertes         = data?.alertes         ?? [];
  const historique      = data?.historique      ?? [];

  // ─── Données dérivées (uniquement à partir des vraies données) ──────────────
  const totalOperateurs = useMemo(
    () => parOperateur.reduce((s, op) => s + (op.montant ?? 0), 0),
    [parOperateur],
  );

  /** Segments du donut, calculés depuis les montants réels. */
  const segments = useMemo(() => {
    let cumul = 0;
    return parOperateur.map((op) => {
      const part = totalOperateurs > 0 ? (op.montant / totalOperateurs) * 100 : 0;
      const offset = cumul;
      cumul += part;
      return { ...op, part, offset };
    });
  }, [parOperateur, totalOperateurs]);

  const maxAgent = useMemo(
    () => topAgents.reduce((m, a) => Math.max(m, a.montant ?? 0), 0),
    [topAgents],
  );

  const nbDisponibles = historique.filter((r) => r.statut === 'disponible').length;
  const nbEnCours     = historique.filter((r) => r.statut === 'generation').length;
  const dernier       = historique.length > 0
    ? historique.reduce((a, b) => (new Date(b.date) > new Date(a.date) ? b : a))
    : null;

  const historiqueFiltre = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return historique.filter((r) => {
      const okType = filtreType === 'tous' || r.type === filtreType;
      const okQ = q === '' || r.titre.toLowerCase().includes(q);
      return okType && okQ;
    });
  }, [historique, recherche, filtreType]);

  if (isLoading) {
    return (
      <>
        <div className="gm-page-header">
          <div>
            <h1 className="gm-page-title">{t.rapports.title}</h1>
            <p className="gm-page-sub">{t.rapports.subtitle}</p>
          </div>
        </div>
        <div className="gm-kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="gm-kpi-card" style={{ height: 96, opacity: 0.5 }} />
          ))}
        </div>
        <div className="gm-charts-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="gm-chart-card" style={{ height: 200, opacity: 0.5 }} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <GmPageHeader
        titre={t.rapports.title}
        sousTitre={t.rapports.subtitle}
        fil={[t.common.home, t.rapports.breadcrumb]}
        actions={
          <>
            <select
              className="gm-filter-select"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              aria-label={t.rapports.periodAria}
            >
              {PERIODES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <GmButton variante="outline" petit onClick={handleExportPdfGlobal}>
              📄 {t.rapports.exportPdf}
            </GmButton>
            <GmButton variante="primary" petit onClick={() => setModaleOuverte(true)}>
              📊 {t.rapports.generate}
            </GmButton>
          </>
        }
      />

      {/* ─── Statistiques du centre de rapports ─── */}
      <div className="gm-stats-grid">
        <div className="gm-stat-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="gm-stat-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>📊</div>
          <div>
            <div className="gm-stat-label">{t.rapports.stats.available}</div>
            <div className="gm-stat-value">{nbDisponibles}</div>
            <div className="gm-stat-sub">{historique.length} {t.rapports.stats.totalOnPeriod}</div>
          </div>
        </div>
        <div className="gm-stat-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="gm-stat-icon" style={{ background: 'rgba(245,184,0,0.15)' }}>⏳</div>
          <div>
            <div className="gm-stat-label">{t.rapports.stats.generating}</div>
            <div className="gm-stat-value">{nbEnCours}</div>
            <div className="gm-stat-sub">
              {nbEnCours > 0 ? t.rapports.stats.processing : t.rapports.stats.noProcessing}
            </div>
          </div>
        </div>
        <div className="gm-stat-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="gm-stat-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>✅</div>
          <div>
            <div className="gm-stat-label">{t.rapports.stats.lastReport}</div>
            <div className="gm-stat-value" style={{ fontSize: 18 }}>
              {dernier ? formatDate(dernier.date) : '—'}
            </div>
            <div className="gm-stat-sub">{dernier ? dernier.titre : '—'}</div>
          </div>
        </div>
      </div>

      {/* ─── KPIs de la période ─── */}
      <div className="gm-kpi-grid">
        <div className="gm-kpi-card">
          <div className="gm-kpi-label">{t.rapports.kpi.revenue}</div>
          <div className="gm-kpi-value">{formatMontant(ca)}</div>
          {typeof data?.variationCa === 'number' && (
            <div className={clsx('gm-kpi-trend', data.variationCa >= 0 ? 'gm-trend-up' : 'gm-trend-down')}>
              {data.variationCa >= 0 ? '▲' : '▼'} {Math.abs(data.variationCa)}%
            </div>
          )}
        </div>
        <div className="gm-kpi-card">
          <div className="gm-kpi-label">{t.rapports.kpi.transactions}</div>
          <div className="gm-kpi-value">{nbTransactions.toLocaleString('fr-FR')}</div>
          {typeof data?.variationTx === 'number' && (
            <div className={clsx('gm-kpi-trend', data.variationTx >= 0 ? 'gm-trend-up' : 'gm-trend-down')}>
              {data.variationTx >= 0 ? '▲' : '▼'} {Math.abs(data.variationTx)}%
            </div>
          )}
        </div>
        <div className="gm-kpi-card">
          <div className="gm-kpi-label">{t.rapports.kpi.newClients}</div>
          <div className="gm-kpi-value">{nouveauxClients.toLocaleString('fr-FR')}</div>
          {typeof data?.variationClients === 'number' && (
            <div className={clsx('gm-kpi-trend', data.variationClients >= 0 ? 'gm-trend-up' : 'gm-trend-down')}>
              {data.variationClients >= 0 ? '▲' : '▼'} {Math.abs(data.variationClients)}%
            </div>
          )}
        </div>
        <div className="gm-kpi-card">
          <div className="gm-kpi-label">{t.rapports.kpi.avgTicket}</div>
          <div className="gm-kpi-value">{formatMontant(ticketMoyen)}</div>
          <div className="gm-kpi-trend gm-trend-neutral">{t.rapports.kpi.onPeriod}</div>
        </div>
      </div>

      {/* ─── Message de génération ─── */}
      {succesGen && (
        <div className="gm-alert-banner" style={{ marginBottom: 20 }}>
          <div className="gm-alert-icon">⏳</div>
          <div className="gm-alert-content">
            <div className="gm-alert-title">{t.rapports.generation.bannerTitle}</div>
            <div className="gm-alert-desc">{succesGen}</div>
          </div>
        </div>
      )}

      {/* ─── Alertes BI ─── */}
      {alertes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {alertes.map((a) => (
            <div key={a.id} className="gm-alert-banner">
              <div className="gm-alert-icon">
                {a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟡' : 'ℹ️'}
              </div>
              <div className="gm-alert-content">
                <div className="gm-alert-desc">{a.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Aperçu rapide ─── */}
      <GmSectionTitle
        action={
          <span style={{ fontSize: 12, color: 'var(--gm-text-2)', fontWeight: 400 }}>
            {PERIODES.find((p) => p.value === periode)?.label ?? periode}
          </span>
        }
      >
        {t.rapports.overview.title}
      </GmSectionTitle>
      <div className="gm-charts-grid">

        {/* Donut — répartition par opérateur */}
        <div className="gm-chart-card">
          <div className="gm-chart-title">{t.rapports.overview.byOperator}</div>
          <div className="gm-chart-sub">
            {totalOperateurs > 0
              ? `${formatMontant(totalOperateurs)} ${t.rapports.overview.totalSuffix}`
              : '—'}
          </div>
          {segments.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>—</div>
          ) : (
            <svg viewBox="0 0 200 140" width="100%" xmlns="http://www.w3.org/2000/svg">
              <g transform="rotate(-90 70 70)">
                {segments.map((s) => (
                  <circle
                    key={s.key}
                    cx="70"
                    cy="70"
                    r={DONUT_R}
                    fill="none"
                    stroke={s.couleur}
                    strokeWidth="18"
                    strokeDasharray={`${(s.part / 100) * DONUT_C} ${DONUT_C}`}
                    strokeDashoffset={-((s.offset / 100) * DONUT_C)}
                    opacity="0.9"
                  />
                ))}
              </g>
              <text x="70" y="68" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--gm-text)">
                {nbTransactions.toLocaleString('fr-FR')}
              </text>
              <text x="70" y="80" textAnchor="middle" fontSize="7" fill="var(--gm-text-2)">
                {t.rapports.overview.transactions}
              </text>
              {segments.slice(0, 5).map((s, i) => (
                <g key={s.key}>
                  <rect x="130" y={20 + i * 19} width="9" height="9" rx="2" fill={s.couleur} opacity="0.9" />
                  <text x="144" y={28 + i * 19} fontSize="8.5" fontWeight="600" fill="var(--gm-text)">
                    {s.label} {Math.round(s.part)}%
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>

        {/* Barres — top agents */}
        <div className="gm-chart-card">
          <div className="gm-chart-title">{t.rapports.overview.topAgents}</div>
          <div className="gm-chart-sub">{t.rapports.overview.topAgentsSub}</div>
          {topAgents.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>—</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topAgents.map((agent, i) => (
                <div key={`${agent.nom}-${i}`}>
                  <div className="gm-progress-label">
                    <span>{agent.badge || i + 1} {agent.nom}</span>
                    <span>{formatMontant(agent.montant)}</span>
                  </div>
                  <div className="gm-progress-bar">
                    <div
                      className="gm-progress-fill"
                      style={{ width: `${maxAgent > 0 ? (agent.montant / maxAgent) * 100 : 0}%` }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gm-text-2)', marginTop: 2 }}>
                    {agent.agence} — {agent.nbTx} {t.rapports.overview.txSuffix}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progression vers l'objectif */}
        <div className="gm-chart-card">
          <div className="gm-chart-title">{t.rapports.overview.progressTitle}</div>
          <div className="gm-chart-sub">{t.rapports.overview.objectivePrefix} {formatMontant(objectif)}</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 10 }}>
            {progression}%
          </div>
          <div className="gm-progress-bar" style={{ height: 14 }}>
            <div className="gm-progress-fill" style={{ width: `${Math.min(progression, 100)}%` }} />
          </div>
          <div className="gm-progress-label" style={{ marginTop: 10 }}>
            <span>{formatMontant(ca)} {t.rapports.achieved}</span>
            <span>{t.rapports.objective} : {formatMontant(objectif)}</span>
          </div>
        </div>
      </div>

      {/* ─── Historique des rapports ─── */}
      <GmSectionTitle>{t.rapports.history}</GmSectionTitle>
      <GmTableWrap>
        <div className="gm-table-toolbar">
          <div className="gm-table-toolbar-left">
            <input
              type="text"
              className="gm-search-input"
              placeholder={t.rapports.table.searchPlaceholder}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              style={{ width: 220 }}
            />
            <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} aria-label={t.rapports.table.typeFilterAria}>
              <option value="tous">{t.rapports.table.allTypes}</option>
              <option value="journalier">{t.rapports.typeLabels.journalier}</option>
              <option value="hebdomadaire">{t.rapports.typeLabels.hebdomadaire}</option>
              <option value="mensuel">{t.rapports.typeLabels.mensuel}</option>
            </select>
          </div>
          <span className="gm-sort-note">
            {historiqueFiltre.length} {t.rapports.table.countSuffix}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>{t.rapports.table.colName}</th>
                <th>{t.common.date}</th>
                <th>{t.common.type}</th>
                <th>{t.rapports.table.colSize}</th>
                <th>{t.common.statut}</th>
                <th>{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {historiqueFiltre.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--gm-text-2)' }}>
                    {t.rapports.table.empty}
                  </td>
                </tr>
              ) : (
                historiqueFiltre.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.titre}</td>
                    <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{formatDate(r.date)}</td>
                    <td>
                      <span className="gm-badge gm-badge-info" style={{ fontSize: 10 }}>
                        {LIBELLES_TYPE[r.type] ?? r.type}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{r.taille || '—'}</td>
                    <td>
                      <span
                        className={clsx(
                          'gm-status-pill',
                          r.statut === 'disponible' ? 'gm-pill-success' : 'gm-pill-pending',
                        )}
                      >
                        {r.statut === 'disponible'
                          ? t.rapports.table.statusAvailable
                          : t.rapports.table.statusInProgress}
                      </span>
                    </td>
                    <td>
                      {r.statut === 'disponible' ? (
                        <div className="gm-action-btns">
                          <button className="gm-action-btn" onClick={() => handleTelecharger(r)}>
                            📥 CSV
                          </button>
                          <button className="gm-action-btn" onClick={() => handleTelechargerXlsx(r)}>
                            📊 XLSX
                          </button>
                          <button className="gm-action-btn" onClick={() => handleTelechargerPdf(r)}>
                            📄 PDF
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GmTableWrap>

      {/* ─── Modale : générer un rapport ─── */}
      <div
        className={clsx('gm-modal-overlay', modaleOuverte && 'gm-open')}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModaleOuverte(false);
        }}
      >
        <div className="gm-modal">
          <div className="gm-modal-head">
            <div className="gm-modal-title">📊 {t.rapports.generate}</div>
            <button className="gm-modal-close" onClick={() => setModaleOuverte(false)} aria-label={t.rapports.generation.closeAria}>
              ✕
            </button>
          </div>
          <div className="gm-modal-body">
            <div className="gm-form-group">
              <label htmlFor="gen-type">{t.rapports.generation.typeLabel}</label>
              <select id="gen-type" value={typeGen} onChange={(e) => setTypeGen(e.target.value)}>
                {TYPES_RAPPORT.map((ty) => (
                  <option key={ty.value} value={ty.value}>{ty.label}</option>
                ))}
              </select>
            </div>
            <div className="gm-form-group">
              <label htmlFor="gen-periode">{t.rapports.generation.periodLabel}</label>
              <select id="gen-periode" value={periode} onChange={(e) => setPeriode(e.target.value)}>
                {PERIODES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="gm-modal-foot">
            <GmButton variante="outline" onClick={() => setModaleOuverte(false)}>
              {t.common.cancel}
            </GmButton>
            <GmButton variante="primary" onClick={handleGenerer} disabled={genererRapport.isPending}>
              {genererRapport.isPending ? t.rapports.generation.inProgress : `📊 ${t.rapports.generate}`}
            </GmButton>
          </div>
        </div>
      </div>
    </>
  );
}
