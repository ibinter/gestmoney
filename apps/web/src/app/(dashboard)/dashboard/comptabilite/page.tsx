'use client';
// ============================================================
// PAGE COMPTABILITÉ SYSCOHADA — GESTMONEY
// Présentation calquée sur mockup/comptabilite.html (classes gm-*).
//
// RÈGLE DE DONNÉES : tous les montants affichés proviennent des
// endpoints réels /accounting/*. Aucun chiffre de la maquette n'est
// repris. Les blocs sans source de données réelle (tendances
// « vs mois précédent », badges de source d'écriture, journal de
// saisie) sont omis ou remplacés par un état vide explicite.
// ============================================================
import React, { useMemo, useState } from 'react';
import { GmPageHeader, GmTableWrap } from '@/components/gm';
import { GmExportMenu } from '@/components/gm/GmExportMenu';
import {
  useExercicesFiscaux,
  usePlanComptable,
  useJournal,
  useBalanceVerification,
  useCompteResultat,
  useBilan,
  useCompteResultatOhada,
  useBilanAnnuel,
  useCloturerExercice,
  versNombre,
  type PosteBilan,
  type ExerciceFiscal,
} from '@/hooks/useComptabilite';
import { formatDate } from '@/lib/formatters';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

// ─── Helpers d'affichage ─────────────────────────────────────────────────────

/** Montant décimal-string de l'API → affichage fr-FR. Jamais de valeur inventée. */
function montant(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  return versNombre(v).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Cellule débit/crédit : vide si le montant est nul (convention comptable). */
function montantOuVide(v: string | number | null | undefined): string {
  return versNombre(v) === 0 ? '' : montant(v);
}

function sommePostes(postes: PosteBilan[] | undefined): number {
  return (postes ?? []).reduce((acc, p) => acc + versNombre(p.montant), 0);
}

type Onglet = 'exercices' | 'grandlivre' | 'balance' | 'resultat' | 'bilan' | 'plan';

const onglets = (_t: Translations): { cle: Onglet; label: string }[] => [
  { cle: 'exercices', label: 'Exercices' },
  { cle: 'grandlivre', label: _t.comptabilite.onglets.grandlivre },
  { cle: 'balance', label: _t.comptabilite.onglets.balance },
  { cle: 'resultat', label: _t.comptabilite.onglets.resultat },
  { cle: 'bilan', label: _t.comptabilite.onglets.bilan },
  { cle: 'plan', label: _t.comptabilite.onglets.plan },
];

/** Bandeau générique chargement / erreur / vide, sans jamais afficher de chiffres factices. */
function EtatBloc({
  chargement,
  erreur,
  vide,
  messageVide,
}: {
  chargement: boolean;
  erreur: unknown;
  vide?: boolean;
  messageVide?: string;
}) {
  const t = useT();
  if (chargement) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--gm-text-2)', fontSize: 13 }}>
        {t.comptabilite.etat.loading}
      </div>
    );
  }
  if (erreur) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--gm-danger)', fontSize: 13 }}>
        {t.comptabilite.etat.error}
      </div>
    );
  }
  if (vide) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--gm-text-2)', fontSize: 13 }}>
        {messageVide ?? t.comptabilite.etat.empty}
      </div>
    );
  }
  return null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

// ─── Section compte de résultat (exploitation / financier / exceptionnel) ────

interface LigneOhada { compte: string; libelle: string; montant: string }

function SectionResultat({
  titre,
  charges,
  produits,
  totalCharges,
  totalProduits,
  resultat,
}: {
  titre: string;
  charges: LigneOhada[];
  produits: LigneOhada[];
  totalCharges: string;
  totalProduits: string;
  resultat: string;
}) {
  const net = versNombre(resultat);
  return (
    <div
      style={{
        marginBottom: 16,
        border: '1px solid var(--gm-border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          background: 'var(--gm-surface-2, rgba(0,0,0,0.04))',
          fontWeight: 700,
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{titre}</span>
        <span
          style={{
            color: net >= 0 ? 'var(--gm-success)' : 'var(--gm-danger)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {net >= 0 ? '+' : ''}
          {montant(resultat)} XOF
        </span>
      </div>
      <div className="gm-cr-grid" style={{ gap: 0 }}>
        <div className="gm-cr-col" style={{ borderRight: '1px solid var(--gm-border)' }}>
          <div className="gm-cr-header gm-cr-header-produits">Produits</div>
          {produits.length === 0 ? (
            <div className="gm-cr-row">
              <span style={{ color: 'var(--gm-text-2)', fontSize: 12 }}>Aucun produit</span>
            </div>
          ) : (
            produits.map((p) => (
              <div className="gm-cr-row" key={p.compte}>
                <span>
                  {p.compte} — {p.libelle}
                </span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{montant(p.montant)}</span>
              </div>
            ))
          )}
          <div className="gm-cr-total gm-cr-total-produits">
            <span>Total produits</span>
            <span>{montant(totalProduits)} XOF</span>
          </div>
        </div>
        <div className="gm-cr-col">
          <div className="gm-cr-header gm-cr-header-charges">Charges</div>
          {charges.length === 0 ? (
            <div className="gm-cr-row">
              <span style={{ color: 'var(--gm-text-2)', fontSize: 12 }}>Aucune charge</span>
            </div>
          ) : (
            charges.map((c) => (
              <div className="gm-cr-row" key={c.compte}>
                <span>
                  {c.compte} — {c.libelle}
                </span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{montant(c.montant)}</span>
              </div>
            ))
          )}
          <div className="gm-cr-total gm-cr-total-charges">
            <span>Total charges</span>
            <span>{montant(totalCharges)} XOF</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de confirmation de clôture ────────────────────────────────────────

function ModalCloture({
  exercice,
  onConfirm,
  onCancel,
  loading,
  erreur,
}: {
  exercice: ExerciceFiscal;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  erreur: string | null;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--gm-surface)',
          border: '1px solid var(--gm-border)',
          borderRadius: 12,
          padding: '28px 32px',
          maxWidth: 480,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 17, color: 'var(--gm-text)' }}>
          Clôturer l&apos;exercice {exercice.label}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--gm-text-2)', margin: '0 0 16px', lineHeight: 1.6 }}>
          Cette opération est <strong>irréversible</strong>. Elle va&nbsp;:
        </p>
        <ul style={{ fontSize: 13, color: 'var(--gm-text-2)', margin: '0 0 16px', paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Vérifier l&apos;équilibre de la balance (débit = crédit)</li>
          <li>Vérifier l&apos;absence de transactions en attente</li>
          <li>Calculer le résultat net (Produits − Charges)</li>
          <li>Générer l&apos;écriture de report à nouveau (compte 120/129)</li>
          <li>Verrouiller définitivement l&apos;exercice</li>
        </ul>
        {erreur && (
          <div
            style={{
              background: 'rgba(var(--gm-danger-rgb), 0.1)',
              border: '1px solid var(--gm-danger)',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: 'var(--gm-danger)',
            }}
          >
            {erreur}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: '1px solid var(--gm-border)',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--gm-text)',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--gm-danger)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Clôture en cours…' : 'Confirmer la clôture'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComptabilitePage() {
  const t = useT();
  const ONGLETS = onglets(t);
  const [onglet, setOnglet] = useState<Onglet>('exercices');
  const [exerciceId, setExerciceId] = useState<string>('');

  // Clôture OHADA
  const [exerciceACloture, setExerciceACloture] = useState<ExerciceFiscal | null>(null);
  const [erreurCloture, setErreurCloture] = useState<string | null>(null);
  const cloturerMutation = useCloturerExercice();

  // Année sélectionnée pour les rapports annuels
  const anneeActuelle = new Date().getFullYear();
  const [anneeSelectionnee, setAnneeSelectionnee] = useState<number>(anneeActuelle);
  const compteResultatOhada = useCompteResultatOhada(anneeSelectionnee);
  const bilanAnnuel = useBilanAnnuel(anneeSelectionnee);

  const exercices = useExercicesFiscaux();
  const exerciceCourant = useMemo(
    () => (exercices.data ?? []).find((e) => e.id === exerciceId),
    [exercices.data, exerciceId],
  );

  const fy = exerciceId || undefined;
  const journal = useJournal({ fiscalYearId: fy, limit: 50 });
  const balance = useBalanceVerification(fy);
  const resultat = useCompteResultat(fy);
  const bilan = useBilan(fy);
  const plan = usePlanComptable();

  // KPI — uniquement des agrégats renvoyés par l'API
  const totalProduits = resultat.data?.totalProduits;
  const totalCharges = resultat.data?.totalCharges;
  const resultatNet = resultat.data?.resultatNet;
  const resultatNetNum = versNombre(resultatNet);
  const tresorerie = bilan.data ? sommePostes(bilan.data.actif?.tresorerie) : undefined;

  // Lignes du grand livre aplaties pour l'export (mêmes valeurs que le tableau).
  const lignesJournalExport = useMemo(
    () =>
      (journal.data?.data ?? []).flatMap((ec) =>
        (ec.lines.length > 0 ? ec.lines : [null]).map((ln) => ({
          date: formatDate(ec.date),
          reference: ec.reference,
          compte: ln?.accountNumber ?? '—',
          libelle: ln?.label || ec.description || '—',
          debit: ln ? montantOuVide(ln.debit) : '',
          credit: ln ? montantOuVide(ln.credit) : '',
          statut: `${ec.isAutoGenerated ? t.comptabilite.journal.auto : t.comptabilite.journal.manuelle}${
            ec.isReconciled ? ` · ${t.comptabilite.journal.validee}` : ''
          }`,
        })),
      ),
    [journal.data, t],
  );

  const sousTitre = exercices.isLoading
    ? t.comptabilite.loadingFiscalYears
    : exerciceCourant
      ? `${t.comptabilite.fiscalYearPrefix} ${exerciceCourant.label} · ${formatDate(exerciceCourant.startDate)} → ${formatDate(exerciceCourant.endDate)}`
      : (exercices.data ?? []).length === 0
        ? t.comptabilite.noFiscalYear
        : t.comptabilite.allYearsCombined;

  return (
    <>
      <GmPageHeader
        fil={[t.common.home, t.comptabilite.breadcrumb]}
        titre={t.comptabilite.title}
        sousTitre={sousTitre}
        actions={
          <select
            className="gm-filter-select"
            value={exerciceId}
            onChange={(e) => setExerciceId(e.target.value)}
            aria-label={t.comptabilite.fiscalYearAria}
          >
            <option value="">{t.comptabilite.allFiscalYears}</option>
            {(exercices.data ?? []).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.label}
              </option>
            ))}
          </select>
        }
      />

      {/* ── KPI : compte de résultat + trésorerie réels ────────────────────── */}
      <div className="gm-kpi-grid">
        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">📈</div>
          <div className="gm-kpi-label">{t.comptabilite.kpi.produits}</div>
          <div className="gm-kpi-value" style={{ color: 'var(--gm-success)' }}>
            {resultat.isLoading ? '…' : resultat.isError ? '—' : <>{montant(totalProduits)}<span className="gm-kpi-unit"> XOF</span></>}
          </div>
          <div className="gm-kpi-trend gm-trend-neutral">
            {resultat.isError ? t.comptabilite.kpi.unavailable : t.comptabilite.kpi.periodCumul}
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">📉</div>
          <div className="gm-kpi-label">{t.comptabilite.kpi.charges}</div>
          <div className="gm-kpi-value" style={{ color: 'var(--gm-danger)' }}>
            {resultat.isLoading ? '…' : resultat.isError ? '—' : <>{montant(totalCharges)}<span className="gm-kpi-unit"> XOF</span></>}
          </div>
          <div className="gm-kpi-trend gm-trend-neutral">
            {resultat.isError ? t.comptabilite.kpi.unavailable : t.comptabilite.kpi.periodCumul}
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">{resultatNetNum >= 0 ? '✅' : '⚠️'}</div>
          <div className="gm-kpi-label">{t.comptabilite.kpi.resultatNet}</div>
          <div
            className="gm-kpi-value"
            style={{ color: resultatNetNum >= 0 ? 'var(--gm-success)' : 'var(--gm-danger)' }}
          >
            {resultat.isLoading ? '…' : resultat.isError ? '—' : <>{montant(resultatNet)}<span className="gm-kpi-unit"> XOF</span></>}
          </div>
          <div className="gm-kpi-trend gm-trend-neutral">
            {resultat.isError
              ? t.comptabilite.kpi.unavailable
              : resultatNetNum >= 0
                ? t.comptabilite.kpi.produitsMoinsCharges
                : t.comptabilite.kpi.deficitaire}
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">🏦</div>
          <div className="gm-kpi-label">{t.comptabilite.kpi.tresorerie}</div>
          <div className="gm-kpi-value">
            {bilan.isLoading ? '…' : bilan.isError || tresorerie === undefined ? '—' : <>{montant(tresorerie)}<span className="gm-kpi-unit"> XOF</span></>}
          </div>
          <div className="gm-kpi-trend gm-trend-neutral">
            {bilan.isError ? t.comptabilite.kpi.unavailable : t.comptabilite.kpi.bilanTresorerie}
          </div>
        </div>
      </div>

      {/* ── Onglets ────────────────────────────────────────────────────────── */}
      <div className="gm-tabs-bar">
        {ONGLETS.map((o) => (
          <button
            key={o.cle}
            type="button"
            className={clsx('gm-tab-btn', onglet === o.cle && 'gm-active')}
            onClick={() => setOnglet(o.cle)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ── Exercices fiscaux + clôture OHADA ─────────────────────────────── */}
      <div className={clsx('gm-tab-panel', onglet === 'exercices' && 'gm-active')}>
        <div className="gm-table-wrap">
          <div className="gm-table-toolbar">
            <div className="gm-table-toolbar-left">
              <strong style={{ fontSize: 14 }}>Exercices comptables</strong>
            </div>
          </div>

          <EtatBloc
            chargement={exercices.isLoading}
            erreur={exercices.error}
            vide={(exercices.data?.length ?? 0) === 0}
            messageVide="Aucun exercice comptable enregistré."
          />

          {!exercices.isLoading && !exercices.isError && (exercices.data?.length ?? 0) > 0 && (
            <GmTableWrap>
              <table>
                <thead>
                  <tr>
                    <th>Exercice</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Statut</th>
                    <th>Clôturé le</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(exercices.data ?? []).map((ex) => {
                    const estClos = ex.status === 'CLOSED';
                    return (
                      <tr key={ex.id}>
                        <td style={{ fontWeight: 600 }}>{ex.label}</td>
                        <td>{formatDate(ex.startDate)}</td>
                        <td>{formatDate(ex.endDate)}</td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              background: estClos ? 'rgba(107,114,128,0.15)' : 'rgba(16,185,129,0.15)',
                              color: estClos ? 'var(--gm-text-2)' : 'var(--gm-success)',
                            }}
                          >
                            {estClos ? 'CLOS' : 'OUVERT'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--gm-text-2)', fontSize: 13 }}>
                          {ex.closedAt ? formatDate(ex.closedAt) : '—'}
                        </td>
                        <td>
                          {!estClos && (
                            <button
                              type="button"
                              onClick={() => {
                                setErreurCloture(null);
                                setExerciceACloture(ex);
                              }}
                              style={{
                                padding: '5px 14px',
                                borderRadius: 6,
                                border: '1px solid var(--gm-danger)',
                                background: 'transparent',
                                color: 'var(--gm-danger)',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              Clôturer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </GmTableWrap>
          )}
        </div>

        {/* ── Section Bilan annuel ────────────────────────────────────────── */}
        <div className="gm-table-wrap" style={{ marginTop: 24 }}>
          <div className="gm-table-toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="gm-table-toolbar-left">
              <strong style={{ fontSize: 14 }}>Bilan annuel OHADA</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="annee-bilan" style={{ fontSize: 13, color: 'var(--gm-text-2)' }}>
                Année :
              </label>
              <select
                id="annee-bilan"
                className="gm-filter-select"
                value={anneeSelectionnee}
                onChange={(e) => setAnneeSelectionnee(Number(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => anneeActuelle - i).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={bilanAnnuel.isLoading || bilanAnnuel.isError || !bilanAnnuel.data}
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/v1/accounting/bilan/${anneeSelectionnee}/pdf`, { credentials: 'include' });
                    if (!res.ok) return;
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  } catch { /* silencieux */ }
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid var(--gm-primary)',
                  background: 'var(--gm-primary)',
                  color: '#fff',
                  cursor: bilanAnnuel.isLoading || bilanAnnuel.isError ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: bilanAnnuel.isLoading || bilanAnnuel.isError ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                Télécharger PDF
              </button>
            </div>
          </div>

          <EtatBloc
            chargement={bilanAnnuel.isLoading}
            erreur={bilanAnnuel.error}
          />

          {!bilanAnnuel.isLoading && !bilanAnnuel.isError && bilanAnnuel.data && (
            <>
              <div className="gm-bilan-grid">
                <div className="gm-bilan-col gm-bilan-actif">
                  <div className="gm-bilan-header">ACTIF</div>
                  {(
                    [
                      ['Immobilisations', bilanAnnuel.data.actif.immobilisations],
                      ['Stocks', bilanAnnuel.data.actif.stocks],
                      ['Créances', bilanAnnuel.data.actif.creances],
                      ['Trésorerie', bilanAnnuel.data.actif.tresorerie],
                    ] as [string, PosteBilan[]][]
                  ).map(([section, postes]) => (
                    <React.Fragment key={section}>
                      <div className="gm-bilan-section">{section}</div>
                      {(postes ?? []).length === 0 ? (
                        <div className="gm-bilan-row">
                          <span style={{ color: 'var(--gm-text-2)', fontSize: 12 }}>Aucun poste</span>
                        </div>
                      ) : (
                        postes.map((p) => (
                          <div className="gm-bilan-row" key={p.accountNumber}>
                            <span>
                              {p.accountNumber} — {p.label}
                            </span>
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {montant(p.montant)} XOF
                            </span>
                          </div>
                        ))
                      )}
                    </React.Fragment>
                  ))}
                  <div className="gm-bilan-total">
                    <span>Total Actif</span>
                    <span>{montant(bilanAnnuel.data.actif.totalActif)} XOF</span>
                  </div>
                </div>
                <div className="gm-bilan-col gm-bilan-passif">
                  <div className="gm-bilan-header">PASSIF</div>
                  {(
                    [
                      ['Capitaux propres', bilanAnnuel.data.passif.capitaux],
                      ['Dettes', bilanAnnuel.data.passif.dettes],
                    ] as [string, PosteBilan[]][]
                  ).map(([section, postes]) => (
                    <React.Fragment key={section}>
                      <div className="gm-bilan-section">{section}</div>
                      {(postes ?? []).length === 0 ? (
                        <div className="gm-bilan-row">
                          <span style={{ color: 'var(--gm-text-2)', fontSize: 12 }}>Aucun poste</span>
                        </div>
                      ) : (
                        postes.map((p) => (
                          <div className="gm-bilan-row" key={p.accountNumber}>
                            <span>
                              {p.accountNumber} — {p.label}
                            </span>
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {montant(p.montant)} XOF
                            </span>
                          </div>
                        ))
                      )}
                    </React.Fragment>
                  ))}
                  <div className="gm-bilan-total">
                    <span>Total Passif</span>
                    <span>{montant(bilanAnnuel.data.passif.totalPassif)} XOF</span>
                  </div>
                </div>
              </div>
              {!bilanAnnuel.data.isBalanced && (
                <div className="gm-balance-check" style={{ color: 'var(--gm-danger)' }}>
                  Bilan déséquilibré : écart de {montant(bilanAnnuel.data.difference)} XOF
                </div>
              )}
              {bilanAnnuel.data.isBalanced && (
                <div className="gm-balance-check" style={{ color: 'var(--gm-success)' }}>
                  Bilan équilibré — Total actif = Total passif
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Section Compte de résultat OHADA ───────────────────────────── */}
        <div className="gm-table-wrap" style={{ marginTop: 24 }}>
          <div className="gm-table-toolbar">
            <div className="gm-table-toolbar-left">
              <strong style={{ fontSize: 14 }}>
                Compte de résultat OHADA — {anneeSelectionnee}
              </strong>
            </div>
            <button
              type="button"
              disabled={compteResultatOhada.isLoading || compteResultatOhada.isError || !compteResultatOhada.data}
              onClick={async () => {
                try {
                  const res = await fetch(`/api/v1/accounting/compte-resultat/${anneeSelectionnee}/pdf`, { credentials: 'include' });
                  if (!res.ok) return;
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                } catch { /* silencieux */ }
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid var(--gm-primary)',
                background: 'var(--gm-primary)',
                color: '#fff',
                cursor: compteResultatOhada.isLoading || compteResultatOhada.isError ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 600,
                opacity: compteResultatOhada.isLoading || compteResultatOhada.isError ? 0.5 : 1,
              }}
            >
              Télécharger PDF
            </button>
          </div>

          <EtatBloc
            chargement={compteResultatOhada.isLoading}
            erreur={compteResultatOhada.error}
          />

          {!compteResultatOhada.isLoading && !compteResultatOhada.isError && compteResultatOhada.data && (
            <div style={{ padding: '8px 0' }}>
              {/* Exploitation */}
              <SectionResultat
                titre="Résultat d'exploitation"
                charges={compteResultatOhada.data.chargesExploitation}
                produits={compteResultatOhada.data.produitsExploitation}
                totalCharges={compteResultatOhada.data.totalChargesExploitation}
                totalProduits={compteResultatOhada.data.totalProduitsExploitation}
                resultat={compteResultatOhada.data.resultatExploitation}
              />
              {/* Financier */}
              <SectionResultat
                titre="Résultat financier"
                charges={compteResultatOhada.data.chargesFinancieres}
                produits={compteResultatOhada.data.produitsFinanciers}
                totalCharges={compteResultatOhada.data.totalChargesFinancieres}
                totalProduits={compteResultatOhada.data.totalProduitsFinanciers}
                resultat={compteResultatOhada.data.resultatFinancier}
              />
              {/* Exceptionnel */}
              <SectionResultat
                titre="Résultat exceptionnel"
                charges={compteResultatOhada.data.chargesExceptionnelles}
                produits={compteResultatOhada.data.produitsExceptionnels}
                totalCharges={compteResultatOhada.data.totalChargesExceptionnelles}
                totalProduits={compteResultatOhada.data.totalProduitsExceptionnels}
                resultat={compteResultatOhada.data.resultatExceptionnel}
              />
              {/* Synthèse */}
              <div
                style={{
                  margin: '16px 0 0',
                  padding: '16px 20px',
                  background: 'var(--gm-surface-alt, var(--gm-surface))',
                  border: '1px solid var(--gm-border)',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>Résultat avant impôt</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {montant(compteResultatOhada.data.resultatAvantImpot)} XOF
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10, color: 'var(--gm-text-2)' }}>
                  <span>Impôt sur les bénéfices (69x)</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    − {montant(compteResultatOhada.data.impotBenefices)} XOF
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 16,
                    fontWeight: 700,
                    padding: '8px 0 0',
                    borderTop: '2px solid var(--gm-border)',
                    color: versNombre(compteResultatOhada.data.resultatNet) >= 0
                      ? 'var(--gm-success)'
                      : 'var(--gm-danger)',
                  }}
                >
                  <span>RESULTAT NET</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {versNombre(compteResultatOhada.data.resultatNet) >= 0 ? '+' : ''}
                    {montant(compteResultatOhada.data.resultatNet)} XOF
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--gm-text-2)', marginTop: 4 }}>
                  {versNombre(compteResultatOhada.data.resultatNet) >= 0
                    ? 'Bénéfice de l\'exercice'
                    : 'Perte de l\'exercice'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de confirmation */}
        {exerciceACloture && (
          <ModalCloture
            exercice={exerciceACloture}
            loading={cloturerMutation.isPending}
            erreur={erreurCloture}
            onCancel={() => {
              setExerciceACloture(null);
              setErreurCloture(null);
            }}
            onConfirm={async () => {
              const annee = new Date(exerciceACloture.startDate).getFullYear();
              setErreurCloture(null);
              try {
                await cloturerMutation.mutateAsync(annee);
                setExerciceACloture(null);
              } catch (err: unknown) {
                const msg =
                  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                  'Une erreur est survenue lors de la clôture.';
                setErreurCloture(msg);
              }
            }}
          />
        )}
      </div>

      {/* ── Grand livre / journal ──────────────────────────────────────────── */}
      <div className={clsx('gm-tab-panel', onglet === 'grandlivre' && 'gm-active')}>
        <div className="gm-table-wrap">
          <div className="gm-table-toolbar">
            <div className="gm-table-toolbar-left">
              <strong style={{ fontSize: 14 }}>{t.comptabilite.journal.title}</strong>
              {journal.data && (
                <span style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                  {journal.data.total} {t.comptabilite.journal.countSuffix}
                </span>
              )}
            </div>
            <GmExportMenu
              titre={t.comptabilite.journal.title}
              donnees={lignesJournalExport}
              nomFichier="comptabilite_grand_livre"
              colonnes={[
                { titre: t.comptabilite.journal.colDate, valeur: (r) => r.date },
                { titre: t.comptabilite.journal.colReference, valeur: (r) => r.reference },
                { titre: t.comptabilite.journal.colCompte, valeur: (r) => r.compte },
                { titre: t.comptabilite.journal.colLibelle, valeur: (r) => r.libelle },
                { titre: t.comptabilite.journal.colDebit, valeur: (r) => r.debit, align: 'right' },
                { titre: t.comptabilite.journal.colCredit, valeur: (r) => r.credit, align: 'right' },
                { titre: t.comptabilite.journal.colStatut, valeur: (r) => r.statut },
              ]}
            />
          </div>

          <EtatBloc
            chargement={journal.isLoading}
            erreur={journal.error}
            vide={(journal.data?.data.length ?? 0) === 0}
            messageVide={t.comptabilite.journal.empty}
          />

          {!journal.isLoading && !journal.isError && (journal.data?.data.length ?? 0) > 0 && (
            <GmTableWrap>
              <table>
                <thead>
                  <tr>
                    <th>{t.comptabilite.journal.colDate}</th>
                    <th>{t.comptabilite.journal.colReference}</th>
                    <th>{t.comptabilite.journal.colCompte}</th>
                    <th>{t.comptabilite.journal.colLibelle}</th>
                    <th>{t.comptabilite.journal.colDebit}</th>
                    <th>{t.comptabilite.journal.colCredit}</th>
                    <th>{t.comptabilite.journal.colStatut}</th>
                  </tr>
                </thead>
                <tbody>
                  {(journal.data?.data ?? []).flatMap((ec) =>
                    (ec.lines.length > 0 ? ec.lines : [null]).map((ln, i) => (
                      <tr key={`${ec.id}-${ln?.id ?? i}`}>
                        <td>{i === 0 ? formatDate(ec.date) : ''}</td>
                        <td>{i === 0 ? ec.reference : ''}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{ln?.accountNumber ?? '—'}</td>
                        <td>{ln?.label || ec.description || '—'}</td>
                        <td className="gm-debit-col">{ln ? montantOuVide(ln.debit) : ''}</td>
                        <td className="gm-credit-col">{ln ? montantOuVide(ln.credit) : ''}</td>
                        <td>
                          {i === 0 && (
                            <span className="gm-source-badge">
                              {ec.isAutoGenerated ? t.comptabilite.journal.auto : t.comptabilite.journal.manuelle}
                              {ec.isReconciled ? ` · ${t.comptabilite.journal.validee}` : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </GmTableWrap>
          )}
        </div>
      </div>

      {/* ── Balance de vérification ────────────────────────────────────────── */}
      <div className={clsx('gm-tab-panel', onglet === 'balance' && 'gm-active')}>
        <div className="gm-table-wrap">
          <div className="gm-table-toolbar">
            <div className="gm-table-toolbar-left">
              <strong style={{ fontSize: 14 }}>{t.comptabilite.balance.title}</strong>
            </div>
          </div>

          <EtatBloc
            chargement={balance.isLoading}
            erreur={balance.error}
            vide={(balance.data?.lines.length ?? 0) === 0}
            messageVide={t.comptabilite.balance.empty}
          />

          {!balance.isLoading && !balance.isError && (balance.data?.lines.length ?? 0) > 0 && (
            <>
              <GmTableWrap>
                <table>
                  <thead>
                    <tr>
                      <th>{t.comptabilite.balance.colNumero}</th>
                      <th>{t.comptabilite.balance.colIntitule}</th>
                      <th>{t.comptabilite.balance.colTotalDebit}</th>
                      <th>{t.comptabilite.balance.colTotalCredit}</th>
                      <th>{t.comptabilite.balance.colSolde}</th>
                      <th>{t.comptabilite.balance.colSens}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(balance.data?.lines ?? []).map((l) => (
                      <tr key={l.accountNumber}>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{l.accountNumber}</td>
                        <td>{l.label}</td>
                        <td className="gm-debit-col">{montantOuVide(l.totalDebit)}</td>
                        <td className="gm-credit-col">{montantOuVide(l.totalCredit)}</td>
                        <td className={l.balanceType === 'DEBITEUR' ? 'gm-solde-pos' : 'gm-solde-neg'}>
                          {montant(l.balance)}
                        </td>
                        <td>
                          {l.balanceType === 'DEBITEUR'
                            ? t.comptabilite.balance.debiteur
                            : t.comptabilite.balance.crediteur}
                        </td>
                      </tr>
                    ))}
                    <tr className="gm-total-row">
                      <td colSpan={2}>
                        <strong>{t.comptabilite.balance.totaux}</strong>
                      </td>
                      <td className="gm-debit-col">
                        <strong>{montant(balance.data?.totalDebit)}</strong>
                      </td>
                      <td className="gm-credit-col">
                        <strong>{montant(balance.data?.totalCredit)}</strong>
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </GmTableWrap>
              <div className="gm-balance-check">
                {balance.data?.isBalanced
                  ? t.comptabilite.balance.equilibree
                  : t.comptabilite.balance.desequilibree}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Compte de résultat ─────────────────────────────────────────────── */}
      <div className={clsx('gm-tab-panel', onglet === 'resultat' && 'gm-active')}>
        <EtatBloc
          chargement={resultat.isLoading}
          erreur={resultat.error}
          vide={
            !!resultat.data &&
            resultat.data.produits.length === 0 &&
            resultat.data.charges.length === 0
          }
          messageVide={t.comptabilite.resultat.empty}
        />

        {!resultat.isLoading && !resultat.isError && resultat.data && (
          <>
            <div className="gm-cr-grid">
              <div className="gm-cr-col">
                <div className="gm-cr-header gm-cr-header-produits">{t.comptabilite.resultat.produitsHeader}</div>
                {resultat.data.produits.length === 0 ? (
                  <div className="gm-cr-row">
                    <span>{t.comptabilite.resultat.noProduit}</span>
                  </div>
                ) : (
                  resultat.data.produits.map((p) => (
                    <div className="gm-cr-row" key={p.accountNumber}>
                      <span>
                        {p.accountNumber} — {p.label}
                      </span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {montant(p.montant)} XOF
                      </span>
                    </div>
                  ))
                )}
                <div className="gm-cr-total gm-cr-total-produits">
                  <span>{t.comptabilite.resultat.totalProduits}</span>
                  <span>{montant(resultat.data.totalProduits)} XOF</span>
                </div>
              </div>

              <div className="gm-cr-col">
                <div className="gm-cr-header gm-cr-header-charges">{t.comptabilite.resultat.chargesHeader}</div>
                {resultat.data.charges.length === 0 ? (
                  <div className="gm-cr-row">
                    <span>{t.comptabilite.resultat.noCharge}</span>
                  </div>
                ) : (
                  resultat.data.charges.map((c) => (
                    <div className="gm-cr-row" key={c.accountNumber}>
                      <span>
                        {c.accountNumber} — {c.label}
                      </span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {montant(c.montant)} XOF
                      </span>
                    </div>
                  ))
                )}
                <div className="gm-cr-total gm-cr-total-charges">
                  <span>{t.comptabilite.resultat.totalCharges}</span>
                  <span>{montant(resultat.data.totalCharges)} XOF</span>
                </div>
              </div>
            </div>

            <div className="gm-resultat-net">
              <div>
                <div className="gm-resultat-label">{t.comptabilite.resultat.netTitle}</div>
                <div className="gm-resultat-sub">
                  {formatDate(resultat.data.period.startDate)} → {formatDate(resultat.data.period.endDate)}
                </div>
              </div>
              <div>
                <div className="gm-resultat-value">
                  {resultatNetNum >= 0 ? '+ ' : ''}
                  {montant(resultat.data.resultatNet)} XOF
                </div>
                <div className="gm-resultat-sub">
                  {resultatNetNum >= 0
                    ? t.comptabilite.resultat.beneficiaire
                    : t.comptabilite.resultat.deficitaire}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Bilan ──────────────────────────────────────────────────────────── */}
      <div className={clsx('gm-tab-panel', onglet === 'bilan' && 'gm-active')}>
        <EtatBloc chargement={bilan.isLoading} erreur={bilan.error} />

        {!bilan.isLoading && !bilan.isError && bilan.data && (
          <div className="gm-bilan-grid">
            <div className="gm-bilan-col gm-bilan-actif">
              <div className="gm-bilan-header">{t.comptabilite.bilan.actif}</div>
              {(
                [
                  [t.comptabilite.bilan.immobilisations, bilan.data.actif.immobilisations],
                  [t.comptabilite.bilan.stocks, bilan.data.actif.stocks],
                  [t.comptabilite.bilan.creances, bilan.data.actif.creances],
                  [t.comptabilite.bilan.tresorerie, bilan.data.actif.tresorerie],
                ] as [string, PosteBilan[]][]
              ).map(([section, postes]) => (
                <React.Fragment key={section}>
                  <div className="gm-bilan-section">{section}</div>
                  {(postes ?? []).length === 0 ? (
                    <div className="gm-bilan-row">
                      <span>{t.comptabilite.bilan.noPoste}</span>
                    </div>
                  ) : (
                    postes.map((p) => (
                      <div className="gm-bilan-row" key={`${section}-${p.accountNumber}`}>
                        <span>
                          {p.accountNumber} — {p.label}
                        </span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{montant(p.montant)} XOF</span>
                      </div>
                    ))
                  )}
                </React.Fragment>
              ))}
              <div className="gm-bilan-total">
                <span>{t.comptabilite.bilan.totalActif}</span>
                <span>{montant(bilan.data.actif.totalActif)} XOF</span>
              </div>
            </div>

            <div className="gm-bilan-col gm-bilan-passif">
              <div className="gm-bilan-header">{t.comptabilite.bilan.passif}</div>
              {(
                [
                  [t.comptabilite.bilan.capitaux, bilan.data.passif.capitaux],
                  [t.comptabilite.bilan.dettes, bilan.data.passif.dettes],
                ] as [string, PosteBilan[]][]
              ).map(([section, postes]) => (
                <React.Fragment key={section}>
                  <div className="gm-bilan-section">{section}</div>
                  {(postes ?? []).length === 0 ? (
                    <div className="gm-bilan-row">
                      <span>{t.comptabilite.bilan.noPoste}</span>
                    </div>
                  ) : (
                    postes.map((p) => (
                      <div className="gm-bilan-row" key={`${section}-${p.accountNumber}`}>
                        <span>
                          {p.accountNumber} — {p.label}
                        </span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{montant(p.montant)} XOF</span>
                      </div>
                    ))
                  )}
                </React.Fragment>
              ))}
              <div className="gm-bilan-total">
                <span>{t.comptabilite.bilan.totalPassif}</span>
                <span>{montant(bilan.data.passif.totalPassif)} XOF</span>
              </div>
            </div>
          </div>
        )}

        {!bilan.isLoading && !bilan.isError && bilan.data && !bilan.data.isBalanced && (
          <div className="gm-balance-check">
            {t.comptabilite.bilan.desequilibrePrefix} {montant(bilan.data.difference)} XOF
          </div>
        )}
      </div>

      {/* ── Plan comptable ─────────────────────────────────────────────────── */}
      <div className={clsx('gm-tab-panel', onglet === 'plan' && 'gm-active')}>
        <div className="gm-table-wrap">
          <div className="gm-table-toolbar">
            <div className="gm-table-toolbar-left">
              <strong style={{ fontSize: 14 }}>{t.comptabilite.plan.title}</strong>
              {plan.data && (
                <span style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                  {plan.data.length} {t.comptabilite.plan.countSuffix}
                </span>
              )}
            </div>
          </div>

          <EtatBloc
            chargement={plan.isLoading}
            erreur={plan.error}
            vide={(plan.data?.length ?? 0) === 0}
            messageVide={t.comptabilite.plan.empty}
          />

          {!plan.isLoading && !plan.isError && (plan.data?.length ?? 0) > 0 && (
            <GmTableWrap>
              <table>
                <thead>
                  <tr>
                    <th>{t.comptabilite.plan.colNumero}</th>
                    <th>{t.comptabilite.plan.colIntitule}</th>
                    <th>{t.comptabilite.plan.colType}</th>
                    <th>{t.comptabilite.plan.colSens}</th>
                  </tr>
                </thead>
                <tbody>
                  {(plan.data ?? []).map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{c.code}</td>
                      <td>{c.name}</td>
                      <td>{c.type}</td>
                      <td>{c.normalBalance === 'DEBIT' ? t.comptabilite.plan.debit : t.comptabilite.plan.credit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GmTableWrap>
          )}
        </div>
      </div>
    </>
  );
}
