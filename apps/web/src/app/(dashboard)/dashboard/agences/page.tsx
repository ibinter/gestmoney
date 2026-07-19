'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { GmPageHeader, GmButton } from '@/components/gm';
import { formatDate } from '@/lib/formatters';
import { exporterCsv } from '@/lib/exportCsv';
import { useAgences, useCreateAgence, useToggleAgenceStatus } from '@/hooks/useAgences';
import { Agence } from '@/types';

const FORM_INIT = { nom: '', code: '', ville: '', adresse: '', telephone: '', responsable: '' };

/** Palette de la maquette, utilisée pour distinguer visuellement les villes. */
const COULEURS_VILLE = ['#F5B800', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#0EA5E9', '#D97706', '#22C55E'];

export default function AgencesPage() {
  const [search, setSearch] = useState('');
  const [modalOuvert, setModalOuvert] = useState(false);
  const [form, setForm] = useState(FORM_INIT);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const { data: allAgences = [], isLoading } = useAgences();
  const creerAgence = useCreateAgence();
  const toggleStatut = useToggleAgenceStatus();

  const agences = allAgences.filter((a) =>
    !search ||
    a.nom.toLowerCase().includes(search.toLowerCase()) ||
    a.ville.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  );

  const nbActives = allAgences.filter((a) => a.active).length;
  const totalAgents = allAgences.reduce((s, a) => s + a.nbAgents, 0);
  const totalEnLigne = allAgences.reduce((s, a) => s + a.nbAgentsEnLigne, 0);

  // Villes réelles, triées par nombre d'agences décroissant.
  const villes = Array.from(new Set(allAgences.map((a) => a.ville).filter(Boolean)));
  const parVille = villes
    .map((ville) => ({ ville, liste: allAgences.filter((a) => a.ville === ville) }))
    .sort((a, b) => b.liste.length - a.liste.length);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!form.nom || !form.code || !form.ville) {
      setErreur('Veuillez remplir les champs obligatoires (nom, code, ville).');
      return;
    }
    try {
      await creerAgence.mutateAsync(form);
      setSucces(`Agence "${form.nom}" créée avec succès.`);
      setForm(FORM_INIT);
      setTimeout(() => { setModalOuvert(false); setSucces(''); }, 1500);
    } catch {
      setErreur('Erreur lors de la création. Réessayez.');
    }
  };

  const handleToggle = (agence: Agence) => {
    toggleStatut.mutate({ id: agence.id, active: !agence.active });
  };

  const handleExport = () =>
    exporterCsv(agences, [
      { titre: 'Nom', valeur: (a) => a.nom },
      { titre: 'Code', valeur: (a) => a.code },
      { titre: 'Ville', valeur: (a) => a.ville },
      { titre: 'Adresse', valeur: (a) => a.adresse },
      { titre: 'Téléphone', valeur: (a) => a.telephone },
      { titre: 'Responsable', valeur: (a) => a.responsableNom },
      { titre: 'Agents', valeur: (a) => a.nbAgents },
      { titre: 'Agents en ligne', valeur: (a) => a.nbAgentsEnLigne },
      { titre: 'Statut', valeur: (a) => a.active ? 'Active' : 'Inactive' },
      { titre: 'Date création', valeur: (a) => formatDate(a.createdAt) },
    ], 'agences');

  return (
    <>
      <GmPageHeader
        fil={['Accueil', 'Agences']}
        titre="🏪 Gestion des Agences"
        sousTitre={
          isLoading
            ? 'Chargement du réseau…'
            : `Réseau de ${nbActives} agence${nbActives > 1 ? 's' : ''} active${nbActives > 1 ? 's' : ''} — ${villes.length} ville${villes.length > 1 ? 's' : ''} couverte${villes.length > 1 ? 's' : ''}`
        }
        actions={
          <>
            <GmButton variante="outline" petit onClick={handleExport}>📥 Exporter</GmButton>
            <GmButton variante="primary" petit onClick={() => setModalOuvert(true)}>+ Nouvelle agence</GmButton>
          </>
        }
      />

      {/* STATS — valeurs issues des données réelles */}
      <div className="gm-stats-row">
        <div className="gm-stat-card gm-total">
          <div className="gm-stat-value">{isLoading ? '—' : nbActives}</div>
          <div className="gm-stat-label">Agences actives</div>
          <div className="gm-stat-sub">sur {allAgences.length} au total</div>
        </div>
        <div className="gm-stat-card gm-success">
          <div className="gm-stat-value">{isLoading ? '—' : totalAgents}</div>
          <div className="gm-stat-label">Agents au total</div>
          <div className="gm-stat-sub">{totalEnLigne} en ligne maintenant</div>
        </div>
        <div className="gm-stat-card gm-amount">
          <div className="gm-stat-value">{isLoading ? '—' : villes.length}</div>
          <div className="gm-stat-label">Villes couvertes</div>
          <div className="gm-stat-sub">{parVille[0] ? `Top : ${parVille[0].ville}` : '—'}</div>
        </div>
        <div className="gm-stat-card gm-pending">
          <div className="gm-stat-value">{isLoading ? '—' : allAgences.length - nbActives}</div>
          <div className="gm-stat-label">Agences inactives</div>
          <div className="gm-stat-sub">à réactiver ou clôturer</div>
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="gm-filters-bar">
        <div className="gm-search-wrap">
          <span className="gm-si">🔍</span>
          <input
            type="text"
            placeholder="Rechercher une agence (nom, ville, code)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="gm-pag-info">
          {isLoading ? 'Chargement…' : `${agences.length} agence(s) trouvée(s)`}
        </span>
      </div>

      <div className="gm-content-grid">
        {/* CARTES AGENCES */}
        <div className="gm-agences-grid">
          {isLoading && <div className="gm-agence-card"><div className="gm-agence-city">Chargement des agences…</div></div>}

          {!isLoading && agences.length === 0 && (
            <div className="gm-agence-card"><div className="gm-agence-city">Aucune agence trouvée</div></div>
          )}

          {!isLoading && agences.map((a) => (
            <div className="gm-agence-card" key={a.id}>
              <div className="gm-agence-card-header">
                <div>
                  <div className="gm-agence-name">🏪 {a.nom}</div>
                  <div className="gm-agence-city">
                    📍 {a.ville || '—'}{a.adresse ? `, ${a.adresse}` : ''}
                  </div>
                </div>
                <span className={`gm-status-pill ${a.active ? 'gm-pill-active' : 'gm-pill-danger'}`}>
                  {a.active ? '● Active' : '● Inactive'}
                </span>
              </div>

              <div className="gm-agence-metrics">
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value">{a.nbAgents}</div>
                  <div className="gm-agence-metric-label">Agents</div>
                </div>
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value" style={{ color: 'var(--gm-success)' }}>{a.nbAgentsEnLigne}</div>
                  <div className="gm-agence-metric-label">En ligne</div>
                </div>
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value" style={{ fontSize: 13 }}>{a.code || '—'}</div>
                  <div className="gm-agence-metric-label">Code agence</div>
                </div>
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value" style={{ fontSize: 13 }}>
                    {a.createdAt ? formatDate(a.createdAt) : '—'}
                  </div>
                  <div className="gm-agence-metric-label">Ouverture</div>
                </div>
              </div>

              <div className="gm-agence-metric" style={{ marginBottom: 14 }}>
                <div className="gm-agence-metric-label">
                  📞 {a.telephone || '—'} · Resp. {a.responsableNom || '—'}
                </div>
              </div>

              <div className="gm-agence-actions">
                <button type="button" className="gm-agence-btn gm-primary">👁️ Voir détails</button>
                <button
                  type="button"
                  className="gm-agence-btn"
                  onClick={() => handleToggle(a)}
                  disabled={toggleStatut.isPending}
                  style={a.active ? { color: 'var(--gm-danger)' } : { color: 'var(--gm-success)' }}
                >
                  {a.active ? '⏸️ Désactiver' : '▶️ Activer'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RÉPARTITION PAR VILLE — villes réelles uniquement */}
        <div className="gm-map-card">
          <div className="gm-map-title">
            🗺️ Répartition du réseau
            <span style={{ fontSize: 11, color: 'var(--gm-text-2)', fontWeight: 400 }}>
              {isLoading ? '—' : `${allAgences.length} point${allAgences.length > 1 ? 's' : ''}`}
            </span>
          </div>

          {isLoading && <div className="gm-agence-city">Chargement…</div>}
          {!isLoading && parVille.length === 0 && <div className="gm-agence-city">Aucune ville renseignée</div>}

          {!isLoading && parVille.map(({ ville, liste }, i) => (
            <div key={ville} style={{ marginBottom: 14 }}>
              <div className="gm-agence-name" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <svg width="12" height="12" aria-hidden="true">
                  <circle cx="6" cy="6" r="5" fill={COULEURS_VILLE[i % COULEURS_VILLE.length]} />
                </svg>
                {ville}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gm-text-2)', fontWeight: 400 }}>
                  {liste.length} agence{liste.length > 1 ? 's' : ''}
                </span>
              </div>
              {liste.map((a) => (
                <div key={a.id} className="gm-map-legend-item" style={{ justifyContent: 'space-between', width: '100%', padding: '3px 0' }}>
                  <span>{a.nom}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ color: 'var(--gm-text)' }}>{a.nbAgentsEnLigne}/{a.nbAgents}</strong>
                    <span
                      style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: a.active ? 'var(--gm-success)' : 'var(--gm-border)',
                        display: 'inline-block',
                      }}
                    />
                  </span>
                </div>
              ))}
            </div>
          ))}

          {!isLoading && parVille.length > 0 && (
            <div className="gm-map-legend">
              {parVille.map(({ ville }, i) => (
                <div className="gm-map-legend-item" key={ville}>
                  <svg width="12" height="12" aria-hidden="true">
                    <circle cx="6" cy="6" r="5" fill={COULEURS_VILLE[i % COULEURS_VILLE.length]} />
                  </svg>
                  {ville}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal ouvert={modalOuvert} onFermer={() => { setModalOuvert(false); setForm(FORM_INIT); setErreur(''); setSucces(''); }} titre="Nouvelle agence" taille="md">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nom de l'agence *" placeholder="Agence Centre-ville" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
            <Input label="Code *" placeholder="AG-XXX-001" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ville *" placeholder="Abidjan" value={form.ville} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))} required />
            <Input label="Téléphone" type="tel" placeholder="0701000000" value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} />
          </div>
          <Input label="Adresse" placeholder="Rue, Quartier" value={form.adresse} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))} />
          <Input label="Responsable" placeholder="Nom du responsable" value={form.responsable} onChange={(e) => setForm((f) => ({ ...f, responsable: e.target.value }))} />

          {erreur && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreur}</div>}
          {succes && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succes}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={creerAgence.isPending}>
              Créer l&apos;agence
            </Button>
            <Button type="button" variante="ghost" onClick={() => { setModalOuvert(false); setForm(FORM_INIT); setErreur(''); }}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
