'use client';
// ============================================================
// DASHBOARD PRINCIPAL — GESTMONEY
// Grille de 8 grandes cartes selon le CDC
// ============================================================
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Bot, X, CheckCircle } from 'lucide-react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useDashboardStore } from '@/store/dashboardStore';
import { formatMontant } from '@/lib/formatters';
import { useT } from '@/lib/i18n';

export default function DashboardPage() {
  const router = useRouter();
  const { stats, recommandationIA, dismissRecommandation, refreshStats, isLoading, lastUpdated } =
    useDashboardStore();
  const [mounted, setMounted] = React.useState(false);
  const t = useT();

  useEffect(() => {
    setMounted(true);
    refreshStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const heureMAJ = mounted && lastUpdated
    ? new Intl.DateTimeFormat(t.dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(lastUpdated))
    : '';

  const formatDernierRapport = (date: string) => {
    if (!date) return '—';
    try {
      return new Intl.DateTimeFormat(t.dateLocale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">{t.dashboard.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t.dashboard.subtitle} — {t.dashboard.lastUpdated} {heureMAJ}
          </p>
        </div>
        <Button
          variante="ghost"
          taille="sm"
          icone={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
          onClick={() => refreshStats()}
          loading={isLoading}
        >
          {t.common.refresh}
        </Button>
      </div>

      {/* Grille de 8 cartes */}
      {isLoading && !lastUpdated ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : null}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 ${isLoading && !lastUpdated ? 'hidden' : ''}`}>

        {/* 1. TRANSACTIONS */}
        <DashboardCard
          icone="💳"
          titre="TRANSACTIONS"
          couleur="#F5B800"
          onClick={() => router.push('/dashboard/transactions')}
          badge={`${stats.transactions.enAttente} en attente`}
          alerte={stats.transactions.enAttente > 5}
          stats={[
            { label: 'Nombre aujourd\'hui', valeur: stats.transactions.nbAujourdhui.toLocaleString('fr-FR') },
            { label: 'Montant total', valeur: formatMontant(stats.transactions.montantAujourdhui) },
            { label: 'Variation vs hier', valeur: `+${stats.transactions.variationPct}%`, couleur: 'success' },
            { label: 'En attente', valeur: stats.transactions.enAttente, couleur: stats.transactions.enAttente > 0 ? 'warning' : 'default' },
          ]}
          actions={[
            { label: '+ Dépôt', onClick: () => router.push('/dashboard/transactions?type=depot'), variante: 'primary' },
            { label: '+ Retrait', onClick: () => router.push('/dashboard/transactions?type=retrait'), variante: 'outline' },
          ]}
        />

        {/* 2. CAISSE */}
        <DashboardCard
          icone="💵"
          titre="CAISSE"
          couleur="#22C55E"
          onClick={() => router.push('/dashboard/caisse')}
          stats={[
            { label: 'Solde actuel', valeur: formatMontant(stats.caisse.soldeActuel), couleur: 'success' },
            { label: 'Entrées', valeur: formatMontant(stats.caisse.entrees) },
            { label: 'Sorties', valeur: formatMontant(stats.caisse.sorties) },
            { label: 'Écart', valeur: formatMontant(stats.caisse.ecart), couleur: stats.caisse.ecart !== 0 ? 'danger' : 'default' },
          ]}
          actions={[
            { label: 'Voir journal', onClick: () => router.push('/dashboard/caisse'), variante: 'ghost' },
          ]}
        />

        {/* 3. FLOAT */}
        <DashboardCard
          icone="🏦"
          titre="FLOAT"
          couleur="#3B82F6"
          onClick={() => router.push('/dashboard/float')}
          alerte={stats.float.alertes > 0}
          badge={stats.float.alertes > 0 ? `${stats.float.alertes} alertes` : undefined}
          stats={[
            ...stats.float.soldes.slice(0, 3).map((s) => ({
              label: s.operateur.replace('_', ' ').toUpperCase(),
              valeur: formatMontant(s.soldeActuel),
              couleur: (s.statut === 'critique' ? 'danger' : s.statut === 'alerte' ? 'warning' : 'success') as 'danger' | 'warning' | 'success',
            })),
            { label: 'Alertes actives', valeur: `${stats.float.alertes} alerte(s)`, couleur: stats.float.alertes > 0 ? 'warning' : 'default' },
          ]}
          actions={[
            { label: 'Réapprovisionner', onClick: () => router.push('/dashboard/float'), variante: stats.float.alertes > 0 ? 'primary' : 'ghost' },
          ]}
        />

        {/* 4. PERFORMANCES */}
        <DashboardCard
          icone="📈"
          titre="PERFORMANCES"
          couleur="#8B5CF6"
          onClick={() => router.push('/dashboard/performances')}
          stats={[
            { label: 'CA du mois', valeur: formatMontant(stats.performances.chiffreAffaires) },
            { label: 'Objectif', valeur: formatMontant(stats.performances.objectif) },
            { label: 'Progression', valeur: `${stats.performances.progressionPct}%`, couleur: stats.performances.progressionPct >= 80 ? 'success' : 'warning' },
            { label: 'Top agent', valeur: stats.performances.topAgent?.nom ?? '—' },
          ]}
          actions={[
            { label: 'Voir rapport', onClick: () => router.push('/dashboard/rapports'), variante: 'ghost' },
          ]}
        />

        {/* 5. AGENCES / POINTS DE VENTE */}
        <DashboardCard
          icone="🏪"
          titre="AGENCES & PDV"
          couleur="#F59E0B"
          onClick={() => router.push('/dashboard/agences')}
          stats={[
            { label: 'Agences actives', valeur: `${stats.agences.nbActives} / ${stats.agences.nbTotal}` },
            { label: 'Agents en ligne', valeur: `${stats.agences.nbAgentsEnLigne} / ${stats.agences.nbAgentsTotal}`, couleur: 'success' },
          ]}
          actions={[
            { label: 'Gérer agences', onClick: () => router.push('/dashboard/agences'), variante: 'ghost' },
            { label: 'Voir agents', onClick: () => router.push('/dashboard/agents'), variante: 'outline' },
          ]}
        />

        {/* 6. CLIENTS */}
        <DashboardCard
          icone="👥"
          titre="CLIENTS"
          couleur="#06B6D4"
          onClick={() => router.push('/dashboard/clients')}
          stats={[
            { label: 'Total clients', valeur: stats.clients.nbTotal.toLocaleString('fr-FR') },
            { label: 'Nouveaux', valeur: `+${stats.clients.nouveaux}`, couleur: 'success' },
            { label: 'Actifs ce mois', valeur: stats.clients.actifs.toLocaleString('fr-FR') },
          ]}
          actions={[
            { label: 'Voir clients', onClick: () => router.push('/dashboard/clients'), variante: 'ghost' },
          ]}
        />

        {/* 7. COMMISSIONS */}
        <DashboardCard
          icone="💰"
          titre="COMMISSIONS"
          couleur="#10B981"
          onClick={() => router.push('/dashboard/commissions')}
          stats={[
            { label: 'Dues ce mois', valeur: formatMontant(stats.commissions.duesCeMois) },
            { label: 'Payées', valeur: formatMontant(stats.commissions.payees), couleur: 'success' },
            { label: 'En attente', valeur: formatMontant(stats.commissions.enAttente), couleur: 'warning' },
          ]}
          actions={[
            { label: 'Valider paiements', onClick: () => router.push('/dashboard/commissions'), variante: 'primary' },
          ]}
        />

        {/* 8. RAPPORTS */}
        <DashboardCard
          icone="📊"
          titre="RAPPORTS & BI"
          couleur="#EF4444"
          onClick={() => router.push('/dashboard/rapports')}
          stats={[
            { label: 'Dernier rapport', valeur: formatDernierRapport(stats.rapports.dernierRapport) },
            { label: 'Alertes BI', valeur: `${stats.rapports.alertes.length} alerte(s)`, couleur: stats.rapports.alertes.length > 0 ? 'warning' : 'success' },
          ]}
          actions={[
            { label: 'Voir rapports', onClick: () => router.push('/dashboard/rapports'), variante: 'ghost' },
            { label: 'Exporter', onClick: () => {}, variante: 'outline' },
          ]}
        />
      </div>

      {/* Bannière IA */}
      {recommandationIA && (
        <div className={`rounded-card p-5 flex items-start gap-4 ${
          recommandationIA.severite === 'danger' ? 'bg-red-50 border border-red-200' :
          recommandationIA.severite === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="text-2xl flex-shrink-0 mt-0.5">🤖</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assistant IA</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                recommandationIA.severite === 'danger' ? 'bg-red-100 text-danger' :
                recommandationIA.severite === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {recommandationIA.severite === 'danger' ? t.common.error : recommandationIA.severite === 'warning' ? 'Attention' : 'Info'}
              </span>
            </div>
            <p className="font-semibold text-text-main text-sm">{recommandationIA.titre}</p>
            <p className="text-sm text-gray-600 mt-1">{recommandationIA.message}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {recommandationIA.actions.map((action) => (
                <Button
                  key={action.action}
                  taille="sm"
                  variante={action.action.includes('reappro') ? 'primary' : 'ghost'}
                  icone={<CheckCircle size={14} />}
                  onClick={() => router.push('/dashboard/float')}
                >
                  {action.label}
                </Button>
              ))}
              <Button
                taille="sm"
                variante="ghost"
                icone={<X size={14} />}
                onClick={dismissRecommandation}
              >
                {t.common.close}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Barre de progression performances */}
      {isLoading && !lastUpdated ? null : (
      <div className="bg-white rounded-card shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-text-main text-sm">{t.rapports.monthlyObjective}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {t.dashboard.topAgent} : <span className="font-medium text-text-main">{stats.performances.topAgent?.nom ?? '—'}</span>
              {stats.performances.topAgent && <> — {formatMontant(stats.performances.topAgent.montant)}</>}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text-main">{stats.performances.progressionPct}%</p>
            <p className="text-xs text-gray-500">
              {formatMontant(stats.performances.chiffreAffaires)} / {formatMontant(stats.performances.objectif)}
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-yellow-400 transition-all duration-1000"
            style={{ width: `${Math.min(stats.performances.progressionPct, 100)}%` }}
          />
        </div>
      </div>
      )}
    </div>
  );
}
