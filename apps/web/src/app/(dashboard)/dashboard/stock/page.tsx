'use client';
// ============================================================
// PAGE STOCK & INVENTAIRE ARTICLES — GESTMONEY
// Endpoints : GET/POST /stock, GET /stock/stats,
//   GET/PUT /stock/:id, POST /stock/:id/entree|sortie|ajustement
//   GET /stock/:id/mouvements
// ============================================================
import React, { useState, useMemo } from 'react';
import { GmPageHeader, GmButton, GmTableWrap } from '@/components/gm';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';
import { formatMontant, formatDateTime } from '@/lib/formatters';
import {
  useArticlesStock,
  useStatsStock,
  useMouvementsArticle,
  useCreerArticle,
  useModifierArticle,
  useEntreeArticle,
  useSortieArticle,
  useAjustementArticle,
  type ArticleStock,
  type CategorieArticle,
} from '@/hooks/useStock';

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIES: CategorieArticle[] = ['CONSOMMABLE', 'EQUIPEMENT', 'FOURNITURE'];

const CAT_LABEL: Record<CategorieArticle, string> = {
  CONSOMMABLE: 'Consommable',
  EQUIPEMENT: 'Équipement',
  FOURNITURE: 'Fourniture',
};

const CAT_CLASSE: Record<CategorieArticle, string> = {
  CONSOMMABLE: 'gm-cat-consommable',
  EQUIPEMENT: 'gm-cat-sim',
  FOURNITURE: 'gm-cat-accessoire',
};

const TYPE_BADGE: Record<string, { label: string; couleur: string }> = {
  ENTREE:     { label: 'Entrée',      couleur: 'var(--gm-success)' },
  SORTIE:     { label: 'Sortie',      couleur: 'var(--gm-danger)'  },
  AJUSTEMENT: { label: 'Ajustement',  couleur: 'var(--gm-warning)' },
  INVENTAIRE: { label: 'Inventaire',  couleur: 'var(--gm-info)'    },
};

const CELLULE_VIDE: React.CSSProperties = {
  textAlign: 'center',
  color: 'var(--gm-text-2)',
  padding: '24px 16px',
  fontSize: 13,
};

// ─── Types modaux ─────────────────────────────────────────────────────────────

type ModalType = 'creer' | 'modifier' | 'entree' | 'sortie' | 'ajustement' | 'historique' | null;

// ─── Composant principal ──────────────────────────────────────────────────────

export default function StockArticlesPage() {
  // ── Données ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [categorieFiltre, setCategorieFiltre] = useState('');
  const [alerteSeulementFiltre, setAlerteSeulementFiltre] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const articlesQ = useArticlesStock({
    page,
    limit: LIMIT,
    search: search || undefined,
    categorie: categorieFiltre || undefined,
    alerteSeulement: alerteSeulementFiltre || undefined,
  });
  const statsQ = useStatsStock();

  const articles = articlesQ.data?.data ?? [];
  const totalArticles = articlesQ.data?.total ?? 0;
  const totalPages = Math.ceil(totalArticles / LIMIT);
  const stats = statsQ.data;

  // ── Modal state ──────────────────────────────────────────────────────────
  const [modalType, setModalType] = useState<ModalType>(null);
  const [articleSelectionne, setArticleSelectionne] = useState<ArticleStock | null>(null);

  // Formulaire article (créer / modifier)
  const [fNom, setFNom] = useState('');
  const [fRef, setFRef] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fCat, setFCat] = useState<CategorieArticle | ''>('');
  const [fUnite, setFUnite] = useState('pièce');
  const [fPrix, setFPrix] = useState('0');
  const [fSeuil, setFSeuil] = useState('5');

  // Formulaire mouvement
  const [fQuantite, setFQuantite] = useState('');
  const [fMotif, setFMotif] = useState('');
  const [fReference, setFReference] = useState('');
  const [fNouvelleQte, setFNouvelleQte] = useState('');

  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  // ── Mutations ────────────────────────────────────────────────────────────
  const creerArticle    = useCreerArticle();
  const modifierArticle = useModifierArticle();
  const entreeArticle   = useEntreeArticle();
  const sortieArticle   = useSortieArticle();
  const ajustement      = useAjustementArticle();

  const enCours =
    creerArticle.isPending ||
    modifierArticle.isPending ||
    entreeArticle.isPending ||
    sortieArticle.isPending ||
    ajustement.isPending;

  // ── Historique (lazy : chargé seulement quand le modal est ouvert) ───────
  const [histPage, setHistPage] = useState(1);
  const histQ = useMouvementsArticle(
    articleSelectionne?.id ?? '',
    { page: histPage, limit: 30 },
  );
  const historique = histQ.data?.data ?? [];

  // ── Helpers ──────────────────────────────────────────────────────────────
  function ouvrirModal(type: ModalType, art?: ArticleStock) {
    setModalType(type);
    setArticleSelectionne(art ?? null);
    setErreur('');
    setSucces('');

    if (type === 'creer') {
      setFNom(''); setFRef(''); setFDesc(''); setFCat('');
      setFUnite('pièce'); setFPrix('0'); setFSeuil('5');
    }
    if (type === 'modifier' && art) {
      setFNom(art.nom); setFRef(art.reference);
      setFDesc(art.description ?? '');
      setFCat((art.categorie as CategorieArticle | undefined) ?? '');
      setFUnite(art.unite); setFPrix(String(art.prixUnitaire));
      setFSeuil(String(art.seuilAlerte));
    }
    if (type === 'entree' || type === 'sortie') {
      setFQuantite(''); setFMotif(''); setFReference('');
    }
    if (type === 'ajustement' && art) {
      setFNouvelleQte(String(art.quantite)); setFMotif('');
    }
    if (type === 'historique') {
      setHistPage(1);
    }
  }

  function fermerModal() {
    setModalType(null);
    setErreur('');
    setSucces('');
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setSucces('');
    try {
      if (modalType === 'creer') {
        if (!fNom.trim()) return setErreur('Le nom est requis.');
        if (!fRef.trim()) return setErreur('La référence est requise.');
        await creerArticle.mutateAsync({
          nom: fNom.trim(),
          reference: fRef.trim(),
          description: fDesc.trim() || undefined,
          categorie: fCat || undefined,
          unite: fUnite.trim() || 'pièce',
          prixUnitaire: Number(fPrix) || 0,
          seuilAlerte: Number(fSeuil) || 5,
        });
        setSucces('Article créé avec succès.');
        setTimeout(fermerModal, 1200);
      }
      else if (modalType === 'modifier' && articleSelectionne) {
        await modifierArticle.mutateAsync({
          id: articleSelectionne.id,
          nom: fNom.trim(),
          description: fDesc.trim() || undefined,
          categorie: fCat || undefined,
          unite: fUnite.trim() || 'pièce',
          prixUnitaire: Number(fPrix) || 0,
          seuilAlerte: Number(fSeuil) || 5,
        });
        setSucces('Article modifié.');
        setTimeout(fermerModal, 1200);
      }
      else if (modalType === 'entree' && articleSelectionne) {
        const qte = Number(fQuantite);
        if (!Number.isInteger(qte) || qte < 1) return setErreur('Quantité invalide (entier ≥ 1).');
        await entreeArticle.mutateAsync({
          id: articleSelectionne.id,
          quantite: qte,
          motif: fMotif.trim() || undefined,
          reference: fReference.trim() || undefined,
        });
        setSucces(`+${qte} unité(s) ajoutée(s).`);
        setTimeout(fermerModal, 1200);
      }
      else if (modalType === 'sortie' && articleSelectionne) {
        const qte = Number(fQuantite);
        if (!Number.isInteger(qte) || qte < 1) return setErreur('Quantité invalide (entier ≥ 1).');
        if (qte > articleSelectionne.quantite) {
          return setErreur(`Stock insuffisant : ${articleSelectionne.quantite} disponible(s).`);
        }
        await sortieArticle.mutateAsync({
          id: articleSelectionne.id,
          quantite: qte,
          motif: fMotif.trim() || undefined,
          reference: fReference.trim() || undefined,
        });
        setSucces(`-${qte} unité(s) retirée(s).`);
        setTimeout(fermerModal, 1200);
      }
      else if (modalType === 'ajustement' && articleSelectionne) {
        const nouvelleQte = Number(fNouvelleQte);
        if (!Number.isInteger(nouvelleQte) || nouvelleQte < 0) return setErreur('Quantité invalide (entier ≥ 0).');
        await ajustement.mutateAsync({
          id: articleSelectionne.id,
          nouvelleQuantite: nouvelleQte,
          motif: fMotif.trim() || undefined,
        });
        setSucces('Ajustement enregistré.');
        setTimeout(fermerModal, 1200);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Une erreur est survenue.';
      setErreur(String(msg));
    }
  }

  // ── Titre modal ──────────────────────────────────────────────────────────
  const modalTitre = useMemo(() => {
    const nom = articleSelectionne?.nom ? ` — ${articleSelectionne.nom}` : '';
    switch (modalType) {
      case 'creer':      return 'Créer un article';
      case 'modifier':   return `Modifier${nom}`;
      case 'entree':     return `Entrée de stock${nom}`;
      case 'sortie':     return `Sortie de stock${nom}`;
      case 'ajustement': return `Ajustement inventaire${nom}`;
      case 'historique': return `Historique${nom}`;
      default: return '';
    }
  }, [modalType, articleSelectionne]);

  const chargement = articlesQ.isLoading;
  const erreurAPI  = articlesQ.isError;

  // ── Rafraîchir ───────────────────────────────────────────────────────────
  function rafraichir() {
    void articlesQ.refetch();
    void statsQ.refetch();
  }

  return (
    <>
      <GmPageHeader
        fil={['🏠 Accueil', 'Stock & Inventaire']}
        titre="Stock & Inventaire"
        sousTitre="Gestion des articles, entrées/sorties et valorisation"
        actions={
          <>
            <GmButton variante="outline" petit onClick={rafraichir}>
              Rafraîchir
            </GmButton>
            <GmButton variante="primary" petit onClick={() => ouvrirModal('creer')}>
              + Nouvel article
            </GmButton>
          </>
        }
      />

      {/* ─── 4 KPI cards ─────────────────────────────────────────────────── */}
      <div className="gm-stats-row">
        <div className="gm-stat-card gm-s1">
          <div className="gm-stat-value">
            {statsQ.isLoading ? '—' : (stats?.totalArticles ?? 0)}
          </div>
          <div className="gm-stat-label">Total articles</div>
          <div className="gm-stat-sub">Articles actifs en stock</div>
        </div>
        <div className="gm-stat-card gm-s4">
          <div className="gm-stat-value" style={{ fontSize: 20 }}>
            {statsQ.isLoading ? '—' : formatMontant(stats?.valeurTotale ?? 0)}
          </div>
          <div className="gm-stat-label">Valeur totale stock</div>
          <div className="gm-stat-sub">Prix unitaire × quantité</div>
        </div>
        <div className="gm-stat-card gm-s3">
          <div className="gm-stat-value" style={{ color: 'var(--gm-danger)' }}>
            {statsQ.isLoading ? '—' : (stats?.enRupture ?? 0)}
          </div>
          <div className="gm-stat-label">Articles en rupture</div>
          <div className="gm-stat-sub">Quantité = 0</div>
        </div>
        <div className="gm-stat-card gm-s3">
          <div className="gm-stat-value" style={{ color: 'var(--gm-warning)' }}>
            {statsQ.isLoading ? '—' : (stats?.sousSeuil ?? 0)}
          </div>
          <div className="gm-stat-label">Sous seuil d'alerte</div>
          <div className="gm-stat-sub">Quantité ≤ seuil configuré</div>
        </div>
      </div>

      {/* ─── Filtres ─────────────────────────────────────────────────────── */}
      <div className="gm-section-block" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="gm-form-input"
            style={{ maxWidth: 240, padding: '6px 10px' }}
            placeholder="Recherche (nom, référence…)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="gm-form-input"
            style={{ maxWidth: 180, padding: '6px 10px' }}
            value={categorieFiltre}
            onChange={(e) => { setCategorieFiltre(e.target.value); setPage(1); }}
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CAT_LABEL[c]}</option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={alerteSeulementFiltre}
              onChange={(e) => { setAlerteSeulementFiltre(e.target.checked); setPage(1); }}
            />
            Alertes seulement
          </label>
        </div>
      </div>

      {/* ─── Erreur API ──────────────────────────────────────────────────── */}
      {erreurAPI && (
        <div className="gm-alert-banner">
          <div className="gm-alert-icon">⚠️</div>
          <div className="gm-alert-text">
            <strong>Erreur de chargement</strong> — Impossible de récupérer les articles.
          </div>
        </div>
      )}

      {/* ─── Tableau articles ────────────────────────────────────────────── */}
      <div className="gm-section-block">
        <div className="gm-section-title">
          <span>Articles en stock</span>
          {totalArticles > 0 && (
            <span style={{ fontSize: 12, color: 'var(--gm-text-2)', marginLeft: 8 }}>
              ({totalArticles} article{totalArticles > 1 ? 's' : ''})
            </span>
          )}
        </div>
        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th style={{ textAlign: 'right' }}>Qté</th>
                <th style={{ textAlign: 'right' }}>Seuil</th>
                <th style={{ textAlign: 'right' }}>Prix unitaire</th>
                <th style={{ textAlign: 'right' }}>Valeur</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {chargement ? (
                <tr>
                  <td colSpan={8} style={CELLULE_VIDE}>Chargement…</td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={8} style={CELLULE_VIDE}>
                    Aucun article trouvé.{' '}
                    <button
                      className="gm-action-btn"
                      type="button"
                      style={{ marginLeft: 8 }}
                      onClick={() => ouvrirModal('creer')}
                    >
                      Créer le premier article
                    </button>
                  </td>
                </tr>
              ) : (
                articles.map((art) => {
                  const enRupture = art.quantite === 0;
                  const sousSeuil = art.sousSeuil && !enRupture;
                  const qteCouleur = enRupture
                    ? 'var(--gm-danger)'
                    : sousSeuil
                    ? 'var(--gm-warning)'
                    : 'var(--gm-success)';

                  return (
                    <tr key={art.id}>
                      <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                        {art.reference}
                      </td>
                      <td>
                        <strong>{art.nom}</strong>
                        {art.description && (
                          <div style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>{art.description}</div>
                        )}
                      </td>
                      <td>
                        {art.categorie ? (
                          <span className={clsx('gm-cat-badge', CAT_CLASSE[art.categorie as CategorieArticle])}>
                            {CAT_LABEL[art.categorie as CategorieArticle]}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--gm-text-2)' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <span
                          className="gm-status-pill"
                          style={{
                            background: enRupture
                              ? 'var(--gm-danger)'
                              : sousSeuil
                              ? 'var(--gm-warning)'
                              : 'var(--gm-success)',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: 12,
                          }}
                        >
                          {art.quantite.toLocaleString('fr-FR')} {art.unite}
                        </span>
                        {enRupture && (
                          <div style={{ fontSize: 10, color: 'var(--gm-danger)', marginTop: 2 }}>
                            RUPTURE
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--gm-text-2)' }}>
                        {art.seuilAlerte} {art.unite}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
                        {formatMontant(art.prixUnitaire)}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
                        {formatMontant(art.valeur)}
                      </td>
                      <td>
                        <div className="gm-action-btns" style={{ gap: 4, flexWrap: 'wrap' }}>
                          <button
                            className="gm-action-btn"
                            type="button"
                            style={{ color: 'var(--gm-success)' }}
                            onClick={() => ouvrirModal('entree', art)}
                            title="Entrée de stock"
                          >
                            +
                          </button>
                          <button
                            className="gm-action-btn"
                            type="button"
                            style={{ color: 'var(--gm-danger)' }}
                            onClick={() => ouvrirModal('sortie', art)}
                            disabled={art.quantite === 0}
                            title="Sortie de stock"
                          >
                            −
                          </button>
                          <button
                            className="gm-action-btn"
                            type="button"
                            onClick={() => ouvrirModal('ajustement', art)}
                            title="Ajustement inventaire"
                          >
                            ≡
                          </button>
                          <button
                            className="gm-action-btn"
                            type="button"
                            onClick={() => ouvrirModal('historique', art)}
                            title="Historique mouvements"
                          >
                            📋
                          </button>
                          <button
                            className="gm-action-btn"
                            type="button"
                            onClick={() => ouvrirModal('modifier', art)}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </GmTableWrap>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 0' }}>
            <GmButton variante="outline" petit disabled={page <= 1} onClick={() => setPage(page - 1)}>
              ← Préc.
            </GmButton>
            <span style={{ fontSize: 13, lineHeight: '28px' }}>
              Page {page}/{totalPages}
            </span>
            <GmButton variante="outline" petit disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Suiv. →
            </GmButton>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAUX
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        className={clsx('gm-modal-overlay', modalType && 'gm-open')}
        onClick={(e) => {
          if (e.target === e.currentTarget) fermerModal();
        }}
      >
        <div className="gm-modal" style={{ maxWidth: 560, width: '95%' }}>
          <div className="gm-modal-head">
            <div className="gm-modal-title">{modalTitre}</div>
            <button className="gm-modal-close" type="button" onClick={fermerModal} aria-label="Fermer">
              ✕
            </button>
          </div>

          {/* ── Formulaire créer / modifier ───────────────────────────── */}
          {(modalType === 'creer' || modalType === 'modifier') && (
            <form onSubmit={soumettre}>
              <div className="gm-modal-body">
                <div className="gm-form-row">
                  <div className="gm-form-group">
                    <label className="gm-form-label">Nom *</label>
                    <input
                      className="gm-form-input"
                      value={fNom}
                      onChange={(e) => setFNom(e.target.value)}
                      required
                    />
                  </div>
                  <div className="gm-form-group">
                    <label className="gm-form-label">Référence (SKU) *</label>
                    <input
                      className="gm-form-input"
                      value={fRef}
                      onChange={(e) => setFRef(e.target.value)}
                      required
                      disabled={modalType === 'modifier'}
                    />
                  </div>
                </div>
                <div className="gm-form-group">
                  <label className="gm-form-label">Description</label>
                  <input
                    className="gm-form-input"
                    value={fDesc}
                    onChange={(e) => setFDesc(e.target.value)}
                  />
                </div>
                <div className="gm-form-row">
                  <div className="gm-form-group">
                    <label className="gm-form-label">Catégorie</label>
                    <select
                      className="gm-form-input"
                      value={fCat}
                      onChange={(e) => setFCat(e.target.value as CategorieArticle | '')}
                    >
                      <option value="">— Aucune —</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{CAT_LABEL[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="gm-form-group">
                    <label className="gm-form-label">Unité</label>
                    <input
                      className="gm-form-input"
                      value={fUnite}
                      onChange={(e) => setFUnite(e.target.value)}
                      placeholder="pièce"
                    />
                  </div>
                </div>
                <div className="gm-form-row">
                  <div className="gm-form-group">
                    <label className="gm-form-label">Prix unitaire (FCFA)</label>
                    <input
                      className="gm-form-input"
                      type="number"
                      min={0}
                      step={1}
                      value={fPrix}
                      onChange={(e) => setFPrix(e.target.value)}
                    />
                  </div>
                  <div className="gm-form-group">
                    <label className="gm-form-label">Seuil d'alerte</label>
                    <input
                      className="gm-form-input"
                      type="number"
                      min={0}
                      step={1}
                      value={fSeuil}
                      onChange={(e) => setFSeuil(e.target.value)}
                    />
                  </div>
                </div>
                {erreur && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>{erreur}</div>
                )}
                {succes && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-success)' }}>{succes}</div>
                )}
              </div>
              <div className="gm-modal-foot">
                <GmButton type="button" variante="outline" onClick={fermerModal}>Annuler</GmButton>
                <GmButton type="submit" variante="primary" disabled={enCours}>
                  {enCours ? 'Enregistrement…' : modalType === 'creer' ? 'Créer' : 'Sauvegarder'}
                </GmButton>
              </div>
            </form>
          )}

          {/* ── Entrée de stock ───────────────────────────────────────── */}
          {modalType === 'entree' && (
            <form onSubmit={soumettre}>
              <div className="gm-modal-body">
                {articleSelectionne && (
                  <div style={{ background: 'var(--gm-bg-2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                    <strong>{articleSelectionne.nom}</strong> ({articleSelectionne.reference})
                    <span style={{ marginLeft: 12, color: 'var(--gm-text-2)' }}>
                      Stock actuel : <strong>{articleSelectionne.quantite} {articleSelectionne.unite}</strong>
                    </span>
                  </div>
                )}
                <div className="gm-form-row">
                  <div className="gm-form-group">
                    <label className="gm-form-label">Quantité à ajouter *</label>
                    <input
                      className="gm-form-input"
                      type="number"
                      min={1}
                      step={1}
                      value={fQuantite}
                      onChange={(e) => setFQuantite(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="gm-form-group">
                    <label className="gm-form-label">N° Bon de livraison</label>
                    <input
                      className="gm-form-input"
                      value={fReference}
                      onChange={(e) => setFReference(e.target.value)}
                      placeholder="BL-2025-001"
                    />
                  </div>
                </div>
                <div className="gm-form-group">
                  <label className="gm-form-label">Motif</label>
                  <input
                    className="gm-form-input"
                    value={fMotif}
                    onChange={(e) => setFMotif(e.target.value)}
                    placeholder="Réapprovisionnement, achat fournisseur…"
                  />
                </div>
                {erreur && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>{erreur}</div>
                )}
                {succes && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-success)' }}>{succes}</div>
                )}
              </div>
              <div className="gm-modal-foot">
                <GmButton type="button" variante="outline" onClick={fermerModal}>Annuler</GmButton>
                <GmButton type="submit" variante="primary" disabled={enCours}>
                  {enCours ? 'Enregistrement…' : 'Valider entrée'}
                </GmButton>
              </div>
            </form>
          )}

          {/* ── Sortie de stock ───────────────────────────────────────── */}
          {modalType === 'sortie' && (
            <form onSubmit={soumettre}>
              <div className="gm-modal-body">
                {articleSelectionne && (
                  <div style={{ background: 'var(--gm-bg-2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                    <strong>{articleSelectionne.nom}</strong> ({articleSelectionne.reference})
                    <span style={{ marginLeft: 12, color: 'var(--gm-text-2)' }}>
                      Stock actuel : <strong>{articleSelectionne.quantite} {articleSelectionne.unite}</strong>
                    </span>
                  </div>
                )}
                <div className="gm-form-row">
                  <div className="gm-form-group">
                    <label className="gm-form-label">Quantité à retirer *</label>
                    <input
                      className="gm-form-input"
                      type="number"
                      min={1}
                      max={articleSelectionne?.quantite}
                      step={1}
                      value={fQuantite}
                      onChange={(e) => setFQuantite(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="gm-form-group">
                    <label className="gm-form-label">Référence</label>
                    <input
                      className="gm-form-input"
                      value={fReference}
                      onChange={(e) => setFReference(e.target.value)}
                      placeholder="N° commande, bon de sortie…"
                    />
                  </div>
                </div>
                <div className="gm-form-group">
                  <label className="gm-form-label">Motif</label>
                  <input
                    className="gm-form-input"
                    value={fMotif}
                    onChange={(e) => setFMotif(e.target.value)}
                    placeholder="Utilisation interne, vente, perte…"
                  />
                </div>
                {erreur && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>{erreur}</div>
                )}
                {succes && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-success)' }}>{succes}</div>
                )}
              </div>
              <div className="gm-modal-foot">
                <GmButton type="button" variante="outline" onClick={fermerModal}>Annuler</GmButton>
                <GmButton type="submit" variante="primary" disabled={enCours}>
                  {enCours ? 'Enregistrement…' : 'Valider sortie'}
                </GmButton>
              </div>
            </form>
          )}

          {/* ── Ajustement inventaire ─────────────────────────────────── */}
          {modalType === 'ajustement' && (
            <form onSubmit={soumettre}>
              <div className="gm-modal-body">
                {articleSelectionne && (
                  <div style={{ background: 'var(--gm-bg-2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                    <strong>{articleSelectionne.nom}</strong> — Stock système actuel :{' '}
                    <strong>{articleSelectionne.quantite} {articleSelectionne.unite}</strong>
                  </div>
                )}
                <div className="gm-form-group">
                  <label className="gm-form-label">Quantité réelle constatée *</label>
                  <input
                    className="gm-form-input"
                    type="number"
                    min={0}
                    step={1}
                    value={fNouvelleQte}
                    onChange={(e) => setFNouvelleQte(e.target.value)}
                    required
                    autoFocus
                  />
                  {fNouvelleQte !== '' && articleSelectionne && (
                    <div style={{ fontSize: 12, marginTop: 4, color: 'var(--gm-text-2)' }}>
                      Écart : {Number(fNouvelleQte) - articleSelectionne.quantite > 0 ? '+' : ''}
                      {Number(fNouvelleQte) - articleSelectionne.quantite} {articleSelectionne.unite}
                    </div>
                  )}
                </div>
                <div className="gm-form-group">
                  <label className="gm-form-label">Motif de l'ajustement</label>
                  <input
                    className="gm-form-input"
                    value={fMotif}
                    onChange={(e) => setFMotif(e.target.value)}
                    placeholder="Inventaire annuel, correction d'erreur…"
                  />
                </div>
                {erreur && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>{erreur}</div>
                )}
                {succes && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-success)' }}>{succes}</div>
                )}
              </div>
              <div className="gm-modal-foot">
                <GmButton type="button" variante="outline" onClick={fermerModal}>Annuler</GmButton>
                <GmButton type="submit" variante="primary" disabled={enCours}>
                  {enCours ? 'Enregistrement…' : 'Valider ajustement'}
                </GmButton>
              </div>
            </form>
          )}

          {/* ── Historique mouvements ──────────────────────────────────── */}
          {modalType === 'historique' && (
            <div className="gm-modal-body" style={{ padding: 0 }}>
              {histQ.isLoading ? (
                <div style={{ ...CELLULE_VIDE, padding: 24 }}>Chargement de l'historique…</div>
              ) : historique.length === 0 ? (
                <div style={{ ...CELLULE_VIDE, padding: 24 }}>Aucun mouvement enregistré.</div>
              ) : (
                <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                  {historique.map((m) => {
                    const info = TYPE_BADGE[m.type] ?? { label: m.type, couleur: 'var(--gm-text-2)' };
                    const diff = m.quantite;
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '12px 20px',
                          borderBottom: '1px solid var(--gm-border)',
                        }}
                      >
                        {/* point timeline */}
                        <div style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: info.couleur,
                          marginTop: 4,
                          flexShrink: 0,
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: info.couleur,
                                background: info.couleur + '20',
                                padding: '1px 8px',
                                borderRadius: 10,
                              }}
                            >
                              {info.label}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>
                              {diff >= 0 ? '+' : ''}{diff}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                              {m.quantiteAvant} → {m.quantiteApres}
                            </span>
                          </div>
                          {m.motif && (
                            <div style={{ fontSize: 12, color: 'var(--gm-text-2)', marginTop: 2 }}>
                              {m.motif}
                            </div>
                          )}
                          {m.reference && (
                            <div style={{ fontSize: 11, color: 'var(--gm-text-2)', marginTop: 2 }}>
                              Réf. {m.reference}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: 'var(--gm-text-2)', marginTop: 2 }}>
                            {m.createdAt ? formatDateTime(m.createdAt) : '—'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Pagination historique */}
              {(histQ.data?.total ?? 0) > 30 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px 0' }}>
                  <GmButton
                    variante="outline" petit
                    disabled={histPage <= 1}
                    onClick={() => setHistPage(histPage - 1)}
                  >
                    ← Préc.
                  </GmButton>
                  <GmButton
                    variante="outline" petit
                    disabled={histPage >= Math.ceil((histQ.data?.total ?? 0) / 30)}
                    onClick={() => setHistPage(histPage + 1)}
                  >
                    Suiv. →
                  </GmButton>
                </div>
              )}
              <div className="gm-modal-foot">
                <GmButton variante="outline" onClick={fermerModal}>Fermer</GmButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
