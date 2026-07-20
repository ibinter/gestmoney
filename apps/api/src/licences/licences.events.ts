/**
 * Contrat d'événements du cycle de vie des licences.
 *
 * `RAPPEL_EXPIRATION` est publié par LicencesScheduler (rappels J-7 / J-3 /
 * J-1) ; `PERIODE_GRACE` et `EXPIREE` sont publiés par LicencesService au
 * moment des transitions correspondantes.
 */

export const LICENCE_EVENTS = {
  RAPPEL_EXPIRATION: 'licence.rappel-expiration',
  PERIODE_GRACE: 'licence.periode-grace',
  EXPIREE: 'licence.expiree',
} as const;

/** Charge utile émise par LicencesScheduler.envoyerRappelsExpiration(). */
export interface LicenceRappelExpirationEvent {
  tenantId: string;
  nomTenant: string;
  plan: string;
  echeance: Date;
  joursRestants: number;
}

/** Entrée en période de grâce après échéance. */
export interface LicencePeriodeGraceEvent {
  tenantId: string;
  nomTenant: string;
  plan: string;
  /** Échéance dépassée qui a déclenché la grâce. */
  echeance: Date;
  /** Date de fin de la période de grâce. */
  graceJusquA: Date;
  graceJours: number;
}

/** Expiration effective : l'accès est coupé. */
export interface LicenceExpireeEvent {
  tenantId: string;
  nomTenant: string;
  plan: string;
  expireeAt: Date;
}
