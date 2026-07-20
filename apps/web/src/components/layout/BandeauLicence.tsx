'use client';
// ============================================================
// BANDEAU LICENCE — GESTMONEY
// Avertissement NON bloquant affiché en tête du dashboard quand
// l'abonnement approche de son terme.
//
// Ce bandeau ne remplace PAS le contrôle d'accès : celui-ci est
// appliqué côté API par `LicenceGuard`, qui répond 402 dès que la
// licence n'ouvre plus l'accès. Ici on prévient AVANT la coupure,
// pendant que l'accès est encore ouvert (ESSAI, GRACE) — d'où le
// caractère volontairement non bloquant.
// ============================================================
import React from 'react';
import Link from 'next/link';
import { useStatutLicence } from '@/hooks/useLicence';

/** En dessous de ce seuil, un essai qui court est signalé. */
const SEUIL_ESSAI_JOURS = 7;

const URL_ABONNEMENT = '/dashboard/abonnement';

function formatJours(jours: number | null): string {
  if (jours === null) return 'bientôt';
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return 'demain';
  return `dans ${jours} jours`;
}

export function BandeauLicence() {
  const { data } = useStatutLicence();

  // Pas de donnée (chargement, erreur, utilisateur non authentifié) : on
  // n'affiche rien plutôt qu'un bandeau alarmiste ou un espace vide.
  if (!data) return null;

  const jours = data.joursRestants;

  // GRACE : l'échéance est DÉPASSÉE, l'accès n'est maintenu que le temps de
  // renouveler. C'est le cas le plus urgent qui reste non bloquant.
  const enGrace = data.statut === 'GRACE';
  // ESSAI : on n'alerte qu'à l'approche du terme, pour ne pas harceler dès le
  // premier jour d'une période de quatorze jours.
  const essaiFinissant =
    data.statut === 'ESSAI' && jours !== null && jours <= SEUIL_ESSAI_JOURS;

  if (!enGrace && !essaiFinissant) return null;

  const titre = enGrace
    ? 'Votre abonnement a expiré — période de grâce en cours'
    : "Votre période d'essai se termine bientôt";

  const description = enGrace
    ? `L'accès reste ouvert ${formatJours(jours)}, le temps de renouveler. Passé ce délai, l'application sera bloquée.`
    : `Il vous reste ${jours} jour${(jours ?? 0) > 1 ? 's' : ''} d'essai. Souscrivez un abonnement pour ne pas perdre l'accès.`;

  return (
    <div
      className="gm-alert-banner"
      role="status"
      // Le bandeau `gm-alert-banner` est rouge par défaut (incident). Ici il
      // s'agit d'un avertissement, pas d'une panne : on le reteinte avec la
      // couleur d'avertissement du design system (--gm-warning), sans inventer
      // de nouvelle classe.
      style={{
        background: 'linear-gradient(135deg, #FFFBEB, #FEF6E0)',
        borderColor: 'rgba(245,158,11,0.35)',
      }}
    >
      <span className="gm-alert-icon" aria-hidden="true">
        ⏳
      </span>

      <div className="gm-alert-content">
        <div className="gm-alert-title" style={{ color: 'var(--gm-warning)' }}>
          {titre}
        </div>
        <div className="gm-alert-desc" style={{ color: '#78350f' }}>
          {description}
        </div>
      </div>

      <div className="gm-alert-actions">
        <Link href={URL_ABONNEMENT} className="gm-btn gm-btn-primary gm-btn-sm">
          Renouveler
        </Link>
      </div>
    </div>
  );
}

export default BandeauLicence;
