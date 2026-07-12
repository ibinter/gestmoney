'use client';
import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#07110a', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,0,0,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
        <Logo variante="horizontal" theme="sombre" className="mx-auto mb-12" />

        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 16 }}>
          <span style={{ color: '#E60000' }}>5</span>
          <span style={{ color: '#fff' }}>0</span>
          <span style={{ color: '#FFD000' }}>0</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          Une erreur s&apos;est produite
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 36 }}>
          Le serveur a rencontré une erreur inattendue. Notre équipe technique a été notifiée automatiquement.
        </p>

        {error.digest && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginBottom: 32, fontFamily: 'monospace' }}>
            Réf. : {error.digest}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 800,
              background: '#FFD000', color: '#111', border: 'none', cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
          <Link href="/dashboard" style={{
            padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', textDecoration: 'none',
          }}>
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
