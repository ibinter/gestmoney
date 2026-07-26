'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Logo } from '@/components/ui/Logo';

/* ─── Constantes couleurs ─────────────────────────────────────────────────── */
const VERT  = '#009E00';
const OR    = '#FFD000';
const FOND1 = '#0a2e15';
const FOND2 = '#0d3a1a';

/* ─── Données des slides ──────────────────────────────────────────────────── */
interface Slide {
  id: number;
  titre: string;
  sous_titre: string;
  ctas: { label: string; href: string; principal: boolean }[];
  illustration: React.ReactNode;
}

function IllustrationReseau() {
  return (
    <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 380, opacity: 0.85 }}>
      <rect width="320" height="240" rx="16" fill="rgba(0,158,0,0.06)" />
      {/* Nœuds */}
      <circle cx="160" cy="60"  r="22" fill={VERT} opacity="0.9" />
      <circle cx="60"  cy="160" r="16" fill={OR}   opacity="0.8" />
      <circle cx="260" cy="160" r="16" fill={OR}   opacity="0.8" />
      <circle cx="110" cy="200" r="12" fill="rgba(255,255,255,0.3)" />
      <circle cx="210" cy="200" r="12" fill="rgba(255,255,255,0.3)" />
      <circle cx="160" cy="180" r="10" fill="rgba(255,255,255,0.2)" />
      {/* Liaisons */}
      <line x1="160" y1="82" x2="60"  y2="144" stroke={VERT} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
      <line x1="160" y1="82" x2="260" y2="144" stroke={VERT} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
      <line x1="60"  y1="176" x2="110" y2="188" stroke={OR} strokeWidth="1" opacity="0.4" />
      <line x1="260" y1="176" x2="210" y2="188" stroke={OR} strokeWidth="1" opacity="0.4" />
      <line x1="110" y1="200" x2="160" y2="190" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="210" y1="200" x2="160" y2="190" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      {/* Icône centrale */}
      <text x="152" y="66" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="18" fill="white">G</text>
      {/* Étiquettes */}
      <rect x="36"  y="142" width="48" height="16" rx="4" fill="rgba(255,208,0,0.15)" />
      <text x="60"  y="153" textAnchor="middle" fontSize="8" fill={OR} fontFamily="Arial,sans-serif">Agence A</text>
      <rect x="236" y="142" width="48" height="16" rx="4" fill="rgba(255,208,0,0.15)" />
      <text x="260" y="153" textAnchor="middle" fontSize="8" fill={OR} fontFamily="Arial,sans-serif">Agence B</text>
    </svg>
  );
}

function IllustrationVitesse() {
  return (
    <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 380, opacity: 0.85 }}>
      <rect width="320" height="240" rx="16" fill="rgba(0,158,0,0.06)" />
      {/* Jauge */}
      <circle cx="160" cy="140" r="90" stroke="rgba(255,255,255,0.06)" strokeWidth="20" />
      <circle cx="160" cy="140" r="90"
        stroke={VERT} strokeWidth="20" strokeLinecap="round"
        strokeDasharray="283 565" transform="rotate(-180 160 140)" opacity="0.8" />
      {/* Aiguille */}
      <line x1="160" y1="140" x2="230" y2="80" stroke={OR} strokeWidth="3" strokeLinecap="round" />
      <circle cx="160" cy="140" r="8" fill={OR} />
      {/* Labels */}
      <text x="80"  y="220" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Arial,sans-serif">0</text>
      <text x="240" y="220" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Arial,sans-serif">MAX</text>
      <text x="160" y="105" textAnchor="middle" fontSize="10" fill={OR} fontFamily="Arial,sans-serif" fontWeight="bold">Automatisé</text>
      {/* Barres rapport */}
      {[0,1,2].map(i => (
        <rect key={i} x={70+i*60} y={155+i*8} width="40" height={50-i*14}
          rx="4" fill={VERT} opacity={0.6-i*0.15} />
      ))}
    </svg>
  );
}

function IllustrationDevices() {
  return (
    <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 380, opacity: 0.85 }}>
      <rect width="320" height="240" rx="16" fill="rgba(0,158,0,0.06)" />
      {/* Desktop */}
      <rect x="30" y="40" width="160" height="110" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <rect x="38" y="48" width="144" height="94" rx="4" fill="rgba(0,158,0,0.12)" />
      <rect x="90" y="150" width="40" height="8" rx="2" fill="rgba(255,255,255,0.12)" />
      <rect x="70" y="158" width="80" height="5" rx="2" fill="rgba(255,255,255,0.08)" />
      {/* Tablet */}
      <rect x="200" y="60" width="70" height="100" rx="7" fill="rgba(255,255,255,0.08)" stroke="rgba(255,208,0,0.3)" strokeWidth="1.5" />
      <rect x="207" y="68" width="56" height="82" rx="3" fill="rgba(0,158,0,0.12)" />
      <circle cx="235" cy="168" r="3" fill="rgba(255,255,255,0.2)" />
      {/* Mobile */}
      <rect x="240" y="140" width="44" height="74" rx="7" fill="rgba(255,255,255,0.08)" stroke={OR} strokeWidth="1.5" />
      <rect x="246" y="150" width="32" height="54" rx="3" fill="rgba(0,158,0,0.12)" />
      <circle cx="262" cy="208" r="2.5" fill="rgba(255,255,255,0.2)" />
      {/* Signal wifi */}
      <path d="M108 75 Q108 65 120 65 Q132 65 132 75" stroke={VERT} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M104 79 Q104 61 120 61 Q136 61 136 79" stroke={VERT} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      <circle cx="120" cy="82" r="3" fill={VERT} opacity="0.9" />
    </svg>
  );
}

function IllustrationSARA() {
  return (
    <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 380, opacity: 0.85 }}>
      <rect width="320" height="240" rx="16" fill="rgba(0,158,0,0.06)" />
      {/* Avatar IA */}
      <circle cx="160" cy="90" r="48" fill="rgba(0,158,0,0.15)" stroke={VERT} strokeWidth="2" />
      <circle cx="160" cy="90" r="36" fill="rgba(0,158,0,0.25)" />
      {/* Yeux */}
      <circle cx="146" cy="86" r="5" fill={VERT} />
      <circle cx="174" cy="86" r="5" fill={VERT} />
      <circle cx="147" cy="85" r="2" fill="white" />
      <circle cx="175" cy="85" r="2" fill="white" />
      {/* Sourire */}
      <path d="M148 100 Q160 110 172 100" stroke={OR} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Bulles chat */}
      <rect x="30" y="155" width="120" height="32" rx="12" fill="rgba(255,255,255,0.1)" />
      <text x="90" y="175" textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,0.7)" fontFamily="Arial,sans-serif">Comment créer un agent ?</text>
      <rect x="170" y="190" width="120" height="32" rx="12" fill={VERT} opacity="0.8" />
      <text x="230" y="210" textAnchor="middle" fontSize="9.5" fill="white" fontFamily="Arial,sans-serif">Voici les étapes…</text>
      {/* Ondes */}
      {[0,1,2].map(i => (
        <circle key={i} cx="160" cy="90" r={60+i*14}
          stroke={VERT} strokeWidth="1" opacity={0.08-i*0.02} fill="none" />
      ))}
    </svg>
  );
}

function IllustrationSecurite() {
  return (
    <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 380, opacity: 0.85 }}>
      <rect width="320" height="240" rx="16" fill="rgba(0,158,0,0.06)" />
      {/* Bouclier */}
      <path d="M160 30 L210 55 L210 120 Q210 160 160 190 Q110 160 110 120 L110 55 Z"
        fill="rgba(0,158,0,0.18)" stroke={VERT} strokeWidth="2" />
      {/* Coche */}
      <path d="M138 115 L153 130 L182 100" stroke={OR} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Cadenas */}
      <rect x="148" y="65" width="24" height="18" rx="4" fill="rgba(255,255,255,0.2)" />
      <path d="M153 65 Q153 53 160 53 Q167 53 167 65" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" />
      {/* Rôles */}
      {[0,1,2].map(i => (
        <g key={i} transform={`translate(${28+i*90}, 200)`}>
          <circle cx="0" cy="0" r="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <circle cx="0" cy="-3" r="4" fill="rgba(255,255,255,0.2)" />
          <path d="M-6 6 Q0 2 6 6" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
        </g>
      ))}
      <text x="28"  y="222" textAnchor="middle" fontSize="7" fill={OR} fontFamily="Arial,sans-serif">Admin</text>
      <text x="118" y="222" textAnchor="middle" fontSize="7" fill={OR} fontFamily="Arial,sans-serif">Superviseur</text>
      <text x="208" y="222" textAnchor="middle" fontSize="7" fill={OR} fontFamily="Arial,sans-serif">Agent</text>
    </svg>
  );
}

const SLIDES: Slide[] = [
  {
    id: 1,
    titre: 'Pilotez tout votre réseau Mobile Money avec GESTMONEY',
    sous_titre: 'La plateforme intelligente pour centraliser agences, agents, flottes, commissions et conformité en temps réel.',
    ctas: [
      { label: 'Essayer gratuitement', href: '/register', principal: true },
      { label: 'Demander une démo', href: '#contact', principal: false },
    ],
    illustration: <IllustrationReseau />,
  },
  {
    id: 2,
    titre: 'Automatisez vos opérations, réduisez les erreurs',
    sous_titre: 'Transactions validées instantanément, commissions calculées automatiquement, rapports générés en un clic.',
    ctas: [
      { label: 'Découvrir les modules', href: '#modules', principal: true },
    ],
    illustration: <IllustrationVitesse />,
  },
  {
    id: 3,
    titre: 'Pilotez depuis n’importe quel appareil',
    sous_titre: 'Ordinateur, tablette, smartphone — GESTMONEY s’adapte à votre terrain et à votre bureau.',
    ctas: [
      { label: 'Installer l’app', href: '#pwa', principal: true },
    ],
    illustration: <IllustrationDevices />,
  },
  {
    id: 4,
    titre: 'SARA, votre assistante intelligente',
    sous_titre: 'Questions sur le logiciel, aide à la navigation, suggestions — SARA répond 24h/24.',
    ctas: [
      { label: 'Parler à SARA', href: '#sara', principal: true },
    ],
    illustration: <IllustrationSARA />,
  },
  {
    id: 5,
    titre: 'Vos données sont protégées. Votre équipe accompagnée.',
    sous_titre: 'Accès sécurisé par rôle, journal d’audit, sauvegarde, assistance IBIG Soft dédiée.',
    ctas: [
      { label: 'Voir les offres', href: '#tarifs', principal: true },
    ],
    illustration: <IllustrationSecurite />,
  },
];

const DUREE_AUTO = 5000;

/* ─── Composant ──────────────────────────────────────────────────────────────*/
export function HeroDynamique() {
  const [actif, setActif] = useState(0);
  const [pause, setPause] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [anime, setAnime] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aller = useCallback((vers: number, dir: 'next' | 'prev' = 'next') => {
    setDirection(dir);
    setAnime(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setActif(vers);
        setAnime(true);
      });
    });
  }, []);

  const suivant = useCallback(() => {
    aller((actif + 1) % SLIDES.length, 'next');
  }, [actif, aller]);

  const precedent = useCallback(() => {
    aller((actif - 1 + SLIDES.length) % SLIDES.length, 'prev');
  }, [actif, aller]);

  /* Auto-play */
  useEffect(() => {
    if (pause) return;
    timerRef.current = setTimeout(suivant, DUREE_AUTO);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [actif, pause, suivant]);

  /* Swipe */
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) suivant();
    else if (delta > 50) precedent();
    touchStartX.current = null;
  }

  const slide = SLIDES[actif];
  const transX = anime ? '0' : (direction === 'next' ? '32px' : '-32px');
  const opacity = anime ? 1 : 0;

  return (
    <section
      role="region"
      aria-label="Présentation GESTMONEY"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        background: `linear-gradient(135deg, ${FOND1} 0%, ${FOND2} 100%)`,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Fond géométrique subtil */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.04 }}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 800 500"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="700" cy="50"  r="180" fill={VERT} />
        <circle cx="100" cy="450" r="140" fill={OR}   />
        <polygon points="400,0 600,300 200,300" fill={VERT} opacity="0.5" />
        <polygon points="650,200 800,500 500,500" fill={OR} opacity="0.4" />
      </svg>

      {/* Contenu principal */}
      <div className="hero-inner">
        {/* Logo en haut à gauche */}
        <div style={{ marginBottom: 'clamp(24px, 4vh, 40px)' }}>
          <Logo variante="horizontal" theme="sombre" />
        </div>

        {/* Grille texte + illustration */}
        <div className="hero-grid">
          {/* Colonne texte */}
          <div
            style={{
              transition: 'opacity 0.45s ease, transform 0.45s ease',
              opacity,
              transform: `translateX(${transX})`,
            }}
          >
            {/* Numéro de slide */}
            <span style={{
              display: 'inline-block',
              background: 'rgba(0,158,0,0.25)',
              border: `1px solid ${VERT}`,
              borderRadius: 999,
              padding: '3px 14px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: VERT,
              marginBottom: 18,
            }}>
              {String(actif + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
            </span>

            <h1 style={{
              fontSize: 'clamp(22px, 3.5vw, 46px)',
              fontWeight: 900,
              lineHeight: 1.18,
              margin: '0 0 20px',
              fontFamily: "'Arial Black', Arial, sans-serif",
            }}>
              {slide.titre}
            </h1>

            <p style={{
              fontSize: 'clamp(14px, 1.5vw, 18px)',
              color: 'rgba(255,255,255,0.72)',
              lineHeight: 1.65,
              margin: '0 0 36px',
              maxWidth: '52ch',
            }}>
              {slide.sous_titre}
            </p>

            {/* CTA */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {slide.ctas.map((cta) => (
                <a
                  key={cta.href}
                  href={cta.href}
                  style={cta.principal ? {
                    display: 'inline-block',
                    background: VERT,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 'clamp(13px, 1.1vw, 15px)',
                    padding: '13px 28px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    border: '2px solid transparent',
                    transition: 'background .2s ease, transform .15s ease',
                    whiteSpace: 'nowrap',
                  } : {
                    display: 'inline-block',
                    background: 'transparent',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 'clamp(13px, 1.1vw, 15px)',
                    padding: '11px 26px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    border: '2px solid rgba(255,255,255,0.5)',
                    transition: 'border-color .2s ease, background .2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  className={cta.principal ? 'hero-cta-principal' : 'hero-cta-secondaire'}
                >
                  {cta.label}
                  {cta.principal && <span aria-hidden="true" style={{ marginLeft: 8 }}>→</span>}
                </a>
              ))}
            </div>
          </div>

          {/* Colonne illustration */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.45s ease, transform 0.45s ease',
              opacity,
              transform: `translateX(${direction === 'next' ? `-${transX}` : transX})`,
            }}
          >
            {slide.illustration}
          </div>
        </div>

        {/* Navigation : flèches + dots */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'clamp(28px, 5vh, 52px)',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          {/* Flèches */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={precedent}
              aria-label="Slide précédent"
              className="hero-fleche"
            >
              ←
            </button>
            <button
              onClick={suivant}
              aria-label="Slide suivant"
              className="hero-fleche"
            >
              →
            </button>
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => aller(i, i > actif ? 'next' : 'prev')}
                aria-label={`Aller au slide ${i + 1}`}
                aria-current={i === actif ? 'true' : undefined}
                className="hero-dot"
                style={{
                  width: i === actif ? 28 : 10,
                  height: 10,
                  borderRadius: 999,
                  background: i === actif ? VERT : 'rgba(255,255,255,0.25)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'width 0.3s ease, background 0.3s ease',
                }}
              />
            ))}
          </div>

          {/* Barre de progression */}
          <div style={{
            height: 3,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.12)',
            flex: '1 1 120px',
            minWidth: 80,
            maxWidth: 200,
            overflow: 'hidden',
          }}>
            <div
              key={`prog-${actif}-${pause}`}
              style={{
                height: '100%',
                background: VERT,
                borderRadius: 999,
                animation: pause ? 'none' : `hero-prog ${DUREE_AUTO}ms linear`,
                width: pause ? `${((actif + 1) / SLIDES.length) * 100}%` : '100%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Styles encapsulés */}
      <style>{`
        .hero-inner {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: clamp(48px, 8vh, 90px) clamp(20px, 5vw, 64px);
          min-height: min(85vh, 700px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-sizing: border-box;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(24px, 4vw, 60px);
          align-items: center;
        }
        .hero-fleche {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.06);
          color: #fff;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background .2s ease, border-color .2s ease;
          line-height: 1;
          padding: 0;
        }
        .hero-fleche:hover {
          background: ${VERT};
          border-color: ${VERT};
        }
        .hero-fleche:focus-visible {
          outline: 2px solid ${VERT};
          outline-offset: 3px;
        }
        .hero-dot:focus-visible {
          outline: 2px solid ${OR};
          outline-offset: 3px;
        }
        .hero-cta-principal:hover {
          background: #00b200 !important;
          transform: translateY(-1px);
        }
        .hero-cta-secondaire:hover {
          border-color: rgba(255,255,255,0.9) !important;
          background: rgba(255,255,255,0.07) !important;
        }
        .hero-cta-principal:focus-visible,
        .hero-cta-secondaire:focus-visible {
          outline: 2px solid ${OR};
          outline-offset: 3px;
        }
        @keyframes hero-prog {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @media (max-width: 768px) {
          .hero-inner {
            min-height: auto;
            padding: 80px 20px 60px;
          }
          .hero-grid {
            grid-template-columns: 1fr;
          }
          .hero-grid > div:last-child {
            order: -1;
          }
        }
      `}</style>
    </section>
  );
}
