import { registerAs } from '@nestjs/config';

/**
 * Durées du cycle de vie des licences.
 *
 * TOUTES les durées manipulées par LicencesService et LicencesScheduler
 * viennent d'ici : aucun nombre magique ne doit être écrit ailleurs dans le
 * module. Chaque valeur est surchargeable par variable d'environnement.
 */
export interface LicencesConfig {
  /** Durée de la période d'essai, en jours. */
  essaiJours: number;
  /** Durée de la période de grâce accordée après expiration, en jours. */
  graceJours: number;
  /** Plafond réglementaire d'une licence provisoire, en jours. */
  provisoireMaxJours: number;
  /** Délai au-delà duquel un paiement non réglé est considéré expiré, en heures. */
  paiementExpirationHeures: number;
  /** Jours avant échéance déclenchant un rappel (décroissants). */
  rappelsJours: number[];
}

/** Analyse « 7,3,1 » → [7, 3, 1], en éliminant les valeurs non numériques. */
function parseRappels(brut: string | undefined, defaut: number[]): number[] {
  if (!brut) return defaut;
  const valeurs = brut
    .split(',')
    .map((v) => parseInt(v.trim(), 10))
    .filter((v) => Number.isInteger(v) && v > 0);
  return valeurs.length > 0 ? [...new Set(valeurs)].sort((a, b) => b - a) : defaut;
}

function entier(brut: string | undefined, defaut: number): number {
  const valeur = parseInt(brut ?? '', 10);
  return Number.isInteger(valeur) && valeur > 0 ? valeur : defaut;
}

export const LICENCES_CONFIG_KEY = 'licences';

export default registerAs(
  LICENCES_CONFIG_KEY,
  (): LicencesConfig => ({
    essaiJours: entier(process.env.LICENCE_ESSAI_JOURS, 14),
    graceJours: entier(process.env.LICENCE_GRACE_JOURS, 7),
    provisoireMaxJours: entier(process.env.LICENCE_PROVISOIRE_MAX_JOURS, 14),
    paiementExpirationHeures: entier(process.env.LICENCE_PAIEMENT_EXPIRATION_HEURES, 48),
    rappelsJours: parseRappels(process.env.LICENCE_RAPPELS_JOURS, [7, 3, 1]),
  }),
);
