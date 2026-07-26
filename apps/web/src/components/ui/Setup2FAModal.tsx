'use client';
/**
 * Setup2FAModal — Modal en 3 étapes pour activer la 2FA TOTP.
 *
 * Étape 1 : Introduction
 * Étape 2 : QR code + vérification du code TOTP
 * Étape 3 : Codes de secours
 */
import React, { useState, useRef, useEffect } from 'react';
import { X, Shield, Smartphone, Copy, Check, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';

interface Setup2FAModalProps {
  onClose: () => void;
  onActivated: () => void;
}

type Etape = 'intro' | 'qr' | 'codes';

interface SetupData {
  secret: string;
  qrCode: string; // data URL base64
}

export function Setup2FAModal({ onClose, onActivated }: Setup2FAModalProps) {
  const [etape, setEtape] = useState<Etape>('intro');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [copie, setCopie] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automatique sur l'input code quand on arrive à l'étape QR
  useEffect(() => {
    if (etape === 'qr') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [etape]);

  async function demarrerSetup() {
    setChargement(true);
    setErreur('');
    try {
      const res = await api.post('/auth/2fa/setup');
      setSetupData({ secret: res.data.secret, qrCode: res.data.qrCode });
      setEtape('qr');
    } catch (e: any) {
      setErreur(e?.response?.data?.message ?? 'Erreur lors de la configuration');
    } finally {
      setChargement(false);
    }
  }

  async function verifierEtActiver() {
    if (code.length < 6) {
      setErreur('Entrez le code à 6 chiffres');
      return;
    }
    setChargement(true);
    setErreur('');
    try {
      const res = await api.post('/auth/2fa/activer', { code });
      setBackupCodes(res.data.backupCodes ?? []);
      setEtape('codes');
    } catch (e: any) {
      setErreur(e?.response?.data?.message ?? 'Code invalide, réessayez');
      setCode('');
      inputRef.current?.focus();
    } finally {
      setChargement(false);
    }
  }

  function copierCodes() {
    navigator.clipboard.writeText(backupCodes.join('\n')).then(() => {
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    });
  }

  function confirmerEtFermer() {
    onActivated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-2fa-titre">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <h2 id="modal-2fa-titre" className="text-base font-semibold text-gray-900 dark:text-white">
              Authentification à deux facteurs
            </h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center gap-1 px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
          {(['intro', 'qr', 'codes'] as Etape[]).map((e, i) => (
            <React.Fragment key={e}>
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                etape === e ? 'bg-primary text-white' :
                i < (['intro', 'qr', 'codes'] as Etape[]).indexOf(etape) ? 'bg-green-500 text-white' :
                'bg-gray-200 dark:bg-gray-700 text-gray-400'
              }`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 rounded transition-colors ${
                i < (['intro', 'qr', 'codes'] as Etape[]).indexOf(etape) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Contenu */}
        <div className="px-6 py-5">

          {/* ── Étape 1 : Introduction ── */}
          {etape === 'intro' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Smartphone size={32} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Activez la 2FA</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Sécurisez votre compte avec une deuxième couche de protection.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Vous aurez besoin de :</p>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="shrink-0" />
                    Google Authenticator ou Authy (iOS / Android)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="shrink-0" />
                    Scanner un QR code avec votre smartphone
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="shrink-0" />
                    Conserver vos codes de secours en lieu sûr
                  </li>
                </ul>
              </div>

              {erreur && <p className="text-sm text-red-600 text-center">{erreur}</p>}

              <button
                onClick={demarrerSetup}
                disabled={chargement}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {chargement ? 'Chargement…' : 'Commencer la configuration'}
                {!chargement && <ChevronRight size={16} />}
              </button>
            </div>
          )}

          {/* ── Étape 2 : QR Code + vérification ── */}
          {etape === 'qr' && setupData && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Scannez le QR code</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Ouvrez votre application d&apos;authentification et scannez ce code.
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={setupData.qrCode} alt="QR code 2FA" width={180} height={180} />
                </div>
              </div>

              {/* Code manuel */}
              <details className="group">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-center select-none">
                  Impossible de scanner ? Saisir le code manuellement
                </summary>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs text-center tracking-widest text-gray-700 dark:text-gray-300 break-all select-all">
                  {setupData.secret}
                </div>
              </details>

              {/* Champ de vérification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code à 6 chiffres
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setErreur(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') verifierEtActiver(); }}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                />
                {erreur && <p className="text-sm text-red-600 mt-1">{erreur}</p>}
              </div>

              <button
                onClick={verifierEtActiver}
                disabled={chargement || code.length < 6}
                className="w-full py-2.5 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {chargement ? 'Vérification…' : 'Vérifier et activer'}
              </button>
            </div>
          )}

          {/* ── Étape 3 : Codes de secours ── */}
          {etape === 'codes' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Codes de secours</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Conservez ces codes en lieu sûr. Chacun ne peut être utilisé qu&apos;une seule fois.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                  Ces codes ne seront plus affichés. Notez-les ou copiez-les maintenant.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((c) => (
                  <div key={c} className="font-mono text-sm text-center py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-800 dark:text-gray-200 select-all">
                    {c}
                  </div>
                ))}
              </div>

              <button
                onClick={copierCodes}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {copie ? <><Check size={14} className="text-green-600" /> Copié !</> : <><Copy size={14} /> Copier tous les codes</>}
              </button>

              <button
                onClick={confirmerEtFermer}
                className="w-full py-2.5 px-4 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
              >
                J&apos;ai sauvegardé mes codes — Activer la 2FA
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
