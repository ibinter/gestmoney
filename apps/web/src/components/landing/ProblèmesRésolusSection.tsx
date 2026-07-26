'use client';

import React from 'react';

const VERT = '#009E00';
const OR = '#FFD000';
const FOND = '#0a2e15';

const PAIRES = [
  {
    avant: 'Fichiers Excel séparés pour chaque agence',
    apres: 'Toutes les agences centralisées en temps réel',
  },
  {
    avant: 'Calcul manuel des commissions — erreurs fréquentes',
    apres: 'Commissions calculées et versées automatiquement',
  },
  {
    avant: 'Aucune visibilité sur les flottes des agents',
    apres: 'Niveau de flotte de chaque agent visible en un clic',
  },
  {
    avant: 'Rapports de fin de journée laborieux',
    apres: 'Rapports générés instantanément, exportables en PDF/Excel',
  },
  {
    avant: 'Impossible de détecter les fraudes à temps',
    apres: "Alertes en temps réel, journal d'audit complet",
  },
];

export function ProblèmesRésolusSection() {
  return (
    <section className="gm-prob-section">
      <div className="gm-prob-inner">
        <div className="gm-prob-header">
          <h2 className="gm-prob-titre">
            Les défis du réseau Mobile Money,{' '}
            <span style={{ color: VERT }}>résolus</span>
          </h2>
          <p className="gm-prob-sous-titre">
            GESTMONEY transforme les points de friction en avantages compétitifs.
          </p>
        </div>

        {/* En-têtes de colonnes — masqués sur mobile */}
        <div className="gm-prob-col-headers" aria-hidden="true">
          <div className="gm-prob-col-label gm-prob-col-label--avant">
            <span className="gm-prob-icon-x" aria-hidden="true">✗</span>
            Avant
          </div>
          <div style={{ width: 36 }} />
          <div className="gm-prob-col-label gm-prob-col-label--apres">
            <span className="gm-prob-icon-check" aria-hidden="true">✓</span>
            Avec GESTMONEY
          </div>
        </div>

        {/* Paires */}
        <ul className="gm-prob-liste" role="list">
          {PAIRES.map((p, i) => (
            <li key={i} className="gm-prob-paire">
              {/* Colonne AVANT */}
              <div className="gm-prob-card gm-prob-card--avant">
                <span className="gm-prob-icon-x gm-prob-card-icone" aria-hidden="true">✗</span>
                <span>{p.avant}</span>
              </div>

              {/* Flèche */}
              <div className="gm-prob-fleche" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="14" cy="14" r="14" fill={VERT} fillOpacity="0.12" />
                  {/* Flèche droite sur desktop, bas sur mobile (géré via CSS transform) */}
                  <path
                    d="M9 14h10M15 10l4 4-4 4"
                    stroke={VERT}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="gm-prob-fleche-path"
                  />
                </svg>
              </div>

              {/* Colonne APRÈS */}
              <div className="gm-prob-card gm-prob-card--apres">
                <span className="gm-prob-icon-check gm-prob-card-icone" aria-hidden="true">✓</span>
                <span>{p.apres}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .gm-prob-section {
          background: #fff;
          padding: clamp(48px, 7vh, 88px) clamp(16px, 4vw, 48px);
        }

        .gm-prob-inner {
          max-width: 960px;
          margin: 0 auto;
        }

        .gm-prob-header {
          text-align: center;
          margin-bottom: clamp(28px, 4vh, 48px);
        }

        .gm-prob-titre {
          font-size: clamp(1.5rem, 3.5vw, 2.25rem);
          font-weight: 800;
          color: ${FOND};
          margin: 0 0 12px;
          line-height: 1.2;
        }

        .gm-prob-sous-titre {
          font-size: clamp(0.95rem, 1.8vw, 1.1rem);
          color: #4b5563;
          margin: 0;
          max-width: 56ch;
          margin-inline: auto;
          line-height: 1.55;
        }

        /* En-têtes colonnes */
        .gm-prob-col-headers {
          display: grid;
          grid-template-columns: 1fr 36px 1fr;
          gap: 0 12px;
          margin-bottom: 12px;
        }

        .gm-prob-col-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          padding: 0 16px;
        }

        .gm-prob-col-label--avant { color: #b91c1c; }
        .gm-prob-col-label--apres { color: ${VERT}; }

        /* Liste */
        .gm-prob-liste {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Paire = grille 2 colonnes + flèche centrale */
        .gm-prob-paire {
          display: grid;
          grid-template-columns: 1fr 36px 1fr;
          gap: 0 12px;
          align-items: center;
        }

        /* Cartes */
        .gm-prob-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 10px;
          font-size: clamp(0.875rem, 1.5vw, 0.9375rem);
          line-height: 1.5;
          min-height: 60px;
        }

        .gm-prob-card--avant {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #7f1d1d;
        }

        .gm-prob-card--apres {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #14532d;
        }

        .gm-prob-card-icone {
          flex-shrink: 0;
          font-size: 1rem;
          margin-top: 2px;
        }

        .gm-prob-icon-x     { color: #dc2626; }
        .gm-prob-icon-check { color: ${VERT}; }

        /* Flèche centrale */
        .gm-prob-fleche {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* ── Mobile ── */
        @media (max-width: 600px) {
          .gm-prob-col-headers { display: none; }

          .gm-prob-paire {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
            gap: 6px 0;
          }

          /* Flèche : pointe vers le bas */
          .gm-prob-fleche {
            justify-content: center;
          }

          .gm-prob-fleche-path {
            /* Rotation 90° via CSS : flèche droite → flèche bas */
            transform-origin: 14px 14px;
            transform: rotate(90deg);
          }
        }
      `}</style>
    </section>
  );
}
