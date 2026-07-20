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

// ─── Libellés statiques (textes d'interface, pas des données) ────────────────

/** Icône et intitulé de repli d'un moyen. Le libellé réel vient de l'API. */
const METHODE_UI: Record<MethodePaiement, { icone: string; famille: string }> = {
  MOBILE_MONEY_MANUEL: { icone: '📱', famille: 'Mobile Money (validation manuelle)' },
  PASSERELLE: { icone: '💳', famille: 'Passerelle en ligne' },
  VIREMENT_NATIONAL: { icone: '🏦', famille: 'Virement bancaire national' },
  VIREMENT_INTERNATIONAL: { icone: '🌍', famille: 'Virement international' },
  TRANSFERT_ARGENT: { icone: '💸', famille: "Transfert d'argent" },
  ESPECES_AGENCE: { icone: '🏪', famille: 'Espèces en agence' },
  CHEQUE: { icone: '🧾', famille: 'Chèque' },
  CRYPTO: { icone: '₿', famille: 'Crypto-monnaie' },
  VOUCHER: { icone: '🎟️', famille: 'Code prépayé' },
  PAIEMENT_LIVRAISON: { icone: '🚚', famille: 'Paiement à la livraison' },
};

const STATUT_LABEL: Record<StatutPaiement, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours de vérification',
  REUSSI: 'Réussi',
  ECHOUE: 'Échoué',
  REMBOURSE: 'Remboursé',
  ANNULE: 'Annulé',
  EXPIRE: 'Expiré',
};

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
const CHAMPS_PAR_METHODE: Record<MethodePaiement, Array<{ label: string; alias: string[] }>> = {
  MOBILE_MONEY_MANUEL: [
    { label: 'Opérateur', alias: ['operateur', 'reseau', 'operator'] },
    { label: 'Numéro à créditer', alias: ['numero', 'numeroReception', 'numero_reception', 'telephone'] },
    { label: 'Titulaire du compte', alias: ['titulaire', 'nomTitulaire', 'beneficiaire'] },
  ],
  PASSERELLE: [
    { label: 'Fournisseur', alias: ['provider', 'fournisseur'] },
  ],
  VIREMENT_NATIONAL: [
    { label: 'Banque', alias: ['banque', 'nomBanque'] },
    { label: 'Titulaire du compte', alias: ['titulaire', 'nomTitulaire', 'beneficiaire'] },
    { label: 'IBAN', alias: ['iban', 'IBAN'] },
    { label: 'RIB', alias: ['rib', 'RIB'] },
    { label: 'Numéro de compte', alias: ['numeroCompte', 'numero_compte', 'compte'] },
    { label: 'Code BIC / SWIFT', alias: ['bic', 'BIC', 'swift', 'SWIFT'] },
  ],
  VIREMENT_INTERNATIONAL: [
    { label: 'Banque', alias: ['banque', 'nomBanque'] },
    { label: 'Titulaire du compte', alias: ['titulaire', 'nomTitulaire', 'beneficiaire'] },
    { label: 'IBAN', alias: ['iban', 'IBAN'] },
    { label: 'Code BIC / SWIFT', alias: ['bic', 'BIC', 'swift', 'SWIFT'] },
    { label: 'Adresse de la banque', alias: ['adresseBanque', 'adresse_banque', 'adresse'] },
    { label: 'Pays', alias: ['pays', 'paysBanque'] },
  ],
  TRANSFERT_ARGENT: [
    { label: 'Enseigne', alias: ['enseigne', 'operateur', 'service'] },
    { label: 'Bénéficiaire', alias: ['beneficiaire', 'titulaire', 'nomBeneficiaire'] },
    { label: 'Ville', alias: ['ville'] },
    { label: 'Pays', alias: ['pays'] },
    { label: "Pièce d'identité à présenter", alias: ['piece', 'pieceIdentite', 'piece_identite'] },
  ],
  ESPECES_AGENCE: [
    { label: 'Adresse', alias: ['adresse', 'localisation'] },
    { label: 'Horaires', alias: ['horaires', 'horaire'] },
    { label: 'Contact', alias: ['contact', 'telephone'] },
  ],
  CHEQUE: [
    { label: "Chèque à l'ordre de", alias: ['ordre', 'ordreCheque', 'beneficiaire', 'titulaire'] },
    { label: 'Banque', alias: ['banque'] },
    { label: "Adresse d'envoi", alias: ['adresseEnvoi', 'adresse_envoi', 'adresse'] },
  ],
  CRYPTO: [
    { label: 'Réseau', alias: ['reseau', 'network', 'chaine', 'blockchain'] },
    { label: 'Actif', alias: ['actif', 'asset', 'crypto', 'jeton'] },
    { label: 'Adresse du wallet', alias: ['adresse', 'adresseWallet', 'wallet', 'adresse_wallet'] },
    { label: 'Mémo / Tag', alias: ['memo', 'tag', 'destinationTag'] },
  ],
  VOUCHER: [],
  PAIEMENT_LIVRAISON: [
    { label: 'Zones desservies', alias: ['zones', 'zone', 'couverture'] },
    { label: 'Délai', alias: ['delai', 'delaiLivraison'] },
    { label: 'Contact', alias: ['contact', 'telephone'] },
  ],
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
  const parametres = methode.parametres ?? {};
  const champs = CHAMPS_PAR_METHODE[methode.methode] ?? [];

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
        <span>📄 Instructions de paiement</span>
      </div>

      {vide ? (
        <div style={CELLULE_VIDE}>
          Aucune coordonnée n’a été publiée pour ce moyen de paiement. Contactez le support avant
          d’effectuer un versement.
        </div>
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
              label="Points de collecte"
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
      setErreurCreation('Montant invalide : saisissez un montant strictement positif.');
      return;
    }

    const fournisseur = resoudreFournisseur(methodeChoisie);
    if (!fournisseur) {
      setErreurCreation(
        'Ce moyen de paiement n’est pas complètement configuré (fournisseur non déterminé). ' +
          'Contactez le support.',
      );
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
      setErreurCreation(messageErreurApi(erreur, 'Impossible de créer le paiement.'));
    }
  }

  async function soumettrePreuve(evenement: React.FormEvent) {
    evenement.preventDefault();
    setErreurPreuve('');
    setSuccesPreuve('');
    if (!paiementCree) return;

    if (!fichier) {
      setErreurPreuve(
        'Joignez une image ou un PDF de votre justificatif (10 Mo maximum). ' +
          'La référence seule ne suffit pas.',
      );
      return;
    }

    try {
      await televerserPreuve.mutateAsync({
        paiementId: paiementCree.id,
        fichier,
        referenceTexte: referenceTexte.trim() || undefined,
      });
      setSuccesPreuve(
        'Justificatif reçu. Un administrateur doit le vérifier : votre accès n’est pas activé immédiatement.',
      );
      setFichier(null);
      setReferenceTexte('');
      void paiementsQuery.refetch();
    } catch (erreur) {
      setErreurPreuve(messageErreurApi(erreur, 'Impossible d’envoyer le justificatif.'));
    }
  }

  async function soumettreVoucher(evenement: React.FormEvent) {
    evenement.preventDefault();
    setErreurVoucher('');
    setSuccesVoucher('');

    const code = codeVoucher.trim();
    if (code.length < 8) {
      setErreurVoucher('Code invalide : 8 caractères minimum.');
      return;
    }

    try {
      const resultat = await consommerVoucher.mutateAsync(code);
      setSuccesVoucher(
        `Code accepté. Abonnement activé${
          resultat.plan ? ` sur le plan ${resultat.plan}` : ''
        } pour ${resultat.dureeJours} jour(s).`,
      );
      setCodeVoucher('');
    } catch (erreur) {
      setErreurVoucher(messageErreurApi(erreur, 'Ce code n’a pas pu être utilisé.'));
    }
  }

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  const estVoucher = methodeChoisie?.methode === 'VOUCHER';
  const estPasserelle = methodeChoisie?.methode === 'PASSERELLE';
  const estManuel = methodeChoisie ? MOYENS_MANUELS.includes(methodeChoisie.methode) : false;

  return (
    <>
      <GmPageHeader
        fil={['🏠 Accueil', 'Abonnement']}
        titre="💠 Abonnement & paiement"
        sousTitre="Réglez votre abonnement par le moyen de votre choix"
        actions={
          <>
            {methodeChoisie && (
              <GmButton variante="outline" petit onClick={revenirAuChoix}>
                ← Changer de moyen
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
              🔄 Actualiser
            </GmButton>
          </>
        }
      />

      {/* ─── Mention de sécurité (toujours visible) ──────────────────────── */}
      <div className="gm-alert-banner">
        <div className="gm-alert-icon">🔒</div>
        <div className="gm-alert-text">
          <strong>Nous ne vous demanderons jamais votre code secret ou mot de passe.</strong>
        </div>
      </div>

      {/* ─── Étape 1 : choix du moyen ────────────────────────────────────── */}
      {!methodeChoisie && (
        <div className="gm-section-block">
          <div className="gm-section-title">
            <span>💳 Choisissez un moyen de paiement</span>
          </div>

          {methodesQuery.isLoading ? (
            <div style={CELLULE_VIDE}>Chargement des moyens de paiement…</div>
          ) : methodesQuery.isError ? (
            <div className="gm-alert-banner">
              <div className="gm-alert-icon">⚠️</div>
              <div className="gm-alert-text">
                <strong>Moyens de paiement indisponibles.</strong> Le service n’a pas répondu.
                Utilisez « Actualiser » pour réessayer.
              </div>
            </div>
          ) : methodes.length === 0 ? (
            <div style={CELLULE_VIDE}>
              Aucun moyen de paiement n’est actuellement proposé. Contactez le support.
            </div>
          ) : (
            <div className="gm-card-grid">
              {methodes.map((methode) => {
                const ui = METHODE_UI[methode.methode];
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
                        <div className="gm-card-icon">{ui?.icone ?? '💠'}</div>
                        <div className="gm-card-title">{methode.libelle}</div>
                      </div>
                      {methode.sandbox && <span className="gm-badge gm-badge-warn">Test</span>}
                    </div>
                    <div className="gm-card-metrics">
                      <div className="gm-metric-sub">
                        <span>{ui?.famille ?? methode.methode}</span>
                      </div>
                      {methode.variante && (
                        <div className="gm-metric-sub">
                          <span>{methode.variante}</span>
                        </div>
                      )}
                      {methode.devises.length > 0 && (
                        <div className="gm-metric-sub">
                          <span>Devises : {methode.devises.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <div className="gm-card-actions">
                      <GmButton variante="primary" petit onClick={() => choisirMethode(methode)}>
                        Choisir
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
              {METHODE_UI[methodeChoisie.methode]?.icone ?? '💠'} {methodeChoisie.libelle}
            </span>
          </div>

          {methodeChoisie.sandbox && (
            <div className="gm-alert-banner">
              <div className="gm-alert-icon">🧪</div>
              <div className="gm-alert-text">
                Ce moyen est en mode test (bac à sable) : aucun encaissement réel n’est effectué.
              </div>
            </div>
          )}

          {/* Instructions — uniquement issues de `parametres` */}
          {!estVoucher && <BlocInstructions methode={methodeChoisie} />}

          {/* ── Cas VOUCHER : simple code ─────────────────────────────── */}
          {estVoucher && (
            <div className="gm-section-card">
              <div className="gm-section-title">
                <span>🎟️ Code prépayé</span>
              </div>
              <form onSubmit={soumettreVoucher}>
                <div className="gm-form-group">
                  <label className="gm-form-label" htmlFor="abo-voucher">
                    Votre code
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
                <div className="gm-alert-desc">
                  Un code valide active votre abonnement immédiatement. Chaque code ne peut servir
                  qu’une seule fois.
                </div>
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
                    {consommerVoucher.isPending ? 'Vérification…' : 'Utiliser ce code'}
                  </GmButton>
                </div>
              </form>
            </div>
          )}

          {/* ── Autres moyens : création du paiement ──────────────────── */}
          {!estVoucher && !paiementCree && (
            <div className="gm-section-card">
              <div className="gm-section-title">
                <span>🧮 Montant à régler</span>
              </div>
              <form onSubmit={soumettreCreation}>
                <div className="gm-form-row">
                  <div className="gm-form-group">
                    <label className="gm-form-label" htmlFor="abo-montant">
                      Montant
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
                        Devise
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
                  <div className="gm-alert-desc">
                    Après création, vous serez redirigé vers le site du prestataire pour régler.
                    Le retour depuis ce site n’active pas votre abonnement : l’activation n’a lieu
                    qu’après confirmation vérifiée du prestataire auprès de nos serveurs.
                  </div>
                )}
                {estManuel && (
                  <div className="gm-alert-desc">
                    Effectuez le versement d’après les instructions ci-dessus, puis envoyez votre
                    justificatif à l’étape suivante. La validation est faite par un administrateur :
                    votre accès n’est pas immédiat.
                  </div>
                )}

                {erreurCreation && (
                  <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>
                    {erreurCreation}
                  </div>
                )}

                <div className="gm-card-actions">
                  <GmButton type="submit" variante="primary" disabled={creerPaiement.isPending}>
                    {creerPaiement.isPending ? 'Création…' : 'Créer le paiement'}
                  </GmButton>
                </div>
              </form>
            </div>
          )}

          {/* ── Paiement créé : référence + preuve ────────────────────── */}
          {paiementCree && (
            <div className="gm-section-card">
              <div className="gm-section-title">
                <span>✅ Paiement enregistré</span>
              </div>

              <LigneInfo label="Référence à rappeler" valeur={paiementCree.reference} />
              <LigneInfo
                label="Montant"
                valeur={formatMontant(paiementCree.montant, paiementCree.devise)}
              />
              <LigneInfo
                label="Statut"
                valeur={
                  <GmStatusPill statut={tonStatut(paiementCree.statut)}>
                    {STATUT_LABEL[paiementCree.statut]}
                  </GmStatusPill>
                }
              />

              {estPasserelle ? (
                <div className="gm-alert-desc">
                  Réglez ce paiement chez le prestataire en rappelant la référence ci-dessus. Nous
                  n’activons votre abonnement qu’après confirmation vérifiée du prestataire auprès
                  de nos serveurs — le simple retour du navigateur ne suffit pas.
                </div>
              ) : (
                <form onSubmit={soumettrePreuve} style={{ marginTop: 12 }}>
                  <div className="gm-form-group">
                    <label className="gm-form-label" htmlFor="abo-preuve">
                      Justificatif (image ou PDF, 10 Mo maximum)
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
                      Référence de l’opération (MTCN, n° de chèque, hash de transaction, code de
                      reçu…)
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

                  <div className="gm-alert-desc">
                    Votre justificatif est vérifié par un administrateur. L’envoi n’active pas
                    l’abonnement : l’accès n’est pas immédiat.
                  </div>

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
                      {televerserPreuve.isPending ? 'Envoi…' : 'Envoyer le justificatif'}
                    </GmButton>
                  </div>
                </form>
              )}

              {/* Preuves déjà déposées pour ce paiement */}
              {preuvesQuery.isError ? (
                <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>
                  Impossible de charger les justificatifs déjà envoyés.
                </div>
              ) : preuvesQuery.isLoading ? (
                <div style={CELLULE_VIDE}>Chargement des justificatifs…</div>
              ) : (preuvesQuery.data ?? []).length > 0 ? (
                <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 12 }}>
                  {(preuvesQuery.data ?? []).map((preuve) => (
                    <li key={preuve.id}>
                      {preuve.nomOriginal ?? 'Justificatif'} — {preuve.statut}
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
          <span>🧾 Mes paiements</span>
        </div>
        <GmTableWrap>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Référence</th>
                <th>Montant</th>
                <th>Canal</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {paiementsQuery.isLoading ? (
                <tr>
                  <td colSpan={5} style={CELLULE_VIDE}>
                    Chargement de vos paiements…
                  </td>
                </tr>
              ) : paiementsQuery.isError ? (
                <tr>
                  <td colSpan={5} style={{ ...CELLULE_VIDE, color: 'var(--gm-danger)' }}>
                    Impossible de charger vos paiements.
                  </td>
                </tr>
              ) : paiements.length === 0 ? (
                <tr>
                  <td colSpan={5} style={CELLULE_VIDE}>
                    Aucun paiement enregistré
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
                        {STATUT_LABEL[paiement.statut]}
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
