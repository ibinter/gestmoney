'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { GmPageHeader, GmButton, GmTableWrap } from '@/components/gm';
import { Agent } from '@/types';
import { formatMontant, formatDate } from '@/lib/formatters';
import { exporterCsv } from '@/lib/exportCsv';
import { useAgents, useCreateAgent, useToggleAgentStatus } from '@/hooks/useAgents';
import { useAgences } from '@/hooks/useAgences';

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
      setErreur('Veuillez remplir tous les champs obligatoires.');
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
      setSucces(`Agent ${form.prenom} ${form.nom} créé avec succès.`);
      setForm(FORM_INIT);
      setTimeout(() => { setModalNouvelAgent(false); setSucces(''); }, 1500);
    } catch {
      setErreur('Erreur lors de la création. Réessayez.');
    }
  };

  const handleToggle = async (agent: Agent) => {
    await toggleStatut.mutateAsync({ id: agent.id, actif: !agent.actif });
  };

  const handleExport = () =>
    exporterCsv(agents, [
      { titre: 'Prénom', valeur: (a) => a.prenom },
      { titre: 'Nom', valeur: (a) => a.nom },
      { titre: 'Email', valeur: (a) => a.email },
      { titre: 'Téléphone', valeur: (a) => a.telephone },
      { titre: 'Agence', valeur: (a) => a.agenceNom },
      { titre: 'Statut', valeur: (a) => (a.actif ? 'Actif' : 'Inactif') },
      { titre: 'En ligne', valeur: (a) => (a.enLigne ? 'Oui' : 'Non') },
      { titre: 'Tx aujourd\'hui', valeur: (a) => a.nbTransactionsAujourdhui },
      { titre: 'Volume today (FCFA)', valeur: (a) => a.montantTransactionsAujourdhui },
      { titre: 'Commission (FCFA)', valeur: (a) => a.commission },
      { titre: 'Date création', valeur: (a) => formatDate(a.createdAt) },
    ], 'agents');

  const pagesAffichees = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <>
      <GmPageHeader
        fil={['🏠 Accueil', 'Agents']}
        titre="👤 Gestion des Agents"
        sousTitre="Suivi des performances, volumes et commissions par agent"
        actions={
          <>
            <GmButton variante="outline" petit onClick={handleExport}>📥 Exporter</GmButton>
            <GmButton petit onClick={() => setModalNouvelAgent(true)}>+ Créer un agent</GmButton>
          </>
        }
      />

      {/* STATS */}
      <div className="gm-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="gm-stat-card gm-s1">
          <div className="gm-stat-value">{nbActifs}</div>
          <div className="gm-stat-label">Agents actifs</div>
          <div className="gm-stat-sub">
            {allAgences.length > 0 ? `Sur ${allAgences.length} agence(s)` : '—'}
          </div>
        </div>
        <div className="gm-stat-card gm-s2">
          <div className="gm-stat-value">{nbInactifs}</div>
          <div className="gm-stat-label">Agents inactifs</div>
          <div className="gm-stat-sub">Sur {allAgents.length} agent(s)</div>
        </div>
        <div className="gm-stat-card gm-s3">
          <div className="gm-stat-value">{nbEnLigne}</div>
          <div className="gm-stat-label">En ligne maintenant</div>
          <div className="gm-stat-sub">{totalTransactions} transaction(s) auj.</div>
        </div>
        <div className="gm-stat-card gm-s4">
          <div className="gm-stat-value" style={{ fontSize: 14, paddingTop: 4 }}>
            {topAgent ? `${topAgent.prenom} ${topAgent.nom}` : '—'}
          </div>
          <div className="gm-stat-label">Top agent (volume auj.)</div>
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
          <div className="gm-stat-label">Commissions dues (tous agents)</div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="gm-filters-card">
        <div className="gm-filters-row">
          <div className="gm-filter-group">
            <label htmlFor="f-agence">Agence</label>
            <select id="f-agence" value={filtreAgence} onChange={(e) => setFiltreAgence(e.target.value)}>
              <option value="">Toutes les agences</option>
              {optionsAgences.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="gm-filter-group">
            <label htmlFor="f-statut">Statut</label>
            <select id="f-statut" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
              <option value="">Tous statuts</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
              <option value="en_ligne">En ligne</option>
            </select>
          </div>
          <div className="gm-filter-group gm-filter-search">
            <label htmlFor="f-search">Recherche</label>
            <input
              id="f-search"
              type="text"
              placeholder="Nom, email, téléphone…"
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
                Effacer
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
              {isLoading ? 'Chargement…' : <><strong>{agents.length}</strong> agent(s) trouvé(s)</>}
            </span>
          </div>
          <span className="gm-sort-note">Cliquez sur un en-tête pour trier</span>
        </div>

        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => basculerTri('nom')}>Agent</th>
                <th>Téléphone</th>
                <th style={{ cursor: 'pointer' }} onClick={() => basculerTri('agenceNom')}>Agence</th>
                <th style={{ cursor: 'pointer' }} onClick={() => basculerTri('nbTransactionsAujourdhui')}>Transac. auj.</th>
                <th style={{ cursor: 'pointer' }} onClick={() => basculerTri('montantTransactionsAujourdhui')}>Volume auj.</th>
                <th>Commission</th>
                <th>Présence</th>
                <th>Statut</th>
                <th>Inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24 }}>Chargement…</td></tr>
              )}
              {!isLoading && agentsPage.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24 }}>Aucun agent trouvé</td></tr>
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
                      ● {a.enLigne ? 'En ligne' : 'Hors ligne'}
                    </span>
                  </td>
                  <td>
                    <span className={`gm-status-pill ${a.actif ? 'gm-pill-online' : 'gm-pill-suspended'}`}>
                      {a.actif ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{formatDate(a.createdAt)}</td>
                  <td>
                    <div className="gm-action-btns">
                      <button type="button" className="gm-action-btn">👁️ Voir</button>
                      <button
                        type="button"
                        className={`gm-action-btn${a.actif ? ' gm-danger' : ''}`}
                        onClick={() => handleToggle(a)}
                        disabled={toggleStatut.isPending}
                      >
                        {a.actif ? '🚫 Suspendre' : '✅ Activer'}
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
            {agents.length} agent(s) — Page {page} / {totalPages || 1}
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
            <div className="gm-modal-title">👤 Nouvel agent</div>
            <button type="button" className="gm-modal-close" onClick={fermerModal} aria-label="Fermer">✕</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="gm-modal-body">
              <div className="gm-form-row-2">
                <div className="gm-form-group">
                  <label htmlFor="m-prenom">Prénom *</label>
                  <input id="m-prenom" placeholder="Ex : Aminata" value={form.prenom}
                    onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} required />
                </div>
                <div className="gm-form-group">
                  <label htmlFor="m-nom">Nom *</label>
                  <input id="m-nom" placeholder="Ex : Koné" value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
                </div>
              </div>
              <div className="gm-form-group">
                <label htmlFor="m-email">Email *</label>
                <input id="m-email" type="email" placeholder="agent@exemple.com" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="gm-form-group">
                <label htmlFor="m-tel">Téléphone *</label>
                <input id="m-tel" type="tel" placeholder="+225 07 00 00 00 00" value={form.telephone}
                  onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} required />
              </div>
              <div className="gm-form-group">
                <label htmlFor="m-agence">Agence</label>
                <select id="m-agence" value={form.agenceId}
                  onChange={(e) => setForm((f) => ({ ...f, agenceId: e.target.value }))}>
                  <option value="">Choisir une agence</option>
                  {optionsAgences.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="gm-form-group">
                <label htmlFor="m-pass">Mot de passe temporaire *</label>
                <input id="m-pass" type="password" placeholder="Minimum 8 caractères" value={form.password}
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
              <GmButton type="button" variante="outline" onClick={fermerModal}>Annuler</GmButton>
              <GmButton type="submit" disabled={creerAgent.isPending}>
                {creerAgent.isPending ? 'Création…' : '✅ Créer l’agent'}
              </GmButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
