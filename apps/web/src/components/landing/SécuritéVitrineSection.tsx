'use client';

import React from 'react';

const VERT = '#009E00';

interface PointSécurité {
  icone: string;
  titre: string;
  description: string;
}

const POINTS: PointSécurité[] = [
  {
    icone: '🔐',
    titre: 'Authentification sécurisée',
    description:
      'Les mots de passe sont chiffrés avec bcrypt. Les sessions reposent sur des tokens JWT à durée limitée, jamais stockés en clair.',
  },
  {
    icone: '👥',
    titre: 'Gestion des rôles',
    description:
      'Chaque utilisateur accède uniquement aux données et fonctions correspondant à son rôle (admin, superviseur, agent…). Aucun accès croisé.',
  },
  {
    icone: '📋',
    titre: "Journal d'audit complet",
    description:
      'Chaque action est enregistrée : qui a fait quoi, à quelle heure, et quelle était la valeur avant et après la modification.',
  },
  {
    icone: '💾',
    titre: 'Sauvegarde régulière',
    description:
      'Les données sont sauvegardées périodiquement sur notre infrastructure. Une restauration peut être demandée à notre équipe support.',
  },
  {
    icone: '🌐',
    titre: 'Connexion chiffrée',
    description:
      'Toutes les communications passent par HTTPS. Les en-têtes de sécurité HTTP (CSP, HSTS, X-Frame-Options) sont activés sur chaque réponse.',
  },
  {
    icone: '🏢',
    titre: 'Séparation des données',
    description:
      "GESTMONEY est une architecture multi-tenant : les données de chaque réseau sont isolées. Un tenant ne peut pas accéder aux données d'un autre.",
  },
];

export function SécuritéVitrineSection() {
  return (
    <section
      id="securite"
      style={{
        background: '#f8fafc',
        padding: 'clamp(48px,8vh,96px) clamp(16px,4vw,48px)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: VERT,
              margin: '0 0 12px',
            }}
          >
            Sécurité & protection des données
          </p>
          <h2
            style={{
              fontSize: 'clamp(24px,3vw,36px)',
              fontWeight: 800,
              color: '#111827',
              margin: '0 0 16px',
              lineHeight: 1.25,
            }}
          >
            Vos données sont protégées,{' '}
            <span style={{ color: VERT }}>sans exagération</span>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: '#6b7280',
              maxWidth: '60ch',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Nous décrivons ici ce que nous faisons réellement, sans certifications
            inventées ni promesses non tenues. Ce sont les mesures concrètes en
            place aujourd'hui.
          </p>
        </div>

        {/* Grille des 6 points */}
        <div className="gm-secu-grid">
          {POINTS.map((p) => (
            <div
              key={p.titre}
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                padding: '28px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,.05)',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#f0fdf4',
                  border: `1.5px solid #bbf7d0`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {p.icone}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1.3,
                }}
              >
                {p.titre}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: '#4b5563',
                  lineHeight: 1.7,
                }}
              >
                {p.description}
              </p>
            </div>
          ))}
        </div>

        {/* Note de transparence */}
        <div
          style={{
            marginTop: 48,
            padding: '20px 28px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderLeft: `4px solid ${VERT}`,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: 13.5, color: '#374151', lineHeight: 1.7 }}>
            <strong style={{ color: '#111827' }}>Notre engagement de transparence :</strong>{' '}
            nous ne revendiquons aucune certification (ISO 27001, SOC 2, PCI DSS…) que nous
            n'avons pas encore obtenue. Si votre activité exige des certifications spécifiques,
            contactez notre équipe pour discuter de vos contraintes réglementaires.
          </p>
        </div>
      </div>

      <style>{`
        .gm-secu-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) {
          .gm-secu-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .gm-secu-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
