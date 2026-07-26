'use client';
/**
 * Page de vérification 2FA — 2ème étape du login.
 *
 * Reçoit `tempToken` via sessionStorage (posé par la page /login)
 * et échange le code TOTP (ou code de secours) contre les vrais tokens.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function Verify2FAPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [code, setCode] = useState('');
  const [modeSecours, setModeSecours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vérifier qu'on a bien un tempToken en session
  useEffect(() => {
    const token = sessionStorage.getItem('gestmoney_temp_token');
    if (!token) {
      router.replace('/login');
    }
    inputRef.current?.focus();
  }, [router]);

  async function verifier(e: React.FormEvent) {
    e.preventDefault();
    const tempToken = sessionStorage.getItem('gestmoney_temp_token');
    if (!tempToken) { router.replace('/login'); return; }
    if (!code.trim()) { setErreur('Entrez votre code'); return; }

    setChargement(true);
    setErreur('');
    try {
      const res = await api.post('/auth/2fa/login-verify', { tempToken, code: code.trim() });
      // Nettoyer le token temporaire
      sessionStorage.removeItem('gestmoney_temp_token');
      // Connecter l'utilisateur dans le store
      const u = res.data?.user;
      if (u) {
        login({
          id: u.id,
          email: u.email,
          prenom: u.firstName,
          nom: u.lastName,
          role: u.roles?.[0] ?? 'AGENT',
          tenantId: u.tenantId,
          actif: u.status === 'ACTIVE',
        });
      }
      router.replace('/dashboard');
    } catch (e: any) {
      setErreur(e?.response?.data?.message ?? 'Code invalide, réessayez');
      setCode('');
      inputRef.current?.focus();
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">

        {/* Logo / icône */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vérification 2FA</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
            {modeSecours
              ? 'Entrez un code de secours (format XXXX-XXXX)'
              : 'Entrez le code à 6 chiffres affiché par votre application.'}
          </p>
        </div>

        <form onSubmit={verifier} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type={modeSecours ? 'text' : 'text'}
              inputMode={modeSecours ? 'text' : 'numeric'}
              pattern={modeSecours ? undefined : '[0-9]*'}
              maxLength={modeSecours ? 9 : 6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(modeSecours ? /[^A-Za-z0-9-]/g : /\D/g, '')); setErreur(''); }}
              placeholder={modeSecours ? 'XXXX-XXXX' : '000000'}
              autoFocus
              className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
            {erreur && <p className="text-sm text-red-600 mt-2 text-center">{erreur}</p>}
          </div>

          <button
            type="submit"
            disabled={chargement || !code.trim()}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {chargement ? 'Vérification…' : 'Vérifier'}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-3">
          <button
            onClick={() => { setModeSecours((v) => !v); setCode(''); setErreur(''); }}
            className="text-sm text-primary hover:underline"
          >
            {modeSecours ? 'Utiliser le code TOTP' : 'Utiliser un code de secours'}
          </button>

          <button
            onClick={() => router.replace('/login')}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ArrowLeft size={14} />
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}
