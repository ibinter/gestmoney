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
import {
  useExercicesFiscaux,
  usePlanComptable,
  useJournal,
  useBalanceVerification,
  useCompteResultat,
  useBilan,
  versNombre,
  type PosteBilan,
} from '@/hooks/useComptabilite';
import { formatDate } from '@/lib/formatters';
import { clsx } from 'clsx';

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

type Onglet = 'grandlivre' | 'balance' | 'resultat' | 'bilan' | 'plan';

const ONGLETS: { cle: Onglet; label: string }[] = [
  { cle: 'grandlivre', label: 'Grand Livre' },
  { cle: 'balance', label: 'Balance' },
  { cle: 'resultat', label: 'Compte de Résultat' },
  { cle: 'bilan', label: 'Bilan' },
  { cle: 'plan', label: 'Plan comptable' },
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
  if (chargement) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--gm-text-2)', fontSize: 13 }}>
        Chargement des données comptables…
      </div>
    );
  }
  if (erreur) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--gm-danger)', fontSize: 13 }}>
        Données comptables indisponibles. Aucun montant ne peut être affiché.
      </div>
    );
  }
  if (vide) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--gm-text-2)', fontSize: 13 }}>
        {messageVide ?? 'Aucune donnée'}
      </div>
    );
  }
  return null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ComptabilitePage() {
  const [onglet, setOnglet] = useState<Onglet>('grandlivre');
  const [exerciceId, setExerciceId] = useState<string>('');

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

  const sousTitre = exercices.isLoading
    ? 'Chargement des exercices…'
    : exerciceCourant
      ? `Exercice ${exerciceCourant.label} · ${formatDate(exerciceCourant.startDate)} → ${formatDate(exerciceCourant.endDate)}`
      : (exercices.data ?? []).length === 0
        ? 'Aucun exercice fiscal ouvert'
        : 'Tous exercices confondus';

  return (
    <>
      <GmPageHeader
        fil={['Accueil', 'Comptabilité']}
        titre="Comptabilité SYSCOHADA"
        sousTitre={sousTitre}
        actions={
          <select
            className="gm-filter-select"
            value={exerciceId}
            onChange={(e) => setExerciceId(e.target.value)}
            aria-label="Exercice fiscal"
          >
            <option value="">Tous les exercices</option>
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
          <div className="gm-kpi-label">Produits (classe 7)</div>
          <div className="gm-kpi-value" style={{ color: 'var(--gm-success)' }}>
            {resultat.isLoading ? '…' : resultat.isError ? '—' : montant(totalProduits)}
          </div>
          <div className="gm-kpi-trend gm-trend-neutral">
            {resultat.isError ? 'Indisponible' : 'Cumul de la période'}
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">📉</div>
          <div className="gm-kpi-label">Charges (classe 6)</div>
          <div className="gm-kpi-value" style={{ color: 'var(--gm-danger)' }}>
            {resultat.isLoading ? '…' : resultat.isError ? '—' : montant(totalCharges)}
          </div>
          <div className="gm-kpi-trend gm-trend-neutral">
            {resultat.isError ? 'Indisponible' : 'Cumul de la période'}
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">{resultatNetNum >= 0 ? '✅' : '⚠️'}</div>
          <div className="gm-kpi-label">Résultat net</div>
          <div
            className="gm-kpi-value"
            style={{ color: resultatNetNum >= 0 ? 'var(--gm-success)' : 'var(--gm-danger)' }}
          >
            {resultat.isLoading ? '…' : resultat.isError ? '—' : montant(resultatNet)}
          </div>
          <div className="gm-kpi-trend gm-trend-neutral">
            {resultat.isError
              ? 'Indisponible'
              : resultatNetNum >= 0
                ? 'Produits − Charges'
                : 'Exercice déficitaire'}
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">🏦</div>
          <div className="gm-kpi-label">Trésorerie (classe 5)</div>
          <div className="gm-kpi-value">
            {bilan.isLoading ? '…' : bilan.isError || tresorerie === undefined ? '—' : montant(tresorerie)}
          </div>
          <div className="gm-kpi-trend gm-trend-neutral">
            {bilan.isError ? 'Indisponible' : 'Postes de trésorerie du bilan'}
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

      {/* ── Grand livre / journal ──────────────────────────────────────────── */}
      <div className={clsx('gm-tab-panel', onglet === 'grandlivre' && 'gm-active')}>
        <div className="gm-table-wrap">
          <div className="gm-table-toolbar">
            <div className="gm-table-toolbar-left">
              <strong style={{ fontSize: 14 }}>Écritures du journal</strong>
              {journal.data && (
                <span style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                  {journal.data.total} écriture{journal.data.total > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <EtatBloc
            chargement={journal.isLoading}
            erreur={journal.error}
            vide={(journal.data?.data.length ?? 0) === 0}
            messageVide="Aucune écriture comptable pour cet exercice"
          />

          {!journal.isLoading && !journal.isError && (journal.data?.data.length ?? 0) > 0 && (
            <GmTableWrap>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Référence</th>
                    <th>Compte</th>
                    <th>Libellé</th>
                    <th>Débit</th>
                    <th>Crédit</th>
                    <th>Statut</th>
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
                              {ec.isAutoGenerated ? 'Auto' : 'Manuelle'}
                              {ec.isReconciled ? ' · Validée' : ''}
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
              <strong style={{ fontSize: 14 }}>Balance de vérification</strong>
            </div>
          </div>

          <EtatBloc
            chargement={balance.isLoading}
            erreur={balance.error}
            vide={(balance.data?.lines.length ?? 0) === 0}
            messageVide="Aucun mouvement comptable à balancer"
          />

          {!balance.isLoading && !balance.isError && (balance.data?.lines.length ?? 0) > 0 && (
            <>
              <GmTableWrap>
                <table>
                  <thead>
                    <tr>
                      <th>N° compte</th>
                      <th>Intitulé</th>
                      <th>Total débit</th>
                      <th>Total crédit</th>
                      <th>Solde</th>
                      <th>Sens</th>
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
                        <td>{l.balanceType === 'DEBITEUR' ? 'Débiteur' : 'Créditeur'}</td>
                      </tr>
                    ))}
                    <tr className="gm-total-row">
                      <td colSpan={2}>
                        <strong>TOTAUX</strong>
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
                  ? '✅ Balance équilibrée — Total débit = Total crédit'
                  : '⚠️ Balance déséquilibrée — vérifiez les écritures'}
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
          messageVide="Aucun produit ni charge enregistré sur la période"
        />

        {!resultat.isLoading && !resultat.isError && resultat.data && (
          <>
            <div className="gm-cr-grid">
              <div className="gm-cr-col">
                <div className="gm-cr-header gm-cr-header-produits">📈 Produits — Classe 7</div>
                {resultat.data.produits.length === 0 ? (
                  <div className="gm-cr-row">
                    <span>Aucun produit enregistré</span>
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
                  <span>TOTAL PRODUITS</span>
                  <span>{montant(resultat.data.totalProduits)} XOF</span>
                </div>
              </div>

              <div className="gm-cr-col">
                <div className="gm-cr-header gm-cr-header-charges">📉 Charges — Classe 6</div>
                {resultat.data.charges.length === 0 ? (
                  <div className="gm-cr-row">
                    <span>Aucune charge enregistrée</span>
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
                  <span>TOTAL CHARGES</span>
                  <span>{montant(resultat.data.totalCharges)} XOF</span>
                </div>
              </div>
            </div>

            <div className="gm-resultat-net">
              <div>
                <div className="gm-resultat-label">Résultat net de l&apos;exercice</div>
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
                  {resultatNetNum >= 0 ? 'Exercice bénéficiaire' : 'Exercice déficitaire'}
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
              <div className="gm-bilan-header">ACTIF</div>
              {(
                [
                  ['Immobilisations', bilan.data.actif.immobilisations],
                  ['Stocks', bilan.data.actif.stocks],
                  ['Créances', bilan.data.actif.creances],
                  ['Trésorerie', bilan.data.actif.tresorerie],
                ] as [string, PosteBilan[]][]
              ).map(([section, postes]) => (
                <React.Fragment key={section}>
                  <div className="gm-bilan-section">{section}</div>
                  {(postes ?? []).length === 0 ? (
                    <div className="gm-bilan-row">
                      <span>Aucun poste</span>
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
                <span>TOTAL ACTIF</span>
                <span>{montant(bilan.data.actif.totalActif)} XOF</span>
              </div>
            </div>

            <div className="gm-bilan-col gm-bilan-passif">
              <div className="gm-bilan-header">PASSIF</div>
              {(
                [
                  ['Capitaux propres', bilan.data.passif.capitaux],
                  ['Dettes', bilan.data.passif.dettes],
                ] as [string, PosteBilan[]][]
              ).map(([section, postes]) => (
                <React.Fragment key={section}>
                  <div className="gm-bilan-section">{section}</div>
                  {(postes ?? []).length === 0 ? (
                    <div className="gm-bilan-row">
                      <span>Aucun poste</span>
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
                <span>TOTAL PASSIF</span>
                <span>{montant(bilan.data.passif.totalPassif)} XOF</span>
              </div>
            </div>
          </div>
        )}

        {!bilan.isLoading && !bilan.isError && bilan.data && !bilan.data.isBalanced && (
          <div className="gm-balance-check">
            ⚠️ Bilan déséquilibré — écart de {montant(bilan.data.difference)} XOF
          </div>
        )}
      </div>

      {/* ── Plan comptable ─────────────────────────────────────────────────── */}
      <div className={clsx('gm-tab-panel', onglet === 'plan' && 'gm-active')}>
        <div className="gm-table-wrap">
          <div className="gm-table-toolbar">
            <div className="gm-table-toolbar-left">
              <strong style={{ fontSize: 14 }}>Plan comptable SYSCOHADA</strong>
              {plan.data && (
                <span style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{plan.data.length} comptes</span>
              )}
            </div>
          </div>

          <EtatBloc
            chargement={plan.isLoading}
            erreur={plan.error}
            vide={(plan.data?.length ?? 0) === 0}
            messageVide="Plan comptable non initialisé pour ce tenant"
          />

          {!plan.isLoading && !plan.isError && (plan.data?.length ?? 0) > 0 && (
            <GmTableWrap>
              <table>
                <thead>
                  <tr>
                    <th>N° compte</th>
                    <th>Intitulé</th>
                    <th>Type</th>
                    <th>Sens normal</th>
                  </tr>
                </thead>
                <tbody>
                  {(plan.data ?? []).map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{c.code}</td>
                      <td>{c.name}</td>
                      <td>{c.type}</td>
                      <td>{c.normalBalance === 'DEBIT' ? 'Débit' : 'Crédit'}</td>
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
