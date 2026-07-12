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

        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 16 }}>
          <span style={{ color: '#FFD000' }}>4</span>
          <span style={{ color: '#fff' }}>0</span>
          <span style={{ color: '#009E00' }}>4</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          Page introuvable
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 36 }}>
          La page que vous cherchez n&apos;existe pas ou a été déplacée. Vérifiez l&apos;URL ou retournez au tableau de bord.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 800,
            background: '#FFD000', color: '#111', textDecoration: 'none',
          }}>
            Tableau de bord
          </Link>
          <Link href="/login" style={{
            padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', textDecoration: 'none',
          }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
