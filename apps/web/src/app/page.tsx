'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

const FEATURES = [
  { icon: '↔️', titre: 'Multi-opérateurs', desc: 'Orange Money, MTN MoMo, Wave, Moov, Airtel — tous vos réseaux dans une seule plateforme.' },
  { icon: '🔒', titre: '100% sécurisé', desc: 'Authentification renforcée, chiffrement de bout en bout et journaux d\'audit complets.' },
  { icon: '📊', titre: 'Reporting temps réel', desc: 'Tableaux de bord live, alertes float intelligentes et rapports BI exportables.' },
  { icon: '🏪', titre: 'Réseau d\'agences', desc: 'Gérez agents, agences et points de vente depuis un espace centralisé.' },
  { icon: '💰', titre: 'Commissions automatisées', desc: 'Calcul, validation et paiement des commissions agents en quelques clics.' },
  { icon: '🤖', titre: 'Assistant IA intégré', desc: 'Alertes prédictives, recommandations de réapprovisionnement et détection de fraudes.' },
];

const STATS = [
  { valeur: '10 000+', label: 'Transactions / jour', couleur: '#009E00' },
  { valeur: '500+', label: 'Agences gérées', couleur: '#FFD000' },
  { valeur: '5', label: 'Opérateurs intégrés', couleur: '#E60000' },
  { valeur: '99.9%', label: 'Disponibilité SLA', couleur: '#fff' },
];

const OPS = [
  { nom: 'Orange Money', couleur: '#FF6B00', emoji: '🟠' },
  { nom: 'MTN MoMo', couleur: '#FFD000', emoji: '🟡' },
  { nom: 'Wave', couleur: '#0099FF', emoji: '🔵' },
  { nom: 'Moov', couleur: '#009E00', emoji: '🟢' },
  { nom: 'Airtel', couleur: '#E60000', emoji: '🔴' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: '#07110a', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(7,17,10,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'all .25s',
      }}>
        <Logo variante="compact" theme="sombre" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="#fonctionnalites" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Fonctionnalités</a>
          <a href="#operateurs" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Opérateurs</a>
          <Link href="/login" style={{
            padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: '#FFD000', color: '#111', textDecoration: 'none',
          }}>
            Se connecter
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '120px 24px 80px' }}>
        {/* Glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-5%', left: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,158,0,0.14) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,208,0,0.09) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', top: '40%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,0,0,0.07) 0%, transparent 70%)' }} />
          {/* Grille points */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
            <defs>
              <pattern id="grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="#fff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 780, textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,158,0,0.12)', border: '1px solid rgba(0,158,0,0.25)',
            borderRadius: 999, padding: '6px 16px', marginBottom: 32,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#009E00', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#009E00', letterSpacing: '.06em' }}>PLATEFORME CLOUD SAAS · AFRIQUE DE L&apos;OUEST</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.02em' }}>
            Gérez tout votre réseau<br />
            <span style={{ color: '#FFD000' }}>Mobile Money</span><br />
            <span style={{ color: '#009E00' }}>depuis un seul endroit.</span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
            GESTMONEY est la plateforme intelligente de gestion des services financiers digitaux pour les réseaux Mobile Money en Afrique — agents, float, commissions et reporting en temps réel.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <Link href="/login" style={{
              padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 900,
              background: '#FFD000', color: '#111', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Accéder à la plateforme →
            </Link>
            <Link href="/login" style={{
              padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', textDecoration: 'none',
            }}>
              ⚡ Démo gratuite
            </Link>
          </div>

          {/* Opérateurs pills */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {OPS.map(op => (
              <div key={op.nom} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 999, padding: '5px 14px',
              }}>
                <span style={{ fontSize: 14 }}>{op.emoji}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{op.nom}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '0 24px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '32px 24px', textAlign: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: i === 0 ? '14px 0 0 14px' : i === 3 ? '0 14px 14px 0' : 0,
            }}>
              <p style={{ fontSize: 36, fontWeight: 900, color: s.couleur, fontVariantNumeric: 'tabular-nums' }}>{s.valeur}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6, fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section id="fonctionnalites" style={{ padding: '80px 24px 100px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: '#FFD000', textAlign: 'center', marginBottom: 16 }}>Fonctionnalités</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, textAlign: 'center', marginBottom: 16, letterSpacing: '-0.02em' }}>
            Tout ce dont vous avez besoin<br />
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>pour piloter votre réseau.</span>
          </h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 16, marginBottom: 64 }}>
            Une plateforme unique, conçue pour les réalités du terrain africain.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '28px 28px',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(255,208,0,0.08)', border: '1px solid rgba(255,208,0,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 16,
                }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{f.titre}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPÉRATEURS ── */}
      <section id="operateurs" style={{ padding: '80px 24px 100px', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: '#009E00', marginBottom: 16 }}>Opérateurs supportés</p>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, marginBottom: 48, letterSpacing: '-0.02em' }}>
            Compatible avec tous les réseaux<br />Mobile Money d&apos;Afrique de l&apos;Ouest.
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            {OPS.map(op => (
              <div key={op.nom} style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${op.couleur}33`,
                borderRadius: 16, padding: '24px 32px', minWidth: 140,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 36 }}>{op.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: op.couleur }}>{op.nom}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '100px 24px 120px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,208,0,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: '#FFD000', marginBottom: 20 }}>Commencer maintenant</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, marginBottom: 20, letterSpacing: '-0.02em' }}>
            Prêt à digitaliser<br />votre réseau Mobile Money ?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 40, lineHeight: 1.7 }}>
            Accédez à la démo immédiatement — aucune carte bancaire requise. Découvrez GESTMONEY avec des données réelles.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              padding: '15px 36px', borderRadius: 12, fontSize: 16, fontWeight: 900,
              background: '#FFD000', color: '#111', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Accéder à la plateforme →
            </Link>
            <Link href="/login" style={{
              padding: '15px 36px', borderRadius: 12, fontSize: 16, fontWeight: 700,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', textDecoration: 'none',
            }}>
              ⚡ Démo rapide
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '40px 40px 32px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Logo variante="compact" theme="sombre" />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>La plateforme intelligente de gestion des services financiers digitaux</p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Connexion</Link>
            <a href="mailto:contact@ibigsoft.com" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
        <div style={{ maxWidth: 1040, margin: '20px auto 0', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 IBIG SOFT — GESTMONEY. Tous droits réservés.</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Made with ❤️ pour l&apos;Afrique</p>
        </div>
      </footer>

    </div>
  );
}
