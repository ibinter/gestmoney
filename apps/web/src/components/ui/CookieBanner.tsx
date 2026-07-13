'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type ConsentState = {
  necessary: true;
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
  ai: boolean;
};

const STORAGE_KEY = 'gestmoney-cookie-consent';

function loadConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(consent: ConsentState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...consent, savedAt: Date.now() }));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'banner' | 'details'>('banner');
  const [prefs, setPrefs] = useState<ConsentState>({
    necessary: true,
    preferences: false,
    statistics: false,
    marketing: false,
    ai: false,
  });

  useEffect(() => {
    const saved = loadConsent();
    if (!saved) setVisible(true);
  }, []);

  const acceptAll = () => {
    const consent: ConsentState = { necessary: true, preferences: true, statistics: true, marketing: true, ai: true };
    saveConsent(consent);
    setVisible(false);
  };

  const refuseAll = () => {
    const consent: ConsentState = { necessary: true, preferences: false, statistics: false, marketing: false, ai: false };
    saveConsent(consent);
    setVisible(false);
  };

  const saveCustom = () => {
    saveConsent(prefs);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9990] bg-[#111111] border-t border-white/10 shadow-2xl"
      role="dialog"
      aria-label="Gestion des cookies"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-4xl mx-auto px-4 py-4">
        {mode === 'banner' ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">Gestion des cookies</p>
              <p className="text-white/50 text-xs mt-0.5 leading-relaxed">
                GESTMONEY utilise des cookies pour assurer le bon fonctionnement du service et améliorer votre expérience.{' '}
                <Link href="/legal/cookies" className="text-[#FFD000] hover:underline">En savoir plus</Link>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={() => setMode('details')}
                className="text-white/50 text-xs px-3 py-2 border border-white/20 rounded-lg hover:text-white hover:border-white/40 transition-colors"
              >
                Personnaliser
              </button>
              <button
                onClick={refuseAll}
                className="text-white/70 text-xs px-3 py-2 border border-white/20 rounded-lg hover:text-white hover:border-white/40 transition-colors"
              >
                Refuser
              </button>
              <button
                onClick={acceptAll}
                className="bg-[#009E00] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#007a00] transition-colors"
              >
                Tout accepter
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm">Personnaliser les cookies</h3>
              <button onClick={() => setMode('banner')} className="text-white/40 hover:text-white/70 text-xs">← Retour</button>
            </div>
            <div className="space-y-3 mb-4">
              {([
                { key: 'necessary', label: 'Nécessaires', desc: 'Session, sécurité, préférences de langue — non désactivables', disabled: true },
                { key: 'preferences', label: 'Préférences', desc: 'Thème, langue, paramètres d\'affichage' },
                { key: 'statistics', label: 'Statistiques', desc: 'Mesure d\'audience anonymisée pour améliorer le service' },
                { key: 'marketing', label: 'Marketing', desc: 'Personnalisation des campagnes IBIG Soft et partenaires' },
                { key: 'ai', label: 'IA (SARA)', desc: 'Amélioration de l\'assistante SARA via conversations anonymisées' },
              ] as Array<{ key: keyof ConsentState; label: string; desc: string; disabled?: boolean }>).map((item) => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={prefs[item.key]}
                    disabled={item.disabled}
                    onChange={(e) => setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))}
                    className="mt-0.5 flex-shrink-0"
                    style={{ accentColor: '#009E00', width: 16, height: 16 }}
                  />
                  <div className="min-w-0">
                    <span className="text-white text-xs font-semibold">{item.label}</span>
                    {item.disabled && <span className="ml-2 text-white/30 text-xs">(toujours actif)</span>}
                    <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={refuseAll} className="text-white/50 text-xs px-3 py-2 border border-white/20 rounded-lg hover:text-white">
                Tout refuser
              </button>
              <button onClick={acceptAll} className="text-white/70 text-xs px-3 py-2 border border-white/20 rounded-lg hover:text-white">
                Tout accepter
              </button>
              <button
                onClick={saveCustom}
                className="bg-[#009E00] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#007a00] transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
