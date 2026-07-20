/**
 * Gabarits d'email du module de paiement et du cycle de vie des licences.
 *
 * Tout le texte vit ici : le listener ne fait qu'assembler des valeurs réelles
 * issues des événements reçus et déclencher l'envoi.
 *
 * RÈGLE ABSOLUE — aucun de ces gabarits ne doit jamais recevoir ni afficher un
 * secret : mot de passe, code PIN, clé d'API, jeton, numéro de compte ou de
 * carte complet. Seules des références de transaction, des montants et des
 * dates y figurent.
 */

/** Un email prêt à partir. */
export interface GabaritEmail {
  subject: string;
  body: string;
}

/** Mention anti-hameçonnage obligatoire sur tous les emails de paiement. */
export const MENTION_ANTI_HAMECONNAGE =
  'Nous ne vous demanderons jamais votre code secret ou mot de passe.';

const SIGNATURE = "L'équipe GESTMONEY";

// ─── Formatage ───────────────────────────────────────────────────────────────

/** Montant lisible, sans arrondi trompeur : « 25 000 XOF ». */
export function formaterMontant(montant: number, devise: string): string {
  const valeur = Number.isFinite(montant) ? montant : 0;
  const formate = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valeur);
  return `${formate} ${(devise ?? '').toUpperCase()}`.trim();
}

/** Date lisible en français : « 12 mars 2026 ». */
export function formaterDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return 'date inconnue';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Assemble un corps d'email : lignes non vides, mention légale, signature. */
function corps(lignes: (string | null | undefined)[], avecMention = true): string {
  const contenu = lignes.filter((l): l is string => !!l && l.trim().length > 0);
  if (avecMention) {
    contenu.push('', MENTION_ANTI_HAMECONNAGE);
  }
  contenu.push('', SIGNATURE);
  return contenu.join('\n');
}

/** Ligne « Plan : … » uniquement si le plan est réellement connu. */
function lignePlan(plan?: string | null): string | null {
  return plan ? `Plan concerné : ${plan}` : null;
}

// ─── Paiements ───────────────────────────────────────────────────────────────

export interface DonneesPaiement {
  reference: string;
  montant: number;
  devise: string;
  plan?: string | null;
  provider?: string | null;
}

/** 1. Paiement créé — accusé de réception et instructions. */
export function gabaritPaiementCree(d: DonneesPaiement): GabaritEmail {
  return {
    subject: `Votre demande de paiement ${d.reference} a bien été enregistrée`,
    body: corps([
      'Bonjour,',
      '',
      'Nous avons bien enregistré votre demande de paiement. Elle est en attente de règlement.',
      '',
      `Référence : ${d.reference}`,
      `Montant à régler : ${formaterMontant(d.montant, d.devise)}`,
      d.provider ? `Moyen de paiement choisi : ${d.provider}` : null,
      lignePlan(d.plan),
      '',
      'Marche à suivre :',
      `1. Effectuez le règlement de ${formaterMontant(d.montant, d.devise)} par le moyen sélectionné.`,
      `2. Indiquez la référence ${d.reference} lors de votre règlement.`,
      '3. Téléversez ensuite votre justificatif (reçu ou capture) depuis votre espace client.',
      '',
      "Votre abonnement sera activé après vérification de votre justificatif par nos équipes.",
      "Sans règlement de votre part, cette demande expirera automatiquement et devra être recréée.",
    ]),
  };
}

/** 2a. Preuve reçue — confirmation au client. */
export function gabaritPreuveRecueClient(d: DonneesPaiement): GabaritEmail {
  return {
    subject: `Justificatif reçu pour le paiement ${d.reference}`,
    body: corps([
      'Bonjour,',
      '',
      'Nous avons bien reçu votre justificatif de paiement. Il est en cours de vérification.',
      '',
      `Référence : ${d.reference}`,
      `Montant déclaré : ${formaterMontant(d.montant, d.devise)}`,
      lignePlan(d.plan),
      '',
      "Aucune action de votre part n'est nécessaire pour le moment.",
      "Vous recevrez un email dès que la vérification sera terminée. Tant que votre justificatif n'a pas été validé, votre abonnement n'est pas encore activé.",
    ]),
  };
}

/** 2b. Preuve reçue — alerte aux administrateurs, validation requise. */
export function gabaritPreuveRecueAdmin(
  d: DonneesPaiement & { paiementId: string; preuveId: string; referenceTexte?: string | null },
): GabaritEmail {
  return {
    subject: `[Validation requise] Justificatif à vérifier — paiement ${d.reference}`,
    body: corps(
      [
        'Un justificatif de paiement vient d\'être déposé et attend une vérification manuelle.',
        '',
        `Référence du paiement : ${d.reference}`,
        `Montant déclaré : ${formaterMontant(d.montant, d.devise)}`,
        lignePlan(d.plan),
        d.referenceTexte ? `Référence indiquée par le client : ${d.referenceTexte}` : null,
        `Identifiant du justificatif : ${d.preuveId}`,
        '',
        "Rendez-vous dans la console d'administration, rubrique Paiements, pour consulter le justificatif et le valider ou le rejeter.",
        "Rappel : tant que le justificatif n'est pas validé, aucun accès n'est ouvert.",
      ],
      false,
    ),
  };
}

/** 3a. Preuve validée — notification au client. */
export function gabaritPreuveValidee(d: DonneesPaiement): GabaritEmail {
  return {
    subject: `Paiement ${d.reference} validé — votre abonnement est actif`,
    body: corps([
      'Bonjour,',
      '',
      'Votre justificatif a été vérifié et votre paiement est validé. Votre abonnement est désormais actif.',
      '',
      `Référence : ${d.reference}`,
      `Montant validé : ${formaterMontant(d.montant, d.devise)}`,
      lignePlan(d.plan),
      '',
      'Vous pouvez dès à présent accéder à l\'ensemble des fonctionnalités de votre espace.',
      'Merci de votre confiance.',
    ]),
  };
}

/** 3b. Preuve rejetée — notification au client, avec le motif. */
export function gabaritPreuveRejetee(
  d: DonneesPaiement & { motifRejet: string },
): GabaritEmail {
  return {
    subject: `Justificatif non validé pour le paiement ${d.reference}`,
    body: corps([
      'Bonjour,',
      '',
      "Après vérification, le justificatif que vous avez transmis n'a pas pu être validé.",
      '',
      `Référence : ${d.reference}`,
      `Montant attendu : ${formaterMontant(d.montant, d.devise)}`,
      lignePlan(d.plan),
      `Motif du rejet : ${d.motifRejet}`,
      '',
      'Votre demande de paiement reste ouverte : vous pouvez déposer un nouveau justificatif depuis votre espace client.',
      "Si vous pensez qu'il s'agit d'une erreur, répondez à cet email en précisant la référence ci-dessus.",
    ]),
  };
}

/** 4. Paiement confirmé par webhook — activation de l'abonnement. */
export function gabaritPaiementConfirmeWebhook(d: DonneesPaiement): GabaritEmail {
  return {
    subject: `Paiement ${d.reference} confirmé — votre abonnement est activé`,
    body: corps([
      'Bonjour,',
      '',
      'Votre paiement a été confirmé par notre prestataire de paiement. Votre abonnement est activé.',
      '',
      `Référence : ${d.reference}`,
      `Montant encaissé : ${formaterMontant(d.montant, d.devise)}`,
      d.provider ? `Confirmé via : ${d.provider}` : null,
      lignePlan(d.plan),
      '',
      "Aucune action complémentaire n'est requise de votre part.",
      'Merci de votre confiance.',
    ]),
  };
}

// ─── Cycle de vie des licences ───────────────────────────────────────────────

export interface DonneesLicence {
  nomTenant: string;
  plan: string;
}

/** 5. Rappel d'expiration J-7 / J-3 / J-1. */
export function gabaritRappelExpiration(
  d: DonneesLicence & { echeance: Date; joursRestants: number },
): GabaritEmail {
  const jours =
    d.joursRestants <= 1 ? 'demain' : `dans ${d.joursRestants} jours`;
  return {
    subject: `Votre abonnement ${d.plan} expire ${jours}`,
    body: corps([
      `Bonjour ${d.nomTenant},`,
      '',
      `Votre abonnement arrive à échéance ${jours}.`,
      '',
      `Plan : ${d.plan}`,
      `Date d'échéance : ${formaterDate(d.echeance)}`,
      '',
      "Pour éviter toute interruption de service, procédez au renouvellement depuis votre espace client, rubrique Abonnement.",
      "Passée l'échéance, une période de grâce vous sera accordée avant la suspension effective de votre accès.",
    ]),
  };
}

/** 6a. Entrée en période de grâce. */
export function gabaritPeriodeGrace(
  d: DonneesLicence & { echeance: Date; graceJusquA: Date; graceJours: number },
): GabaritEmail {
  return {
    subject: `Abonnement ${d.plan} échu — période de grâce jusqu'au ${formaterDate(d.graceJusquA)}`,
    body: corps([
      `Bonjour ${d.nomTenant},`,
      '',
      "Votre abonnement est arrivé à échéance et n'a pas encore été renouvelé.",
      '',
      `Plan : ${d.plan}`,
      `Échéance dépassée le : ${formaterDate(d.echeance)}`,
      `Période de grâce de ${d.graceJours} jour(s), jusqu'au ${formaterDate(d.graceJusquA)}`,
      '',
      "Votre accès reste ouvert pendant cette période. Au-delà, il sera suspendu jusqu'au règlement.",
      'Renouvelez dès maintenant depuis votre espace client, rubrique Abonnement.',
    ]),
  };
}

/** 6b. Expiration effective : accès suspendu. */
export function gabaritLicenceExpiree(
  d: DonneesLicence & { expireeAt: Date },
): GabaritEmail {
  return {
    subject: `Abonnement ${d.plan} expiré — accès suspendu`,
    body: corps([
      `Bonjour ${d.nomTenant},`,
      '',
      "La période de grâce est écoulée et votre abonnement n'a pas été renouvelé. Votre accès est désormais suspendu.",
      '',
      `Plan : ${d.plan}`,
      `Suspension effective le : ${formaterDate(d.expireeAt)}`,
      '',
      'Vos données sont conservées. Le renouvellement de votre abonnement rétablira immédiatement votre accès.',
      'Rendez-vous dans votre espace client, rubrique Abonnement, ou répondez à cet email pour être accompagné.',
    ]),
  };
}
