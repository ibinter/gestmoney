'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { GmPageHeader, GmButton, GmTableWrap } from '@/components/gm';
import { Agent } from '@/types';
import { formatMontant, formatDate } from '@/lib/formatters';
import { exporterCsv } from '@/lib/exportCsv';
import { useAgents, useCreateAgent, useToggleAgentStatus } from '@/hooks/useAgents';
import { useAgences } from '@/hooks/useAgences';
import { useT } from '@/lib/i18n';

const FORM_INIT = { prenom: '', nom: '', email: '', telephone: '', agenceId: '', password: '' };

const AVATAR_COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d', '#b45309'];

/** Couleur d'avatar déterministe à partir de l'identifiant de l'agent. */
function couleurAvatar(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initiales(a: Agent): string {
  return `${a.prenom?.[0] ?? ''}${a.nom?.[0] ?? ''}`.toUpperCase() || '—';
}

type CleTri = 'nom' | 'agenceNom' | 'nbTransactionsAujourdhui' | 'montantTransactionsAujourdhui';

export default function AgentsPage() {
  const t = useT();
  const [search, setSearch] = useState('');
  const [filtreAgence, setFiltreAgence] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 15;
  const [tri, setTri] = useState<{ cle: CleTri; sens: 'asc' | 'desc' } | null>(null);
  const [modalNouvelAgent, setModalNouvelAgent] = useState(false);
  const [form, setForm] = useState(FORM_INIT);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const { data: allAgents = [], isLoading } = useAgents();
  const { data: allAgences = [] } = useAgences();
  const creerAgent = useCreateAgent();
  const toggleStatut = useToggleAgentStatus();

  const agents = useMemo(() => {
    const filtres = allAgents.filter((a) => {
      const matchSearch =
        !search ||
        `${a.prenom} ${a.nom}`.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        a.telephone.includes(search);
      const matchAgence = !filtreAgence || a.agenceId === filtreAgence;
      const matchStatut =
        !filtreStatut ||
        (filtreStatut === 'actif' && a.actif) ||
        (filtreStatut === 'inactif' && !a.actif) ||
        (filtreStatut === 'en_ligne' && a.enLigne);
      return matchSearch && matchAgence && matchStatut;
    });
    if (!tri) return filtres;
    const signe = tri.sens === 'asc' ? 1 : -1;
    return [...filtres].sort((x, y) => {
      const vx = tri.cle === 'nom' ? `${x.nom} ${x.prenom}` : x[tri.cle];
      const vy = tri.cle === 'nom' ? `${y.nom} ${y.prenom}` : y[tri.cle];
      if (typeof vx === 'number' && typeof vy === 'number') return (vx - vy) * signe;
      return String(vx).localeCompare(String(vy), 'fr') * signe;
    });
  }, [allAgents, search, filtreAgence, filtreStatut, tri]);

  const totalPages = Math.ceil(agents.length / LIMIT);
  const agentsPage = agents.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => setPage(1), [search, filtreAgence, filtreStatut]);

  const nbActifs = allAgents.filter((a) => a.actif).length;
  const nbInactifs = allAgents.length - nbActifs;
  const nbEnLigne = allAgents.filter((a) => a.enLigne).length;
  const totalCommissions = allAgents.reduce((s, a) => s + a.commission, 0);
  const totalTransactions = allAgents.reduce((s, a) => s + a.nbTransactionsAujourdhui, 0);

  const topAgent = allAgents.reduce<Agent | null>(
    (best, a) => (!best || a.montantTransactionsAujourdhui > best.montantTransactionsAujourdhui ? a : best),
    null,
  );

  const optionsAgences = allAgences.map((a) => ({ value: a.id, label: a.nom }));

  const basculerTri = (cle: CleTri) =>
    setTri((t) => (t?.cle === cle ? { cle, sens: t.sens === 'asc' ? 'desc' : 'asc' } : { cle, sens: 'asc' }));

  const fermerModal = () => {
    setModalNouvelAgent(false);
    setForm(FORM_INIT);
    setErreur('');
    setSucces('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!form.prenom || !form.nom || !form.email || !form.telephone) {
      setErreur(t.agents.modal.requiredFields);
      return;
    }
    try {
      await creerAgent.mutateAsync({
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        agenceId: form.agenceId,
        password: form.password,
      });
      setSucces(`${t.agents.modal.createdPrefix} ${form.prenom} ${form.nom} ${t.agents.modal.createdSuffix}`);
      setForm(FORM_INIT);
      setTimeout(() => { setModalNouvelAgent(false); setSucces(''); }, 1500);
    } catch {
      setErreur(t.common.createError);
    }
  };

  const handleToggle = async (agent: Agent) => {
    await toggleStatut.mutateAsync({ id: agent.id, actif: !agent.actif });
  };

  const handleExport = () =>
    exporterCsv(agents, [
      { titre: t.common.firstName, valeur: (a) => a.prenom },
      { titre: t.common.lastName, valeur: (a) => a.nom },
      { titre: t.common.email, valeur: (a) => a.email },
      { titre: t.common.phone, valeur: (a) => a.telephone },
      { titre: t.common.agency, valeur: (a) => a.agenceNom },
      { titre: t.common.statut, valeur: (a) => (a.actif ? t.common.active : t.common.inactive) },
      { titre: t.common.online, valeur: (a) => (a.enLigne ? t.common.yes : t.common.no) },
      { titre: t.agents.table.colTxToday, valeur: (a) => a.nbTransactionsAujourdhui },
      { titre: `${t.agents.table.colVolumeToday} (FCFA)`, valeur: (a) => a.montantTransactionsAujourdhui },
      { titre: `${t.common.commission} (FCFA)`, valeur: (a) => a.commission },
      { titre: t.common.registration, valeur: (a) => formatDate(a.createdAt) },
    ], 'agents');

  const pagesAffichees = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <>
      <GmPageHeader
        fil={[`🏠 ${t.common.home}`, t.agents.title]}
        titre={`👤 ${t.agents.pageTitle}`}
        sousTitre={t.agents.pageSubtitle}
        actions={
          <>
            <GmButton variante="outline" petit onClick={handleExport}>📥 {t.common.export}</GmButton>
            <GmButton petit onClick={() => setModalNouvelAgent(true)}>{t.agents.createAgent}</GmButton>
          </>
        }
      />

      {/* STATS */}
      {/* Pas de style inline ici : une déclaration inline l'emporte sur les
          @media de mockup-system.css et empêchait la grille de se replier
          sur mobile (débordement mesuré à 449px pour 375px de large).
          .gm-stats-row vaut déjà repeat(4, 1fr) par défaut. */}
      <div className="gm-stats-row">
        <div className="gm-stat-card gm-s1">
          <div className="gm-stat-value">{nbActifs}</div>
          <div className="gm-stat-label">{t.agents.stats.activeAgents}</div>
          <div className="gm-stat-sub">
            {allAgences.length > 0 ? `${t.agents.stats.overAgencies} ${allAgences.length} ${t.agents.stats.agenciesSuffix}` : '—'}
          </div>
        </div>
        <div className="gm-stat-card gm-s2">
          <div className="gm-stat-value">{nbInactifs}</div>
          <div className="gm-stat-label">{t.agents.stats.inactiveAgents}</div>
          <div className="gm-stat-sub">{t.agents.stats.overAgents} {allAgents.length} {t.agents.stats.agentsSuffix}</div>
        </div>
        <div className="gm-stat-card gm-s3">
          <div className="gm-stat-value">{nbEnLigne}</div>
          <div className="gm-stat-label">{t.agents.stats.onlineNow}</div>
          <div className="gm-stat-sub">{totalTransactions} {t.agents.stats.txTodaySuffix}</div>
        </div>
        <div className="gm-stat-card gm-s4">
          <div className="gm-stat-value" style={{ fontSize: 14, paddingTop: 4 }}>
            {topAgent ? `${topAgent.prenom} ${topAgent.nom}` : '—'}
          </div>
          <div className="gm-stat-label">{t.agents.stats.topAgent}</div>
          <div className="gm-stat-sub">
            {topAgent
              ? `${formatMontant(topAgent.montantTransactionsAujourdhui)} — ${topAgent.agenceNom || '—'}`
              : '—'}
          </div>
        </div>
      </div>

      {/* COMMISSIONS GLOBALES */}
      <div className="gm-stats-row" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
        <div className="gm-stat-card gm-s3">
          <div className="gm-stat-value">{formatMontant(totalCommissions)}</div>
          <div className="gm-stat-label">{t.agents.stats.commissionsDue}</div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="gm-filters-card">
        <div className="gm-filters-row">
          <div className="gm-filter-group">
            <label htmlFor="f-agence">{t.common.agency}</label>
            <select id="f-agence" value={filtreAgence} onChange={(e) => setFiltreAgence(e.target.value)}>
              <option value="">{t.agents.filters.allAgencies}</option>
              {optionsAgences.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="gm-filter-group">
            <label htmlFor="f-statut">{t.common.statut}</label>
            <select id="f-statut" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
              <option value="">{t.agents.filters.allStatus}</option>
              <option value="actif">{t.agents.filters.actifs}</option>
              <option value="inactif">{t.agents.filters.inactifs}</option>
              <option value="en_ligne">{t.agents.filters.enLigne}</option>
            </select>
          </div>
          <div className="gm-filter-group gm-filter-search">
            <label htmlFor="f-search">{t.transactions.filters.search}</label>
            <input
              id="f-search"
              type="text"
              placeholder={t.agents.filters.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {(search || filtreAgence || filtreStatut) && (
            <div className="gm-filters-actions">
              <GmButton
                variante="outline"
                petit
                onClick={() => { setSearch(''); setFiltreAgence(''); setFiltreStatut(''); }}
              >
                {t.common.clear}
              </GmButton>
            </div>
          )}
        </div>
      </div>

      {/* TABLEAU */}
      <div className="gm-table-card">
        <div className="gm-table-toolbar">
          <div className="gm-table-toolbar-left">
            <span className="gm-selected-count">
              {isLoading ? t.common.loading : <><strong>{agents.length}</strong> {t.agents.table.found}</>}
            </span>
          </div>
          <span className="gm-sort-note">{t.agents.table.sortHint}</span>
        </div>

        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => basculerTri('nom')}>{t.agents.table.colAgent}</th>
                <th>{t.common.phone}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => basculerTri('agenceNom')}>{t.common.agency}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => basculerTri('nbTransactionsAujourdhui')}>{t.agents.table.colTxToday}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => basculerTri('montantTransactionsAujourdhui')}>{t.agents.table.colVolumeToday}</th>
                <th>{t.common.commission}</th>
                <th>{t.agents.table.colPresence}</th>
                <th>{t.common.statut}</th>
                <th>{t.common.registration}</th>
                <th>{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24 }}>{t.common.loading}</td></tr>
              )}
              {!isLoading && agentsPage.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24 }}>{t.agents.table.empty}</td></tr>
              )}
              {!isLoading && agentsPage.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="gm-avatar-cell">
                      <div className="gm-avatar" style={{ background: couleurAvatar(a.id) }}>{initiales(a)}</div>
                      <div>
                        <div className="gm-client-name">{a.prenom} {a.nom}</div>
                        <div className="gm-client-id">{a.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.telephone || '—'}</td>
                  <td style={{ fontSize: 12 }}>{a.agenceNom || '—'}</td>
                  <td className="gm-amount-cell">{a.nbTransactionsAujourdhui}</td>
                  <td className="gm-amount-cell">{formatMontant(a.montantTransactionsAujourdhui)}</td>
                  <td className="gm-amount-cell" style={{ color: 'var(--gm-primary-dark)' }}>
                    {formatMontant(a.commission)}
                  </td>
                  <td>
                    <span className={`gm-status-pill ${a.enLigne ? 'gm-pill-online' : 'gm-pill-offline'}`}>
                      ● {a.enLigne ? t.common.online : t.common.offline}
                    </span>
                  </td>
                  <td>
                    <span className={`gm-status-pill ${a.actif ? 'gm-pill-online' : 'gm-pill-suspended'}`}>
                      {a.actif ? t.common.active : t.common.suspended}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{formatDate(a.createdAt)}</td>
                  <td>
                    <div className="gm-action-btns">
                      <button type="button" className="gm-action-btn">{t.agents.table.viewAction}</button>
                      <button
                        type="button"
                        className={`gm-action-btn${a.actif ? ' gm-danger' : ''}`}
                        onClick={() => handleToggle(a)}
                        disabled={toggleStatut.isPending}
                      >
                        {a.actif ? t.agents.table.suspend : t.agents.table.activate}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GmTableWrap>

        <div className="gm-pagination">
          <span className="gm-pag-info">
            {agents.length} {t.agents.table.pagerSuffix} — {t.common.page} {page} / {totalPages || 1}
          </span>
          <div className="gm-pag-controls">
            <button
              type="button"
              className="gm-pag-btn"
              style={{ width: 'auto', padding: '0 10px' }}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </button>
            {pagesAffichees.map((p) => (
              <button
                key={p}
                type="button"
                className={`gm-pag-btn${p === page ? ' gm-active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="gm-pag-btn"
              style={{ width: 'auto', padding: '0 10px' }}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* MODALE CRÉATION */}
      <div
        className={`gm-modal-overlay${modalNouvelAgent ? ' gm-open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) fermerModal(); }}
      >
        <div className="gm-modal">
          <div className="gm-modal-head">
            <div className="gm-modal-title">{t.agents.modal.title}</div>
            <button type="button" className="gm-modal-close" onClick={fermerModal} aria-label={t.common.close}>✕</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="gm-modal-body">
              <div className="gm-form-row-2">
                <div className="gm-form-group">
                  <label htmlFor="m-prenom">{t.agents.modal.firstNameRequired}</label>
                  <input id="m-prenom" placeholder={t.agents.modal.firstNamePlaceholder} value={form.prenom}
                    onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} required />
                </div>
                <div className="gm-form-group">
                  <label htmlFor="m-nom">{t.agents.modal.lastNameRequired}</label>
                  <input id="m-nom" placeholder={t.agents.modal.lastNamePlaceholder} value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
                </div>
              </div>
              <div className="gm-form-group">
                <label htmlFor="m-email">{t.agents.modal.emailRequired}</label>
                <input id="m-email" type="email" placeholder={t.agents.modal.emailPlaceholder} value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="gm-form-group">
                <label htmlFor="m-tel">{t.agents.modal.phoneRequired}</label>
                <input id="m-tel" type="tel" placeholder="+225 07 00 00 00 00" value={form.telephone}
                  onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} required />
              </div>
              <div className="gm-form-group">
                <label htmlFor="m-agence">{t.common.agency}</label>
                <select id="m-agence" value={form.agenceId}
                  onChange={(e) => setForm((f) => ({ ...f, agenceId: e.target.value }))}>
                  <option value="">{t.agents.modal.agencyChoose}</option>
                  {optionsAgences.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="gm-form-group">
                <label htmlFor="m-pass">{t.agents.modal.tempPassword}</label>
                <input id="m-pass" type="password" placeholder={t.agents.modal.tempPasswordPlaceholder} value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
              </div>

              {erreur && (
                <div className="gm-status-pill gm-pill-suspended" style={{ display: 'block', padding: '8px 12px' }}>
                  {erreur}
                </div>
              )}
              {succes && (
                <div className="gm-status-pill gm-pill-online" style={{ display: 'block', padding: '8px 12px' }}>
                  {succes}
                </div>
              )}
            </div>
            <div className="gm-modal-foot">
              <GmButton type="button" variante="outline" onClick={fermerModal}>{t.common.cancel}</GmButton>
              <GmButton type="submit" disabled={creerAgent.isPending}>
                {creerAgent.isPending ? t.common.creating : t.agents.modal.submit}
              </GmButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
