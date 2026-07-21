'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { GmPageHeader, GmButton } from '@/components/gm';
import { formatDate } from '@/lib/formatters';
import { GmExportMenu } from '@/components/gm/GmExportMenu';
import { useAgences, useCreateAgence, useToggleAgenceStatus } from '@/hooks/useAgences';
import { Agence } from '@/types';
import { useT } from '@/lib/i18n';

const FORM_INIT = { nom: '', code: '', ville: '', adresse: '', telephone: '', responsable: '' };

/** Palette de la maquette, utilisée pour distinguer visuellement les villes. */
const COULEURS_VILLE = ['#F5B800', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#0EA5E9', '#D97706', '#22C55E'];

export default function AgencesPage() {
  const t = useT();
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
      setErreur(t.agences.modal.requiredFields);
      return;
    }
    try {
      await creerAgence.mutateAsync(form);
      setSucces(`${t.agences.modal.createdPrefix} "${form.nom}" ${t.agences.modal.createdSuffix}`);
      setForm(FORM_INIT);
      setTimeout(() => { setModalOuvert(false); setSucces(''); }, 1500);
    } catch {
      setErreur(t.common.createError);
    }
  };

  const handleToggle = (agence: Agence) => {
    toggleStatut.mutate({ id: agence.id, active: !agence.active });
  };

  return (
    <>
      <GmPageHeader
        fil={[t.common.home, t.agences.breadcrumb]}
        titre={t.agences.title}
        sousTitre={
          isLoading
            ? t.agences.subtitleLoading
            : `${t.agences.subtitleNetwork} ${nbActives} ${t.agences.subtitleActiveAgencies} — ${villes.length} ${t.agences.subtitleCities}`
        }
        actions={
          <>
            <GmExportMenu
              titre="Agences"
              donnees={agences}
              colonnes={[
                { titre: t.agences.csv.nom, valeur: (a) => a.nom },
                { titre: t.agences.csv.code, valeur: (a) => a.code },
                { titre: t.agences.csv.ville, valeur: (a) => a.ville },
                { titre: t.agences.csv.adresse, valeur: (a) => a.adresse },
                { titre: t.agences.csv.telephone, valeur: (a) => a.telephone },
                { titre: t.agences.csv.responsable, valeur: (a) => a.responsableNom },
                { titre: t.agences.csv.agents, valeur: (a) => a.nbAgents },
                { titre: t.agences.csv.agentsOnline, valeur: (a) => a.nbAgentsEnLigne },
                { titre: t.agences.csv.statut, valeur: (a) => a.active ? t.agences.csv.active : t.agences.csv.inactive },
                { titre: t.agences.csv.dateCreation, valeur: (a) => formatDate(a.createdAt) },
              ]}
              nomFichier="agences"
            />
            <GmButton variante="primary" petit onClick={() => setModalOuvert(true)}>{t.agences.newAgency}</GmButton>
          </>
        }
      />

      {/* STATS — valeurs issues des données réelles */}
      <div className="gm-stats-row">
        <div className="gm-stat-card gm-total">
          <div className="gm-stat-value">{isLoading ? '—' : nbActives}</div>
          <div className="gm-stat-label">{t.agences.stats.activeAgencies}</div>
          <div className="gm-stat-sub">{t.agences.stats.ofTotalPrefix} {allAgences.length} {t.agences.stats.ofTotalSuffix}</div>
        </div>
        <div className="gm-stat-card gm-success">
          <div className="gm-stat-value">{isLoading ? '—' : totalAgents}</div>
          <div className="gm-stat-label">{t.agences.stats.totalAgents}</div>
          <div className="gm-stat-sub">{totalEnLigne} {t.agences.stats.onlineNow}</div>
        </div>
        <div className="gm-stat-card gm-amount">
          <div className="gm-stat-value">{isLoading ? '—' : villes.length}</div>
          <div className="gm-stat-label">{t.agences.stats.citiesCovered}</div>
          <div className="gm-stat-sub">{parVille[0] ? `${t.agences.stats.topPrefix} ${parVille[0].ville}` : '—'}</div>
        </div>
        <div className="gm-stat-card gm-pending">
          <div className="gm-stat-value">{isLoading ? '—' : allAgences.length - nbActives}</div>
          <div className="gm-stat-label">{t.agences.stats.inactiveAgencies}</div>
          <div className="gm-stat-sub">{t.agences.stats.inactiveSub}</div>
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="gm-filters-bar">
        <div className="gm-search-wrap">
          <span className="gm-si">🔍</span>
          <input
            type="text"
            placeholder={t.agences.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="gm-pag-info">
          {isLoading ? t.common.loading : `${agences.length} ${t.agences.foundSuffix}`}
        </span>
      </div>

      <div className="gm-content-grid">
        {/* CARTES AGENCES */}
        <div className="gm-agences-grid">
          {isLoading && <div className="gm-agence-card"><div className="gm-agence-city">{t.agences.loadingAgencies}</div></div>}

          {!isLoading && agences.length === 0 && (
            <div className="gm-agence-card"><div className="gm-agence-city">{t.agences.emptyAgencies}</div></div>
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
                  {a.active ? t.agences.pillActive : t.agences.pillInactive}
                </span>
              </div>

              <div className="gm-agence-metrics">
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value">{a.nbAgents}</div>
                  <div className="gm-agence-metric-label">{t.agences.metrics.agents}</div>
                </div>
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value" style={{ color: 'var(--gm-success)' }}>{a.nbAgentsEnLigne}</div>
                  <div className="gm-agence-metric-label">{t.agences.metrics.online}</div>
                </div>
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value" style={{ fontSize: 13 }}>{a.code || '—'}</div>
                  <div className="gm-agence-metric-label">{t.agences.metrics.code}</div>
                </div>
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value" style={{ fontSize: 13 }}>
                    {a.createdAt ? formatDate(a.createdAt) : '—'}
                  </div>
                  <div className="gm-agence-metric-label">{t.agences.metrics.opening}</div>
                </div>
              </div>

              <div className="gm-agence-metric" style={{ marginBottom: 14 }}>
                <div className="gm-agence-metric-label">
                  📞 {a.telephone || '—'} · {t.agences.metrics.respPrefix} {a.responsableNom || '—'}
                </div>
              </div>

              <div className="gm-agence-actions">
                <button type="button" className="gm-agence-btn gm-primary">{t.agences.actions.viewDetails}</button>
                <button
                  type="button"
                  className="gm-agence-btn"
                  onClick={() => handleToggle(a)}
                  disabled={toggleStatut.isPending}
                  style={a.active ? { color: 'var(--gm-danger)' } : { color: 'var(--gm-success)' }}
                >
                  {a.active ? t.agences.actions.deactivate : t.agences.actions.activate}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RÉPARTITION PAR VILLE — villes réelles uniquement */}
        <div className="gm-map-card">
          <div className="gm-map-title">
            {t.agences.map.title}
            <span style={{ fontSize: 11, color: 'var(--gm-text-2)', fontWeight: 400 }}>
              {isLoading ? '—' : `${allAgences.length} ${t.agences.map.pointsSuffix}`}
            </span>
          </div>

          {isLoading && <div className="gm-agence-city">{t.common.loading}</div>}
          {!isLoading && parVille.length === 0 && <div className="gm-agence-city">{t.agences.map.noCity}</div>}

          {!isLoading && parVille.map(({ ville, liste }, i) => (
            <div key={ville} style={{ marginBottom: 14 }}>
              <div className="gm-agence-name" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <svg width="12" height="12" aria-hidden="true">
                  <circle cx="6" cy="6" r="5" fill={COULEURS_VILLE[i % COULEURS_VILLE.length]} />
                </svg>
                {ville}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gm-text-2)', fontWeight: 400 }}>
                  {liste.length} {t.agences.map.agencesSuffix}
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

      <Modal ouvert={modalOuvert} onFermer={() => { setModalOuvert(false); setForm(FORM_INIT); setErreur(''); setSucces(''); }} titre={t.agences.modal.title} taille="md">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t.agences.modal.nomLabel} placeholder={t.agences.modal.nomPlaceholder} value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
            <Input label={t.agences.modal.codeLabel} placeholder={t.agences.modal.codePlaceholder} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t.agences.modal.villeLabel} placeholder={t.agences.modal.villePlaceholder} value={form.ville} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))} required />
            <Input label={t.agences.modal.telephoneLabel} type="tel" placeholder={t.agences.modal.telephonePlaceholder} value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} />
          </div>
          <Input label={t.agences.modal.adresseLabel} placeholder={t.agences.modal.adressePlaceholder} value={form.adresse} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))} />
          <Input label={t.agences.modal.responsableLabel} placeholder={t.agences.modal.responsablePlaceholder} value={form.responsable} onChange={(e) => setForm((f) => ({ ...f, responsable: e.target.value }))} />

          {erreur && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreur}</div>}
          {succes && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succes}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={creerAgence.isPending}>
              {t.agences.modal.submit}
            </Button>
            <Button type="button" variante="ghost" onClick={() => { setModalOuvert(false); setForm(FORM_INIT); setErreur(''); }}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
