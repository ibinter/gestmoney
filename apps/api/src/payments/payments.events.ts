/**
 * Contrat d'événements du module de paiement.
 *
 * Les services de paiement publient ces événements sur le bus applicatif
 * (`EventEmitter2`). Ils sont volontairement DESCRIPTIFS et ne portent aucun
 * secret : ni clé d'API, ni jeton, ni coordonnées bancaires complètes. Les
 * abonnés (module notifications) ne doivent avoir besoin de rien d'autre.
 *
 * Publier un événement ne doit jamais faire échouer l'opération métier :
 * `EventEmitter2` est synchrone par défaut, les abonnés sont donc responsables
 * d'attraper leurs propres erreurs (voir PaymentNotificationsListener).
 */

export const PAYMENT_EVENTS = {
  /** Paiement créé, en attente du règlement et de sa preuve. */
  CREE: 'paiement.cree',
  /** Une preuve de paiement vient d'être téléversée par le client. */
  PREUVE_RECUE: 'paiement.preuve-recue',
  /** Un administrateur a validé la preuve : le paiement est activé. */
  PREUVE_VALIDEE: 'paiement.preuve-validee',
  /** Un administrateur a rejeté la preuve : le client doit en soumettre une autre. */
  PREUVE_REJETEE: 'paiement.preuve-rejetee',
  /** Le paiement a été confirmé par un webhook signé de la passerelle. */
  CONFIRME_WEBHOOK: 'paiement.confirme-webhook',
} as const;

/** Champs communs à tous les événements de paiement. */
export interface EvenementPaiementBase {
  paiementId: string;
  tenantId: string | null;
  reference: string;
  montant: number;
  devise: string;
  /** Identifiant de l'utilisateur à l'origine du paiement, s'il est connu. */
  userId?: string | null;
  /** Plan d'abonnement visé, s'il a été précisé à la création. */
  plan?: string | null;
}

export interface PaiementCreeEvent extends EvenementPaiementBase {
  provider: string;
}

export interface PreuveRecueEvent extends EvenementPaiementBase {
  preuveId: string;
  /** Référence saisie par le client (texte libre), jamais un numéro de compte. */
  referenceTexte?: string | null;
}

export interface PreuveValideeEvent extends EvenementPaiementBase {
  preuveId: string;
  valideeAt: Date;
}

export interface PreuveRejeteeEvent extends EvenementPaiementBase {
  preuveId: string;
  motifRejet: string;
  rejeteeAt: Date;
}

export interface PaiementConfirmeWebhookEvent extends EvenementPaiementBase {
  provider: string;
  confirmeAt: Date;
}
