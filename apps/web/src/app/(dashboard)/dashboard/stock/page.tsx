'use client';
// ============================================================
// PAGE STOCK & INVENTAIRE — GESTMONEY
// Présentation calquée sur mockup/stock.html (classes gm-*).
// 100 % des chiffres proviennent de l'API réelle (/stock/*).
// Aucun produit ni quantité de démonstration n'est affiché :
// en l'absence de données, on montre un état vide explicite.
// ============================================================
import React, { useMemo, useState } from 'react';
import { GmPageHeader, GmButton, GmTableWrap } from '@/components/gm';
import {
  useProduits,
  useInventaire,
  useMouvementsStock,
  useAlertesStock,
  useValorisationStock,
  useEntreeStock,
  useSortieStock,
  type CategorieProduit,
  type LigneInventaire,
  type MotifMouvement,
  type MouvementStock,
} from '@/hooks/useStock';
import { formatMontant, formatDateTime } from '@/lib/formatters';
import { clsx } from 'clsx';

// ─── Libellés statiques (pas des données) ────────────────────────────────────

const CATEGORIE_BADGE: Record<CategorieProduit, { classe: string; label: string }> = {
  SIM: { classe: 'gm-cat-sim', label: 'SIM' },
  TERMINAL: { classe: 'gm-cat-terminal', label: 'Terminal' },
  ACCESSOIRE: { classe: 'gm-cat-accessoire', label: 'Accessoire' },
  CONSOMMABLE: { classe: 'gm-cat-consommable', label: 'Consommable' },
};

const MOTIFS: Array<{ valeur: MotifMouvement; label: string }> = [
  { valeur: 'PURCHASE', label: 'Achat / réception' },
  { valeur: 'SALE', label: 'Vente' },
  { valeur: 'RETURN', label: 'Retour' },
  { valeur: 'DAMAGE', label: 'Casse / dommage' },
  { valeur: 'THEFT', label: 'Vol / perte' },
  { valeur: 'TRANSFER', label: 'Transfert' },
  { valeur: 'INVENTORY', label: 'Ajustement inventaire' },
];

const TYPE_MOUVEMENT_LABEL: Record<MouvementStock['type'], string> = {
  IN: 'Entrée',
  OUT: 'Sortie',
  TRANSFER: 'Transfert',
  ADJUSTMENT: 'Ajustement',
};

type NiveauStock = 'ok' | 'bas' | 'critique';

/** Statut dérivé UNIQUEMENT des quantités et seuils réels. */
function niveauStock(quantite: number, seuil: number): NiveauStock {
  if (quantite <= 0) return 'critique';
  if (seuil > 0 && quantite <= seuil) return 'bas';
  return 'ok';
}

const NIVEAU_PILL: Record<NiveauStock, { classe: string; label: string; couleur: string }> = {
  ok: { classe: 'gm-pill-ok', label: '● OK', couleur: 'var(--gm-success)' },
  bas: { classe: 'gm-pill-low', label: '⚠️ Bas', couleur: 'var(--gm-warning)' },
  critique: { classe: 'gm-pill-critical', label: '🔴 Critique', couleur: 'var(--gm-danger)' },
};

/** Remplissage visuel de la barre : quantité rapportée à 2× le seuil d'alerte. */
function largeurBarre(quantite: number, seuil: number): number {
  if (quantite <= 0) return 0;
  const reference = seuil > 0 ? seuil * 2 : quantite;
  return Math.min(100, Math.round((quantite / reference) * 100));
}

const CELLULE_VIDE: React.CSSProperties = {
  textAlign: 'center',
  color: 'var(--gm-text-2)',
  padding: '24px 16px',
  fontSize: 13,
};

export default function StockPage() {
  const produitsQuery = useProduits({ limit: 200 });
  const inventaireQuery = useInventaire({ limit: 200 });
  const mouvementsQuery = useMouvementsStock({ limit: 50 });
  const alertesQuery = useAlertesStock();
  const valorisationQuery = useValorisationStock();

  const entreeStock = useEntreeStock();
  const sortieStock = useSortieStock();

  const produits = produitsQuery.data?.data ?? [];
  const lignes = inventaireQuery.data?.data ?? [];
  const mouvements = mouvementsQuery.data?.data ?? [];
  const alertes = alertesQuery.data ?? [];

  // Index produit pour enrichir les mouvements (le backend ne les joint pas)
  const produitParId = useMemo(() => {
    const index = new Map<string, string>();
    produits.forEach((p) => index.set(p.id, p.name));
    lignes.forEach((l) => {
      if (l.product) index.set(l.product.id, l.product.name);
    });
    return index;
  }, [produits, lignes]);

  const totalUnites = useMemo(
    () => lignes.reduce((somme, l) => somme + Number(l.quantity ?? 0), 0),
    [lignes],
  );
  const nbCritiques = alertes.filter((a) => a.severity === 'CRITICAL').length;

  // ─── Modal mouvement ───────────────────────────────────────────────────────
  const [modalOuvert, setModalOuvert] = useState(false);
  const [sens, setSens] = useState<'in' | 'out'>('in');
  const [produitId, setProduitId] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState<MotifMouvement>('PURCHASE');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const enCours = entreeStock.isPending || sortieStock.isPending;

  function ouvrirModal(direction: 'in' | 'out', ligne?: LigneInventaire) {
    setSens(direction);
    setProduitId(ligne?.productId ?? '');
    setAgencyId(ligne?.agencyId ?? '');
    setQuantite('');
    setMotif(direction === 'in' ? 'PURCHASE' : 'SALE');
    setReference('');
    setNotes('');
    setErreur('');
    setSucces('');
    setModalOuvert(true);
  }

  function fermerModal() {
    setModalOuvert(false);
    setErreur('');
    setSucces('');
  }

  async function soumettreMouvement(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setSucces('');
    const qte = Number(quantite);
    if (!produitId) return setErreur('Produit requis.');
    if (!agencyId.trim()) return setErreur('Identifiant d’agence requis.');
    if (!Number.isInteger(qte) || qte < 1) return setErreur('Quantité invalide (entier ≥ 1).');

    const dto = {
      productId: produitId,
      agencyId: agencyId.trim(),
      quantity: qte,
      reason: motif,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (sens === 'in') await entreeStock.mutateAsync(dto);
      else await sortieStock.mutateAsync(dto);
      setSucces('Mouvement enregistré.');
      setQuantite('');
      setTimeout(() => fermerModal(), 1200);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors de l’enregistrement du mouvement.';
      setErreur(String(message));
    }
  }

  const chargementGlobal = produitsQuery.isLoading || inventaireQuery.isLoading;
  const erreurGlobale =
    produitsQuery.isError || inventaireQuery.isError || alertesQuery.isError;

  return (
    <>
      <GmPageHeader
        fil={['🏠 Accueil', 'Stock & Inventaire']}
        titre="📦 Stock & Inventaire"
        sousTitre="SIM, terminaux, accessoires et consommables"
        actions={
          <>
            <GmButton
              variante="outline"
              petit
              onClick={() => {
                void produitsQuery.refetch();
                void inventaireQuery.refetch();
                void mouvementsQuery.refetch();
                void alertesQuery.refetch();
                void valorisationQuery.refetch();
              }}
            >
              🔄 Actualiser
            </GmButton>
            <GmButton
              variante="outline"
              petit
              onClick={() => ouvrirModal('out')}
              disabled={produits.length === 0}
            >
              📤 Sortie stock
            </GmButton>
            <GmButton
              variante="primary"
              petit
              onClick={() => ouvrirModal('in')}
              disabled={produits.length === 0}
            >
              📥 Entrée stock
            </GmButton>
          </>
        }
      />

      {/* ─── Erreur API ──────────────────────────────────────────────────── */}
      {erreurGlobale && (
        <div className="gm-alert-banner">
          <div className="gm-alert-icon">⚠️</div>
          <div className="gm-alert-text">
            <strong>Données de stock indisponibles.</strong> Le service inventaire n’a pas répondu.
            Utilisez « Actualiser » pour réessayer.
          </div>
        </div>
      )}

      {/* ─── Statistiques (issues des données réelles) ───────────────────── */}
      <div className="gm-stats-row">
        <div className="gm-stat-card gm-s1">
          <div className="gm-stat-value">
            {produitsQuery.isLoading ? '—' : produitsQuery.data?.total ?? 0}
          </div>
          <div className="gm-stat-label">Produits au catalogue</div>
          <div className="gm-stat-sub">Références actives</div>
        </div>
        <div className="gm-stat-card gm-s2">
          <div className="gm-stat-value">
            {inventaireQuery.isLoading ? '—' : totalUnites.toLocaleString('fr-FR')}
          </div>
          <div className="gm-stat-label">Unités en stock</div>
          <div className="gm-stat-sub">
            {inventaireQuery.isLoading ? '—' : `${lignes.length} ligne(s) d’inventaire`}
          </div>
        </div>
        <div className="gm-stat-card gm-s3">
          <div className="gm-stat-value">{alertesQuery.isLoading ? '—' : alertes.length}</div>
          <div className="gm-stat-label">Alertes stock bas</div>
          <div className="gm-stat-sub">
            {alertesQuery.isLoading ? '—' : `${nbCritiques} critique(s)`}
          </div>
        </div>
        <div className="gm-stat-card gm-s4">
          <div className="gm-stat-value" style={{ fontSize: 20 }}>
            {valorisationQuery.isLoading || valorisationQuery.isError
              ? '—'
              : formatMontant(valorisationQuery.data?.totalValue ?? 0)}
          </div>
          <div className="gm-stat-label">Valorisation du stock</div>
          <div className="gm-stat-sub">Toutes agences confondues</div>
        </div>
      </div>

      {/* ─── Bandeau d'alertes stock bas ─────────────────────────────────── */}
      {alertes.length > 0 && (
        <div className="gm-alert-banner">
          <div className="gm-alert-icon">⚠️</div>
          <div className="gm-alert-text">
            <strong>
              {alertes.length} alerte(s) stock bas
              {nbCritiques > 0 ? ` dont ${nbCritiques} critique(s)` : ''} :
            </strong>{' '}
            {alertes
              .slice(0, 3)
              .map(
                (a) =>
                  `${a.productName} — agence ${a.agencyId} (${a.currentQuantity}/${a.threshold})`,
              )
              .join(' · ')}
            {alertes.length > 3 ? ` … +${alertes.length - 3} autre(s)` : ''}
          </div>
        </div>
      )}

      {/* ─── Inventaire ──────────────────────────────────────────────────── */}
      <div className="gm-section-block">
        <div className="gm-section-title">
          <span>📋 Inventaire produits</span>
        </div>
        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Agence</th>
                <th>Niveau de stock</th>
                <th>Seuil alerte</th>
                <th>Valeur unitaire</th>
                <th>Valorisation</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {chargementGlobal ? (
                <tr>
                  <td colSpan={9} style={CELLULE_VIDE}>
                    Chargement de l’inventaire…
                  </td>
                </tr>
              ) : inventaireQuery.isError ? (
                <tr>
                  <td colSpan={9} style={{ ...CELLULE_VIDE, color: 'var(--gm-danger)' }}>
                    Impossible de charger l’inventaire.
                  </td>
                </tr>
              ) : lignes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={CELLULE_VIDE}>
                    Aucun produit en stock
                  </td>
                </tr>
              ) : (
                lignes.map((ligne) => {
                  const produit = ligne.product;
                  const seuil = Number(produit?.alertThreshold ?? 0);
                  const dispo = Number(ligne.availableQuantity ?? 0);
                  const niveau = niveauStock(dispo, seuil);
                  const pill = NIVEAU_PILL[niveau];
                  const badge = produit ? CATEGORIE_BADGE[produit.category] : undefined;
                  return (
                    <tr key={`${ligne.productId}-${ligne.agencyId}`}>
                      <td>
                        <strong>{produit?.name ?? 'Produit inconnu'}</strong>
                        <div style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>
                          {produit?.sku ?? ligne.productId}
                        </div>
                      </td>
                      <td>
                        {badge ? (
                          <span className={clsx('gm-cat-badge', badge.classe)}>{badge.label}</span>
                        ) : (
                          <span style={{ color: 'var(--gm-text-2)' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12 }}>{ligne.agencyId || '—'}</td>
                      <td>
                        <div className="gm-stock-bar-wrap">
                          <div className="gm-stock-bar">
                            <div
                              className="gm-stock-fill"
                              style={{
                                width: `${largeurBarre(dispo, seuil)}%`,
                                background: pill.couleur,
                              }}
                            />
                          </div>
                          <span className="gm-stock-val" style={{ color: pill.couleur }}>
                            {dispo.toLocaleString('fr-FR')} {produit?.unit ?? 'u.'}
                          </span>
                        </div>
                        {Number(ligne.reservedQuantity ?? 0) > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--gm-text-2)', marginTop: 2 }}>
                            {ligne.reservedQuantity} réservée(s) · {ligne.quantity} au total
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                        {seuil > 0 ? `${seuil} ${produit?.unit ?? 'u.'}` : '—'}
                      </td>
                      <td style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                        {produit ? formatMontant(produit.unitPrice) : '—'}
                      </td>
                      <td style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                        {formatMontant(Number(ligne.valorisation ?? 0))}
                      </td>
                      <td>
                        <span className={clsx('gm-status-pill', pill.classe)}>{pill.label}</span>
                      </td>
                      <td>
                        <div className="gm-action-btns">
                          <button
                            className="gm-action-btn"
                            type="button"
                            onClick={() => ouvrirModal('in', ligne)}
                          >
                            📥 Entrée
                          </button>
                          <button
                            className={clsx('gm-action-btn', niveau === 'critique' && 'gm-danger')}
                            type="button"
                            onClick={() => ouvrirModal('out', ligne)}
                            disabled={dispo <= 0}
                          >
                            📤 Sortie
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
      </div>

      {/* ─── Mouvements de stock ─────────────────────────────────────────── */}
      <div className="gm-section-block">
        <div className="gm-section-title">
          <span>🔁 Mouvements de stock</span>
        </div>
        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Agence</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Motif</th>
                <th>Référence</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {mouvementsQuery.isLoading ? (
                <tr>
                  <td colSpan={8} style={CELLULE_VIDE}>
                    Chargement des mouvements…
                  </td>
                </tr>
              ) : mouvementsQuery.isError ? (
                <tr>
                  <td colSpan={8} style={{ ...CELLULE_VIDE, color: 'var(--gm-danger)' }}>
                    Impossible de charger les mouvements.
                  </td>
                </tr>
              ) : mouvements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={CELLULE_VIDE}>
                    Aucun mouvement enregistré
                  </td>
                </tr>
              ) : (
                mouvements.map((m) => {
                  const entree = m.type === 'IN';
                  return (
                    <tr key={m.id}>
                      <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                        {m.createdAt ? formatDateTime(m.createdAt) : '—'}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {produitParId.get(m.productId) ?? m.productId}
                      </td>
                      <td style={{ fontSize: 12 }}>{m.agencyId || '—'}</td>
                      <td>
                        <span className={clsx('gm-badge', entree ? 'gm-badge-in' : 'gm-badge-out')}>
                          {TYPE_MOUVEMENT_LABEL[m.type] ?? m.type}
                        </span>
                      </td>
                      <td className={entree ? 'gm-amount-pos' : 'gm-amount-neg'}>
                        {entree ? '+' : '-'}
                        {Number(m.quantity ?? 0).toLocaleString('fr-FR')}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {MOTIFS.find((x) => x.valeur === m.reason)?.label ?? m.reason}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>
                        {m.reference || '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{m.notes || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </GmTableWrap>
      </div>

      {/* ─── Modal mouvement de stock ────────────────────────────────────── */}
      <div
        className={clsx('gm-modal-overlay', modalOuvert && 'gm-open')}
        onClick={(e) => {
          if (e.target === e.currentTarget) fermerModal();
        }}
      >
        <div className="gm-modal">
          <div className="gm-modal-head">
            <div className="gm-modal-title">
              {sens === 'in' ? '📥 Entrée de stock' : '📤 Sortie de stock'}
            </div>
            <button
              className="gm-modal-close"
              type="button"
              onClick={fermerModal}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
          <form onSubmit={soumettreMouvement}>
            <div className="gm-modal-body">
              <div className="gm-form-group">
                <label className="gm-form-label" htmlFor="stock-produit">
                  Produit
                </label>
                <select
                  id="stock-produit"
                  className="gm-form-input"
                  value={produitId}
                  onChange={(e) => setProduitId(e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {produits.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
                {produits.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--gm-text-2)', marginTop: 4 }}>
                    Aucun produit au catalogue.
                  </div>
                )}
              </div>

              <div className="gm-form-row">
                <div className="gm-form-group">
                  <label className="gm-form-label" htmlFor="stock-agence">
                    Agence (identifiant)
                  </label>
                  <input
                    id="stock-agence"
                    className="gm-form-input"
                    type="text"
                    value={agencyId}
                    onChange={(e) => setAgencyId(e.target.value)}
                    required
                  />
                </div>
                <div className="gm-form-group">
                  <label className="gm-form-label" htmlFor="stock-qte">
                    Quantité
                  </label>
                  <input
                    id="stock-qte"
                    className="gm-form-input"
                    type="number"
                    min={1}
                    step={1}
                    value={quantite}
                    onChange={(e) => setQuantite(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="gm-form-row">
                <div className="gm-form-group">
                  <label className="gm-form-label" htmlFor="stock-motif">
                    Motif
                  </label>
                  <select
                    id="stock-motif"
                    className="gm-form-input"
                    value={motif}
                    onChange={(e) => setMotif(e.target.value as MotifMouvement)}
                    required
                  >
                    {MOTIFS.map((m) => (
                      <option key={m.valeur} value={m.valeur}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="gm-form-group">
                  <label className="gm-form-label" htmlFor="stock-ref">
                    Référence
                  </label>
                  <input
                    id="stock-ref"
                    className="gm-form-input"
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              </div>

              <div className="gm-form-group">
                <label className="gm-form-label" htmlFor="stock-notes">
                  Notes
                </label>
                <input
                  id="stock-notes"
                  className="gm-form-input"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {erreur && (
                <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>
                  {erreur}
                </div>
              )}
              {succes && (
                <div className="gm-alert-desc" style={{ color: 'var(--gm-success)' }}>
                  {succes}
                </div>
              )}
            </div>
            <div className="gm-modal-foot">
              <GmButton type="button" variante="outline" onClick={fermerModal}>
                Annuler
              </GmButton>
              <GmButton type="submit" variante="primary" disabled={enCours}>
                {enCours ? 'Enregistrement…' : 'Valider le mouvement'}
              </GmButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
