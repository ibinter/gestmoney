'use client';
// ============================================================
// PAGE PARAMÈTRES — GESTMONEY
// ============================================================
import React, { useState } from 'react';
import { Shield, Bell, Palette, Camera, Eye, EyeOff, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Toggle } from '@/components/ui/Toggle';
import { useAuthStore } from '@/store/authStore';
import { useOnboarding } from '@/components/ui/Onboarding';
import { useT } from '@/lib/i18n';
import api from '@/lib/api';

// ——————————————————————————————————————
// Onglet Profil
// ——————————————————————————————————————
function OngletProfil() {
  const { user, updateUser } = useAuthStore();
  const t = useT();
  const [form, setForm] = useState({
    prenom: user?.prenom ?? '',
    nom: user?.nom ?? '',
    email: user?.email ?? '',
    telephone: '',
    langue: 'fr',
    fuseau: 'Africa/Abidjan',
  });
  const [saved, setSaved] = useState(false);
  const [uploadPhoto, setUploadPhoto] = useState(false);
  const [photoErr, setPhotoErr] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const choisirPhoto = () => fileInputRef.current?.click();

  const changerPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoErr('Veuillez choisir une image.');
      e.target.value = '';
      return;
    }
    if (file.size > 1_500_000) {
      setPhotoErr('Image trop volumineuse (max 1,5 Mo).');
      e.target.value = '';
      return;
    }
    setPhotoErr('');
    setUploadPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/auth/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatar: res.data.avatar });
    } catch {
      setPhotoErr("Échec de l'envoi de la photo.");
    } finally {
      setUploadPhoto(false);
      e.target.value = '';
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // Simulation sauvegarde
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Photo de profil */}
      <Card padding="md">
        <div className="flex items-center gap-6">
          <div className="relative">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-sidebar flex items-center justify-center text-white text-2xl font-bold">
                {(form.prenom[0] ?? '').toUpperCase()}{(form.nom[0] ?? '').toUpperCase()}
              </div>
            )}
            <button
              type="button"
              aria-label={t.settings.changePhoto}
              onClick={choisirPhoto}
              disabled={uploadPhoto}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              <Camera size={14} className="text-sidebar" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={changerPhoto}
            />
          </div>
          <div>
            <p className="font-semibold text-text-main">{form.prenom} {form.nom}</p>
            <p className="text-sm text-text-muted mt-0.5">{user?.role ?? t.settings.defaultUser}</p>
            <button type="button" onClick={choisirPhoto} disabled={uploadPhoto} className="text-xs text-primary hover:underline mt-2 disabled:opacity-50">
              {uploadPhoto ? '…' : t.settings.uploadPhoto}
            </button>
            {photoErr && <p className="text-xs text-red-500 mt-1">{photoErr}</p>}
          </div>
        </div>
      </Card>

      {/* Formulaire */}
      <Card padding="md">
        <h3 className="text-base font-semibold text-text-main mb-5">{t.settings.profile}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t.settings.firstName}
            value={form.prenom}
            onChange={(e) => handleChange('prenom', e.target.value)}
          />
          <Input
            label={t.settings.lastName}
            value={form.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
          />
          <Input
            label={t.settings.email}
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
          <Input
            label={t.settings.phone}
            type="tel"
            value={form.telephone}
            onChange={(e) => handleChange('telephone', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">{t.settings.languageField}</label>
            <select
              value={form.langue}
              onChange={(e) => handleChange('langue', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">{t.settings.timezone}</label>
            <select
              value={form.fuseau}
              onChange={(e) => handleChange('fuseau', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="Africa/Abidjan">Abidjan (GMT+0)</option>
              <option value="Africa/Dakar">Dakar (GMT+0)</option>
              <option value="Africa/Lagos">Lagos (GMT+1)</option>
              <option value="Africa/Nairobi">Nairobi (GMT+3)</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button variante="primary" onClick={handleSave}>
            {t.common.save}
          </Button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">{t.common.success} ✓</span>
          )}
        </div>
      </Card>
    </div>
  );
}

// ——————————————————————————————————————
// Onglet Sécurité
// ——————————————————————————————————————
function OngletSecurite() {
  const t = useT();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deux_fa, setDeuxFa] = useState(false);
  const [pwForm, setPwForm] = useState({ ancien: '', nouveau: '', confirmer: '' });

  const sessions = [
    { id: '1', device: 'Chrome — macOS', ip: '41.202.207.12', date: "Aujourd'hui à 09:14", actuel: true },
    { id: '2', device: 'Firefox — Windows 11', ip: '41.202.207.15', date: 'Hier à 22:30', actuel: false },
    { id: '3', device: 'Mobile Safari — iPhone', ip: '41.202.207.20', date: '8 juil. à 15:42', actuel: false },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Changement mot de passe */}
      <Card padding="md">
        <h3 className="text-base font-semibold text-text-main mb-5">{t.settings.security}</h3>
        <div className="space-y-4">
          {[
            { field: 'ancien', label: t.settings.oldPassword, show: showOld, toggle: () => setShowOld((v) => !v) },
            { field: 'nouveau', label: t.settings.newPassword, show: showNew, toggle: () => setShowNew((v) => !v) },
            { field: 'confirmer', label: t.settings.confirmPassword, show: showConfirm, toggle: () => setShowConfirm((v) => !v) },
          ].map(({ field, label, show, toggle }) => (
            <div key={field} className="relative">
              <label className="block text-sm font-medium text-text-main mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pwForm[field as keyof typeof pwForm]}
                  onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={show ? t.settings.hidePassword : t.settings.showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Button variante="primary">{t.common.save}</Button>
        </div>
      </Card>

      {/* 2FA */}
      <Card padding="md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text-main">{t.settings.twoFactor}</h3>
            <p className="text-sm text-text-muted mt-1">
              {t.settings.twoFactorSub}
            </p>
          </div>
          <Toggle checked={deux_fa} onChange={setDeuxFa} label="" />
        </div>

        {deux_fa && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-sm text-text-main mb-3 font-medium">
              {t.settings.scanQr}
            </p>
            {/* QR Code fictif SVG */}
            <div className="inline-block p-3 bg-white border-2 border-gray-200 rounded-xl">
              <svg width="120" height="120" viewBox="0 0 120 120" aria-label={t.settings.qrLabel}>
                {Array.from({ length: 9 }, (_, row) =>
                  Array.from({ length: 9 }, (_, col) => {
                    const fill = ((row + col + row * col) % 3 === 0) || (row < 3 && col < 3) || (row < 3 && col > 5) || (row > 5 && col < 3);
                    return fill ? (
                      <rect key={`${row}-${col}`} x={col * 13 + 3} y={row * 13 + 3} width={11} height={11} fill="#1f2937" rx={1} />
                    ) : null;
                  })
                )}
              </svg>
            </div>
            <p className="text-xs text-text-muted mt-2">
              {t.settings.secretCode} <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">JBSWY3DPEHPK3PXP</code>
            </p>
          </div>
        )}
      </Card>

      {/* Sessions actives */}
      <Card padding="md">
        <h3 className="text-base font-semibold text-text-main mb-4">{t.settings.activeSessions}</h3>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main flex items-center gap-2">
                  {session.device}
                  {session.actuel && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">
                      {t.settings.currentSession}
                    </span>
                  )}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{session.ip} — {session.date}</p>
              </div>
              {!session.actuel && (
                <Button variante="danger" taille="sm">
                  {t.settings.revoke}
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ——————————————————————————————————————
// Onglet Notifications Paramètres
// ——————————————————————————————————————
const CATEGORIES = ['transactions', 'float', 'commissions', 'fraude', 'systeme'] as const;
const CANAUX = ['email', 'sms', 'push', 'inApp'] as const;

function OngletNotifications() {
  const t = useT();
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    CATEGORIES.forEach((cat) => {
      CANAUX.forEach((canal) => {
        init[`${cat}-${canal}`] = true;
      });
    });
    return init;
  });

  const toggle = (key: string) => setToggles((t) => ({ ...t, [key]: !t[key] }));

  return (
    <div className="space-y-6 max-w-3xl">
      <Card padding="md">
        <h3 className="text-base font-semibold text-text-main mb-5">{t.settings.notifications}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-text-muted font-medium pb-3 pr-6 min-w-[140px]">{t.settings.notifCategory}</th>
                {CANAUX.map((canal) => (
                  <th key={canal} className="text-center text-text-muted font-medium pb-3 px-4">{t.settings.notifChannels[canal]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {CATEGORIES.map((cat) => (
                <tr key={cat}>
                  <td className="py-3 pr-6 font-medium text-text-main">{t.settings.notifCategories[cat]}</td>
                  {CANAUX.map((canal) => {
                    const key = `${cat}-${canal}`;
                    return (
                      <td key={canal} className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            checked={toggles[key]}
                            onChange={() => toggle(key)}
                            aria-label={t.settings.notifVia
                              .replace('{cat}', t.settings.notifCategories[cat])
                              .replace('{canal}', t.settings.notifChannels[canal])}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <Button variante="primary">{t.common.save}</Button>
        </div>
      </Card>
    </div>
  );
}

// ——————————————————————————————————————
// Onglet Apparence
// ——————————————————————————————————————
function OngletApparence() {
  const t = useT();
  const [theme, setTheme] = useState<'clair' | 'sombre' | 'systeme'>('clair');
  const [densite, setDensite] = useState<'compact' | 'normal' | 'confortable'>('normal');
  const [langue, setLangue] = useState('fr');

  return (
    <div className="space-y-6 max-w-2xl">
      <Card padding="md">
        <h3 className="text-base font-semibold text-text-main mb-5">{t.settings.theme}</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'clair' as const, label: t.settings.light, icon: '☀️' },
            { key: 'sombre' as const, label: t.settings.dark, icon: '🌙' },
            { key: 'systeme' as const, label: t.settings.system, icon: '🖥️' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={clsx(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
                theme === key
                  ? 'border-primary bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-sm font-medium text-text-main">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-base font-semibold text-text-main mb-5">{t.settings.density}</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'compact' as const, label: t.settings.compact, desc: '' },
            { key: 'normal' as const, label: t.settings.normal, desc: '' },
            { key: 'confortable' as const, label: t.settings.comfortable, desc: '' },
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => setDensite(key)}
              className={clsx(
                'flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-colors',
                densite === key
                  ? 'border-primary bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <span className="text-sm font-semibold text-text-main">{label}</span>
              <span className="text-xs text-text-muted">{desc}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-base font-semibold text-text-main mb-4">{t.settings.language}</h3>
        <div className="flex gap-3">
          {[
            { value: 'fr', label: '🇫🇷 Français' },
            { value: 'en', label: '🇬🇧 English' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setLangue(value)}
              className={clsx(
                'px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors',
                langue === value
                  ? 'border-primary bg-yellow-50 text-text-main'
                  : 'border-gray-200 text-text-muted hover:border-gray-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-6">
          <Button variante="primary">{t.settings.apply}</Button>
        </div>
      </Card>
    </div>
  );
}

// ——————————————————————————————————————
// Page principale
// ——————————————————————————————————————
export default function SettingsPage() {
  const { reset: resetOnboarding } = useOnboarding();
  const [onboardingReset, setOnboardingReset] = React.useState(false);
  const t = useT();

  const handleRelancerGuide = () => {
    resetOnboarding();
    setOnboardingReset(true);
    setTimeout(() => window.location.reload(), 300);
  };

  const tabs = [
    { key: 'profil', label: t.settings.profile, content: <OngletProfil /> },
    { key: 'securite', label: t.settings.security, content: <OngletSecurite /> },
    { key: 'notifications', label: t.settings.notifications, content: <OngletNotifications /> },
    { key: 'apparence', label: t.settings.appearance, content: <OngletApparence /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-main">{t.settings.title}</h1>
        <p className="text-sm text-text-muted mt-1">{t.settings.subtitle}</p>
      </div>

      <Tabs tabs={tabs} defaultTab="profil" />

      {/* Guide de démarrage */}
      <div className="bg-white dark:bg-white/03 rounded-card shadow-card p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">{t.settings.guide}</p>
            <p className="text-xs text-text-muted mt-0.5">{t.settings.guideSub}</p>
          </div>
        </div>
        <Button
          variante="secondary"
          taille="sm"
          onClick={handleRelancerGuide}
          loading={onboardingReset}
        >
          {t.settings.relaunchGuide}
        </Button>
      </div>
    </div>
  );
}
