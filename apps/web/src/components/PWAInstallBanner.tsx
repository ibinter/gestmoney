'use client';
import { useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem('pwa-dismissed') === 'true') return;

    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!promptRef.current) return;
    await promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    promptRef.current = null;
  };

  const handleLater = () => {
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-dismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
        backgroundColor: '#009E00',
        color: '#ffffff',
        padding: '0.875rem 1rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.25)',
        fontFamily: 'sans-serif',
        fontSize: '0.9rem',
      }}
    >
      <span style={{ flex: '1 1 auto', fontWeight: 500 }}>
        Installez GESTMONEY pour un accès plus rapide
      </span>

      <button
        onClick={handleInstall}
        style={{
          backgroundColor: '#ffffff',
          color: '#009E00',
          border: 'none',
          borderRadius: '0.375rem',
          padding: '0.4rem 1rem',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Installer maintenant
      </button>

      <button
        onClick={handleLater}
        style={{
          backgroundColor: 'transparent',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: '0.375rem',
          padding: '0.4rem 0.75rem',
          fontWeight: 500,
          fontSize: '0.85rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Plus tard
      </button>

      <button
        onClick={handleDismiss}
        style={{
          backgroundColor: 'transparent',
          color: 'rgba(255,255,255,0.7)',
          border: 'none',
          borderRadius: '0.375rem',
          padding: '0.4rem 0.75rem',
          fontWeight: 400,
          fontSize: '0.8rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          textDecoration: 'underline',
        }}
      >
        Ne plus afficher
      </button>
    </div>
  );
}
