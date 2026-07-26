'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: '#07110a', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      {/* Glows */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,158,0,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,208,0,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
        <Logo variante="horizontal" theme="sombre" className="mx-auto mb-12" />

        {/* Illustration 404 avec icône loupe */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
          <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em' }}>
            <span style={{ color: '#FFD000' }}>4</span>
            <span style={{ color: '#fff' }}>0</span>
            <span style={{ color: '#009E00' }}>4</span>
          </div>
          {/* Loupe SVG positionnée sur le zéro */}
          <svg
            width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="#009E00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', bottom: -10, right: -16 }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, marginTop: 16 }}>
          Page introuvable
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 36 }}>
          Cette page n&apos;existe pas ou a été déplacée.<br />
          Vérifiez l&apos;URL ou utilisez l&apos;un des liens ci-dessous.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '12px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', cursor: 'pointer',
            }}
          >
            ← Retour
          </button>
          <Link href="/dashboard" style={{
            padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 800,
            background: '#FFD000', color: '#111', textDecoration: 'none',
          }}>
            Aller au tableau de bord
          </Link>
        </div>

        <Link href="/" style={{
          fontSize: 14, color: 'rgba(255,255,255,0.35)',
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}>
          Page d&apos;accueil GESTMONEY
        </Link>
      </div>
    </div>
  );
}
