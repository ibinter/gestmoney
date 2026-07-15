'use client';
// ============================================================
// DASHBOARD PRINCIPAL — GESTMONEY
// Dashboard adaptatif par rôle utilisateur
// Rôles : SUPER_ADMIN / ADMIN | MANAGER | AGENT/CAISSIER | AUDITEUR
// ============================================================
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, CreditCard, Users, Building2, TrendingUp, Wallet,
  AlertTriangle, CheckCircle, BarChart2, FileText, Plus,
  ShieldCheck, ArrowRight, UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { KpiCard } from '@/components/ui/KpiCard';
import { MiniChart } from '@/components/ui/MiniChart';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { formatMontant } from '@/lib/formatters';
import { clsx } from 'clsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(iso));
}

const TYPE_LABELS: Record<string, string> = {
  depot: 'Dépôt', retrait: 'Retrait', transfert: 'Transfert',
  cash_in: 'Cash In', cash_out: 'Cash Out', paiement: 'Paiement',
};

const STATUT_STYLES: Record<string, string> = {
  success: 'bg-[#009E00]/10 text-[#009E00]',
  pending: 'bg-[#FFD000]/15 text-[#806B00]',
  failed:  'bg-[#E60000]/10 text-[#E60000]',
};

// ─── Sous-composants de section ───────────────────────────────────────────────

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-text-main uppercase tracking-wider">{children}</h2>
      {action}
    </div>
  );
}

function AlertBadge({ count, label, couleur = 'warning' }: { count: number; label: string; couleur?: 'warning' | 'danger' }) {
  if (count === 0) return null;
  return (
    <div className={clsx(
      'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium',
      couleur === 'danger'
        ? 'bg-[#E60000]/08 border-[#E60000]/20 text-[#E60000]'
        : 'bg-[#FFD000]/10 border-[#FFD000]/30 text-[#806B00] dark:text-[#FFD000]',
    )}>
      <AlertTriangle size={15} className="flex-shrink-0" />
      <span>{count} {label}</span>
    </div>
  );
}

// ─── Vue SUPER_ADMIN / ADMIN ─────────────────────────────────────────────────

function DashboardAdmin() {
  const { stats, isLoading, isMock, refresh } = useDashboardStats();
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section data-tour="dashboard-kpi">
        <SectionTitle action={
          isMock && (
            <span className="text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full font-medium">
              Données démo
            </span>
          )
        }>
          Vue d'ensemble — aujourd'hui
        </SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            titre="Transactions"
            valeur={isLoading ? '—' : (stats?.nbTransactionsJour ?? 0).toLocaleString('fr-FR')}
            delta={stats?.variationPct}
            icone={CreditCard}
            variante="primary"
            isLoading={isLoading}
            onClick={() => router.push('/dashboard/transactions')}
          />
          <KpiCard
            titre="Volume (XOF)"
            valeur={isLoading ? '—' : formatMontant(stats?.volumeJour ?? 0)}
            delta={stats?.variationPct}
            icone={Wallet}
            variante="success"
            isLoading={isLoading}
          />
          <KpiCard
            titre="Agents actifs"
            valeur={isLoading ? '—' : `${stats?.nbAgentsActifs ?? 0}`}
            sousTitre={`sur ${(stats?.nbAgentsActifs ?? 0) + (stats?.alertesAgentsInactifs ?? 0)} agents total`}
            icone={Users}
            variante="neutral"
            isLoading={isLoading}
            onClick={() => router.push('/dashboard/agents')}
          />
          <KpiCard
            titre="Agences actives"
            valeur={isLoading ? '—' : `${stats?.nbAgencesActives ?? 0}`}
            icone={Building2}
            variante="neutral"
            isLoading={isLoading}
            onClick={() => router.push('/dashboard/agences')}
          />
        </div>
      </section>

      {/* Sparkline 7 jours */}
      {!isLoading && stats?.sparklineData && (
        <section className="bg-white dark:bg-[hsl(0_0%_12%)] rounded-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-main">Transactions — 7 derniers jours</h3>
              <p className="text-xs text-gray-500 mt-0.5">Nombre de transactions par jour</p>
            </div>
            <TrendingUp size={16} className="text-[#009E00]" />
          </div>
          <MiniChart
            data={stats.sparklineData}
            color="#009E00"
            height={56}
            className="w-full"
          />
          <div className="flex justify-between mt-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((j) => (
              <span key={j} className="text-[10px] text-gray-400">{j}</span>
            ))}
          </div>
        </section>
      )}

      {/* Alertes */}
      {!isLoading && (
        <section>
          <SectionTitle>Alertes</SectionTitle>
          <div className="flex flex-wrap gap-3">
            <AlertBadge count={stats?.alertesAgentsInactifs ?? 0} label="agent(s) inactif(s)" couleur="warning" />
            <AlertBadge count={stats?.alertesFloatBas ?? 0} label="float bas" couleur="danger" />
            <AlertBadge count={stats?.commissionsAValider ?? 0} label="commission(s) à valider" couleur="warning" />
            {(stats?.alertesAgentsInactifs === 0 && stats?.alertesFloatBas === 0 && stats?.commissionsAValider === 0) && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#009E00]/20 bg-[#009E00]/08 text-sm font-medium text-[#009E00]">
                <CheckCircle size={15} />
                <span>Aucune alerte active — tout est en ordre</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Activité récente */}
      <section>
        <SectionTitle action={
          <button onClick={() => router.push('/dashboard/transactions')} className="text-xs text-[#009E00] hover:underline flex items-center gap-1">
            Tout voir <ArrowRight size={12} />
          </button>
        }>
          Activité récente
        </SectionTitle>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="bg-white dark:bg-[hsl(0_0%_12%)] rounded-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/08 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Client</th>
                    <th className="text-right px-4 py-3 font-medium">Montant</th>
                    <th className="text-center px-4 py-3 font-medium">Statut</th>
                    <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/05">
                  {(stats?.transactionsRecentes ?? []).slice(0, 10).map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/03 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-text-main">{TYPE_LABELS[tx.type] ?? tx.type}</span>
                        <span className="text-xs text-gray-400 block">{tx.operateur.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-400">{tx.clientNom}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-text-main">
                        {tx.montant.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', STATUT_STYLES[tx.statut])}>
                          {tx.statut === 'success' ? 'Succès' : tx.statut === 'pending' ? 'En cours' : 'Échoué'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-400 hidden md:table-cell">
                        {formatRelative(tx.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Liens rapides */}
      <section>
        <SectionTitle>Accès rapides</SectionTitle>
        <div className="flex flex-wrap gap-3" data-tour="new-transaction">
          <Button variante="primary" icone={<Plus size={15} />} onClick={() => router.push('/dashboard/transactions?type=depot')}>
            Nouvelle transaction
          </Button>
          <Button variante="outline" icone={<UserPlus size={15} />} onClick={() => router.push('/dashboard/agents')}>
            Ajouter un agent
          </Button>
          <Button variante="ghost" icone={<BarChart2 size={15} />} onClick={() => router.push('/dashboard/rapports')} data-tour="rapports-link">
            Rapports
          </Button>
        </div>
      </section>
    </div>
  );
}

// ─── Vue MANAGER ─────────────────────────────────────────────────────────────

function DashboardManager() {
  const { stats, isLoading, isMock, refresh } = useDashboardStats();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <section data-tour="dashboard-kpi">
        <SectionTitle action={isMock && (
          <span className="text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full font-medium">Données démo</span>
        )}>
          Mon agence — aujourd'hui
        </SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard titre="Mes transactions" valeur={isLoading ? '—' : (stats?.nbTransactionsJour ?? 0).toLocaleString('fr-FR')} delta={stats?.variationPct} icone={CreditCard} variante="primary" isLoading={isLoading} />
          <KpiCard titre="Volume agence" valeur={isLoading ? '—' : formatMontant(stats?.volumeAgence ?? 0)} icone={Wallet} variante="success" isLoading={isLoading} />
          <KpiCard titre="Agents supervisés" valeur={isLoading ? '—' : `${stats?.nbAgentsSupervisés ?? 0}`} icone={Users} variante="neutral" isLoading={isLoading} onClick={() => router.push('/dashboard/agents')} />
        </div>
      </section>

      {/* Alerte float agence */}
      {!isLoading && stats?.alerteFloatAgence && (
        <AlertBadge count={1} label="alerte float — votre agence est en dessous du seuil" couleur="danger" />
      )}

      {/* Performances agents */}
      <section>
        <SectionTitle>Performances de mon équipe</SectionTitle>
        {isLoading ? <SkeletonCard /> : (
          <div className="bg-white dark:bg-[hsl(0_0%_12%)] rounded-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/08 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Agent</th>
                    <th className="text-center px-4 py-3 font-medium">Transactions</th>
                    <th className="text-right px-4 py-3 font-medium">Volume</th>
                    <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Commission</th>
                    <th className="text-center px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/05">
                  {(stats?.performancesAgents ?? []).map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-white/03 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-main">{agent.nom}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{agent.nbTransactions}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-text-main">{agent.volume.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#009E00] hidden sm:table-cell">{agent.commission.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', agent.statut === 'actif' ? 'bg-[#009E00]/10 text-[#009E00]' : 'bg-gray-100 text-gray-500')}>
                          {agent.statut === 'actif' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Vue AGENT / CAISSIER ────────────────────────────────────────────────────

function DashboardAgent() {
  const user = useAuthStore((s) => s.user);
  const { stats, isLoading, isMock, refresh } = useDashboardStats();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <section data-tour="dashboard-kpi">
        <SectionTitle action={isMock && (
          <span className="text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full font-medium">Données démo</span>
        )}>
          Mon activité — aujourd'hui
        </SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard titre="Mes transactions" valeur={isLoading ? '—' : (stats?.nbTransactionsJour ?? 0).toLocaleString('fr-FR')} delta={stats?.variationPct} icone={CreditCard} variante="primary" isLoading={isLoading} />
          <KpiCard titre="Mon volume" valeur={isLoading ? '—' : formatMontant(stats?.volumeJour ?? 0)} icone={Wallet} variante="success" isLoading={isLoading} />
          <KpiCard titre="Ma commission (mois)" valeur={isLoading ? '—' : formatMontant(stats?.maCommissionMois ?? 0)} icone={TrendingUp} variante="neutral" isLoading={isLoading} sousTitre="Ce mois" />
        </div>
      </section>

      {/* Float disponible */}
      {!isLoading && (
        <div className={clsx(
          'flex items-center justify-between px-5 py-4 rounded-xl border',
          (stats?.monFloat ?? 0) < 100000
            ? 'bg-[#E60000]/08 border-[#E60000]/20'
            : 'bg-[#009E00]/08 border-[#009E00]/20',
        )}>
          <div className="flex items-center gap-3">
            <Wallet size={20} className={(stats?.monFloat ?? 0) < 100000 ? 'text-[#E60000]' : 'text-[#009E00]'} />
            <div>
              <p className="text-sm font-semibold text-text-main">Float disponible</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {(stats?.monFloat ?? 0) < 100000 ? 'Seuil bas — contactez votre manager' : 'Niveau correct'}
              </p>
            </div>
          </div>
          <p className="text-lg font-bold tabular-nums text-text-main">
            {formatMontant(stats?.monFloat ?? 0)}
          </p>
        </div>
      )}

      {/* Bouton principale */}
      <div data-tour="new-transaction">
        <Button
          variante="primary"
          taille="lg"
          icone={<Plus size={18} />}
          onClick={() => router.push('/dashboard/transactions?type=depot')}
          className="w-full sm:w-auto"
        >
          Nouvelle transaction
        </Button>
      </div>

      {/* Mes dernières transactions */}
      <section>
        <SectionTitle action={
          <button onClick={() => router.push('/dashboard/transactions')} className="text-xs text-[#009E00] hover:underline flex items-center gap-1">
            Tout voir <ArrowRight size={12} />
          </button>
        }>
          Mes dernières transactions
        </SectionTitle>
        {isLoading ? <SkeletonCard /> : (
          <div className="bg-white dark:bg-[hsl(0_0%_12%)] rounded-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/08 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Client</th>
                    <th className="text-right px-4 py-3 font-medium">Montant</th>
                    <th className="text-center px-4 py-3 font-medium">Statut</th>
                    <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/05">
                  {(stats?.mesTransactions ?? []).map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/03 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-text-main">{TYPE_LABELS[tx.type] ?? tx.type}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-400">{tx.clientNom}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-text-main">
                        {tx.montant.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', STATUT_STYLES[tx.statut])}>
                          {tx.statut === 'success' ? 'Succès' : tx.statut === 'pending' ? 'En cours' : 'Échoué'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-400 hidden md:table-cell">
                        {formatRelative(tx.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Vue AUDITEUR / VIEWER ───────────────────────────────────────────────────

function DashboardAuditeur() {
  const { stats, isLoading, isMock, refresh } = useDashboardStats();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <section data-tour="dashboard-kpi">
        <SectionTitle action={isMock && (
          <span className="text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full font-medium">Données démo</span>
        )}>
          Tableau d'audit
        </SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard titre="Opérations auditées" valeur={isLoading ? '—' : (stats?.operationsAuditees ?? 0).toLocaleString('fr-FR')} icone={ShieldCheck} variante="neutral" isLoading={isLoading} />
          <KpiCard titre="Transactions (jour)" valeur={isLoading ? '—' : (stats?.nbTransactionsJour ?? 0).toLocaleString('fr-FR')} delta={stats?.variationPct} icone={CreditCard} variante="primary" isLoading={isLoading} />
          <KpiCard titre="Volume (XOF)" valeur={isLoading ? '—' : formatMontant(stats?.volumeJour ?? 0)} icone={Wallet} variante="success" isLoading={isLoading} />
        </div>
      </section>

      {/* Journal d'audit */}
      <section>
        <SectionTitle>Journal d'audit récent</SectionTitle>
        {isLoading ? <SkeletonCard /> : (
          <div className="bg-white dark:bg-[hsl(0_0%_12%)] rounded-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/08 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Action</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Utilisateur</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Ressource</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">IP</th>
                    <th className="text-right px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/05">
                  {(stats?.journalAudit ?? []).map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-white/03 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 dark:bg-white/08 px-2 py-0.5 rounded text-text-main">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-600 dark:text-gray-400 truncate max-w-[160px]">
                        {entry.utilisateur}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 truncate max-w-[140px]">
                        {entry.ressource}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs font-mono text-gray-400">
                        {entry.ip}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-400 whitespace-nowrap">
                        {formatRelative(entry.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Liens rapides */}
      <section>
        <SectionTitle>Accès rapides</SectionTitle>
        <div className="flex flex-wrap gap-3" data-tour="rapports-link">
          <Button variante="primary" icone={<BarChart2 size={15} />} onClick={() => router.push('/dashboard/rapports')}>
            Voir les rapports
          </Button>
          <Button variante="outline" icone={<FileText size={15} />} onClick={() => router.push('/dashboard/rapports')}>
            Exporter
          </Button>
        </div>
      </section>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { refresh, isLoading, lastUpdated } = useDashboardStats();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = user?.role?.toLowerCase() ?? '';
  const isAdmin = role.includes('admin');
  const isManager = role === 'superviseur' || role === 'manager';
  const isAgent = role === 'agent' || role === 'caissier';
  const isAuditeur = role === 'viewer' || role === 'auditeur';

  const heureMAJ = mounted && lastUpdated
    ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(lastUpdated))
    : '';

  // Salutation selon l'heure
  const heure = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';
  const prenom = user?.prenom ?? user?.nom ?? 'vous';

  return (
    <div className="space-y-6">
      {/* Tour d'onboarding (première connexion) */}
      <OnboardingTour />

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            {salutation}, {prenom} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tableau de bord
            {heureMAJ && <> — Mis à jour à {heureMAJ}</>}
          </p>
        </div>
        <Button
          variante="ghost"
          taille="sm"
          icone={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
          onClick={() => refresh()}
          loading={isLoading}
        >
          Actualiser
        </Button>
      </div>

      {/* Checklist d'onboarding (nouveaux comptes uniquement) */}
      {(isAdmin) && <OnboardingChecklist />}

      {/* Dashboard adaptatif par rôle */}
      {isAdmin   && <DashboardAdmin />}
      {isManager && <DashboardManager />}
      {isAgent   && <DashboardAgent />}
      {isAuditeur && <DashboardAuditeur />}

      {/* Fallback si rôle inconnu */}
      {!isAdmin && !isManager && !isAgent && !isAuditeur && (
        <DashboardAdmin />
      )}
    </div>
  );
}
