'use client';

import React from 'react';

const VERT = '#009E00';
const OR = '#FFD000';
const FOND = '#0a2e15';

const AVANTAGES = [
  {
    emoji: '🌍',
    titre: 'Conçu pour l\'Afrique',
    description: 'Adapté aux opérateurs locaux, conformité OHADA, devises FCFA',
  },
  {
    emoji: '🚀',
    titre: 'Déploiement immédiat',
    description: 'Accessible depuis un navigateur, aucune installation complexe',
  },
  {
    emoji: '🤖',
    titre: 'Intelligence artificielle',
    description: 'SARA intégrée pour former et assister vos équipes',
  },
  {
    emoji: '🔄',
    titre: 'Mises à jour automatiques',
    description: 'Le logiciel évolue sans interruption de service',
  },
  {
    emoji: '👨‍💼',
    titre: 'Accompagnement dédié',
    description: 'Support IBIG Soft, formation, documentation complète',
  },
  {
    emoji: '🔐',
    titre: 'Sécurité de niveau entreprise',
    description: 'Chiffrement, rôles, audit, sauvegarde cloud',
  },
];

export function AvantagesIBIGSection() {
  return (
    <section
      style={{
        padding: 'clamp(48px,8vh,80px) clamp(16px,5vw,48px)',
        background: FOND,
        color: '#fff',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(32px,5vh,56px)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: OR, marginBottom: 10 }}>
            Notre différence
          </p>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#fff', margin: '0 0 14px', lineHeight: 1.2 }}>
            Pourquoi choisir une solution IBIG Soft&nbsp;?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: '60ch', margin: '0 auto', lineHeight: 1.65 }}>
            IBIG Soft est un éditeur de logiciels africain engagé à fournir des solutions robustes, adaptées aux réalités du terrain et portées par une équipe dédiée.
          </p>
        </div>

        <div className="gm-avt-grid">
          {AVANTAGES.map((a) => (
            <article key={a.titre} className="gm-avt-card">
              <span className="gm-avt-emoji" aria-hidden>{a.emoji}</span>
              <h3 className="gm-avt-titre">{a.titre}</h3>
              <p className="gm-avt-desc">{a.description}</p>
            </article>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 'clamp(32px,5vh,52px)' }}>
          <a
            href="https://ibigsoft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="gm-avt-cta"
          >
            Découvrir IBIG Soft <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <style>{`
        .gm-avt-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 2vw, 24px);
        }
        .gm-avt-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: clamp(20px, 3vw, 30px);
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: background .2s ease, border-color .2s ease, transform .2s ease;
        }
        .gm-avt-card:hover {
          background: rgba(0,158,0,0.12);
          border-color: rgba(0,158,0,0.4);
          transform: translateY(-3px);
        }
        .gm-avt-emoji {
          font-size: 28px;
          line-height: 1;
          display: block;
        }
        .gm-avt-titre {
          font-size: 15.5px;
          font-weight: 700;
          color: #fff;
          margin: 4px 0 0;
          line-height: 1.3;
        }
        .gm-avt-desc {
          font-size: 13.5px;
          color: rgba(255,255,255,0.6);
          margin: 0;
          line-height: 1.65;
        }
        .gm-avt-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: ${OR};
          color: #0a2e15;
          font-size: 14px;
          font-weight: 700;
          padding: 13px 28px;
          border-radius: 8px;
          text-decoration: none;
          transition: background .15s ease, transform .15s ease;
        }
        .gm-avt-cta:hover { background: #e6bc00; transform: translateY(-2px); }
        .gm-avt-cta:focus-visible { outline: 2px solid ${OR}; outline-offset: 4px; border-radius: 8px; }

        @media (max-width: 900px) {
          .gm-avt-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .gm-avt-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
