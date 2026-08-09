'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Edit3, X, Calendar, Phone, Mail, Clock, Activity, Camera, Shield, Monitor, Trash2, Bell } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Setup2FAModal } from '@/components/ui/Setup2FAModal';
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/formatters';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useT } from '@/lib/i18n';

// ─── Types ────────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  super_admin: 'warning', SUPER_ADMIN: 'warning',
  admin: 'info', ADMIN: 'info', NETWORK_ADMIN: 'info',
  superviseur: 'success', SUPERVISEUR: 'success', AGENCY_MANAGER: 'success',
  agent: 'neutral', AGENT: 'neutral',
  ACCOUNTANT: 'info', AUDITOR: 'neutral',
  caissier: 'neutral', CAISSIER: 'neutral',
};

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  detail: string;
  date: string;
  type: string;
}

interface ActiveSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

const ACTION_ICON: Record<string, string> = {
  LOGIN: '🔐', LOGOUT: '🔓', CREATE: '✏️', UPDATE: '⚙️',
  DELETE: '🗑️', EXPORT: '📤', VIEW: '👁️', APPROVE: '✅',
  REJECT: '❌', SUSPEND: '🚫', ACTIVATE: '🟢',
};

const MOCK_AUDIT: AuditEntry[] = [
  { id: 'm1', action: 'LOGIN', resource: 'session', detail: 'Chrome — session démarrée', date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), type: 'auth' },
  { id: 'm2', action: 'CREATE', resource: 'transaction', detail: 'Retrait MTN MoMo — 75 000 XOF', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'transaction' },
  { id: 'm3', action: 'EXPORT', resource: 'rapport', detail: 'Rapport mensuel — Juin 2026', date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), type: 'report' },
  { id: 'm4', action: 'UPDATE', resource: 'settings', detail: 'Mise à jour du fuseau horaire', date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), type: 'settings' },
  { id: 'm5', action: 'CREATE', resource: 'transaction', detail: 'Dépôt Orange Money — 120 000 XOF', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'transaction' },
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function parseUserAgent(ua: string | null): string {
  if (!ua) return '';
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    if (/iPhone|iPad/i.test(ua)) return 'iOS';
    return 'Android';
  }
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua)) return 'Safari';
  if (/Edge/i.test(ua)) return 'Edge';
  return 'Navigateur';
}

function passwordStrength(pwd: string): 0 | 1 | 2 {
  if (pwd.length < 8) return 0;
  const strong = /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd) && pwd.length >= 12;
  const medium = pwd.length >= 8 && (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd));
  return strong ? 2 : medium ? 1 : 0;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useUserAuditLogs(userId: string | undefined) {
  return useQuery<AuditEntry[]>({
    queryKey: ['audit', 'user', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const res = await api.get(`/audit/logs/user/${userId}`, { params: { limit: 10 } });
        const items: Record<string, unknown>[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        return items.map((e) => ({
          id: String(e.id ?? ''),
          action: String(e.action ?? 'VIEW'),
          resource: String(e.resource ?? e.resourceType ?? ''),
          detail: ((): string => {
            const d = e.details ?? e.description ?? e.resourceId;
            if (d == null) return '';
            if (typeof d === 'string') return d;
            if (typeof d === 'object') {
              const o = d as Record<string, unknown>;
              return String(
                o.message ?? o.motif ?? o.description ??
                Object.entries(o).map(([k, val]) => `${k}: ${val}`).join(' · '),
              );
            }
            return String(d);
          })(),
          date: String(e.createdAt ?? e.timestamp ?? new Date().toISOString()),
          type: String(e.type ?? e.category ?? 'other'),
        }));
      } catch {
        return MOCK_AUDIT;
      }
    },
  });
}

function useUserStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['audit', 'stats', userId],
    enabled: !!userId,
    staleTime: 120_000,
    queryFn: async () => {
      try {
        const [auditRes, sessionsRes] = await Promise.allSettled([
          api.get(`/audit/logs/user/${userId}`, { params: { limit: 1000 } }),
          api.get('/auth/sessions'),
        ]);
        const logs = auditRes.status === 'fulfilled'
          ? (Array.isArray(auditRes.value.data?.data) ? auditRes.value.data.data : Array.isArray(auditRes.value.data) ? auditRes.value.data : [])
          : [];
        const sessions = sessionsRes.status === 'fulfilled'
          ? (Array.isArray(sessionsRes.value.data?.data) ? sessionsRes.value.data.data : Array.isArray(sessionsRes.value.data) ? sessionsRes.value.data : [])
          : [];
        return {
          nbTransactions: logs.filter((l: Record<string, unknown>) => String(l.resource ?? l.resourceType ?? '').toLowerCase().includes('transaction')).length,
          nbSessions: sessions.length || logs.filter((l: Record<string, unknown>) => l.action === 'LOGIN').length,
          derniereConnexion: logs.find((l: Record<string, unknown>) => l.action === 'LOGIN')?.createdAt as string ?? null,
        };
      } catch {
        return { nbTransactions: 0, nbSessions: 0, derniereConnexion: null };
      }
    },
  });
}

function useActiveSessions() {
  return useQuery<ActiveSession[]>({
    queryKey: ['auth', 'sessions'],
    staleTime: 30_000,
    queryFn: async () => {
      try {
        const res = await api.get('/auth/sessions');
        const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
        return data;
      } catch {
        return [];
      }
    },
  });
}

// ─── Composant : Modifier le profil ──────────────────────────────────────────

function ModalModifier({ onClose, prenom, nom, email }: { onClose: () => void; prenom: string; nom: string; email: string }) {
  const [form, setForm] = useState({ prenom, nom, email, telephone: '' });
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-main">{t.profile.modalTitle}</h2>
          <button onClick={onClose} aria-label={t.profile.close} className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t.profile.firstName} value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} />
            <Input label={t.profile.lastName} value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
          </div>
          <Input label={t.profile.email} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label={t.profile.phone} value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} />
        </div>
        <div className="flex gap-3 mt-6">
          <Button variante="primary" fullWidth onClick={onClose}>{t.profile.save}</Button>
          <Button variante="ghost" fullWidth onClick={onClose}>{t.profile.cancel}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant : Photo de profil ─────────────────────────────────────────────

function SectionPhoto({ avatar, initiales }: { avatar?: string; initiales: string }) {
  const t = useT();
  const { updateUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(t.profile.photoFormatError);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(t.profile.photoSizeError);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      // Redimensionner à 300×300 via Canvas avant prévisualisation / envoi
      const img = new window.Image();
      img.onload = () => {
        const SIZE = 300;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) { setPreview(src); return; }
        // Crop carré centré
        const minSide = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth  - minSide) / 2;
        const sy = (img.naturalHeight - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, SIZE, SIZE);
        setPreview(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setUploading(true);
    setError('');
    try {
      const res = await api.post('/auth/avatar', { image: preview });
      const newAvatar = res.data?.avatar ?? preview;
      updateUser({ avatar: newAvatar });
      setPreview(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError(t.profile.photoError);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const currentAvatar = preview ?? avatar;

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera size={16} className="text-primary" />
          {t.profile.photoTitle}
        </CardTitle>
      </CardHeader>
      <div className="flex items-center gap-6 flex-wrap">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-primary flex items-center justify-center">
            {currentAvatar ? (
              <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold">{initiales}</span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
            aria-label={t.profile.photoChange}
          >
            <Camera size={14} className="text-white" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex-1 space-y-3 min-w-0">
          <p className="text-sm text-text-muted">{t.profile.photoHint}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
          {preview ? (
            <div className="flex gap-2 flex-wrap">
              <Button
                variante="primary"
                onClick={handleConfirm}
                disabled={uploading}
              >
                {uploading ? t.profile.photoUploading : t.profile.photoConfirm}
              </Button>
              <Button variante="ghost" onClick={handleCancel}>{t.profile.photoCancel}</Button>
            </div>
          ) : (
            <Button variante="ghost" icone={<Camera size={15} />} onClick={() => fileRef.current?.click()}>
              {t.profile.photoChange}
            </Button>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{t.profile.photoSuccess}</p>}
        </div>
      </div>
    </Card>
  );
}

// ─── Composant : Changement de mot de passe ──────────────────────────────────

function SectionMotDePasse() {
  const t = useT();
  const [form, setForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(form.newPwd);
  const strengthLabel = form.newPwd
    ? strength === 2 ? t.profile.pwdStrong : strength === 1 ? t.profile.pwdMedium : t.profile.pwdWeak
    : '';
  const strengthColor = strength === 2 ? 'bg-green-500' : strength === 1 ? 'bg-yellow-400' : 'bg-red-400';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (form.newPwd.length < 8) { setError(t.profile.pwdTooShort); return; }
    if (form.newPwd !== form.confirm) { setError(t.profile.pwdMismatch); return; }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.current,
        newPassword: form.newPwd,
        confirmPassword: form.confirm,
      });
      setForm({ current: '', newPwd: '', confirm: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t.profile.pwdError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          {t.profile.pwdTitle}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t.profile.pwdCurrent}
          type="password"
          value={form.current}
          onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
          required
          autoComplete="current-password"
        />
        <div className="space-y-1">
          <Input
            label={t.profile.pwdNew}
            type="password"
            value={form.newPwd}
            onChange={(e) => setForm((f) => ({ ...f, newPwd: e.target.value }))}
            required
            autoComplete="new-password"
          />
          {form.newPwd && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-1 flex-1 max-w-[120px]">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-text-muted">
                {t.profile.pwdStrength} <span className="font-medium">{strengthLabel}</span>
              </span>
            </div>
          )}
        </div>
        <Input
          label={t.profile.pwdConfirm}
          type="password"
          value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          required
          autoComplete="new-password"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{t.profile.pwdSuccess}</p>}
        <Button variante="primary" type="submit" disabled={loading}>
          {loading ? t.profile.pwdSubmitting : t.profile.pwdSubmit}
        </Button>
      </form>
    </Card>
  );
}

// ─── Composant : Sessions actives ────────────────────────────────────────────

function SectionSessions() {
  const t = useT();
  const qc = useQueryClient();
  const { data: sessions = [], isLoading } = useActiveSessions();
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const handleRevoke = useCallback(async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      qc.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    } catch {
      // silently ignore
    } finally {
      setRevoking(null);
    }
  }, [qc]);

  const handleRevokeAll = useCallback(async () => {
    if (!confirm(t.profile.sessionsRevokeAllConfirm)) return;
    setRevokingAll(true);
    try {
      await api.delete('/auth/sessions/all');
      qc.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    } catch {
      // silently ignore
    } finally {
      setRevokingAll(false);
    }
  }, [qc, t]);

  const othersCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <Card padding="md">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-main flex items-center gap-2">
            <Monitor size={16} className="text-primary" />
            {t.profile.sessionsTitle}
          </h3>
          <p className="text-sm text-text-muted mt-0.5">{t.profile.sessionsSubtitle}</p>
        </div>
        {othersCount > 0 && (
          <Button
            variante="ghost"
            icone={<Trash2 size={14} />}
            onClick={handleRevokeAll}
            disabled={revokingAll}
          >
            {revokingAll ? t.profile.sessionsRevoking : t.profile.sessionsRevokeAll}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-text-muted font-medium pb-3 pr-4">{t.profile.sessionsColDevice}</th>
              <th className="text-left text-text-muted font-medium pb-3 pr-4">{t.profile.sessionsColIp}</th>
              <th className="text-left text-text-muted font-medium pb-3 pr-4 whitespace-nowrap">{t.profile.sessionsColDate}</th>
              <th className="text-right text-text-muted font-medium pb-3">{t.profile.sessionsColActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="py-3 pr-4"><Skeleton hauteur={14} largeur={160} /></td>
                  <td className="py-3 pr-4"><Skeleton hauteur={14} largeur={100} /></td>
                  <td className="py-3 pr-4"><Skeleton hauteur={14} largeur={90} /></td>
                  <td className="py-3"><Skeleton hauteur={28} largeur={70} /></td>
                </tr>
              ))
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-muted text-sm">
                  {t.profile.sessionsEmpty}
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const device = parseUserAgent(session.userAgent) || t.profile.sessionsUnknownDevice;
                const ip = session.ipAddress || t.profile.sessionsUnknownIp;
                return (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Monitor size={14} className="text-text-muted shrink-0" />
                        <span className="font-medium text-text-main truncate max-w-[160px]">{device}</span>
                        {session.isCurrent && (
                          <Badge couleur="success">{t.profile.sessionsCurrent}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-text-muted font-mono text-xs">{ip}</td>
                    <td className="py-3 pr-4 text-text-muted whitespace-nowrap">
                      {formatRelativeTime(session.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      {!session.isCurrent && (
                        <Button
                          variante="ghost"
                          onClick={() => handleRevoke(session.id)}
                          disabled={revoking === session.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1"
                        >
                          {revoking === session.id ? t.profile.sessionsRevoking : t.profile.sessionsRevoke}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Composant : Authentification à deux facteurs ────────────────────────────

function Section2FA() {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDesactiverModal, setShowDesactiverModal] = useState(false);
  const [motDePasse, setMotDePasse] = useState('');
  const [erreurDesactiver, setErreurDesactiver] = useState('');
  const [loadingDesactiver, setLoadingDesactiver] = useState(false);
  const [successDesactiver, setSuccessDesactiver] = useState(false);

  // Récupérer l'état 2FA depuis /auth/me
  const { data: profil, isLoading, refetch } = useQuery<{ twoFactorEnabled?: boolean }>({
    queryKey: ['profil', '2fa'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    },
    staleTime: 30_000,
  });

  const est2FAActive = profil?.twoFactorEnabled ?? false;

  const handleDesactiver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurDesactiver('');
    setLoadingDesactiver(true);
    try {
      await api.post('/auth/2fa/desactiver', { motDePasse });
      setSuccessDesactiver(true);
      setMotDePasse('');
      setTimeout(() => {
        setShowDesactiverModal(false);
        setSuccessDesactiver(false);
        refetch();
      }, 1500);
    } catch (e: any) {
      setErreurDesactiver(e?.response?.data?.message ?? 'Erreur, vérifiez votre mot de passe');
    } finally {
      setLoadingDesactiver(false);
    }
  };

  return (
    <>
      <Card padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            Authentification à deux facteurs
          </CardTitle>
        </CardHeader>

        {isLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton hauteur={28} largeur={80} rounded="lg" />
            <Skeleton hauteur={28} largeur={120} rounded="lg" />
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {est2FAActive ? (
                  <Badge couleur="success" point>Activée</Badge>
                ) : (
                  <Badge couleur="neutral">Désactivée</Badge>
                )}
              </div>
              <p className="text-sm text-text-muted">
                {est2FAActive
                  ? 'Votre compte est protégé par un code TOTP (Google Authenticator / Authy).'
                  : 'Ajoutez une couche de sécurité supplémentaire à votre compte.'}
              </p>
            </div>
            {est2FAActive ? (
              <Button variante="ghost" onClick={() => setShowDesactiverModal(true)}>
                Désactiver
              </Button>
            ) : (
              <Button variante="primary" onClick={() => setShowSetupModal(true)}>
                Activer la 2FA
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Modal activation */}
      {showSetupModal && (
        <Setup2FAModal
          onClose={() => setShowSetupModal(false)}
          onActivated={() => refetch()}
        />
      )}

      {/* Modal désactivation */}
      {showDesactiverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDesactiverModal(false)} aria-hidden="true" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Shield size={18} className="text-red-500" /> Désactiver la 2FA
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Entrez votre mot de passe pour confirmer la désactivation.
            </p>
            {successDesactiver ? (
              <p className="text-sm text-green-600 font-medium text-center py-4">2FA désactivée avec succès.</p>
            ) : (
              <form onSubmit={handleDesactiver} className="space-y-3">
                <input
                  type="password"
                  placeholder="Votre mot de passe"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
                {erreurDesactiver && <p className="text-sm text-red-600">{erreurDesactiver}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loadingDesactiver || !motDePasse}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
                  >
                    {loadingDesactiver ? 'Vérification…' : 'Confirmer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDesactiverModal(false); setErreurDesactiver(''); setMotDePasse(''); }}
                    className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Composant : Notifications push ──────────────────────────────────────────

function SectionNotificationsPush() {
  const { permission, isSubscribed, supported, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!supported) {
    return (
      <Card padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            Notifications push
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-text-muted">
          Votre navigateur ne prend pas en charge les notifications push.
        </p>
      </Card>
    );
  }

  const permissionLabel = permission === 'granted'
    ? 'Autorisées'
    : permission === 'denied'
    ? 'Refusées par le navigateur'
    : 'Non demandées';

  const permissionColor = permission === 'granted'
    ? 'text-green-600'
    : permission === 'denied'
    ? 'text-red-600'
    : 'text-yellow-600';

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={16} className="text-primary" />
          Notifications push
        </CardTitle>
      </CardHeader>

      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-text-main font-medium">
              {isSubscribed ? 'Notifications activées' : 'Notifications désactivées'}
            </p>
            <p className={`text-xs mt-0.5 ${permissionColor}`}>
              Autorisation navigateur : {permissionLabel}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Recevez des alertes en temps réel pour les floats bas et les transactions validées, même quand l&apos;onglet est fermé.
            </p>
          </div>

          {permission === 'denied' ? (
            <p className="text-xs text-red-600 max-w-xs">
              Les notifications ont été bloquées. Pour les réactiver, modifiez les permissions dans les paramètres de votre navigateur.
            </p>
          ) : isSubscribed ? (
            <Button
              variante="ghost"
              onClick={unsubscribe}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
            >
              {loading ? 'Désactivation…' : 'Désactiver'}
            </Button>
          ) : (
            <Button
              variante="primary"
              icone={<Bell size={15} />}
              onClick={subscribe}
              disabled={loading}
              className="shrink-0"
            >
              {loading ? 'Activation…' : 'Activer les notifications'}
            </Button>
          )}
        </div>

        {isSubscribed && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 rounded-lg px-3 py-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0" />
            Vous recevrez des alertes pour les floats bas et les transactions validées.
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuthStore();
  const t = useT();
  const roleLabels = t.profile.roles as Record<string, string>;

  const prenom = user?.prenom ?? t.profile.defaultUser;
  const nom = user?.nom ?? '';
  const email = user?.email ?? '';
  const role = user?.role ?? 'admin';
  const createdAt = user?.createdAt ?? new Date().toISOString();
  const initiales = `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
  const avatar = user?.avatar;

  const { data: auditLogs = [], isLoading: logsLoading } = useUserAuditLogs(user?.id);
  const { data: userStats, isLoading: statsLoading } = useUserStats(user?.id);

  const derniereConnexion = userStats?.derniereConnexion
    ? new Date(userStats.derniereConnexion)
    : new Date(Date.now() - 30 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">{t.profile.title}</h1>
          <p className="text-sm text-text-muted mt-1">{t.profile.subtitle}</p>
        </div>
        <Button variante="primary" icone={<Edit3 size={16} />} onClick={() => setModalOpen(true)}>
          {t.profile.edit}
        </Button>
      </div>

      {/* Carte identité */}
      <Card padding="none">
        <div className="h-24 rounded-t-card" style={{ background: 'linear-gradient(135deg, #1E8C32 0%, #0e1a0e 100%)' }} />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-primary flex items-center justify-center shrink-0">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold">{initiales}</span>
                )}
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-text-main">{prenom} {nom}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge couleur={ROLE_COLORS[role] ?? 'neutral'}>{roleLabels[role] ?? role}</Badge>
                  {user?.actif && <Badge couleur="success" point>{t.profile.active}</Badge>}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {[
              { icon: <Mail size={15} />, label: email || t.profile.notProvided },
              { icon: <Phone size={15} />, label: t.profile.notProvided },
              { icon: <Calendar size={15} />, label: t.profile.memberSince.replace('{date}', formatDate(createdAt)) },
            ].map(({ icon, label }, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-text-muted">
                <span className="shrink-0">{icon}</span>
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} padding="md">
              <div className="flex items-start gap-3">
                <Skeleton hauteur={32} largeur={32} rounded="lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton hauteur={12} largeur="60%" />
                  <Skeleton hauteur={24} largeur="40%" />
                  <Skeleton hauteur={11} largeur="80%" />
                </div>
              </div>
            </Card>
          ))
        ) : (
          [
            {
              label: t.profile.statTransactions,
              value: (userStats?.nbTransactions ?? 0).toLocaleString('fr-FR'),
              icon: '💳',
              desc: t.profile.statTransactionsDesc,
            },
            {
              label: t.profile.statSessions,
              value: (userStats?.nbSessions ?? 0).toLocaleString('fr-FR'),
              icon: '🔐',
              desc: t.profile.statSessionsDesc,
            },
            {
              label: t.profile.statLastLogin,
              value: formatRelativeTime(derniereConnexion.toISOString()),
              icon: '🕐',
              desc: formatDateTime(derniereConnexion.toISOString()),
            },
          ].map(({ label, value, icon, desc }) => (
            <Card key={label} padding="md">
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">{icon}</span>
                <div>
                  <p className="text-sm text-text-muted">{label}</p>
                  <p className="text-xl font-bold text-text-main mt-0.5">{value}</p>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Photo de profil */}
      <SectionPhoto avatar={avatar} initiales={initiales} />

      {/* Changement de mot de passe */}
      <SectionMotDePasse />

      {/* Authentification à deux facteurs */}
      <Section2FA />

      {/* Notifications push */}
      <SectionNotificationsPush />

      {/* Sessions actives */}
      <SectionSessions />

      {/* Historique des activités */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>{t.profile.activityTitle}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Activity size={14} />
            <span>{t.profile.lastActions.replace('{n}', String(auditLogs.length))}</span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-text-muted font-medium pb-3 pr-4">{t.profile.colAction}</th>
                <th className="text-left text-text-muted font-medium pb-3 pr-4">{t.profile.colDetail}</th>
                <th className="text-left text-text-muted font-medium pb-3 whitespace-nowrap">
                  <Clock size={13} className="inline mr-1" />{t.profile.colDate}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-4"><Skeleton hauteur={14} largeur={120} /></td>
                    <td className="py-3 pr-4"><Skeleton hauteur={14} largeur={200} /></td>
                    <td className="py-3"><Skeleton hauteur={14} largeur={80} /></td>
                  </tr>
                ))
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-text-muted text-sm">
                    {t.profile.noActivity}
                  </td>
                </tr>
              ) : (
                auditLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true">{ACTION_ICON[item.action] ?? '📋'}</span>
                        <span className="font-medium text-text-main">{item.action}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-text-muted max-w-xs truncate">{item.detail || item.resource}</td>
                    <td className="py-3 whitespace-nowrap text-text-muted">{formatRelativeTime(item.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <ModalModifier onClose={() => setModalOpen(false)} prenom={prenom} nom={nom} email={email} />
      )}
    </div>
  );
}
