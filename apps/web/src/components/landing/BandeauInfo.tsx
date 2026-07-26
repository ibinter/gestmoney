'use client';

import React, { useState } from 'react';

const FOND = '#0a2e15';
const OR = '#FFD000';
const VERT = '#009E00';

export function BandeauInfo() {
  const [langue, setLangue] = useState<'FR' | 'EN'>('FR');

  const textes = {
    FR: {
      essai: 'Essai gratuit disponible — aucune carte bancaire requise',
      support: 'Assistance Lun–Sam 8h–18h · +225 07 78 88 25 92',
    },
    EN: {
      essai: 'Free trial available — no credit card required',
      support: 'Support Mon–Sat 8am–6pm · +225 07 78 88 25 92',
    },
  };

  const t = textes[langue];

  return (
    <div
      style={{
        background: FOND,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 clamp(12px, 3vw, 32px)',
        fontSize: 12.5,
        color: 'rgba(255,255,255,0.8)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Bloc mobile : premier message uniquement, centré */}
      <span className="bi-mobile">{t.essai}</span>

      {/* Blocs desktop : 3 blocs séparés par · */}
      <div className="bi-desktop">
        <span>{t.essai}</span>
        <span className="bi-sep" aria-hidden>·</span>
        <span>{t.support}</span>
        <span className="bi-sep" aria-hidden>·</span>
        <span className="bi-lang" role="group" aria-label="Langue">
          {(['FR', 'EN'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLangue(l)}
              className="bi-lang-btn"
              aria-pressed={langue === l}
              style={{
                color: langue === l ? OR : 'rgba(255,255,255,0.55)',
                fontWeight: langue === l ? 700 : 400,
                borderBottom: langue === l ? `1px solid ${VERT}` : '1px solid transparent',
              }}
            >
              {l}
            </button>
          ))}
        </span>
      </div>

      <style>{`
        .bi-mobile  { display: none; }
        .bi-desktop { display: flex; align-items: center; gap: 10px; }

        .bi-sep {
          color: rgba(255,255,255,0.25);
          user-select: none;
        }

        .bi-lang { display: flex; align-items: center; gap: 6px; }

        .bi-lang-btn {
          background: none;
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-size: 12.5px;
          padding: 0 2px 1px;
          transition: color .15s ease;
          line-height: 1;
        }
        .bi-lang-btn:hover { color: ${OR} !important; }
        .bi-lang-btn:focus-visible { outline: 2px solid ${VERT}; outline-offset: 2px; border-radius: 2px; }

        @media (max-width: 639px) {
          .bi-mobile  { display: block; }
          .bi-desktop { display: none; }
        }
      `}</style>
    </div>
  );
}
