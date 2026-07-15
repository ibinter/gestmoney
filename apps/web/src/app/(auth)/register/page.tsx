'use client';
import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const PAYS = [
  "Côte d'Ivoire","Sénégal","Ghana","Mali","Bénin","Togo","Burkina Faso",
  "Niger","Guinée","Cameroun","Kenya","Nigeria","Rwanda","Tanzanie","Autre",
];

function RegisterContent() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    country: '',
    plan: 'STARTER',
    acceptTerms: false,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    if (!form.firstName.trim()) return 'Le prénom est requis.';
    if (!form.lastName.trim()) return 'Le nom est requis.';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Email invalide.';
    if (form.phone && !form.phone.match(/^\+?[\d\s\-()]{7,}$/)) return 'Numéro de téléphone invalide.';
    if (form.password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (form.password !== form.confirmPassword) return 'Les mots de passe ne correspondent pas.';
    return '';
  };

  const validateStep2 = () => {
    if (!form.companyName.trim()) return 'Le nom de l\'entreprise est requis.';
    if (!form.country) return 'Veuillez sélectionner votre pays.';
    if (!form.acceptTerms) return 'Vous devez accepter les conditions d\'utilisation.';
    return '';
  };

  const handleNextStep = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          password: form.password,
          companyName: form.companyName.trim(),
          country: form.country,
          plan: form.plan,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message;
        if (Array.isArray(msg)) setError(msg.join(' '));
        else if (typeof msg === 'string') setError(msg);
        else setError('Erreur lors de la création du compte. Veuillez réessayer.');
        return;
      }

      // Succès → rediriger vers le dashboard ou login
      router.push('/dashboard');
    } catch {
      setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#f9fafb', border: '1.5px solid #d1d5db',
    borderRadius: 10, padding: '11px 14px', color: '#111', fontSize: 14,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color .15s, background .15s',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#009E00';
    e.currentTarget.style.background = '#f0fdf4';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#d1d5db';
    e.currentTarget.style.background = '#f9fafb';
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #e8fded 0%, #f8fef9 40%, #fffef0 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <header style={{ padding: '18px clamp(16px,4vw,40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo variante="compact" theme="clair" />
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: '#009E00', fontWeight: 700, textDecoration: 'none' }}>Se connecter →</Link>
        </span>
      </header>

      {/* Form container */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(20px,4vh,40px) clamp(16px,4vw,24px)' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* Badge essai */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,158,0,0.10)', border: '1.5px solid rgba(0,158,0,0.22)',
              borderRadius: 999, padding: '6px 16px', marginBottom: 16,
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#009E00', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                ⚡ Essai gratuit 14 jours · Aucune carte bancaire
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a2e15', margin: 0, letterSpacing: '-0.02em' }}>
              Créer votre compte GESTMONEY
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
              Gérez tout votre réseau Mobile Money en quelques minutes.
            </p>
          </div>

          {/* Indicateur étapes */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
            {[{ n: 1, label: 'Compte' }, { n: 2, label: 'Entreprise' }].map(({ n, label }) => (
              <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', fontSize: 13, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step >= n ? '#009E00' : '#e5e7eb',
                  color: step >= n ? '#fff' : '#9ca3af',
                  transition: 'background .3s',
                }}>{step > n ? '✓' : n}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: step >= n ? '#009E00' : '#9ca3af' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 'clamp(24px,4vw,36px)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1.5px solid #e8f5e9' }}>
            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                fontSize: 13, color: '#dc2626', lineHeight: 1.5,
              }}>{error}</div>
            )}

            {step === 1 ? (
              <form onSubmit={e => { e.preventDefault(); handleNextStep(); }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Prénom *</label>
                    <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jean" required
                      style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Nom *</label>
                    <input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Kouassi" required
                      style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Email professionnel *</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jean@monreseau.com" required
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Téléphone / WhatsApp</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+225 07 XX XX XX XX"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Mot de passe *</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => set('password', e.target.value)} placeholder="Minimum 8 caractères" required
                      style={{ ...inputStyle, paddingRight: 42 }} onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowPass(v => !v)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af',
                    }}>{showPass ? '🙈' : '👁️'}</button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                      {[4,6,8,10].map(n => (
                        <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: form.password.length >= n ? (n <= 5 ? '#E60000' : n <= 7 ? '#FFD000' : '#009E00') : '#e5e7eb', transition: 'background .2s' }} />
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Confirmer le mot de passe *</label>
                  <input type={showPass ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)} placeholder="Retapez votre mot de passe" required
                    style={{ ...inputStyle, borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#E60000' : '#d1d5db' }}
                    onFocus={onFocus} onBlur={onBlur} />
                </div>

                <button type="submit" style={{
                  width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                  background: '#FFD000', color: '#111', fontSize: 15, fontWeight: 900,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 16px rgba(255,208,0,0.35)',
                }}>
                  Continuer → Étape 2
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Nom de l&apos;entreprise *</label>
                  <input value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Mon Réseau Mobile Money" required
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Pays *</label>
                  <select value={form.country} onChange={e => set('country', e.target.value)} required
                    style={{ ...inputStyle, appearance: 'none' }} onFocus={onFocus} onBlur={onBlur}>
                    <option value="">Sélectionner un pays...</option>
                    {PAYS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Formule *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { key: 'STARTER', label: 'Starter', prix: '29 900 XOF', color: '#009E00' },
                      { key: 'ESSENTIEL', label: 'Essentiel', prix: '59 900 XOF', color: '#d97706' },
                      { key: 'PROFESSIONAL', label: 'Professional', prix: '129 900 XOF', color: '#b45309' },
                      { key: 'ENTERPRISE', label: 'Enterprise', prix: 'Sur devis', color: '#0369a1' },
                    ].map(p => (
                      <button key={p.key} type="button" onClick={() => set('plan', p.key)} style={{
                        padding: '10px 8px', borderRadius: 10, border: `2px solid ${form.plan === p.key ? p.color : '#e5e7eb'}`,
                        background: form.plan === p.key ? `${p.color}12` : '#f9fafb',
                        cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
                      }}>
                        <p style={{ fontSize: 12, fontWeight: 800, color: p.color, margin: 0 }}>{p.label}</p>
                        <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>{p.prix}</p>
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>✅ Tous les plans incluent 14 jours d&apos;essai gratuit</p>
                </div>

                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 24 }}>
                  <input type="checkbox" checked={form.acceptTerms} onChange={e => set('acceptTerms', e.target.checked)}
                    style={{ width: 16, height: 16, marginTop: 1, accentColor: '#009E00', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                    J&apos;accepte les{' '}
                    <Link href="/conditions" style={{ color: '#009E00', fontWeight: 700 }}>conditions d&apos;utilisation</Link>
                    {' '}et la{' '}
                    <Link href="/confidentialite" style={{ color: '#009E00', fontWeight: 700 }}>politique de confidentialité</Link>
                    {' '}de GESTMONEY.
                  </span>
                </label>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => { setStep(1); setError(''); }} style={{
                    flex: 1, padding: '13px', borderRadius: 12, border: '1.5px solid #d1d5db',
                    background: '#fff', color: '#374151', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    ← Retour
                  </button>
                  <button type="submit" disabled={loading} style={{
                    flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                    background: loading ? '#d1d5db' : '#009E00', color: '#fff', fontSize: 15, fontWeight: 900,
                    cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(0,158,0,0.3)',
                    transition: 'all .15s',
                  }}>
                    {loading ? '⏳ Création...' : '🚀 Créer mon compte'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
            🔒 Vos données sont chiffrées et protégées.<br />
            Aucune carte bancaire requise pour l&apos;essai.
          </p>
        </div>
      </main>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; }
        @media (prefers-color-scheme: dark) {
          div[style*="background: #fff"] { background: #1a1a1a !important; }
          input, select { background: #262626 !important; color: #fff !important; border-color: #404040 !important; }
        }
      `}</style>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
