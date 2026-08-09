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
import { useStatutLicence, useQuotas, EtatQuota } from '@/hooks/useLicence';
import { useT } from '@/lib/i18n';

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
  const t = useT();
  const { data } = useStatutLicence();
  // Chargé en permanence mais n'affiche des compteurs qu'au palier Découverte.
  const { data: quotas } = useQuotas();

  // Pas de donnée (chargement, erreur, utilisateur non authentifié) : on
  // n'affiche rien plutôt qu'un bandeau alarmiste ou un espace vide.
  if (!data) return null;

  const jours = data.joursRestants;

  // DÉMO : environnement de démonstration publique. Bandeau PERMANENT et
  // purement informatif (bleu, ni alarmiste ni promotionnel) prévenant que les
  // données sont fictives et remises à zéro chaque nuit (cahier §8.4).
  if (data.statut === 'DEMO') {
    return (
      <div
        className="gm-alert-banner"
        role="status"
        style={{
          background: '#EFF6FF',
          borderColor: '#3b82f655',
        }}
      >
        <span className="gm-alert-icon" aria-hidden="true">
          🧪
        </span>

        <div className="gm-alert-content">
          <div className="gm-alert-title" style={{ color: '#1e40af' }}>
            Démonstration publique
          </div>
          <div className="gm-alert-desc" style={{ color: '#1e40af' }}>
            Les données sont fictives et effacées chaque nuit.
          </div>
        </div>

        <div className="gm-alert-actions">
          <Link
            href="/register"
            className="gm-btn gm-btn-sm"
            style={{ color: '#1e40af' }}
          >
            Créer mon espace
          </Link>
        </div>
      </div>
    );
  }

  // DÉCOUVERTE : palier gratuit. Bandeau INFORMATIF (non alarmiste) rappelant
  // les plafonds et invitant à passer sur une formule payante (cahier §8.4).
  if (data.statut === 'DECOUVERTE') {
    return <BandeauDecouverte quotas={quotas} t={t} />;
  }

  // GRACE : l'échéance est DÉPASSÉE, l'accès n'est maintenu que le temps de
  // renouveler. C'est le cas le plus urgent qui reste non bloquant.
  const enGrace = data.statut === 'GRACE';
  // ESSAI : on n'alerte qu'à l'approche du terme, pour ne pas harceler dès le
  // premier jour d'une période de quatorze jours.
  const essaiFinissant =
    data.statut === 'ESSAI' && jours !== null && jours <= SEUIL_ESSAI_JOURS;

  if (!enGrace && !essaiFinissant) return null;

  const titre = enGrace
    ? t.licence.banniere.grace.titre
    : t.licence.banniere.essai.titre;

  const description = enGrace
    ? t.licence.banniere.grace.desc.replace('{duree}', formatJours(jours))
    : t.licence.banniere.essai.desc.replace('{jours}', String(jours ?? 0));

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
          {t.common.renew}
        </Link>
      </div>
    </div>
  );
}

/**
 * Bandeau informatif du palier gratuit « Découverte » : rappelle les plafonds
 * et affiche les compteurs d'usage. Volontairement discret (vert, pas rouge) —
 * l'accès n'est pas menacé, seule la limite de volume s'applique.
 */
function BandeauDecouverte({
  quotas,
  t,
}: {
  quotas?: EtatQuota[];
  t: ReturnType<typeof useT>;
}) {
  const compteurs = (quotas ?? []).filter((q) => Number.isFinite(q.plafond));

  return (
    <div
      className="gm-alert-banner"
      role="status"
      style={{
        background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)',
        borderColor: 'rgba(22,163,74,0.30)',
      }}
    >
      <span className="gm-alert-icon" aria-hidden="true">
        🎁
      </span>

      <div className="gm-alert-content">
        <div className="gm-alert-title" style={{ color: '#15803d' }}>
          {t.licence.banniere.decouverte.titre}
        </div>
        <div className="gm-alert-desc" style={{ color: '#166534' }}>
          {t.licence.banniere.decouverte.desc}
          {compteurs.length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                flexWrap: 'wrap',
                gap: '6px 14px',
                marginTop: 6,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {compteurs.map((q) => {
                const atteint = q.valeur >= q.plafond;
                return (
                  <span
                    key={q.compteur}
                    style={{
                      fontWeight: 700,
                      color: atteint ? 'var(--gm-danger, #dc2626)' : '#166534',
                    }}
                  >
                    {t.licence.compteur[q.compteur]} : {q.valeur}/{q.plafond}
                  </span>
                );
              })}
            </span>
          )}
        </div>
      </div>

      <div className="gm-alert-actions">
        <Link href={URL_ABONNEMENT} className="gm-btn gm-btn-primary gm-btn-sm">
          {t.licence.banniere.decouverte.cta}
        </Link>
      </div>
    </div>
  );
}

export default BandeauLicence;
