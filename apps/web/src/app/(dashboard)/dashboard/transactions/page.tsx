'use client';
// ============================================================
// PAGE TRANSACTIONS — GESTMONEY
// Présentation calquée sur mockup/transactions.html (classes gm-*)
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge, badgeStatutTransaction } from '@/components/ui/Badge';
import { GmPageHeader, GmButton, GmTableWrap } from '@/components/gm';
import { useTransactions, useCreateTransaction, useValiderTransaction } from '@/hooks/useTransactions';
import { Transaction, TypeTransaction, StatutTransaction, Operateur, OPERATEURS } from '@/types';
import { formatMontant, formatDate, formatDateTime } from '@/lib/formatters';
import { exporterCsv } from '@/lib/exportCsv';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

/** Libellés de type d'opération pour la langue active. */
const typeLabels = (t: Translations): Record<TypeTransaction, string> => t.transactions.types;

/** Libellés de statut pour la langue active. */
const statutLabels = (t: Translations): Record<StatutTransaction, string> => t.transactions.statutLabels;

/** Classe de badge « gm-* » pour un type d'opération. */
const CLASSE_BADGE_TYPE: Record<TypeTransaction, string> = {
  depot: 'gm-badge-depot',
  retrait: 'gm-badge-retrait',
  cash_in: 'gm-badge-cashin',
  cash_out: 'gm-badge-cashout',
  transfert: 'gm-badge-transfert',
  paiement: 'gm-badge-transfert',
};

/** Classe de pastille « gm-* » pour un statut. */
const CLASSE_PILL_STATUT: Record<StatutTransaction, string> = {
  success: 'gm-pill-success',
  pending: 'gm-pill-pending',
  failed: 'gm-pill-failed',
  cancelled: 'gm-pill-failed',
};

/** Colonnes triables : clé de tri ↔ libellé affiché. */
type CleTri = 'date' | 'type' | 'agentNom' | 'agenceNom' | 'operateur' | 'clientNom' | 'montant' | 'commission' | 'statut';

const colonnesTriables = (t: Translations): { cle: CleTri; titre: string }[] => [
  { cle: 'date', titre: t.transactions.columns.date },
  { cle: 'type', titre: t.transactions.columns.type },
  { cle: 'agentNom', titre: t.transactions.columns.agent },
  { cle: 'agenceNom', titre: t.transactions.columns.agence },
  { cle: 'operateur', titre: t.transactions.columns.operateur },
  { cle: 'clientNom', titre: t.transactions.columns.client },
  { cle: 'montant', titre: t.transactions.columns.montant },
  { cle: 'commission', titre: t.transactions.columns.commission },
  { cle: 'statut', titre: t.transactions.columns.statut },
];

export default function TransactionsPage() {
  const t = useT();
  const TYPE_LABELS = typeLabels(t);
  const STATUT_LABELS = statutLabels(t);
  const COLONNES_TRIABLES = colonnesTriables(t);
  const [search, setSearch] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [filtreOperateur, setFiltreOperateur] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [selectionnees, setSelectionnees] = useState<string[]>([]);
  const [modalOuvert, setModalOuvert] = useState<TypeTransaction | null>(null);
  const [formTx, setFormTx] = useState({ operateur: 'orange_money', montant: '', clientNom: '', clientTel: '' });
  const [erreurTx, setErreurTx] = useState('');
  const [succesTx, setSuccesTx] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  const [transactionSelectionnee, setTransactionSelectionnee] = useState<Transaction | null>(null);
  const [tri, setTri] = useState<{ cle: CleTri; sens: 'asc' | 'desc' }>({ cle: 'date', sens: 'desc' });

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, filtreType, filtreOperateur, filtreStatut, dateDebut, dateFin]);

  const creerTransaction = useCreateTransaction();
  const validerTransaction = useValiderTransaction();

  const handleSubmitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurTx('');
    const montant = Number(formTx.montant);
    if (!montant || montant <= 0) { setErreurTx(t.common.invalidAmount); return; }
    if (!modalOuvert) return;
    try {
      await creerTransaction.mutateAsync({
        type: modalOuvert,
        operateur: formTx.operateur as Operateur,
        montant,
        clientNom: formTx.clientNom || undefined,
        clientTel: formTx.clientTel || undefined,
      });
      setSuccesTx(t.transactions.form.success);
      setFormTx({ operateur: 'orange_money', montant: '', clientNom: '', clientTel: '' });
      setTimeout(() => { setModalOuvert(null); setSuccesTx(''); }, 1500);
    } catch {
      setErreurTx(t.common.createError);
    }
  };

  const { data, isLoading, isError, isFetching, refetch } = useTransactions({
    search: search || undefined,
    type: (filtreType as TypeTransaction) || undefined,
    operateur: (filtreOperateur as Operateur) || undefined,
    statut: (filtreStatut as StatutTransaction) || undefined,
    dateDebut: dateDebut || undefined,
    dateFin: dateFin || undefined,
    page,
    limit: LIMIT,
  });

  const transactions = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.total ?? transactions.length;

  // Filtrage par plage de dates (appliqué côté client sur les lignes renvoyées)
  const lignesFiltrees = useMemo(() => {
    if (!dateDebut && !dateFin) return transactions;
    return transactions.filter((tx) => {
      const jour = new Date(tx.date).toISOString().slice(0, 10);
      if (dateDebut && jour < dateDebut) return false;
      if (dateFin && jour > dateFin) return false;
      return true;
    });
  }, [transactions, dateDebut, dateFin]);

  // Tri côté client sur les lignes affichées
  const lignes = useMemo(() => {
    const copie = [...lignesFiltrees];
    copie.sort((a, b) => {
      const va = a[tri.cle];
      const vb = b[tri.cle];
      let cmp: number;
      if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
      else cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'fr');
      return tri.sens === 'asc' ? cmp : -cmp;
    });
    return copie;
  }, [lignesFiltrees, tri]);

  const basculerTri = (cle: CleTri) =>
    setTri((t0) => (t0.cle === cle ? { cle, sens: t0.sens === 'asc' ? 'desc' : 'asc' } : { cle, sens: 'desc' }));

  // Stats calculées sur les lignes réellement affichées
  const volumePage = lignes.reduce((s, tx) => s + tx.montant, 0);
  const nbSucces = lignes.filter((tx) => tx.statut === 'success').length;
  const nbAttente = lignes.filter((tx) => tx.statut === 'pending').length;
  const nbEchecs = lignes.filter((tx) => tx.statut === 'failed' || tx.statut === 'cancelled').length;
  const pct = (n: number) =>
    lignes.length
      ? `${((n / lignes.length) * 100).toFixed(1).replace('.', ',')} % ${t.transactions.stats.ofPage}`
      : '—';

  const toutSelectionne = lignes.length > 0 && lignes.every((tx) => selectionnees.includes(tx.id));
  const basculerTout = (coche: boolean) =>
    setSelectionnees(coche ? Array.from(new Set([...selectionnees, ...lignes.map((tx) => tx.id)])) : selectionnees.filter((id) => !lignes.some((tx) => tx.id === id)));
  const basculerLigne = (id: string) =>
    setSelectionnees((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const reinitialiser = () => {
    setFiltreType(''); setFiltreOperateur(''); setFiltreStatut('');
    setSearch(''); setDateDebut(''); setDateFin(''); setPage(1);
  };

  const exporter = () =>
    exporterCsv(lignes, [
      { titre: t.common.date, valeur: (tx) => formatDate(tx.date) },
      { titre: t.common.reference, valeur: (tx) => tx.reference },
      { titre: t.common.type, valeur: (tx) => TYPE_LABELS[tx.type] ?? tx.type },
      { titre: t.common.agent, valeur: (tx) => tx.agentNom },
      { titre: t.common.agency, valeur: (tx) => tx.agenceNom },
      { titre: t.common.operator, valeur: (tx) => tx.operateur },
      { titre: t.common.client, valeur: (tx) => tx.clientNom ?? '' },
      { titre: t.common.phone, valeur: (tx) => tx.clientTel ?? '' },
      { titre: `${t.common.amount} (FCFA)`, valeur: (tx) => tx.montant },
      { titre: `${t.transactions.detail.fees} (FCFA)`, valeur: (tx) => tx.frais },
      { titre: `${t.common.commission} (FCFA)`, valeur: (tx) => tx.commission },
      { titre: t.common.statut, valeur: (tx) => STATUT_LABELS[tx.statut] ?? tx.statut },
    ], 'transactions');

  // Numéros de page affichés dans la pagination
  const numerosPages: number[] = [];
  for (let i = 0; i < Math.min(totalPages, 5); i++) {
    const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
    if (p >= 1 && p <= totalPages) numerosPages.push(p);
  }

  return (
    <>
      <GmPageHeader
        fil={[`🏠 ${t.common.home}`, t.transactions.title]}
        titre={<>💳 {t.transactions.title}</>}
        sousTitre={t.transactions.subtitle}
        actions={
          <>
            <GmButton variante="ghost" petit className="gm-btn-success" onClick={() => setModalOuvert('depot')}>+ {TYPE_LABELS.depot}</GmButton>
            <GmButton variante="ghost" petit className="gm-btn-danger" onClick={() => setModalOuvert('retrait')}>+ {TYPE_LABELS.retrait}</GmButton>
            <GmButton variante="ghost" petit className="gm-btn-info" onClick={() => setModalOuvert('cash_in')}>+ Cash In</GmButton>
            <GmButton variante="outline" petit onClick={() => setModalOuvert('cash_out')}>+ Cash Out</GmButton>
            <GmButton variante="ghost" petit onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? `⏳ ${t.common.refreshing}` : `↻ ${t.common.refresh}`}
            </GmButton>
            <GmButton variante="ghost" petit className="gm-btn-export" onClick={exporter}>📥 {t.transactions.exportCsv}</GmButton>
          </>
        }
      />

      {/* STATS — calculées sur les données réelles */}
      <div className="gm-stats-row">
        <div className="gm-stat-card gm-total">
          <div className="gm-stat-value">{totalItems.toLocaleString('fr-FR')}</div>
          <div className="gm-stat-label">{t.transactions.stats.totalLabel}</div>
          <div className="gm-stat-sub">{lignes.length} {t.transactions.stats.displayedOnPage}</div>
        </div>
        <div className="gm-stat-card gm-amount">
          <div className="gm-stat-value">{formatMontant(volumePage)}</div>
          <div className="gm-stat-label">{t.transactions.stats.pageVolume}</div>
          <div className="gm-stat-sub">{t.common.page} {page} / {totalPages}</div>
        </div>
        <div className="gm-stat-card gm-success">
          <div className="gm-stat-value">{nbSucces}</div>
          <div className="gm-stat-label">{t.transactions.stats.succeeded}</div>
          <div className="gm-stat-sub">{pct(nbSucces)}</div>
        </div>
        <div className="gm-stat-card gm-pending">
          <div className="gm-stat-value">{nbAttente}</div>
          <div className="gm-stat-label">{t.transactions.stats.pending}</div>
          <div className="gm-stat-sub">{pct(nbAttente)}</div>
        </div>
        <div className="gm-stat-card gm-failed">
          <div className="gm-stat-value">{nbEchecs}</div>
          <div className="gm-stat-label">{t.transactions.stats.failedCancelled}</div>
          <div className="gm-stat-sub">{pct(nbEchecs)}</div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="gm-filters-card">
        <div className="gm-filters-row">
          <div className="gm-filter-group">
            <label htmlFor="f-date-debut">{t.transactions.filters.dateStart}</label>
            <input id="f-date-debut" type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          </div>
          <div className="gm-filter-group">
            <label htmlFor="f-date-fin">{t.transactions.filters.dateEnd}</label>
            <input id="f-date-fin" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
          </div>
          <div className="gm-filter-group">
            <label htmlFor="f-type">{t.common.type}</label>
            <select id="f-type" value={filtreType} onChange={(e) => setFiltreType(e.target.value)}>
              <option value="">{t.transactions.filters.allTypes}</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="gm-filter-group">
            <label htmlFor="f-op">{t.common.operator}</label>
            <select id="f-op" value={filtreOperateur} onChange={(e) => setFiltreOperateur(e.target.value)}>
              <option value="">{t.common.all}</option>
              {Object.entries(OPERATEURS).map(([v, o]) => <option key={v} value={v}>{o.label}</option>)}
            </select>
          </div>
          <div className="gm-filter-group">
            <label htmlFor="f-statut">{t.common.statut}</label>
            <select id="f-statut" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
              <option value="">{t.common.all}</option>
              {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="gm-filter-group gm-filter-search">
            <label htmlFor="f-search">{t.transactions.filters.search}</label>
            <input
              id="f-search"
              type="text"
              placeholder={t.transactions.filters.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="gm-filters-actions">
            <GmButton variante="outline" petit onClick={reinitialiser}>{t.common.reset}</GmButton>
          </div>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="gm-table-card">
        <div className="gm-table-toolbar">
          <div className="gm-table-toolbar-left">
            <div className="gm-selected-count">
              {t.transactions.toolbar.showing} <strong>{lignes.length}</strong> {t.transactions.toolbar.onTotal} {totalItems.toLocaleString('fr-FR')} {t.transactions.title.toLowerCase()}
              {selectionnees.length > 0 && <> — <strong>{selectionnees.length}</strong> {t.transactions.toolbar.selectedSuffix}</>}
            </div>
          </div>
          <div className="gm-sort-note">
            {selectionnees.length > 0
              ? <GmButton variante="ghost" petit onClick={() => setSelectionnees([])}>{t.transactions.toolbar.deselect}</GmButton>
              : t.transactions.toolbar.sortHint}
          </div>
        </div>

        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th className="gm-checkbox-col">
                  <input
                    type="checkbox"
                    aria-label={t.transactions.toolbar.selectAll}
                    checked={toutSelectionne}
                    onChange={(e) => basculerTout(e.target.checked)}
                  />
                </th>
                <th>{t.common.reference}</th>
                {COLONNES_TRIABLES.map((c) => (
                  <th
                    key={c.cle}
                    className={tri.cle === c.cle ? 'gm-sorted' : undefined}
                    onClick={() => basculerTri(c.cle)}
                    style={{ cursor: 'pointer' }}
                  >
                    {c.titre}
                    <span className="gm-sort-icon">{tri.cle === c.cle ? (tri.sens === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                ))}
                <th>{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '32px', color: 'var(--gm-text-2)' }}>{t.transactions.table.loading}</td></tr>
              )}
              {!isLoading && isError && (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '32px', color: 'var(--gm-danger)' }}>{t.transactions.table.error}</td></tr>
              )}
              {!isLoading && !isError && lignes.length === 0 && (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '32px', color: 'var(--gm-text-2)' }}>{t.transactions.table.empty}</td></tr>
              )}
              {!isLoading && !isError && lignes.map((tx) => (
                <tr key={tx.id} className={selectionnees.includes(tx.id) ? 'gm-selected' : undefined}>
                  <td className="gm-checkbox-col">
                    <input
                      type="checkbox"
                      aria-label={`${t.transactions.toolbar.selectRow} ${tx.reference}`}
                      checked={selectionnees.includes(tx.id)}
                      onChange={() => basculerLigne(tx.id)}
                    />
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--gm-text-2)' }}>{tx.reference}</td>
                  <td style={{ color: 'var(--gm-text-2)', fontSize: '12px' }}>{formatDateTime(tx.date)}</td>
                  <td>
                    <span className={`gm-badge ${CLASSE_BADGE_TYPE[tx.type] ?? 'gm-badge-depot'}`}>
                      {TYPE_LABELS[tx.type] ?? tx.type}
                    </span>
                  </td>
                  <td><strong>{tx.agentNom || '—'}</strong></td>
                  <td style={{ fontSize: '12px', color: 'var(--gm-text-2)' }}>{tx.agenceNom || '—'}</td>
                  <td>
                    <span className="gm-op-logo">
                      <span className="gm-op-dot" style={{ background: OPERATEURS[tx.operateur]?.couleur ?? '#999' }} />
                      {OPERATEURS[tx.operateur]?.label ?? tx.operateur}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px' }}>{tx.clientNom || '—'}</td>
                  <td className="gm-amount-cell">{formatMontant(tx.montant)}</td>
                  <td style={{ fontSize: '12px', color: 'var(--gm-text-2)' }}>{formatMontant(tx.commission)}</td>
                  <td>
                    <span className={`gm-status-pill ${CLASSE_PILL_STATUT[tx.statut] ?? 'gm-pill-pending'}`}>
                      ● {STATUT_LABELS[tx.statut] ?? tx.statut}
                    </span>
                  </td>
                  <td>
                    <div className="gm-action-btns">
                      <button className="gm-icon-btn" title={t.transactions.table.viewDetail} onClick={() => setTransactionSelectionnee(tx)}>👁</button>
                      {tx.statut === 'pending' && (
                        <button
                          className="gm-icon-btn"
                          title={t.transactions.table.validateTx}
                          onClick={() => validerTransaction.mutate(tx.id)}
                          disabled={validerTransaction.isPending}
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GmTableWrap>

        {/* PAGINATION */}
        <div className="gm-pagination">
          <div className="gm-pag-info">
            {totalItems.toLocaleString('fr-FR')} {t.common.results} — {t.common.page} {page} {t.transactions.pagination.onPage} {totalPages}
          </div>
          <div className="gm-pag-controls">
            <button className="gm-pag-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label={t.transactions.pagination.prevPage}>‹</button>
            {numerosPages.map((p) => (
              <button key={p} className={`gm-pag-btn${p === page ? ' gm-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="gm-pag-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label={t.transactions.pagination.nextPage}>›</button>
          </div>
        </div>
      </div>

      {/* Modal détail transaction */}
      <Modal
        ouvert={!!transactionSelectionnee}
        onFermer={() => setTransactionSelectionnee(null)}
        titre={t.transactions.detail.title}
        taille="md"
      >
        {transactionSelectionnee && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-gray-600">{transactionSelectionnee.reference}</span>
              <Badge couleur={badgeStatutTransaction(transactionSelectionnee.statut)} point>
                {STATUT_LABELS[transactionSelectionnee.statut]}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{t.common.type}</p>
                <p className="font-semibold">{TYPE_LABELS[transactionSelectionnee.type]}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{t.common.operator}</p>
                <p className="font-semibold">{OPERATEURS[transactionSelectionnee.operateur]?.logo} {OPERATEURS[transactionSelectionnee.operateur]?.label}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{t.common.amount}</p>
                <p className="font-bold text-lg text-text-main">{formatMontant(transactionSelectionnee.montant)}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{t.transactions.detail.fees}</p>
                <p className="font-semibold">{formatMontant(transactionSelectionnee.frais)}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{t.common.agent}</p>
                <p className="font-semibold">{transactionSelectionnee.agentNom || '—'}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{t.common.agency}</p>
                <p className="font-semibold">{transactionSelectionnee.agenceNom || '—'}</p>
              </div>
              {transactionSelectionnee.clientNom && (
                <div className="bg-surface rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{t.common.client}</p>
                  <p className="font-semibold">{transactionSelectionnee.clientNom}</p>
                </div>
              )}
              {transactionSelectionnee.clientTel && (
                <div className="bg-surface rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{t.common.phone}</p>
                  <p className="font-semibold">{transactionSelectionnee.clientTel}</p>
                </div>
              )}
              <div className="bg-surface rounded-xl p-3 col-span-2">
                <p className="text-xs text-gray-400 mb-1">{t.transactions.detail.dateTime}</p>
                <p className="font-semibold">{formatDate(transactionSelectionnee.date)}</p>
              </div>
            </div>
            {transactionSelectionnee.commission > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                <span className="text-green-700 font-medium">{t.transactions.detail.agentCommission} {formatMontant(transactionSelectionnee.commission)}</span>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {transactionSelectionnee.statut === 'pending' && (
                <Button
                  variante="primary"
                  fullWidth
                  onClick={() => { validerTransaction.mutate(transactionSelectionnee.id); setTransactionSelectionnee(null); }}
                >
                  {t.transactions.table.validateTx}
                </Button>
              )}
              <Button variante="ghost" fullWidth onClick={() => setTransactionSelectionnee(null)}>
                {t.common.close}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal nouvelle transaction */}
      <Modal
        ouvert={!!modalOuvert}
        onFermer={() => { setModalOuvert(null); setErreurTx(''); setSuccesTx(''); }}
        titre={`${t.transactions.form.newTitle} ${modalOuvert ? TYPE_LABELS[modalOuvert] : ''}`}
        taille="md"
      >
        <form className="space-y-4" onSubmit={handleSubmitTx}>
          <Select
            label={t.transactions.form.operatorRequired}
            value={formTx.operateur}
            onChange={(e) => setFormTx((f) => ({ ...f, operateur: e.target.value }))}
            options={Object.entries(OPERATEURS).map(([v, o]) => ({ value: v, label: `${o.logo} ${o.label}` }))}
          />
          <Input
            label={t.transactions.form.amountRequired}
            type="number"
            placeholder="0"
            value={formTx.montant}
            onChange={(e) => setFormTx((f) => ({ ...f, montant: e.target.value }))}
            icone={<span className="text-xs font-bold">F</span>}
            required
          />
          <Input
            label={t.transactions.form.clientPhone}
            type="tel"
            placeholder="+225 07 00 00 00 00"
            value={formTx.clientTel}
            onChange={(e) => setFormTx((f) => ({ ...f, clientTel: e.target.value }))}
          />
          <Input
            label={t.transactions.form.clientName}
            placeholder={t.transactions.form.clientNamePlaceholder}
            value={formTx.clientNom}
            onChange={(e) => setFormTx((f) => ({ ...f, clientNom: e.target.value }))}
          />
          {erreurTx && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreurTx}</div>}
          {succesTx && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succesTx}</div>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={creerTransaction.isPending}>
              {t.transactions.table.validateTx}
            </Button>
            <Button type="button" variante="ghost" onClick={() => { setModalOuvert(null); setErreurTx(''); }}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
