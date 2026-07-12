'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('admin@gestmoney.demo');
  const [motDePasse, setMotDePasse] = useState('Admin2026!');
  const [afficherMdp, setAfficherMdp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [modalMdpOublie, setModalMdpOublie] = useState(false);
  const [emailReset, setEmailReset] = useState('');
  const [resetEnvoye, setResetEnvoye] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const DEMO_EMAIL = 'admin@gestmoney.demo';
  const DEMO_PASSWORD = 'Admin2026!';

  const loginDemo = () => {
    login({
      id: 'demo-user',
      nom: 'Admin',
      prenom: 'Demo',
      email: DEMO_EMAIL,
      role: 'SUPER_ADMIN',
      actif: true,
      createdAt: new Date().toISOString(),
    }, 'demo-token');
    router.push('/dashboard');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingReset(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailReset }),
        signal: AbortSignal.timeout(4000),
      });
    } catch { /* backend absent, on simule quand même */ }
    setLoadingReset(false);
    setResetEnvoye(true);
  };

  const handleConnexion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!email || !motDePasse) { setErreur('Veuillez remplir tous les champs.'); return; }
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';
      const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId && { 'x-tenant-id': tenantId }),
        },
        body: JSON.stringify({ email, password: motDePasse, ...(tenantId && { tenantId }) }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.message || 'Email ou mot de passe incorrect.'); setLoading(false); return; }
      const { accessToken, user } = data;
      localStorage.setItem('access_token', accessToken);
      login({
        id: user.id, nom: user.lastName ?? '', prenom: user.firstName ?? '',
        email: user.email, role: (Array.isArray(user.roles) ? user.roles[0] : user.role) ?? 'VIEWER',
        actif: user.status === 'ACTIVE', createdAt: user.createdAt,
      }, accessToken);
      router.push('/dashboard');
    } catch {
      // Fallback démo si les identifiants correspondent
      if (email === DEMO_EMAIL && motDePasse === DEMO_PASSWORD) {
        loginDemo();
        return;
      }
      setErreur('Impossible de contacter le serveur. Utilisez le compte démo pour accéder à l\'application.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Gauche : panneau marque ── */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden" style={{ background: '#0e1a0e' }}>
        {/* Cercles décoratifs aux couleurs du logo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #1E8C32, transparent)' }} />
          <div className="absolute top-1/2 -right-24 w-72 h-72 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #F5B800, transparent)' }} />
          <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #C41E1E, transparent)' }} />
        </div>

        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          {/* Logo */}
          <div className="mb-auto">
            <Image src="/logo.png" alt="GESTMONEY" width={200} height={68} className="object-contain" priority />
          </div>

          {/* Slogan central */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-black text-white leading-tight mb-5">
              Gérez votre réseau<br />
              <span style={{ color: '#F5B800' }}>Mobile Money</span><br />
              <span style={{ color: '#1E8C32' }}>en toute simplicité.</span>
            </h2>
            <p className="text-gray-400 text-base max-w-sm leading-relaxed">
              Plateforme Cloud SaaS africaine pour la gestion complète de vos opérations Mobile Money — agents, float, commissions et reporting en temps réel.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { label: 'Transactions / jour', valeur: '10 000+', couleur: '#1E8C32' },
                { label: 'Agences gérées', valeur: '500+', couleur: '#F5B800' },
                { label: 'Opérateurs', valeur: '5', couleur: '#C41E1E' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-2xl font-black" style={{ color: item.couleur }}>{item.valeur}</p>
                  <p className="text-gray-400 text-xs mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Opérateurs */}
            <div className="mt-8 flex flex-wrap gap-2">
              {['🟠 Orange Money', '🟡 MTN MoMo', '🔵 Wave', '🟢 Moov', '🔴 Airtel'].map((op) => (
                <span key={op} className="text-xs text-gray-300 px-3 py-1.5 rounded-full border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {op}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-600 mt-10">&copy; 2024 IBIG SOFT — GESTMONEY</p>
        </div>
      </div>

      {/* ── Droite : formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo mobile uniquement */}
          <div className="mb-8 lg:hidden">
            <Image src="/logo.png" alt="GESTMONEY" width={160} height={54} className="object-contain" priority />
          </div>

          {/* Carte formulaire */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {/* En-tête */}
            <div className="mb-7">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#1E8C32' }}>
                <Zap size={22} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Connexion</h2>
              <p className="text-gray-500 text-sm mt-1">Accédez à votre espace GESTMONEY</p>
            </div>

            <form onSubmit={handleConnexion} className="space-y-4">
              <Input
                label="Adresse email"
                type="email"
                placeholder="vous@exemple.ci"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icone={<Mail size={16} />}
                autoComplete="email"
                required
              />

              <div className="space-y-1">
                <Input
                  label="Mot de passe"
                  type={afficherMdp ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  icone={<Lock size={16} />}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setAfficherMdp((v) => !v)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 ml-auto mt-1"
                >
                  {afficherMdp ? <EyeOff size={12} /> : <Eye size={12} />}
                  {afficherMdp ? 'Masquer' : 'Afficher le mot de passe'}
                </button>
              </div>

              {erreur && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                  {erreur}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" className="rounded" style={{ accentColor: '#1E8C32' }} />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={() => { setModalMdpOublie(true); setResetEnvoye(false); setEmailReset(''); }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#1E8C32' }}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <Button
                type="submit"
                variante="primary"
                taille="lg"
                fullWidth
                loading={loading}
                icone={<ArrowRight size={18} />}
                iconePosition="droite"
              >
                Se connecter
              </Button>
            </form>

            {/* Compte démo */}
            <div className="mt-6 p-4 rounded-xl border" style={{ background: '#f9fdf9', borderColor: '#d1f0d8' }}>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#1E8C32' }}>Compte démo :</p>
              <p className="text-xs text-gray-500 mb-3">
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">admin@gestmoney.demo</span>
                {' '}/{' '}
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">Admin2026!</span>
              </p>
              <button
                type="button"
                onClick={() => { setEmail(DEMO_EMAIL); setMotDePasse(DEMO_PASSWORD); loginDemo(); }}
                className="w-full text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                style={{ background: '#1E8C32', color: 'white' }}
              >
                ⚡ Connexion rapide démo
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            &copy; 2024 IBIG SOFT — GESTMONEY. Tous droits réservés.
          </p>
        </div>
      </div>
      {/* Modal mot de passe oublié */}
      {modalMdpOublie && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Mot de passe oublié</h3>
            {!resetEnvoye ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Entrez votre adresse email. Un lien de réinitialisation vous sera envoyé.
                </p>
                <form onSubmit={handleReset} className="space-y-3">
                  <input
                    type="email"
                    placeholder="votre@email.ci"
                    value={emailReset}
                    onChange={(e) => setEmailReset(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={loadingReset}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: '#1E8C32' }}
                  >
                    {loadingReset ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">📧</div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Email envoyé !</p>
                <p className="text-xs text-gray-500">
                  Si un compte existe pour <strong>{emailReset}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setModalMdpOublie(false)}
              className="mt-4 w-full py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
