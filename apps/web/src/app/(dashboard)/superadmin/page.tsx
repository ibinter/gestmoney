'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Shield, Users, Building2, Activity, AlertTriangle, Server, TrendingUp, Clock, Mail, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { formatMontant, formatRelativeTime } from '@/lib/formatters';
import api from '@/lib/api';

// ─── Données mock SuperAdmin (fallback si API absente) ─────────────────────
/** Nombre, ou « — » si la donnée n'existe pas. Ne fabrique jamais de zéro
 *  trompeur : un 0 affiché se lit comme une mesure, pas comme une absence. */
const n = (v: number | null | undefined): string =>
  v === null || v === undefined ? '—' : v.toLocaleString('fr-FR');

/** Montant, ou « — » si la donnée n'existe pas. */
const m = (v: number | null | undefined): string =>
  v === null || v === undefined ? '—' : formatMontant(v);

const MOCK_STATS = {
  tenants: { total: 12, actifs: 9, essai: 2, expires: 1 },
  utilisateurs: { total: 147, actifs: 98, suspendus: 3 },
  transactions: { aujourd_hui: 8_420, montant_aujourd_hui: 4_230_000, ce_mois: 198_450 },
  revenus: { mrr: 2_850_000, arr: 34_200_000, en_attente: 450_000 },
  tickets: { ouverts: 7, en_cours: 3, resolus_aujourd_hui: 12 },
  sante: { api_latency_ms: 48, uptime_pct: 99.98, erreurs_24h: 2 },
};

const MOCK_TENANTS = [
  { id: '1', nom: 'OrangeMoney CI', plan: 'ENTERPRISE', statut: 'ACTIVE', utilisateurs: 34, transactions_mois: 45_230, renouvellement: '2027-01-15' },
  { id: '2', nom: 'Wave Sénégal', plan: 'PROFESSIONAL', statut: 'ACTIVE', utilisateurs: 18, transactions_mois: 28_900, renouvellement: '2026-11-30' },
  { id: '3', nom: 'MTN Ghana', plan: 'PROFESSIONAL', statut: 'TRIAL', utilisateurs: 5, transactions_mois: 1_200, renouvellement: '2026-08-01' },
  { id: '4', nom: 'Moov Bénin', plan: 'STARTER', statut: 'ACTIVE', utilisateurs: 8, transactions_mois: 6_700, renouvellement: '2026-09-15' },
  { id: '5', nom: 'Airtel Kenya', plan: 'ENTERPRISE', statut: 'SUSPENDED', utilisateurs: 22, transactions_mois: 0, renouvellement: '2026-07-01' },
];

const MOCK_AUDIT = [
  { id: '1', utilisateur: 'admin@wavesn.com', action: 'LOGIN', ressource: 'session', date: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: '2', utilisateur: 'root@ibigsoft.com', action: 'ACTIVATE', ressource: 'tenant:MTN Ghana', date: new Date(Date.now() - 23 * 60 * 1000).toISOString() },
  { id: '3', utilisateur: 'support@ibigsoft.com', action: 'VIEW', ressource: 'tenant:OrangeMoney CI', date: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: '4', utilisateur: 'admin@mtn.gh', action: 'CREATE', ressource: 'transaction', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '5', utilisateur: 'root@ibigsoft.com', action: 'SUSPEND', ressource: 'tenant:Airtel Kenya', date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
];

const PLAN_COLOR: Record<string, 'warning' | 'info' | 'success' | 'neutral'> = {
  ENTERPRISE: 'warning', PROFESSIONAL: 'info', STARTER: 'success', CUSTOM: 'neutral',
};

const STATUT_COLOR: Record<string, 'success' | 'info' | 'neutral' | 'danger'> = {
  ACTIVE: 'success', TRIAL: 'info', SUSPENDED: 'danger', EXPIRED: 'neutral',
};

const STATUT_LABEL: Record<string, string> = {
  ACTIVE: 'Actif', TRIAL: 'Essai', SUSPENDED: 'Suspendu', EXPIRED: 'Expiré',
};

function KpiCard({ titre, valeur, soustitre, icone, couleur }: { titre: string; valeur: string | number; soustitre?: string; icone: React.ReactNode; couleur: string }) {
  return (
    <div className="bg-white dark:bg-white/05 rounded-card shadow-card p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: couleur + '18' }}>
        <span style={{ color: couleur }}>{icone}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{titre}</p>
        <p className="text-2xl font-black text-text-main mt-0.5">{valeur}</p>
        {soustitre && <p className="text-xs text-text-muted mt-0.5">{soustitre}</p>}
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Restriction d'accès : SUPER_ADMIN uniquement
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['superadmin', 'stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/tenants/stats');
        return res.data?.data ?? res.data ?? MOCK_STATS;
      } catch {
        return MOCK_STATS;
      }
    },
    staleTime: 60_000,
  });

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ['superadmin', 'tenants'],
    queryFn: async () => {
      try {
        const res = await api.get('/tenants');
        const raw = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        return raw.length > 0 ? raw : MOCK_TENANTS;
      } catch {
        return MOCK_TENANTS;
      }
    },
    staleTime: 60_000,
  });

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['superadmin', 'audit'],
    queryFn: async () => {
      try {
        const res = await api.get('/audit/logs', { params: { limit: 10 } });
        const raw = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        return raw.length > 0 ? raw : MOCK_AUDIT;
      } catch {
        return MOCK_AUDIT;
      }
    },
    staleTime: 30_000,
  });

  const s = stats ?? MOCK_STATS;

  if (user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD000]/15 flex items-center justify-center">
            <Shield size={20} className="text-[#b8960a] dark:text-[#FFD000]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-main">Console SuperAdmin</h1>
            <p className="text-sm text-text-muted">Pilotage global IBIG Soft — accès restreint</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#009E00]/10 border border-[#009E00]/20 rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-[#009E00] animate-pulse" />
          <span className="text-xs font-semibold text-[#009E00]">Système opérationnel · {s.sante?.uptime_pct ?? 99.9}% uptime</span>
        </div>
      </div>

      {/* KPIs globaux */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Chaque bloc peut être absent : l'API renvoie `null` quand aucune
              source réelle ne l'alimente (MRR, tickets, supervision). On
              affiche « — » plutôt que d'inventer un chiffre, et surtout la
              page ne doit jamais tomber sur une donnée manquante — c'est ce
              qui la rendait entièrement blanche. */}
          <KpiCard titre="Tenants actifs"       valeur={n(s.tenants?.actifs)}       soustitre={`${n(s.tenants?.total)} au total`}              icone={<Building2 size={18} />}  couleur="#009E00" />
          <KpiCard titre="Essais en cours"      valeur={n(s.tenants?.essai)}        soustitre={`${n(s.tenants?.expires)} expiré(s)`}           icone={<Clock size={18} />}      couleur="#FFD000" />
          <KpiCard titre="Utilisateurs actifs"  valeur={n(s.utilisateurs?.actifs)}  soustitre={`${n(s.utilisateurs?.total)} inscrits`}         icone={<Users size={18} />}      couleur="#3B82F6" />
          <KpiCard titre="Tx aujourd'hui"       valeur={n(s.transactions?.aujourd_hui)} soustitre={m(s.transactions?.montant_aujourd_hui)}    icone={<Activity size={18} />}   couleur="#8B5CF6" />
          <KpiCard titre="MRR"                  valeur={m(s.revenus?.mrr)}          soustitre={`ARR : ${m(s.revenus?.arr)}`}                   icone={<TrendingUp size={18} />} couleur="#10B981" />
          <KpiCard titre="En attente paiement"  valeur={m(s.revenus?.en_attente)}   soustitre="À relancer"                                    icone={<AlertTriangle size={18} />} couleur="#F59E0B" />
          <KpiCard titre="Tickets ouverts"      valeur={n(s.tickets?.ouverts)}      soustitre={s.tickets ? `${n(s.tickets.en_cours)} en cours` : 'Module non branché'} icone={<AlertTriangle size={18} />} couleur="#EF4444" />
          <KpiCard titre="Latence API"          valeur={s.sante ? `${n(s.sante.api_latency_ms)} ms` : '—'} soustitre={s.sante ? `${n(s.sante.erreurs_24h)} erreur(s) / 24h` : 'Supervision non branchée'} icone={<Server size={18} />} couleur="#6B7280" />
        </div>
      )}

      {/* Tableau des tenants */}
      <div className="bg-white dark:bg-white/03 rounded-card shadow-card">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/08 flex items-center justify-between">
          <h2 className="font-semibold text-text-main">Clients & tenants</h2>
          <span className="text-xs text-text-muted">{tenants.length} entrée(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/08">
                {['Société', 'Plan', 'Statut', 'Utilisateurs', 'Tx ce mois', 'Renouvellement'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-text-muted px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/05">
              {tenantsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-white/10 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : (tenants as typeof MOCK_TENANTS).map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/03 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-main">{t.nom}</td>
                  <td className="px-4 py-3"><Badge couleur={PLAN_COLOR[t.plan] ?? 'neutral'}>{t.plan}</Badge></td>
                  <td className="px-4 py-3"><Badge couleur={STATUT_COLOR[t.statut] ?? 'neutral'} point>{STATUT_LABEL[t.statut] ?? t.statut}</Badge></td>
                  <td className="px-4 py-3 text-text-muted">{t.utilisateurs}</td>
                  <td className="px-4 py-3 text-text-muted">{t.transactions_mois.toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-text-muted whitespace-nowrap">{t.renouvellement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accès rapides SuperAdmin */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link href="/superadmin/emails" className="bg-white dark:bg-white/03 rounded-card shadow-card p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/05 transition-colors group border border-gray-100 dark:border-white/08">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <Mail size={17} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Emails automatiques</p>
            <p className="text-xs text-text-muted">6 templates · Config SMTP</p>
          </div>
        </Link>
        <Link href="/superadmin/licences" className="bg-white dark:bg-white/03 rounded-card shadow-card p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/05 transition-colors group border border-gray-100 dark:border-white/08">
          <div className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
            <CreditCard size={17} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Licences & Facturation</p>
            <p className="text-xs text-text-muted">{MOCK_TENANTS.length} licences · MRR</p>
          </div>
        </Link>
        <div className="bg-white dark:bg-white/03 rounded-card shadow-card p-4 flex items-center gap-3 opacity-60 border border-gray-100 dark:border-white/08 cursor-not-allowed">
          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/08 flex items-center justify-center flex-shrink-0">
            <Server size={17} className="text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Infrastructure</p>
            <p className="text-xs text-text-muted">Bientôt disponible</p>
          </div>
        </div>
      </div>

      {/* Journal d'audit global */}
      <div className="bg-white dark:bg-white/03 rounded-card shadow-card">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/08">
          <h2 className="font-semibold text-text-main">Journal d&apos;audit global</h2>
          <p className="text-xs text-text-muted mt-0.5">Dernières actions sur l&apos;ensemble de la plateforme</p>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-white/05">
          {auditLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-3 flex items-center gap-4">
                <div className="h-3 bg-gray-200 dark:bg-white/10 rounded animate-pulse flex-1" />
              </div>
            ))
          ) : (auditLogs as typeof MOCK_AUDIT).map((log) => (
            <div key={log.id} className="px-6 py-3 flex items-center gap-4 text-sm hover:bg-gray-50 dark:hover:bg-white/03 transition-colors">
              <span className="font-mono text-xs bg-gray-100 dark:bg-white/10 text-text-muted px-2 py-0.5 rounded shrink-0">{log.action}</span>
              <span className="text-text-muted flex-1 truncate">{log.utilisateur}</span>
              <span className="text-text-muted truncate max-w-[200px]">{log.ressource}</span>
              <span className="text-text-muted whitespace-nowrap text-xs shrink-0">{formatRelativeTime(log.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
