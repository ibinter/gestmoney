'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

const NAV_LINKS: [string, string][] = [
  ['#fonctionnalites', 'Fonctionnalités'],
  ['#modules', 'Modules'],
  ['/tarifs', 'Tarifs'],
  ['#paiement', 'Paiement'],
  ['#faq', 'FAQ'],
  ['#contact', 'Contact'],
];

export function HeaderLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  /* ── scroll effect ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── body scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  /* ── Escape key ── */
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const close = () => setDrawerOpen(false);

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '0 clamp(16px,4vw,48px)',
          height: 66,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(248,254,249,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(0,158,0,0.15)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: scrolled ? '0 2px 16px rgba(0,158,0,0.08)' : 'none',
          transition: 'all .25s',
        }}
      >
        {/* Logo */}
        <Logo variante="compact" theme="clair" />

        {/* Desktop nav */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 32 }}
          className="hidden-mobile"
        >
          {NAV_LINKS.map(([href, label]) => (
            <a
              key={href}
              href={href}
              style={{ fontSize: 14, fontWeight: 600, color: '#444', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#009E00')}
              onMouseLeave={e => (e.currentTarget.style.color = '#444')}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          className="hidden-mobile"
        >
          <Link
            href="/login"
            style={{
              fontSize: 14, fontWeight: 700, color: '#009E00', textDecoration: 'none',
              padding: '8px 16px', border: '1.5px solid #009E00', borderRadius: 10,
            }}
          >
            Connexion
          </Link>
          <Link
            href="/register"
            style={{
              padding: '9px 22px', borderRadius: 10, fontSize: 14, fontWeight: 800,
              background: '#FFD000', color: '#111', textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(255,208,0,0.35)',
            }}
          >
            Essai gratuit →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setDrawerOpen(v => !v)}
          aria-label={drawerOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
          className="show-mobile"
          style={{
            background: 'none', border: '1.5px solid #ddd', borderRadius: 8,
            width: 40, height: 40, cursor: 'pointer', fontSize: 18, color: '#333',
          }}
        >
          {drawerOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* ── DRAWER MOBILE ── */}
      {/* Overlay */}
      <div
        onClick={close}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity .25s',
        }}
      />

      {/* Drawer panel */}
      <div
        id="mobile-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(320px, 80vw)',
          background: '#fff',
          zIndex: 201,
          padding: 24,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .25s ease',
        }}
      >
        {/* Header drawer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <Logo variante="compact" theme="clair" />
          <button
            onClick={close}
            aria-label="Fermer le menu"
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666' }}
          >
            ✕
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_LINKS.map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={close}
              style={{
                display: 'flex', alignItems: 'center',
                minHeight: 48, padding: '0 8px',
                fontSize: 16, fontWeight: 600, color: '#222', textDecoration: 'none',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* CTA + langue */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 24 }}>
          <Link
            href="/login"
            onClick={close}
            style={{
              display: 'block', textAlign: 'center', padding: 13, borderRadius: 10,
              border: '1.5px solid #009E00', color: '#009E00', textDecoration: 'none', fontWeight: 700,
            }}
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            onClick={close}
            style={{
              display: 'block', textAlign: 'center', padding: 13, borderRadius: 10,
              background: '#FFD000', color: '#111', textDecoration: 'none', fontWeight: 900,
            }}
          >
            ⚡ Essai gratuit 14 jours
          </Link>

          {/* Language selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            {(['FR', 'EN'] as const).map(lang => (
              <button
                key={lang}
                style={{
                  padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: 'none', border: '1.5px solid #ddd', color: '#555', cursor: 'pointer',
                }}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
