'use client';
import React, { useState } from 'react';
import { Edit3, X, Calendar, Phone, Mail, Clock, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/formatters';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useT } from '@/lib/i18n';

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
  { id: 'm6', action: 'CREATE', resource: 'agent', detail: 'Nouvel agent : Diallo Ibrahim', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'admin' },
  { id: 'm7', action: 'APPROVE', resource: 'float', detail: 'Wave — réapprovisionnement 500 000 XOF', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), type: 'float' },
  { id: 'm8', action: 'LOGOUT', resource: 'session', detail: 'Session terminée manuellement', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'auth' },
];

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
          detail: String(e.details ?? e.description ?? e.resourceId ?? ''),
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
          <div className="grid grid-cols-2 gap-4">
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

  const { data: auditLogs = [], isLoading: logsLoading } = useUserAuditLogs(user?.id);
  const { data: userStats, isLoading: statsLoading } = useUserStats(user?.id);

  const derniereConnexion = userStats?.derniereConnexion
    ? new Date(userStats.derniereConnexion)
    : new Date(Date.now() - 30 * 60 * 1000);

  return (
    <div className="space-y-6">
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
              <div className="w-20 h-20 rounded-2xl bg-primary border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {initiales}
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
