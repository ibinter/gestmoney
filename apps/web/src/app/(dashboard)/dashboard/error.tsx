'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#1a1a1a',
      }}
    >
      {/* Icône alerte */}
      <svg
        width="56"
        height="56"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#E60000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: '1.25rem' }}
        aria-hidden="true"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>

      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: '0.75rem',
          color: '#1a1a1a',
        }}
      >
        Une erreur est survenue dans cette section
      </h2>

      <p
        style={{
          fontSize: '0.95rem',
          color: '#666',
          lineHeight: 1.6,
          maxWidth: '420px',
          marginBottom: '0.5rem',
        }}
      >
        Notre équipe a été notifiée automatiquement. Vous pouvez réessayer ou retourner au tableau de bord.
      </p>

      {/* Message technique — développement uniquement */}
      {process.env.NODE_ENV === 'development' && error.message && (
        <p
          style={{
            fontSize: '0.75rem',
            color: '#aaa',
            fontFamily: 'monospace',
            background: '#f5f5f5',
            padding: '6px 12px',
            borderRadius: 6,
            marginBottom: '0.75rem',
            maxWidth: 480,
            wordBreak: 'break-all',
          }}
        >
          {error.message.slice(0, 100)}
        </p>
      )}

      {error.digest && (
        <p
          style={{
            fontSize: '0.7rem',
            color: '#ccc',
            fontFamily: 'monospace',
            marginBottom: '1.5rem',
          }}
        >
          Réf. : {error.digest}
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.25rem' }}>
        <button
          onClick={reset}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            fontSize: '0.95rem',
            fontWeight: 700,
            background: '#009E00',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            fontSize: '0.95rem',
            fontWeight: 600,
            background: '#f0f0f0',
            color: '#333',
            border: '1px solid #ddd',
            cursor: 'pointer',
          }}
        >
          Retour au tableau de bord
        </button>
      </div>

      {/* Lien vers le support */}
      <button
        onClick={() => router.push('/dashboard/support')}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '0.875rem',
          color: '#009E00',
          cursor: 'pointer',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        Signaler ce problème
      </button>
    </div>
  );
}
