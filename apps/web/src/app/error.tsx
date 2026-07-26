'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

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

        {/* Icône alerte */}
        <svg
          width="64" height="64" viewBox="0 0 24 24" fill="none"
          stroke="#E60000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ marginBottom: 20 }}
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          Une erreur est survenue
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24 }}>
          Notre équipe a été notifiée. Essayez de recharger la page.
        </p>

        {/* Message technique — visible en développement uniquement */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 24,
            fontFamily: 'monospace', background: 'rgba(255,255,255,0.04)',
            padding: '8px 14px', borderRadius: 6, wordBreak: 'break-all',
          }}>
            {error.message.slice(0, 100)}
          </p>
        )}

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
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', cursor: 'pointer',
            }}
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
}
