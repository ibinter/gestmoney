'use client';
import { useEffect, useState } from 'react';
import { getPwaInstallPrompt } from './PwaRegister';
import { useT } from '@/lib/i18n';

export function PwaInstallBanner() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Ne pas montrer si déjà installé ou déjà refusé récemment
    const alreadyDismissed = localStorage.getItem('gestmoney-pwa-dismissed');
    if (alreadyDismissed) {
      const dismissedAt = parseInt(alreadyDismissed, 10);
      // Ne pas re-montrer pendant 7 jours
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const checkInstallable = () => {
      if (getPwaInstallPrompt()) setVisible(true);
    };

    checkInstallable();
    window.addEventListener('pwa-installable', checkInstallable);
    return () => window.removeEventListener('pwa-installable', checkInstallable);
  }, []);

  const handleInstall = async () => {
    const prompt = getPwaInstallPrompt();
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('gestmoney-pwa-dismissed', Date.now().toString());
    setDismissed(true);
    setVisible(false);
  };

  if (!visible || dismissed) return null;

  return (
    <div
      role="banner"
      aria-label="Installer GESTMONEY"
      className="fixed bottom-0 left-0 right-0 z-[9998] safe-area-inset-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="bg-[#111111] border-t border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          {/* Icône */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10">
            <img src="/icons/icon-96x96.png" alt="GESTMONEY" className="w-full h-full object-cover" />
          </div>

          {/* Texte */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Installer GESTMONEY</p>
            <p className="text-white/50 text-xs mt-0.5 leading-tight truncate">
              Accédez à l&apos;application depuis votre écran d&apos;accueil
            </p>
          </div>

          {/* Boutons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="text-white/40 text-xs px-2 py-1.5 hover:text-white/70 transition-colors"
            >
              Plus tard
            </button>
            <button
              onClick={handleInstall}
              className="bg-[#009E00] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#007a00] transition-colors whitespace-nowrap"
            >
              Installer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
