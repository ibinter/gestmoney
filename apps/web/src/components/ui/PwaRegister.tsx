'use client';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Stocké globalement pour pouvoir être déclenché depuis n'importe quel composant
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function getPwaInstallPrompt() {
  return deferredPrompt;
}

export function PwaRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Enregistrement du service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch((err) => {
          // SW non critique — erreur silencieuse en dev
          if (process.env.NODE_ENV === 'development') {
            console.warn('[PWA] Service worker non enregistré:', err);
          }
        });
    }

    // Capturer l'événement d'installation PWA
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      // Déclencher un événement custom pour que d'autres composants puissent réagir
      window.dispatchEvent(new Event('pwa-installable'));
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleUpdate = () => {
    navigator.serviceWorker.controller?.postMessage('SKIP_WAITING');
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[9999] bg-gm-green text-white rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-slide-up">
      <span className="text-2xl flex-shrink-0">🔄</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Mise à jour disponible</p>
        <p className="text-xs opacity-80 mt-0.5">Une nouvelle version de GESTMONEY est prête.</p>
      </div>
      <button
        onClick={handleUpdate}
        className="flex-shrink-0 bg-white text-gm-green text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        Mettre à jour
      </button>
    </div>
  );
}
