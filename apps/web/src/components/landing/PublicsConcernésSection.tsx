'use client';

import React from 'react';

const VERT = '#009E00';
const OR = '#FFD000';

const PROFILS = [
  {
    titre: 'Opérateurs Mobile Money',
    description: 'Gérez votre réseau complet depuis un seul tableau de bord',
    icone: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={36} height={36} aria-hidden>
        <rect x="4" y="8" width="32" height="24" rx="3" stroke={VERT} strokeWidth="2" fill="none"/>
        <path d="M4 14h32" stroke={VERT} strokeWidth="2"/>
        <circle cx="10" cy="11" r="1.5" fill={VERT}/>
        <circle cx="15" cy="11" r="1.5" fill={OR}/>
        <circle cx="20" cy="11" r="1.5" fill={VERT}/>
        <path d="M10 20h6M10 25h10M22 20h8M22 25h5" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    titre: 'Directeurs d\'agences',
    description: 'Suivez les performances, flottes et agents en temps réel',
    icone: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={36} height={36} aria-hidden>
        <path d="M8 30V18l12-10 12 10v12H24v-8h-8v8H8z" stroke={VERT} strokeWidth="2" fill="none" strokeLinejoin="round"/>
        <rect x="17" y="22" width="6" height="8" stroke={VERT} strokeWidth="1.5" fill="none"/>
        <path d="M4 30h32" stroke={OR} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    titre: 'Agents de terrain',
    description: 'Interface simple et rapide, même depuis un smartphone',
    icone: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={36} height={36} aria-hidden>
        <rect x="13" y="4" width="14" height="24" rx="3" stroke={VERT} strokeWidth="2" fill="none"/>
        <circle cx="20" cy="24" r="1.5" fill={OR}/>
        <path d="M16 8h8M16 12h5" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 32c0-4 5-6 12-6s12 2 12 6" stroke={VERT} strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  {
    titre: 'Responsables financiers',
    description: 'Commissions, comptabilité, rapports en quelques clics',
    icone: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={36} height={36} aria-hidden>
        <rect x="6" y="6" width="28" height="28" rx="2" stroke={VERT} strokeWidth="2" fill="none"/>
        <path d="M12 28l6-8 5 5 5-10" stroke={OR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="28" cy="15" r="2" fill={VERT}/>
      </svg>
    ),
  },
  {
    titre: 'Auditeurs et contrôleurs',
    description: 'Journal complet, traçabilité de chaque transaction',
    icone: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={36} height={36} aria-hidden>
        <path d="M10 6h14l8 8v20H10V6z" stroke={VERT} strokeWidth="2" fill="none" strokeLinejoin="round"/>
        <path d="M24 6v8h8" stroke={VERT} strokeWidth="2" fill="none"/>
        <path d="M14 18h12M14 22h12M14 26h8" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="29" cy="29" r="5" fill="white" stroke={OR} strokeWidth="2"/>
        <path d="M27 29l1.5 1.5L31 27" stroke={OR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    titre: 'DSI et équipes IT',
    description: 'API ouverte, webhooks, rôles granulaires, logs complets',
    icone: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={36} height={36} aria-hidden>
        <rect x="6" y="10" width="28" height="18" rx="2" stroke={VERT} strokeWidth="2" fill="none"/>
        <path d="M14 30h12M20 28v2" stroke={VERT} strokeWidth="2" strokeLinecap="round"/>
        <path d="M13 19l3-3-3-3M18 22h6" stroke={OR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export function PublicsConcernésSection() {
  return (
    <section
      style={{
        padding: 'clamp(48px,8vh,80px) clamp(16px,5vw,48px)',
        background: '#fff',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(32px,5vh,56px)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: VERT, marginBottom: 10 }}>
            Pour qui ?
          </p>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#0a2e15', margin: '0 0 14px', lineHeight: 1.2 }}>
            GESTMONEY s&rsquo;adapte à tous les acteurs<br />du Mobile Money
          </h2>
          <p style={{ fontSize: 15, color: '#555', maxWidth: '60ch', margin: '0 auto', lineHeight: 1.65 }}>
            Qu&rsquo;il s&rsquo;agisse d&rsquo;une grande enseigne ou d&rsquo;une agence indépendante, chaque profil dispose de ses propres outils et accès.
          </p>
        </div>

        <div className="gm-pub-grid">
          {PROFILS.map((p) => (
            <article key={p.titre} className="gm-pub-card">
              <div className="gm-pub-icone">{p.icone}</div>
              <h3 className="gm-pub-titre">{p.titre}</h3>
              <p className="gm-pub-desc">{p.description}</p>
              <a href="#fonctionnalites" className="gm-pub-lien">
                En savoir plus <span aria-hidden>→</span>
              </a>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .gm-pub-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(16px, 2.5vw, 28px);
        }
        .gm-pub-card {
          background: #fff;
          border: 1.5px solid rgba(0,158,0,0.12);
          border-radius: 14px;
          padding: clamp(20px, 3vw, 32px);
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: box-shadow .2s ease, border-color .2s ease, transform .2s ease;
        }
        .gm-pub-card:hover {
          border-color: ${VERT};
          box-shadow: 0 6px 28px rgba(0,158,0,0.12);
          transform: translateY(-3px);
        }
        .gm-pub-icone {
          width: 52px;
          height: 52px;
          background: rgba(0,158,0,0.07);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gm-pub-titre {
          font-size: 16px;
          font-weight: 700;
          color: #0a2e15;
          margin: 4px 0 0;
          line-height: 1.3;
        }
        .gm-pub-desc {
          font-size: 13.5px;
          color: #555;
          margin: 0;
          line-height: 1.6;
          flex: 1;
        }
        .gm-pub-lien {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          color: ${VERT};
          text-decoration: none;
          margin-top: 4px;
          transition: color .15s;
        }
        .gm-pub-lien:hover { color: #007200; }
        .gm-pub-lien:focus-visible { outline: 2px solid ${VERT}; outline-offset: 3px; border-radius: 3px; }

        @media (max-width: 900px) {
          .gm-pub-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .gm-pub-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
