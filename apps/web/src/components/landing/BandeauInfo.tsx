'use client';

import React, { useState } from 'react';

const FOND = '#0a2e15';
const OR = '#FFD000';
const VERT = '#009E00';

export function BandeauInfo() {
  const [langue, setLangue] = useState<'FR' | 'EN'>('FR');
  const [demoLoading, setDemoLoading] = useState(false);

  const textes = {
    FR: {
      essai: 'Essai gratuit disponible — aucune carte bancaire requise',
      support: 'Assistance Lun–Sam 8h–18h · +225 07 78 88 25 92',
      demo: 'Explorer la démo',
      demoLoading: 'Connexion…',
      demoErr: 'La démo est momentanément indisponible. Réessayez plus tard.',
    },
    EN: {
      essai: 'Free trial available — no credit card required',
      support: 'Support Mon–Sat 8am–6pm · +225 07 78 88 25 92',
      demo: 'Explorer la démo',
      demoLoading: 'Connexion…',
      demoErr: 'La démo est momentanément indisponible. Réessayez plus tard.',
    },
  };

  const t = textes[langue];

  const lancerDemo = async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      const res = await fetch('/api/demo-access', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/dashboard';
        return;
      }
      window.alert(t.demoErr);
    } catch {
      window.alert(t.demoErr);
    } finally {
      setDemoLoading(false);
    }
  };

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
      {/* Bloc mobile : premier message + accès démo, centré */}
      <span className="bi-mobile">
        <span>{t.essai}</span>
        <span className="bi-sep" aria-hidden>·</span>
        <button
          onClick={lancerDemo}
          disabled={demoLoading}
          className="bi-demo-btn"
          aria-busy={demoLoading}
        >
          {demoLoading ? t.demoLoading : t.demo}
        </button>
      </span>

      {/* Blocs desktop : 3 blocs séparés par · */}
      <div className="bi-desktop">
        <span>{t.essai}</span>
        <span className="bi-sep" aria-hidden>·</span>
        <span>{t.support}</span>
        <span className="bi-sep" aria-hidden>·</span>
        <button
          onClick={lancerDemo}
          disabled={demoLoading}
          className="bi-demo-btn"
          aria-busy={demoLoading}
        >
          {demoLoading ? t.demoLoading : t.demo}
        </button>
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

        .bi-demo-btn {
          background: none;
          border: 1px solid ${OR};
          border-radius: 999px;
          color: ${OR};
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 12px;
          line-height: 1;
          transition: background .15s ease, color .15s ease, opacity .15s ease;
        }
        .bi-demo-btn:hover:not(:disabled) { background: ${OR}; color: ${FOND}; }
        .bi-demo-btn:focus-visible { outline: 2px solid ${VERT}; outline-offset: 2px; }
        .bi-demo-btn:disabled { opacity: 0.6; cursor: wait; }

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
