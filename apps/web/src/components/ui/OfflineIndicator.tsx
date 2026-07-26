'use client';

import { useState, useEffect } from 'react';

/**
 * OfflineIndicator — bannière discrète affichée quand la connexion est perdue.
 *
 * Montée dans le layout dashboard uniquement ; ne touche aucune donnée,
 * ne met rien en cache, ne lit rien d'authentifié.
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [visible, setVisible] = useState(false); // fade-in différé

  useEffect(() => {
    // Valeur initiale synchrone dès le premier rendu client
    setIsOnline(navigator.onLine);

    const goOnline = () => {
      setIsOnline(true);
      setVisible(false);
    };
    const goOffline = () => {
      setIsOnline(false);
      // Légère temporisation pour éviter un flash sur coupure brève
      setTimeout(() => setVisible(true), 400);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '4.5rem', // au-dessus de la BottomNav mobile (64 px)
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#b91c1c',
        color: '#ffffff',
        padding: '10px 20px',
        borderRadius: '8px',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,.35)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.875rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none', // ne capture pas les clics
      }}
    >
      {/* Icône signal barré */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
      </svg>
      Connexion perdue — données en cache affichées
    </div>
  );
}
