'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [afficherMdp, setAfficherMdp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [heure, setHeure] = useState('');
  const [loadingDemo, setLoadingDemo] = useState(false);

  const [modalMdpOublie, setModalMdpOublie] = useState(false);
  const [emailReset, setEmailReset] = useState('');
  const [resetEnvoye, setResetEnvoye] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    const tick = () => setHeure(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  const doLogin = async (emailVal: string, passwordVal: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantId && { 'x-tenant-id': tenantId }),
      },
      credentials: 'include', // Pour réceptionner le cookie httpOnly si configuré
      body: JSON.stringify({ email: emailVal, password: passwordVal, ...(tenantId && { tenantId }) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Email ou mot de passe incorrect.');
    }
    const data = await res.json();
    return data;
  };

  const handleConnexion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!email || !motDePasse) { setErreur('Veuillez remplir tous les champs.'); return; }
    setLoading(true);
    try {
      const { user } = await doLogin(email, motDePasse);
      login({
        id: user.id,
        nom: user.lastName ?? '',
        prenom: user.firstName ?? '',
        email: user.email,
        role: (Array.isArray(user.roles) ? user.roles[0] : user.role) ?? 'VIEWER',
        actif: user.status === 'ACTIVE',
        createdAt: user.createdAt,
      });
      router.replace(redirectUrl);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Connexion impossible. Vérifiez votre réseau.');
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setLoadingDemo(true);
    setErreur('');
    // Les credentials démo sont dans l'environnement serveur, jamais dans le code client
    try {
      const res = await fetch('/api/demo-access', {
        method: 'POST',
        credentials: 'include',
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error('Démo indisponible');
      const { user } = await res.json();
      login({
        id: user.id ?? 'demo-user',
        nom: user.lastName ?? 'Demo',
        prenom: user.firstName ?? 'Admin',
        email: user.email ?? 'demo@gestmoney.ibigsoft.com',
        role: (Array.isArray(user.roles) ? user.roles[0] : user.role) ?? 'MANAGER',
        actif: true,
        createdAt: user.createdAt ?? new Date().toISOString(),
      });
      router.replace('/dashboard');
    } catch {
      setErreur('Accès démo temporairement indisponible. Contactez IBIG Soft.');
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingReset(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailReset }),
        signal: AbortSignal.timeout(6000),
      });
    } catch { /* L'email est toujours envoyé côté serveur si le compte existe */ }
    setLoadingReset(false);
    setResetEnvoye(true);
  };

  return (
    <>
      {/* Fond plein écran sombre */}
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#07110a' }}>

        {/* Glows ambiants panafricains */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute" style={{ top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,158,0,0.12) 0%, transparent 70%)' }} />
          <div className="absolute" style={{ bottom: '-8%', right: '-6%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,208,0,0.08) 0%, transparent 70%)' }} />
          <div className="absolute" style={{ top: '30%', right: '10%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,0,0,0.07) 0%, transparent 70%)' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="#ffffff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Carte centrale */}
        <div className="relative z-10 w-full max-w-[420px] mx-4">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <Logo variante="horizontal" theme="sombre" />
            </div>
            <p className="text-sm font-medium tracking-widest uppercase" style={{ color: '#FFD000', letterSpacing: '0.18em' }}>
              La plateforme intelligente
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              DE GESTION DES SERVICES FINANCIERS DIGITAUX
            </p>
          </div>

          {/* Formulaire */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 20,
            backdropFilter: 'blur(12px)',
            padding: '36px 36px 28px',
          }}>
            <h2 className="text-xl font-black text-white mb-1">Connexion</h2>
            <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Accédez à votre espace de gestion
            </p>

            <form onSubmit={handleConnexion} className="space-y-4" autoComplete="on">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>
                  ADRESSE EMAIL
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, padding: '11px 14px',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    placeholder="vous@exemple.ci"
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      color: '#fff', fontSize: 14, fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>
                  MOT DE PASSE
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, padding: '11px 14px',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password"
                    type={afficherMdp ? 'text' : 'password'}
                    value={motDePasse}
                    onChange={e => setMotDePasse(e.target.value)}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      color: '#fff', fontSize: 14, fontFamily: 'inherit',
                    }}
                  />
                  <button type="button" onClick={() => setAfficherMdp(v => !v)} style={{ color: 'rgba(255,255,255,0.35)', display: 'flex', lineHeight: 1 }}>
                    {afficherMdp ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <input type="checkbox" style={{ accentColor: '#009E00', width: 14, height: 14 }} />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={() => { setModalMdpOublie(true); setResetEnvoye(false); setEmailReset(''); }}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: '#FFD000' }}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Erreur */}
              {erreur && (
                <div style={{ background: 'rgba(230,0,0,0.12)', border: '1px solid rgba(230,0,0,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff8080' }}>
                  {erreur}
                </div>
              )}

              {/* Bouton connexion */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                  background: loading ? 'rgba(255,208,0,0.5)' : '#FFD000',
                  color: '#111111', fontSize: 15, fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit', marginTop: 8,
                  transition: 'opacity .15s',
                }}
              >
                {loading ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".8s" repeatCount="indefinite" />
                    </path>
                  </svg>
                ) : (
                  <>Se connecter <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="flex items-center gap-3 my-5">
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>ou</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Accès démo */}
            <div style={{ background: 'rgba(0,158,0,0.08)', border: '1px solid rgba(0,158,0,0.2)', borderRadius: 14, padding: '14px 16px' }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: 12, fontWeight: 700, color: '#009E00', letterSpacing: '0.05em' }}>ESPACE DÉMO</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Accès immédiat</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.5 }}>
                Explorez GESTMONEY avec des données fictives, sans engagement.
              </p>
              <button
                onClick={handleDemoAccess}
                disabled={loadingDemo}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(0,158,0,0.4)',
                  background: 'rgba(0,158,0,0.15)', color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: loadingDemo ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: loadingDemo ? 0.6 : 1,
                }}
              >
                {loadingDemo ? 'Connexion...' : '⚡ Accéder à la démo'}
              </button>
            </div>
          </div>

          {/* Bande opérateurs + heure */}
          <div className="flex items-center justify-between mt-8 px-1">
            <div className="flex gap-3 items-center">
              {['🟠', '🟡', '🔵', '🟢', '🔴'].map((e, i) => (
                <span key={i} style={{ fontSize: 16, opacity: 0.7 }}>{e}</span>
              ))}
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>
              {heure} · &copy; 2026 IBIG SOFT
            </span>
          </div>

        </div>
      </div>

      {/* Modal mot de passe oublié */}
      {modalMdpOublie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#111c12', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-base font-black text-white mb-1">Mot de passe oublié</h3>
            {!resetEnvoye ? (
              <>
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Entrez votre email. Un lien de réinitialisation vous sera envoyé.
                </p>
                <form onSubmit={handleReset} className="space-y-3">
                  <input
                    type="email"
                    placeholder="votre@email.ci"
                    value={emailReset}
                    onChange={e => setEmailReset(e.target.value)}
                    required
                    autoComplete="email"
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                      padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loadingReset}
                    style={{
                      width: '100%', padding: 11, borderRadius: 10, border: 'none',
                      background: '#FFD000', color: '#111', fontSize: 14, fontWeight: 700,
                      cursor: loadingReset ? 'not-allowed' : 'pointer', opacity: loadingReset ? 0.6 : 1, fontFamily: 'inherit',
                    }}
                  >
                    {loadingReset ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">📧</div>
                <p className="text-sm font-semibold text-white mb-2">Email envoyé !</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Si un compte existe pour <strong style={{ color: '#fff' }}>{emailReset}</strong>,<br />
                  vous recevrez un lien dans quelques minutes.
                </p>
              </div>
            )}
            <button
              onClick={() => setModalMdpOublie(false)}
              style={{
                marginTop: 16, width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
