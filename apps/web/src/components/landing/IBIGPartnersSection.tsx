'use client';

import React from 'react';

const VERT = '#009E00';
const OR = '#FFD000';

const POINTS = [
  { emoji: '✅', label: 'Inscription gratuite' },
  { emoji: '💸', label: 'Commissions sur ventes' },
  { emoji: '🛠️', label: 'Accès aux outils IBIG' },
  { emoji: '📊', label: 'Suivi en temps réel' },
];

export function IBIGPartnersSection() {
  return (
    <section className="gm-part-section">
      {/* Fond bicolore : vert clair à gauche, blanc à droite */}
      <div className="gm-part-bg-left" aria-hidden />

      <div className="gm-part-inner">
        {/* Colonne gauche — fond vert clair */}
        <div className="gm-part-col-left">
          <p className="gm-part-surtitre">Programme Partenariat</p>
          <h2 className="gm-part-titre">
            Développez vos revenus avec<br />
            <span className="gm-part-titre-accent">IBIG PARTNERS</span>
          </h2>
          <p className="gm-part-intro">
            Rejoignez gratuitement le programme de partenariat IBIG et recommandez les solutions du groupe à votre réseau.
          </p>

          <ul className="gm-part-points" aria-label="Points clés du programme">
            {POINTS.map((pt) => (
              <li key={pt.label} className="gm-part-point">
                <span className="gm-part-point-emoji" aria-hidden>{pt.emoji}</span>
                <span>{pt.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne droite — fond blanc */}
        <div className="gm-part-col-right">
          <div className="gm-part-card">
            <div className="gm-part-card-icon" aria-hidden>
              <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" width={48} height={48}>
                <circle cx="28" cy="28" r="26" fill="rgba(0,158,0,0.08)" stroke={VERT} strokeWidth="2"/>
                <path d="M20 36c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={VERT} strokeWidth="2" strokeLinecap="round" fill="none"/>
                <circle cx="28" cy="22" r="5" stroke={VERT} strokeWidth="2" fill="none"/>
                <path d="M36 20c1.7 1.2 3 3.2 3 5.5M20 20c-1.7 1.2-3 3.2-3 5.5" stroke={OR} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <path d="M40 30c1.5 1.4 2.5 3.4 2.5 5.5M16 30c-1.5 1.4-2.5 3.4-2.5 5.5" stroke={OR} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>

            <h3 className="gm-part-card-titre">Prêt à rejoindre le réseau&nbsp;?</h3>
            <p className="gm-part-card-desc">
              Accédez au tableau de bord partenaire, suivez vos recommandations et percevez vos commissions en toute transparence.
            </p>

            <div className="gm-part-ctas">
              <a
                href="https://ibigpartners.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="gm-part-cta-primary"
              >
                Devenir partenaire <span aria-hidden>→</span>
              </a>
              <a
                href="https://ibigpartners.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="gm-part-cta-secondary"
              >
                Découvrir le programme
              </a>
            </div>

            <p className="gm-part-legal">
              Aucun revenu n&rsquo;est garanti. Les commissions dépendent des ventes réalisées.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .gm-part-section {
          position: relative;
          overflow: hidden;
          padding: clamp(48px,8vh,80px) clamp(16px,5vw,48px);
          background: #fff;
        }
        .gm-part-bg-left {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 48%;
          background: linear-gradient(135deg, rgba(0,158,0,0.08) 0%, rgba(0,158,0,0.03) 100%);
          z-index: 0;
        }
        .gm-part-inner {
          position: relative;
          z-index: 1;
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(32px, 5vw, 72px);
          align-items: center;
        }
        .gm-part-col-left {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .gm-part-surtitre {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: ${VERT};
          margin: 0;
        }
        .gm-part-titre {
          font-size: clamp(22px, 3.5vw, 34px);
          font-weight: 800;
          color: #0a2e15;
          margin: 0;
          line-height: 1.2;
        }
        .gm-part-titre-accent {
          color: ${VERT};
          display: block;
        }
        .gm-part-intro {
          font-size: 15px;
          color: #444;
          margin: 0;
          line-height: 1.7;
          max-width: 46ch;
        }
        .gm-part-points {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .gm-part-point {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #0a2e15;
          background: rgba(0,158,0,0.06);
          border: 1px solid rgba(0,158,0,0.15);
          border-radius: 10px;
          padding: 10px 14px;
        }
        .gm-part-point-emoji { font-size: 18px; line-height: 1; }

        .gm-part-col-right { display: flex; flex-direction: column; }
        .gm-part-card {
          background: #fff;
          border: 1.5px solid rgba(0,158,0,0.15);
          border-radius: 18px;
          padding: clamp(24px,4vw,40px);
          box-shadow: 0 4px 32px rgba(0,158,0,0.08);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .gm-part-card-icon {
          width: 64px;
          height: 64px;
          background: rgba(0,158,0,0.06);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gm-part-card-titre {
          font-size: 18px;
          font-weight: 700;
          color: #0a2e15;
          margin: 0;
          line-height: 1.3;
        }
        .gm-part-card-desc {
          font-size: 14px;
          color: #555;
          margin: 0;
          line-height: 1.65;
        }
        .gm-part-ctas {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }
        .gm-part-cta-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: ${VERT};
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          padding: 13px 24px;
          border-radius: 8px;
          text-decoration: none;
          transition: background .15s ease, transform .15s ease;
          text-align: center;
        }
        .gm-part-cta-primary:hover { background: #007200; transform: translateY(-2px); }
        .gm-part-cta-primary:focus-visible { outline: 2px solid ${VERT}; outline-offset: 4px; border-radius: 8px; }

        .gm-part-cta-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: transparent;
          color: ${VERT};
          font-size: 14px;
          font-weight: 600;
          padding: 11px 24px;
          border-radius: 8px;
          border: 1.5px solid ${VERT};
          text-decoration: none;
          transition: background .15s ease, color .15s ease;
          text-align: center;
        }
        .gm-part-cta-secondary:hover { background: rgba(0,158,0,0.06); }
        .gm-part-cta-secondary:focus-visible { outline: 2px solid ${VERT}; outline-offset: 4px; border-radius: 8px; }

        .gm-part-legal {
          font-size: 11.5px;
          color: #999;
          margin: 0;
          line-height: 1.5;
          border-top: 1px solid #f0f0f0;
          padding-top: 12px;
        }

        @media (max-width: 860px) {
          .gm-part-bg-left { width: 100%; height: 50%; bottom: auto; top: 0; }
          .gm-part-inner { grid-template-columns: 1fr; }
          .gm-part-col-left { align-items: flex-start; }
        }
        @media (max-width: 480px) {
          .gm-part-points { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
