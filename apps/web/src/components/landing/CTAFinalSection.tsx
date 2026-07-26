'use client';

import React from 'react';
import Link from 'next/link';

const VERT = '#009E00';
const OR = '#FFD000';
const FOND = '#0a2e15';

export function CTAFinalSection() {
  return (
    <section
      id="cta-final"
      style={{
        background: FOND,
        padding: 'clamp(64px,10vh,112px) clamp(16px,4vw,48px)',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Accroche décorative */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(0,158,0,.15)',
            border: '1px solid rgba(0,158,0,.3)',
            borderRadius: 999,
            padding: '6px 16px',
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: VERT,
              display: 'inline-block',
              boxShadow: `0 0 0 3px rgba(0,158,0,.25)`,
            }}
          />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#86efac', letterSpacing: '.04em' }}>
            Essai gratuit disponible
          </span>
        </div>

        {/* Titre principal */}
        <h2
          style={{
            fontSize: 'clamp(26px,4vw,44px)',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 20px',
            lineHeight: 1.2,
          }}
        >
          Prêt à moderniser la gestion de votre réseau{' '}
          <span style={{ color: OR }}>Mobile Money</span> ?
        </h2>

        {/* Sous-titre */}
        <p
          style={{
            fontSize: 'clamp(15px,2vw,18px)',
            color: 'rgba(255,255,255,0.65)',
            margin: '0 0 44px',
            lineHeight: 1.7,
            maxWidth: '52ch',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Rejoignez les opérateurs qui font confiance à GESTMONEY. Démarrez
          votre essai gratuit ou échangez avec un expert.
        </p>

        {/* Boutons */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Bouton principal */}
          <Link
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: VERT,
              color: '#fff',
              fontWeight: 700,
              fontSize: 15.5,
              padding: '14px 30px',
              borderRadius: 10,
              textDecoration: 'none',
              transition: 'background .18s ease, transform .15s ease',
              boxShadow: '0 4px 16px rgba(0,158,0,.35)',
            }}
            className="gm-cta-principal"
          >
            Commencer gratuitement
            <span style={{ fontSize: 17 }}>→</span>
          </Link>

          {/* Bouton secondaire */}
          <a
            href="#contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: 15.5,
              padding: '13px 28px',
              borderRadius: 10,
              textDecoration: 'none',
              border: '2px solid rgba(255,255,255,0.45)',
              transition: 'border-color .18s ease, color .18s ease',
            }}
            className="gm-cta-secondaire"
          >
            Demander une démonstration
          </a>

          {/* Bouton tertiaire */}
          <a
            href="#sara"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 500,
              fontSize: 14,
              textDecoration: 'none',
              padding: '10px 4px',
              transition: 'color .15s ease',
              borderBottom: '1px solid transparent',
            }}
            className="gm-cta-tertiaire"
          >
            <span style={{ fontSize: 16 }}>💬</span>
            Parler à SARA
          </a>
        </div>

        {/* Note discrète */}
        <p
          style={{
            marginTop: 28,
            fontSize: 12.5,
            color: 'rgba(255,255,255,0.28)',
            letterSpacing: '.02em',
          }}
        >
          Aucune carte bancaire requise pour l&apos;essai.
        </p>
      </div>

      <style>{`
        .gm-cta-principal:hover {
          background: #00b800 !important;
          transform: translateY(-1px);
        }
        .gm-cta-secondaire:hover {
          border-color: rgba(255,255,255,0.85) !important;
          color: #fff !important;
        }
        .gm-cta-tertiaire:hover {
          color: rgba(255,255,255,0.8) !important;
          border-bottom-color: rgba(255,255,255,0.35) !important;
        }
        @media (max-width: 480px) {
          .gm-cta-principal,
          .gm-cta-secondaire {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}
