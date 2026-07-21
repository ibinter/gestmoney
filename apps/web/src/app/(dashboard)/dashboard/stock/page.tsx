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
import { GmExportMenu } from '@/components/gm/GmExportMenu';
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
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

// ─── Libellés statiques (pas des données) ────────────────────────────────────

const categorieBadge = (t: Translations): Record<CategorieProduit, { classe: string; label: string }> => ({
  SIM: { classe: 'gm-cat-sim', label: t.stock.categories.SIM },
  TERMINAL: { classe: 'gm-cat-terminal', label: t.stock.categories.TERMINAL },
  ACCESSOIRE: { classe: 'gm-cat-accessoire', label: t.stock.categories.ACCESSOIRE },
  CONSOMMABLE: { classe: 'gm-cat-consommable', label: t.stock.categories.CONSOMMABLE },
});

const motifsListe = (t: Translations): Array<{ valeur: MotifMouvement; label: string }> => [
  { valeur: 'PURCHASE', label: t.stock.motifs.PURCHASE },
  { valeur: 'SALE', label: t.stock.motifs.SALE },
  { valeur: 'RETURN', label: t.stock.motifs.RETURN },
  { valeur: 'DAMAGE', label: t.stock.motifs.DAMAGE },
  { valeur: 'THEFT', label: t.stock.motifs.THEFT },
  { valeur: 'TRANSFER', label: t.stock.motifs.TRANSFER },
  { valeur: 'INVENTORY', label: t.stock.motifs.INVENTORY },
];

const typeMouvementLabel = (t: Translations): Record<MouvementStock['type'], string> => ({
  IN: t.stock.typeMouvement.IN,
  OUT: t.stock.typeMouvement.OUT,
  TRANSFER: t.stock.typeMouvement.TRANSFER,
  ADJUSTMENT: t.stock.typeMouvement.ADJUSTMENT,
});

type NiveauStock = 'ok' | 'bas' | 'critique';

/** Statut dérivé UNIQUEMENT des quantités et seuils réels. */
function niveauStock(quantite: number, seuil: number): NiveauStock {
  if (quantite <= 0) return 'critique';
  if (seuil > 0 && quantite <= seuil) return 'bas';
  return 'ok';
}

const niveauPill = (t: Translations): Record<NiveauStock, { classe: string; label: string; couleur: string }> => ({
  ok: { classe: 'gm-pill-ok', label: t.stock.niveaux.ok, couleur: 'var(--gm-success)' },
  bas: { classe: 'gm-pill-low', label: t.stock.niveaux.bas, couleur: 'var(--gm-warning)' },
  critique: { classe: 'gm-pill-critical', label: t.stock.niveaux.critique, couleur: 'var(--gm-danger)' },
});

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
  const t = useT();
  const CATEGORIE_BADGE = categorieBadge(t);
  const MOTIFS = motifsListe(t);
  const TYPE_MOUVEMENT_LABEL = typeMouvementLabel(t);
  const NIVEAU_PILL = niveauPill(t);
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

  // Lignes d'inventaire mappées pour l'export (mêmes valeurs que le tableau).
  const inventaireExport = useMemo(
    () =>
      lignes.map((ligne) => {
        const produit = ligne.product;
        const seuil = Number(produit?.alertThreshold ?? 0);
        const dispo = Number(ligne.availableQuantity ?? 0);
        const niveau = niveauStock(dispo, seuil);
        const unit = produit?.unit ?? t.stock.inventaire.unitDefault;
        return {
          produit: produit?.name ?? t.stock.inventaire.unknownProduct,
          categorie: produit ? CATEGORIE_BADGE[produit.category].label : '—',
          agence: ligne.agencyId || '—',
          niveau: `${dispo.toLocaleString('fr-FR')} ${unit}`,
          seuil: seuil > 0 ? `${seuil} ${unit}` : '—',
          valeurUnitaire: produit ? formatMontant(produit.unitPrice) : '—',
          valorisation: formatMontant(Number(ligne.valorisation ?? 0)),
          statut: NIVEAU_PILL[niveau].label,
        };
      }),
    [lignes, t, CATEGORIE_BADGE, NIVEAU_PILL],
  );

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
    if (!produitId) return setErreur(t.stock.modal.errProduit);
    if (!agencyId.trim()) return setErreur(t.stock.modal.errAgence);
    if (!Number.isInteger(qte) || qte < 1) return setErreur(t.stock.modal.errQuantite);

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
      setSucces(t.stock.modal.success);
      setQuantite('');
      setTimeout(() => fermerModal(), 1200);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t.stock.modal.errSave;
      setErreur(String(message));
    }
  }

  const chargementGlobal = produitsQuery.isLoading || inventaireQuery.isLoading;
  const erreurGlobale =
    produitsQuery.isError || inventaireQuery.isError || alertesQuery.isError;

  return (
    <>
      <GmPageHeader
        fil={[`🏠 ${t.common.home}`, t.stock.breadcrumb]}
        titre={t.stock.title}
        sousTitre={t.stock.subtitle}
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
              {t.stock.refresh}
            </GmButton>
            <GmButton
              variante="outline"
              petit
              onClick={() => ouvrirModal('out')}
              disabled={produits.length === 0}
            >
              {t.stock.sortieBtn}
            </GmButton>
            <GmButton
              variante="primary"
              petit
              onClick={() => ouvrirModal('in')}
              disabled={produits.length === 0}
            >
              {t.stock.entreeBtn}
            </GmButton>
            <GmExportMenu
              titre={t.stock.inventaire.sectionTitle}
              donnees={inventaireExport}
              nomFichier="stock_inventaire"
              colonnes={[
                { titre: t.stock.inventaire.colProduit, valeur: (r) => r.produit },
                { titre: t.stock.inventaire.colCategorie, valeur: (r) => r.categorie },
                { titre: t.stock.inventaire.colAgence, valeur: (r) => r.agence },
                { titre: t.stock.inventaire.colNiveau, valeur: (r) => r.niveau, align: 'right' },
                { titre: t.stock.inventaire.colSeuil, valeur: (r) => r.seuil, align: 'right' },
                { titre: t.stock.inventaire.colValeurUnitaire, valeur: (r) => r.valeurUnitaire, align: 'right' },
                { titre: t.stock.inventaire.colValorisation, valeur: (r) => r.valorisation, align: 'right' },
                { titre: t.stock.inventaire.colStatut, valeur: (r) => r.statut },
              ]}
            />
          </>
        }
      />

      {/* ─── Erreur API ──────────────────────────────────────────────────── */}
      {erreurGlobale && (
        <div className="gm-alert-banner">
          <div className="gm-alert-icon">⚠️</div>
          <div className="gm-alert-text">
            <strong>{t.stock.errorTitle}</strong> {t.stock.errorBody}
          </div>
        </div>
      )}

      {/* ─── Statistiques (issues des données réelles) ───────────────────── */}
      <div className="gm-stats-row">
        <div className="gm-stat-card gm-s1">
          <div className="gm-stat-value">
            {produitsQuery.isLoading ? '—' : produitsQuery.data?.total ?? 0}
          </div>
          <div className="gm-stat-label">{t.stock.stats.produits}</div>
          <div className="gm-stat-sub">{t.stock.stats.produitsSub}</div>
        </div>
        <div className="gm-stat-card gm-s2">
          <div className="gm-stat-value">
            {inventaireQuery.isLoading ? '—' : totalUnites.toLocaleString('fr-FR')}
          </div>
          <div className="gm-stat-label">{t.stock.stats.unites}</div>
          <div className="gm-stat-sub">
            {inventaireQuery.isLoading ? '—' : `${lignes.length} ${t.stock.stats.lignesSuffix}`}
          </div>
        </div>
        <div className="gm-stat-card gm-s3">
          <div className="gm-stat-value">{alertesQuery.isLoading ? '—' : alertes.length}</div>
          <div className="gm-stat-label">{t.stock.stats.alertes}</div>
          <div className="gm-stat-sub">
            {alertesQuery.isLoading ? '—' : `${nbCritiques} ${t.stock.stats.critiquesSuffix}`}
          </div>
        </div>
        <div className="gm-stat-card gm-s4">
          <div className="gm-stat-value" style={{ fontSize: 20 }}>
            {valorisationQuery.isLoading || valorisationQuery.isError
              ? '—'
              : formatMontant(valorisationQuery.data?.totalValue ?? 0)}
          </div>
          <div className="gm-stat-label">{t.stock.stats.valorisation}</div>
          <div className="gm-stat-sub">{t.stock.stats.valorisationSub}</div>
        </div>
      </div>

      {/* ─── Bandeau d'alertes stock bas ─────────────────────────────────── */}
      {alertes.length > 0 && (
        <div className="gm-alert-banner">
          <div className="gm-alert-icon">⚠️</div>
          <div className="gm-alert-text">
            <strong>
              {alertes.length} {t.stock.alerts.alertesSuffix}
              {nbCritiques > 0 ? ` ${t.stock.alerts.dontPrefix} ${nbCritiques} ${t.stock.stats.critiquesSuffix}` : ''} :
            </strong>{' '}
            {alertes
              .slice(0, 3)
              .map(
                (a) =>
                  `${a.productName} — ${t.stock.alerts.agencePrefix} ${a.agencyId} (${a.currentQuantity}/${a.threshold})`,
              )
              .join(' · ')}
            {alertes.length > 3 ? ` … +${alertes.length - 3} ${t.stock.alerts.othersSuffix}` : ''}
          </div>
        </div>
      )}

      {/* ─── Inventaire ──────────────────────────────────────────────────── */}
      <div className="gm-section-block">
        <div className="gm-section-title">
          <span>{t.stock.inventaire.sectionTitle}</span>
        </div>
        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th>{t.stock.inventaire.colProduit}</th>
                <th>{t.stock.inventaire.colCategorie}</th>
                <th>{t.stock.inventaire.colAgence}</th>
                <th>{t.stock.inventaire.colNiveau}</th>
                <th>{t.stock.inventaire.colSeuil}</th>
                <th>{t.stock.inventaire.colValeurUnitaire}</th>
                <th>{t.stock.inventaire.colValorisation}</th>
                <th>{t.stock.inventaire.colStatut}</th>
                <th>{t.stock.inventaire.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {chargementGlobal ? (
                <tr>
                  <td colSpan={9} style={CELLULE_VIDE}>
                    {t.stock.inventaire.loading}
                  </td>
                </tr>
              ) : inventaireQuery.isError ? (
                <tr>
                  <td colSpan={9} style={{ ...CELLULE_VIDE, color: 'var(--gm-danger)' }}>
                    {t.stock.inventaire.error}
                  </td>
                </tr>
              ) : lignes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={CELLULE_VIDE}>
                    {t.stock.inventaire.empty}
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
                        <strong>{produit?.name ?? t.stock.inventaire.unknownProduct}</strong>
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
                            {dispo.toLocaleString('fr-FR')} {produit?.unit ?? t.stock.inventaire.unitDefault}
                          </span>
                        </div>
                        {Number(ligne.reservedQuantity ?? 0) > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--gm-text-2)', marginTop: 2 }}>
                            {ligne.reservedQuantity} {t.stock.inventaire.reservedSuffix} · {ligne.quantity} {t.stock.inventaire.totalSuffix}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                        {seuil > 0 ? `${seuil} ${produit?.unit ?? t.stock.inventaire.unitDefault}` : '—'}
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
                            {t.stock.inventaire.actionEntree}
                          </button>
                          <button
                            className={clsx('gm-action-btn', niveau === 'critique' && 'gm-danger')}
                            type="button"
                            onClick={() => ouvrirModal('out', ligne)}
                            disabled={dispo <= 0}
                          >
                            {t.stock.inventaire.actionSortie}
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
          <span>{t.stock.mouvements.sectionTitle}</span>
        </div>
        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th>{t.stock.mouvements.colDate}</th>
                <th>{t.stock.mouvements.colProduit}</th>
                <th>{t.stock.mouvements.colAgence}</th>
                <th>{t.stock.mouvements.colType}</th>
                <th>{t.stock.mouvements.colQuantite}</th>
                <th>{t.stock.mouvements.colMotif}</th>
                <th>{t.stock.mouvements.colReference}</th>
                <th>{t.stock.mouvements.colNotes}</th>
              </tr>
            </thead>
            <tbody>
              {mouvementsQuery.isLoading ? (
                <tr>
                  <td colSpan={8} style={CELLULE_VIDE}>
                    {t.stock.mouvements.loading}
                  </td>
                </tr>
              ) : mouvementsQuery.isError ? (
                <tr>
                  <td colSpan={8} style={{ ...CELLULE_VIDE, color: 'var(--gm-danger)' }}>
                    {t.stock.mouvements.error}
                  </td>
                </tr>
              ) : mouvements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={CELLULE_VIDE}>
                    {t.stock.mouvements.empty}
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
              {sens === 'in' ? t.stock.modal.titleIn : t.stock.modal.titleOut}
            </div>
            <button
              className="gm-modal-close"
              type="button"
              onClick={fermerModal}
              aria-label={t.stock.modal.close}
            >
              ✕
            </button>
          </div>
          <form onSubmit={soumettreMouvement}>
            <div className="gm-modal-body">
              <div className="gm-form-group">
                <label className="gm-form-label" htmlFor="stock-produit">
                  {t.stock.modal.produitLabel}
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
                    {t.stock.modal.noProduct}
                  </div>
                )}
              </div>

              <div className="gm-form-row">
                <div className="gm-form-group">
                  <label className="gm-form-label" htmlFor="stock-agence">
                    {t.stock.modal.agenceLabel}
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
                    {t.stock.modal.quantiteLabel}
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
                    {t.stock.modal.motifLabel}
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
                    {t.stock.modal.referenceLabel}
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
                  {t.stock.modal.notesLabel}
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
                {t.common.cancel}
              </GmButton>
              <GmButton type="submit" variante="primary" disabled={enCours}>
                {enCours ? t.stock.modal.saving : t.stock.modal.submit}
              </GmButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
