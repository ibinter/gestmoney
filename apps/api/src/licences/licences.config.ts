import { registerAs } from '@nestjs/config';

/**
 * Durées et plafonds du cycle de vie des licences.
 *
 * SOURCE UNIQUE des valeurs de licence : `essaiJours`, `graceJours`,
 * `provisoireMaxJours`, `paiementExpirationHeures`, `rappelsJours` ET les
 * `plafondsDecouverte` (agences / agents / transactionsMois) sont définis ICI
 * et NULLE PART ailleurs. Aucun nombre magique ne doit être écrit dans
 * LicencesService, LicencesScheduler ni ailleurs dans le module — tout se lit
 * depuis cette configuration. Chaque valeur est surchargeable par variable
 * d'environnement.
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
  /**
   * Plafonds du palier gratuit « Découverte » (FREE).
   *
   * Vérifiés CÔTÉ SERVEUR à l'écriture (jamais à l'affichage). Ce sont les
   * seules barrières qui empêchent le palier gratuit de remplacer la formule
   * d'entrée : un agent traite 30 à 100 opérations par jour, donc c'est le
   * plafond de transactions mensuelles qui protège réellement le modèle.
   * Valeurs GESTMONEY (cf. cahier IBIG §6) : 1 agence, 1 agent, 25 tx/mois.
   */
  plafondsDecouverte: {
    /** Nombre maximum d'agences (cumulatif). */
    agences: number;
    /** Nombre maximum d'agents (cumulatif). */
    agents: number;
    /** Nombre maximum de transactions par mois calendaire. */
    transactionsMois: number;
  };
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
    plafondsDecouverte: {
      agences: entier(process.env.LICENCE_FREE_MAX_AGENCES, 1),
      agents: entier(process.env.LICENCE_FREE_MAX_AGENTS, 1),
      transactionsMois: entier(process.env.LICENCE_FREE_MAX_TX_MOIS, 25),
    },
  }),
);
