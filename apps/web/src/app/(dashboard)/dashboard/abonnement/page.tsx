'use client';
// ============================================================
// PAGE ABONNEMENT & PAIEMENT — GESTMONEY
// Présentation calquée sur le design system des maquettes (gm-*).
// Mobile-first : une colonne, la grille s'élargit sur grand écran.
//
// RÈGLE ABSOLUE : aucun moyen de paiement, aucun numéro, aucun
// IBAN, aucune adresse de wallet n'est écrit ici. Tout provient
// de GET /payments/methodes et du champ libre `parametres` saisi
// en administration. Un moyen désactivé disparaît immédiatement.
// ============================================================
import React, { useMemo, useState } from 'react';
import { GmPageHeader, GmButton, GmTableWrap, GmStatusPill } from '@/components/gm';
import {
  useMethodesPaiement,
  useMesPaiements,
  usePreuvesPaiement,
  useCreerPaiement,
  useTeleverserPreuve,
  useConsommerVoucher,
  resoudreFournisseur,
  messageErreurApi,
  type MethodeDisponible,
  type MethodePaiement,
  type Paiement,
  type StatutPaiement,
} from '@/hooks/usePaiements';
import { formatMontant, formatDateTime } from '@/lib/formatters';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

// ─── Libellés statiques (textes d'interface, pas des données) ────────────────

/** Icône de repli d'un moyen. Le libellé réel vient de l'API. */
const METHODE_ICONE: Record<MethodePaiement, string> = {
  MOBILE_MONEY_MANUEL: '📱',
  PASSERELLE: '💳',
  VIREMENT_NATIONAL: '🏦',
  VIREMENT_INTERNATIONAL: '🌍',
  TRANSFERT_ARGENT: '💸',
  ESPECES_AGENCE: '🏪',
  CHEQUE: '🧾',
  CRYPTO: '₿',
  VOUCHER: '🎟️',
  PAIEMENT_LIVRAISON: '🚚',
};

/** Intitulé de famille traduit d'un moyen de paiement. */
function familleMethode(t: Translations, methode: MethodePaiement): string {
  return t.abonnement.familles[methode] ?? methode;
}

/** Libellé de statut traduit d'un paiement. */
function statutLabel(t: Translations, statut: StatutPaiement): string {
  return t.abonnement.statuts[statut] ?? statut;
}

/** Le kit n'expose que trois tons de pastille : on y ramène les 7 statuts. */
function tonStatut(statut: StatutPaiement): 'success' | 'pending' | 'failed' {
  if (statut === 'REUSSI') return 'success';
  if (statut === 'EN_ATTENTE' || statut === 'EN_COURS') return 'pending';
  return 'failed';
}

/** Les moyens dont la validation passe par un administrateur. */
const MOYENS_MANUELS: MethodePaiement[] = [
  'MOBILE_MONEY_MANUEL',
  'VIREMENT_NATIONAL',
  'VIREMENT_INTERNATIONAL',
  'TRANSFERT_ARGENT',
  'ESPECES_AGENCE',
  'CHEQUE',
  'CRYPTO',
  'PAIEMENT_LIVRAISON',
];

/**
 * Champs de `parametres` mis en avant par méthode, avec leurs alias possibles
 * (l'administration est libre de son nommage). Seuls les champs REELLEMENT
 * présents sont affichés — rien n'est inventé, rien n'est complété.
 */
const champsParMethode = (
  t: Translations,
): Record<MethodePaiement, Array<{ label: string; alias: string[] }>> => {
  const c = t.abonnement.champs;
  return {
    MOBILE_MONEY_MANUEL: [
      { label: c.operateur, alias: ['operateur', 'reseau', 'operator'] },
      { label: c.numeroACrediter, alias: ['numero', 'numeroReception', 'numero_reception', 'telephone'] },
      { label: c.titulaire, alias: ['titulaire', 'nomTitulaire', 'beneficiaire'] },
    ],
    PASSERELLE: [
      { label: c.fournisseur, alias: ['provider', 'fournisseur'] },
    ],
    VIREMENT_NATIONAL: [
      { label: c.banque, alias: ['banque', 'nomBanque'] },
      { label: c.titulaire, alias: ['titulaire', 'nomTitulaire', 'beneficiaire'] },
      { label: c.iban, alias: ['iban', 'IBAN'] },
      { label: c.rib, alias: ['rib', 'RIB'] },
      { label: c.numeroCompte, alias: ['numeroCompte', 'numero_compte', 'compte'] },
      { label: c.bic, alias: ['bic', 'BIC', 'swift', 'SWIFT'] },
    ],
    VIREMENT_INTERNATIONAL: [
      { label: c.banque, alias: ['banque', 'nomBanque'] },
      { label: c.titulaire, alias: ['titulaire', 'nomTitulaire', 'beneficiaire'] },
      { label: c.iban, alias: ['iban', 'IBAN'] },
      { label: c.bic, alias: ['bic', 'BIC', 'swift', 'SWIFT'] },
      { label: c.adresseBanque, alias: ['adresseBanque', 'adresse_banque', 'adresse'] },
      { label: c.pays, alias: ['pays', 'paysBanque'] },
    ],
    TRANSFERT_ARGENT: [
      { label: c.enseigne, alias: ['enseigne', 'operateur', 'service'] },
      { label: c.beneficiaire, alias: ['beneficiaire', 'titulaire', 'nomBeneficiaire'] },
      { label: c.ville, alias: ['ville'] },
      { label: c.pays, alias: ['pays'] },
      { label: c.pieceIdentite, alias: ['piece', 'pieceIdentite', 'piece_identite'] },
    ],
    ESPECES_AGENCE: [
      { label: c.adresse, alias: ['adresse', 'localisation'] },
      { label: c.horaires, alias: ['horaires', 'horaire'] },
      { label: c.contact, alias: ['contact', 'telephone'] },
    ],
    CHEQUE: [
      { label: c.chequeOrdre, alias: ['ordre', 'ordreCheque', 'beneficiaire', 'titulaire'] },
      { label: c.banque, alias: ['banque'] },
      { label: c.adresseEnvoi, alias: ['adresseEnvoi', 'adresse_envoi', 'adresse'] },
    ],
    CRYPTO: [
      { label: c.reseau, alias: ['reseau', 'network', 'chaine', 'blockchain'] },
      { label: c.actif, alias: ['actif', 'asset', 'crypto', 'jeton'] },
      { label: c.adresseWallet, alias: ['adresse', 'adresseWallet', 'wallet', 'adresse_wallet'] },
      { label: c.memoTag, alias: ['memo', 'tag', 'destinationTag'] },
    ],
    VOUCHER: [],
    PAIEMENT_LIVRAISON: [
      { label: c.zones, alias: ['zones', 'zone', 'couverture'] },
      { label: c.delai, alias: ['delai', 'delaiLivraison'] },
      { label: c.contact, alias: ['contact', 'telephone'] },
    ],
  };
};

/** Clés traitées à part : jamais reprises dans le bloc « autres informations ». */
const CLES_RESERVEES = new Set([
  'instructions',
  'instruction',
  'note',
  'notes',
  'pointsCollecte',
  'points_collecte',
  'points',
  'agences',
]);

const CELLULE_VIDE: React.CSSProperties = {
  textAlign: 'center',
  color: 'var(--gm-text-2)',
  padding: '24px 16px',
  fontSize: 13,
};

// ─── Lecture prudente de `parametres` ────────────────────────────────────────

/** Première valeur scalaire non vide parmi les alias. Sinon `null`. */
function lireParam(parametres: Record<string, unknown>, alias: string[]): string | null {
  for (const cle of alias) {
    const brut = parametres?.[cle];
    if (brut === null || brut === undefined) continue;
    if (typeof brut === 'string' || typeof brut === 'number' || typeof brut === 'boolean') {
      const valeur = String(brut).trim();
      if (valeur) return valeur;
    }
  }
  return null;
}

/** Première liste non vide parmi les alias, normalisée en chaînes lisibles. */
function lireListeParam(parametres: Record<string, unknown>, alias: string[]): string[] {
  for (const cle of alias) {
    const brut = parametres?.[cle];
    if (Array.isArray(brut) && brut.length > 0) {
      return brut
        .map((element) => {
          if (typeof element === 'string' || typeof element === 'number') return String(element);
          if (element && typeof element === 'object') {
            // Objet libre (ex. { nom, adresse, ville }) : on concatène ses
            // valeurs scalaires renseignées, sans en inventer aucune.
            return Object.values(element as Record<string, unknown>)
              .filter((v) => typeof v === 'string' || typeof v === 'number')
              .map((v) => String(v).trim())
              .filter(Boolean)
              .join(' — ');
          }
          return '';
        })
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

/** « adresseBanque » → « Adresse banque ». Sert au bloc générique. */
function humaniserCle(cle: string): string {
  const espace = cle
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
  return espace.charAt(0).toUpperCase() + espace.slice(1);
}

// ─── Sous-composants d'affichage ─────────────────────────────────────────────

/** Ligne « libellé / valeur » d'un bloc d'instructions. */
function LigneInfo({ label, valeur }: { label: string; valeur: React.ReactNode }) {
  return (
    <div className="gm-panel-metrics" style={{ display: 'block', marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--gm-text-2)', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, wordBreak: 'break-all' }}>{valeur}</div>
    </div>
  );
}

/**
 * Bloc d'instructions d'un moyen : uniquement ce que `parametres` contient.
 * Aucune valeur d'exemple n'est produite en cas d'absence.
 */
function BlocInstructions({ methode }: { methode: MethodeDisponible }) {
  const t = useT();
  const parametres = methode.parametres ?? {};
  const champs = champsParMethode(t)[methode.methode] ?? [];

  const renseignes = champs
    .map((champ) => ({ label: champ.label, valeur: lireParam(parametres, champ.alias) }))
    .filter((champ): champ is { label: string; valeur: string } => champ.valeur !== null);

  const clesAffichees = new Set<string>();
  champs.forEach((champ) => champ.alias.forEach((a) => clesAffichees.add(a)));

  const instructions = lireParam(parametres, ['instructions', 'instruction', 'note', 'notes']);
  const pointsCollecte = lireListeParam(parametres, [
    'pointsCollecte',
    'points_collecte',
    'points',
    'agences',
  ]);

  // Tout paramètre supplémentaire saisi en administration reste visible :
  // on n'en masque aucun, mais on n'en fabrique aucun non plus.
  const autres = Object.entries(parametres)
    .filter(([cle, valeur]) => {
      if (clesAffichees.has(cle) || CLES_RESERVEES.has(cle)) return false;
      return (
        (typeof valeur === 'string' && valeur.trim() !== '') ||
        typeof valeur === 'number' ||
        typeof valeur === 'boolean'
      );
    })
    .map(([cle, valeur]) => ({ label: humaniserCle(cle), valeur: String(valeur) }));

  const vide =
    renseignes.length === 0 && !instructions && pointsCollecte.length === 0 && autres.length === 0;

  return (
    <div className="gm-section-card">
      <div className="gm-section-title">
        <span>{t.abonnement.instructions.title}</span>
      </div>

      {vide ? (
        <div style={CELLULE_VIDE}>{t.abonnement.instructions.empty}</div>
      ) : (
        <>
          {instructions && (
            <div className="gm-alert-desc" style={{ marginBottom: 14, whiteSpace: 'pre-line' }}>
              {instructions}
            </div>
          )}

          {renseignes.map((champ) => (
            <LigneInfo key={champ.label} label={champ.label} valeur={champ.valeur} />
          ))}

          {pointsCollecte.length > 0 && (
            <LigneInfo
              label={t.abonnement.instructions.collectPoints}
              valeur={
                <ul style={{ margin: 0, paddingLeft: 18, fontWeight: 500 }}>
                  {pointsCollecte.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              }
            />
          )}

          {autres.map((champ) => (
            <LigneInfo key={champ.label} label={champ.label} valeur={champ.valeur} />
          ))}
        </>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AbonnementPage() {
  const t = useT();
  const methodesQuery = useMethodesPaiement();
  const paiementsQuery = useMesPaiements();

  const creerPaiement = useCreerPaiement();
  const televerserPreuve = useTeleverserPreuve();
  const consommerVoucher = useConsommerVoucher();

  const methodes = useMemo(() => methodesQuery.data ?? [], [methodesQuery.data]);
  const paiements: Paiement[] = paiementsQuery.data ?? [];

  // ─── Parcours en deux temps ────────────────────────────────────────────────
  const [methodeChoisie, setMethodeChoisie] = useState<MethodeDisponible | null>(null);

  // Formulaire de création
  const [montant, setMontant] = useState('');
  const [devise, setDevise] = useState('');
  const [erreurCreation, setErreurCreation] = useState('');
  const [paiementCree, setPaiementCree] = useState<Paiement | null>(null);

  // Formulaire de preuve
  const [fichier, setFichier] = useState<File | null>(null);
  const [referenceTexte, setReferenceTexte] = useState('');
  const [erreurPreuve, setErreurPreuve] = useState('');
  const [succesPreuve, setSuccesPreuve] = useState('');

  // Formulaire de code prépayé
  const [codeVoucher, setCodeVoucher] = useState('');
  const [erreurVoucher, setErreurVoucher] = useState('');
  const [succesVoucher, setSuccesVoucher] = useState('');

  const preuvesQuery = usePreuvesPaiement(paiementCree?.id);

  function choisirMethode(methode: MethodeDisponible) {
    setMethodeChoisie(methode);
    setMontant('');
    setDevise(methode.devises[0] ?? '');
    setErreurCreation('');
    setPaiementCree(null);
    setFichier(null);
    setReferenceTexte('');
    setErreurPreuve('');
    setSuccesPreuve('');
    setCodeVoucher('');
    setErreurVoucher('');
    setSuccesVoucher('');
  }

  function revenirAuChoix() {
    setMethodeChoisie(null);
    setPaiementCree(null);
  }

  async function soumettreCreation(evenement: React.FormEvent) {
    evenement.preventDefault();
    setErreurCreation('');
    if (!methodeChoisie) return;

    const valeur = Number(montant);
    if (!Number.isFinite(valeur) || valeur <= 0) {
      setErreurCreation(t.abonnement.creation.invalidAmount);
      return;
    }

    const fournisseur = resoudreFournisseur(methodeChoisie);
    if (!fournisseur) {
      setErreurCreation(t.abonnement.creation.notConfigured);
      return;
    }

    try {
      const paiement = await creerPaiement.mutateAsync({
        montant: Math.round(valeur * 100) / 100,
        devise: devise || undefined,
        provider: fournisseur,
        configId: methodeChoisie.id,
        metadata: {
          methode: methodeChoisie.methode,
          libelleMethode: methodeChoisie.libelle,
        },
      });
      setPaiementCree(paiement);
    } catch (erreur) {
      setErreurCreation(messageErreurApi(erreur, t.abonnement.creation.failed));
    }
  }

  async function soumettrePreuve(evenement: React.FormEvent) {
    evenement.preventDefault();
    setErreurPreuve('');
    setSuccesPreuve('');
    if (!paiementCree) return;

    if (!fichier) {
      setErreurPreuve(t.abonnement.preuve.missingFile);
      return;
    }

    try {
      await televerserPreuve.mutateAsync({
        paiementId: paiementCree.id,
        fichier,
        referenceTexte: referenceTexte.trim() || undefined,
      });
      setSuccesPreuve(t.abonnement.preuve.success);
      setFichier(null);
      setReferenceTexte('');
      void paiementsQuery.refetch();
    } catch (erreur) {
      setErreurPreuve(messageErreurApi(erreur, t.abonnement.preuve.failed));
    }
  }

  async function soumettreVoucher(evenement: React.FormEvent) {
    evenement.preventDefault();
    setErreurVoucher('');
    setSuccesVoucher('');

    const code = codeVoucher.trim();
    if (code.length < 8) {
      setErreurVoucher(t.abonnement.voucher.invalid);
      return;
    }

    try {
      const resultat = await consommerVoucher.mutateAsync(code);
      setSuccesVoucher(
        `${t.abonnement.voucher.acceptedPrefix}${
          resultat.plan ? ` ${t.abonnement.voucher.onPlan} ${resultat.plan}` : ''
        } ${t.abonnement.voucher.forPrefix} ${resultat.dureeJours} ${t.abonnement.voucher.forDays}`,
      );
      setCodeVoucher('');
    } catch (erreur) {
      setErreurVoucher(messageErreurApi(erreur, t.abonnement.voucher.failed));
    }
  }

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  const estVoucher = methodeChoisie?.methode === 'VOUCHER';
  const estPasserelle = methodeChoisie?.methode === 'PASSERELLE';
  const estManuel = methodeChoisie ? MOYENS_MANUELS.includes(methodeChoisie.methode) : false;

  return (
    <>
      <GmPageHeader
        fil={[`🏠 ${t.common.home}`, t.nav.abonnement]}
        titre={`💠 ${t.abonnement.title}`}
        sousTitre={t.abonnement.subtitle}
        actions={
          <>
            {methodeChoisie && (
              <GmButton variante="outline" petit onClick={revenirAuChoix}>
                {t.abonnement.changeMethod}
              </GmButton>
            )}
            <GmButton
              variante="outline"
              petit
              onClick={() => {
                void methodesQuery.refetch();
                void paiementsQuery.refetch();
              }}
            >
              🔄 {t.common.refresh}
            </GmButton>
          </>
        }
      />

      {/* ─── Mention de sécurité (toujours visible) ──────────────────────── */}
      <div className="gm-alert-banner">
        <div className="gm-alert-icon">🔒</div>
        <div className="gm-alert-text">
          <strong>{t.abonnement.securityNotice}</strong>
        </div>
      </div>

      {/* ─── Étape 1 : choix du moyen ────────────────────────────────────── */}
      {!methodeChoisie && (
        <div className="gm-section-block">
          <div className="gm-section-title">
            <span>{t.abonnement.chooseMethod}</span>
          </div>

          {methodesQuery.isLoading ? (
            <div style={CELLULE_VIDE}>{t.abonnement.loadingMethods}</div>
          ) : methodesQuery.isError ? (
            <div className="gm-alert-banner">
              <div className="gm-alert-icon">⚠️</div>
              <div className="gm-alert-text">
                <strong>{t.abonnement.methodsUnavailable}</strong> {t.abonnement.methodsUnavailableSub}
              </div>
            </div>
          ) : methodes.length === 0 ? (
            <div style={CELLULE_VIDE}>{t.abonnement.noMethod}</div>
          ) : (
            <div className="gm-card-grid">
              {methodes.map((methode) => {
                const icone = METHODE_ICONE[methode.methode];
                return (
                  <div
                    key={methode.id}
                    className="gm-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => choisirMethode(methode)}
                    onKeyDown={(evenement) => {
                      if (evenement.key === 'Enter' || evenement.key === ' ') {
                        evenement.preventDefault();
                        choisirMethode(methode);
                      }
                    }}
                  >
                    <div className="gm-card-head">
                      <div className="gm-card-icon-title">
                        <div className="gm-card-icon">{icone ?? '💠'}</div>
                        <div className="gm-card-title">{methode.libelle}</div>
                      </div>
                      {methode.sandbox && <span className="gm-badge gm-badge-warn">{t.abonnement.testBadge}</span>}
                    </div>
                    <div className="gm-card-metrics">
                      <div className="gm-metric-sub">
                        <span>{familleMethode(t, methode.methode)}</span>
                      </div>
                      {methode.variante && (
                        <div className="gm-metric-sub">
                          <span>{methode.variante}</span>
                        </div>
                      )}
                      {methode.devises.length > 0 && (
                        <div className="gm-metric-sub">
                          <span>{t.abonnement.currencies} {methode.devises.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <div className="gm-card-actions">
                      <GmButton variante="primary" petit onClick={() => choisirMethode(methode)}>
                        {t.abonnement.choose}
                      </GmButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Étape 2 : instructions + formulaire du moyen choisi ─────────── */}
      {methodeChoisie && (
        <div className="gm-section-block">
          <div className="gm-section-title">
            <span>
              {METHODE_ICONE[methodeChoisie.methode] ?? '💠'} {methodeChoisie.libelle}
            </span>
          </div>

          {methodeChoisie.sandbox && (
            <div className="gm-alert-banner">
              <div className="gm-alert-icon">🧪</div>
              <div className="gm-alert-text">
                {t.abonnement.sandboxNotice}
              </div>
            </div>
          )}

          {/* Instructions — uniquement issues de `parametres` */}
          {!estVoucher && <BlocInstructions methode={methodeChoisie} />}

          {/* ── Cas VOUCHER : simple code ─────────────────────────────── */}
          {estVoucher && (
            <div className="gm-section-card">
              <div className="gm-section-title">
                <span>{t.abonnement.voucher.title}</span>
              </div>
              <form onSubmit={soumettreVoucher}>
                <div className="gm-form-group">
                  <label className="gm-form-label" htmlFor="abo-voucher">
                    {t.abonnement.voucher.label}
                  </label>
                  <input
                    id="abo-voucher"
                    className="gm-form-input"
                    type="text"
                    autoComplete="off"
                    value={codeVoucher}
                    onChange={(evenement) => setCodeVoucher(evenement.target.value)}
                    required
                  />
                </div>
                <div className="gm-alert-desc">{t.abonnement.voucher.hint}</div>
                {erreurVoucher && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>
                    {erreurVoucher}
                  </div>
                )}
                {succesVoucher && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-success)' }}>
                    {succesVoucher}
                  </div>
                )}
                <div className="gm-card-actions">
                  <GmButton type="submit" variante="primary" disabled={consommerVoucher.isPending}>
                    {consommerVoucher.isPending ? t.common.checking : t.abonnement.voucher.submit}
                  </GmButton>
                </div>
              </form>
            </div>
          )}

          {/* ── Autres moyens : création du paiement ──────────────────── */}
          {!estVoucher && !paiementCree && (
            <div className="gm-section-card">
              <div className="gm-section-title">
                <span>{t.abonnement.creation.title}</span>
              </div>
              <form onSubmit={soumettreCreation}>
                <div className="gm-form-row">
                  <div className="gm-form-group">
                    <label className="gm-form-label" htmlFor="abo-montant">
                      {t.common.amount}
                    </label>
                    <input
                      id="abo-montant"
                      className="gm-form-input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={montant}
                      onChange={(evenement) => setMontant(evenement.target.value)}
                      required
                    />
                  </div>
                  {methodeChoisie.devises.length > 0 && (
                    <div className="gm-form-group">
                      <label className="gm-form-label" htmlFor="abo-devise">
                        {t.common.currency}
                      </label>
                      <select
                        id="abo-devise"
                        className="gm-form-input"
                        value={devise}
                        onChange={(evenement) => setDevise(evenement.target.value)}
                      >
                        {methodeChoisie.devises.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {estPasserelle && (
                  <div className="gm-alert-desc">{t.abonnement.creation.gatewayNotice}</div>
                )}
                {estManuel && (
                  <div className="gm-alert-desc">{t.abonnement.creation.manualNotice}</div>
                )}

                {erreurCreation && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>
                    {erreurCreation}
                  </div>
                )}

                <div className="gm-card-actions">
                  <GmButton type="submit" variante="primary" disabled={creerPaiement.isPending}>
                    {creerPaiement.isPending ? t.common.creating : t.abonnement.creation.submit}
                  </GmButton>
                </div>
              </form>
            </div>
          )}

          {/* ── Paiement créé : référence + preuve ────────────────────── */}
          {paiementCree && (
            <div className="gm-section-card">
              <div className="gm-section-title">
                <span>{t.abonnement.preuve.title}</span>
              </div>

              <LigneInfo label={t.abonnement.preuve.referenceLabel} valeur={paiementCree.reference} />
              <LigneInfo
                label={t.common.amount}
                valeur={formatMontant(paiementCree.montant, paiementCree.devise)}
              />
              <LigneInfo
                label={t.common.statut}
                valeur={
                  <GmStatusPill statut={tonStatut(paiementCree.statut)}>
                    {statutLabel(t, paiementCree.statut)}
                  </GmStatusPill>
                }
              />

              {estPasserelle ? (
                <div className="gm-alert-desc">{t.abonnement.preuve.gatewayNotice}</div>
              ) : (
                <form onSubmit={soumettrePreuve} style={{ marginTop: 12 }}>
                  <div className="gm-form-group">
                    <label className="gm-form-label" htmlFor="abo-preuve">
                      {t.abonnement.preuve.fileLabel}
                    </label>
                    <input
                      id="abo-preuve"
                      className="gm-form-input"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/heic,application/pdf"
                      onChange={(evenement) => setFichier(evenement.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="gm-form-group">
                    <label className="gm-form-label" htmlFor="abo-reference">
                      {t.abonnement.preuve.referenceFieldLabel}
                    </label>
                    <input
                      id="abo-reference"
                      className="gm-form-input"
                      type="text"
                      autoComplete="off"
                      maxLength={255}
                      value={referenceTexte}
                      onChange={(evenement) => setReferenceTexte(evenement.target.value)}
                    />
                  </div>

                  <div className="gm-alert-desc">{t.abonnement.preuve.reviewNotice}</div>

                  {erreurPreuve && (
                    <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>
                      {erreurPreuve}
                    </div>
                  )}
                  {succesPreuve && (
                    <div className="gm-alert-desc" style={{ color: 'var(--gm-success)' }}>
                      {succesPreuve}
                    </div>
                  )}

                  <div className="gm-card-actions">
                    <GmButton type="submit" variante="primary" disabled={televerserPreuve.isPending}>
                      {televerserPreuve.isPending ? t.common.sending : t.abonnement.preuve.submit}
                    </GmButton>
                  </div>
                </form>
              )}

              {/* Preuves déjà déposées pour ce paiement */}
              {preuvesQuery.isError ? (
                <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>
                  {t.abonnement.preuve.loadError}
                </div>
              ) : preuvesQuery.isLoading ? (
                <div style={CELLULE_VIDE}>{t.abonnement.preuve.loading}</div>
              ) : (preuvesQuery.data ?? []).length > 0 ? (
                <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 12 }}>
                  {(preuvesQuery.data ?? []).map((preuve) => (
                    <li key={preuve.id}>
                      {preuve.nomOriginal ?? t.abonnement.preuve.fallbackName} — {preuve.statut}
                      {preuve.motifRejet ? ` (${preuve.motifRejet})` : ''} ·{' '}
                      {formatDateTime(preuve.createdAt)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* ─── Historique des paiements ────────────────────────────────────── */}
      <div className="gm-section-block">
        <div className="gm-section-title">
          <span>{t.abonnement.historique.title}</span>
        </div>
        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th>{t.common.date}</th>
                <th>{t.common.reference}</th>
                <th>{t.common.amount}</th>
                <th>{t.abonnement.historique.colChannel}</th>
                <th>{t.common.statut}</th>
              </tr>
            </thead>
            <tbody>
              {paiementsQuery.isLoading ? (
                <tr>
                  <td colSpan={5} style={CELLULE_VIDE}>
                    {t.abonnement.historique.loading}
                  </td>
                </tr>
              ) : paiementsQuery.isError ? (
                <tr>
                  <td colSpan={5} style={{ ...CELLULE_VIDE, color: 'var(--gm-danger)' }}>
                    {t.abonnement.historique.error}
                  </td>
                </tr>
              ) : paiements.length === 0 ? (
                <tr>
                  <td colSpan={5} style={CELLULE_VIDE}>
                    {t.abonnement.historique.empty}
                  </td>
                </tr>
              ) : (
                paiements.map((paiement) => (
                  <tr key={paiement.id}>
                    <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                      {formatDateTime(paiement.createdAt)}
                    </td>
                    <td style={{ fontSize: 12 }}>{paiement.reference}</td>
                    <td style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                      {formatMontant(paiement.montant, paiement.devise)}
                    </td>
                    <td style={{ fontSize: 12 }}>{paiement.provider}</td>
                    <td>
                      <GmStatusPill statut={tonStatut(paiement.statut)}>
                        {statutLabel(t, paiement.statut)}
                      </GmStatusPill>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </GmTableWrap>
      </div>
    </>
  );
}
