'use client';

import React from 'react';

const VERT = '#009E00';
const OR = '#FFD000';
const FOND = '#0a2e15';

const BENEFICES = [
  {
    emoji: '⚡',
    titre: 'Gain de temps',
    description: 'Automatisation des tâches répétitives',
  },
  {
    emoji: '🎯',
    titre: 'Zéro erreur',
    description: 'Calculs validés automatiquement',
  },
  {
    emoji: '📊',
    titre: 'Visibilité totale',
    description: 'Tableaux de bord en temps réel',
  },
  {
    emoji: '🔒',
    titre: 'Sécurité renforcée',
    description: "Accès par rôle, journal d'audit",
  },
  {
    emoji: '📱',
    titre: 'Partout, tout le temps',
    description: 'Web + mobile + PWA',
  },
  {
    emoji: '🤝',
    titre: 'Collaboration',
    description: 'Équipes synchronisées instantanément',
  },
  {
    emoji: '📈',
    titre: 'Décisions éclairées',
    description: 'Rapports et analyses intégrés',
  },
  {
    emoji: '💰',
    titre: 'Maîtrise des coûts',
    description: 'Commissions et marges contrôlées',
  },
  {
    emoji: '🌍',
    titre: 'Conforme OHADA',
    description: 'Adapté aux réalités africaines',
  },
];

export function BénéficesMajeursSection() {
  return (
    <section className="gm-ben-section">
      <div className="gm-ben-inner">
        <div className="gm-ben-header">
          <h2 className="gm-ben-titre">
            Pourquoi les réseaux Mobile Money choisissent{' '}
            <span style={{ color: VERT }}>GESTMONEY</span>
          </h2>
        </div>

        <ul className="gm-ben-grille" role="list">
          {BENEFICES.map((b, i) => (
            <li key={i} className="gm-ben-carte">
              <div className="gm-ben-emoji" aria-hidden="true">{b.emoji}</div>
              <div>
                <p className="gm-ben-card-titre">{b.titre}</p>
                <p className="gm-ben-card-desc">{b.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .gm-ben-section {
          background: #f0fdf4;
          padding: clamp(48px, 7vh, 88px) clamp(16px, 4vw, 48px);
        }

        .gm-ben-inner {
          max-width: 1080px;
          margin: 0 auto;
        }

        .gm-ben-header {
          text-align: center;
          margin-bottom: clamp(28px, 4vh, 52px);
        }

        .gm-ben-titre {
          font-size: clamp(1.5rem, 3.5vw, 2.25rem);
          font-weight: 800;
          color: ${FOND};
          margin: 0;
          line-height: 1.2;
          max-width: 22ch;
          margin-inline: auto;
        }

        /* Grille 3×3 desktop */
        .gm-ben-grille {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        /* Carte individuelle */
        .gm-ben-carte {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: #fff;
          border: 1px solid #d1fae5;
          border-radius: 14px;
          padding: 20px 18px;
          transition: box-shadow .2s ease, border-color .2s ease, transform .2s ease;
          cursor: default;
        }

        .gm-ben-carte:hover {
          box-shadow: 0 6px 24px rgba(0,158,0,.10);
          border-color: ${VERT};
          transform: translateY(-2px);
        }

        .gm-ben-emoji {
          font-size: 2rem;
          line-height: 1;
          flex-shrink: 0;
          /* Cercle leger autour de l'emoji */
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #f0fdf4;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #bbf7d0;
        }

        .gm-ben-card-titre {
          font-size: 0.9375rem;
          font-weight: 700;
          color: ${FOND};
          margin: 0 0 4px;
          line-height: 1.3;
        }

        .gm-ben-card-desc {
          font-size: 0.8125rem;
          color: #4b5563;
          margin: 0;
          line-height: 1.45;
        }

        /* Tablette : 2 colonnes */
        @media (max-width: 900px) {
          .gm-ben-grille {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Mobile : 1 colonne */
        @media (max-width: 540px) {
          .gm-ben-grille {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .gm-ben-carte {
            padding: 16px 14px;
          }
        }
      `}</style>
    </section>
  );
}
