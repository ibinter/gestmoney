'use client';

import { useState, useEffect, useCallback } from 'react';

// Pages connues du dashboard pour alimenter les suggestions
const KNOWN_PAGES = [
  { path: '/dashboard', label: 'Tableau de bord' },
  { path: '/dashboard/transactions', label: 'Transactions' },
  { path: '/dashboard/clients', label: 'Clients' },
  { path: '/dashboard/agences', label: 'Agences' },
  { path: '/dashboard/operateurs', label: 'Opérateurs' },
  { path: '/dashboard/float', label: 'Float' },
  { path: '/dashboard/commissions', label: 'Commissions' },
];

const HISTORY_KEY = 'gestmoney-page-history';

function getPageHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

type CheckStatus = 'idle' | 'checking' | 'online' | 'offline';

export default function OfflinePage() {
  const [recentPaths, setRecentPaths] = useState<string[]>([]);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('idle');

  useEffect(() => {
    setRecentPaths(getPageHistory().slice(0, 4));
  }, []);

  const handleCheckConnection = useCallback(async () => {
    setCheckStatus('checking');
    try {
      // On ping une ressource légère du domaine courant
      await fetch('/manifest.json', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      setCheckStatus('online');
      // Connexion rétablie — on retourne à la dernière page visitée
      setTimeout(() => {
        const history = getPageHistory();
        window.location.href = history[0] || '/dashboard';
      }, 800);
    } catch {
      setCheckStatus('offline');
      setTimeout(() => setCheckStatus('idle'), 3000);
    }
  }, []);

  // Trouver le label d'une page connue ou en dériver un à partir du chemin
  const labelFor = (path: string): string => {
    const known = KNOWN_PAGES.find((p) => p.path === path);
    if (known) return known.label;
    const parts = path.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? path;
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
  };

  const btnLabel =
    checkStatus === 'checking'
      ? 'Vérification…'
      : checkStatus === 'online'
        ? 'Connecté !'
        : checkStatus === 'offline'
          ? 'Toujours hors ligne'
          : 'Vérifier la connexion';

  const btnBg =
    checkStatus === 'online'
      ? '#15803d'
      : checkStatus === 'offline'
        ? '#b91c1c'
        : '#009E00';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a2e15',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Icône WiFi barré */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#009E00"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: '1.5rem' }}
        aria-hidden="true"
      >
        <path d="M1 6C1 6 5 2 12 2s11 4 11 4" />
        <path d="M5 10a7 7 0 0 1 14 0" />
        <path d="M8.5 13.5a4 4 0 0 1 7 0" />
        <circle cx="12" cy="17" r="1" fill="#009E00" stroke="none" />
        <line x1="2" y1="2" x2="22" y2="22" stroke="#ef4444" strokeWidth="2" />
      </svg>

      {/* Logo texte */}
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          letterSpacing: '0.05em',
          color: '#009E00',
          marginBottom: '1rem',
        }}
      >
        GESTMONEY
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 1rem' }}>
        Vous êtes hors connexion
      </h1>

      <p
        style={{
          fontSize: '1rem',
          opacity: 0.8,
          maxWidth: '360px',
          lineHeight: 1.6,
          margin: '0 0 2rem',
        }}
      >
        Vérifiez votre connexion internet et réessayez.
        Les ressources statiques de l'application restent disponibles.
      </p>

      {/* ── Bouton vérifier connexion ──────────────────────────────── */}
      <button
        onClick={handleCheckConnection}
        disabled={checkStatus === 'checking' || checkStatus === 'online'}
        style={{
          backgroundColor: btnBg,
          color: '#ffffff',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: checkStatus === 'checking' ? 'wait' : 'pointer',
          transition: 'background-color 0.2s',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: '220px',
          justifyContent: 'center',
        }}
      >
        {checkStatus === 'checking' && (
          <span
            style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />
        )}
        {checkStatus === 'online' && '✓ '}
        {btnLabel}
      </button>

      {/* Bouton recharger simple */}
      <button
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: 'transparent',
          color: '#9ca3af',
          border: '1px solid #374151',
          borderRadius: '0.5rem',
          padding: '0.5rem 1.5rem',
          fontSize: '0.875rem',
          cursor: 'pointer',
          marginBottom: '2.5rem',
        }}
      >
        Recharger la page
      </button>

      {/* ── Dernières pages visitées ───────────────────────────────── */}
      {recentPaths.length > 0 && (
        <div style={{ marginBottom: '2rem', width: '100%', maxWidth: '360px' }}>
          <p style={{ fontSize: '0.8rem', opacity: 0.55, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Dernières pages visitées
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentPaths.map((path) => (
              <a
                key={path}
                href={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: '0.375rem',
                  color: '#d1fae5',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                {labelFor(path)}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Lien état des services ────────────────────────────────── */}
      <a
        href="/status"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(255,255,255,0.6)',
          textDecoration: 'none',
          fontSize: '0.875rem',
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.85rem' }}>🟢</span>
        Vérifier l&apos;état des services
      </a>

      {/* ── Lien WhatsApp support (fonctionne hors connexion Wi-Fi
            si la data mobile est disponible) ─────────────────────── */}
      <a
        href="https://wa.me/2250778882592?text=Bonjour%20IBIG%20Soft%2C%20j%27ai%20besoin%20d%27aide%20avec%20GESTMONEY."
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#4ade80',
          textDecoration: 'none',
          fontSize: '0.9rem',
          opacity: 0.85,
        }}
      >
        {/* Icône WhatsApp simple */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Contacter le support via WhatsApp
      </a>

      {/* Animation spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
