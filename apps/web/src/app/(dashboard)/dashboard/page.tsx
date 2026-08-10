'use client';
// ============================================================
// DASHBOARD PRINCIPAL — GESTMONEY
// Présentation fidèle à /mockup/index.html (classes gm-*)
// Dashboard adaptatif par rôle utilisateur
// Rôles : SUPER_ADMIN / ADMIN | MANAGER | AGENT/CAISSIER | AUDITEUR
// ============================================================
import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MiniChart } from '@/components/ui/MiniChart';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { Transaction } from '@/hooks/useDashboardStats';
import { formatMontant } from '@/lib/formatters';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';
import {
  GmButton,
  GmCard,
  GmCardGrid,
  GmMetric,
  GmMetricSub,
  GmPageHeader,
  GmSectionTitle,
  GmStatusPill,
  GmTableWrap,
  type GmTrend,
} from '@/components/gm';

// Chargement différé des composants lourds (onboarding wizard + analytics)
// pour ne pas bloquer le rendu initial du dashboard
const OnboardingChecklist = dynamic(
  () => import('@/components/onboarding/OnboardingChecklist').then((m) => ({ default: m.OnboardingChecklist })),
  { ssr: false, loading: () => null }
);
const OnboardingTour = dynamic(
  () => import('@/components/onboarding/OnboardingTour').then((m) => ({ default: m.OnboardingTour })),
  { ssr: false, loading: () => null }
);
const OnboardingWizard = dynamic(
  () => import('@/components/ui/OnboardingWizard').then((m) => ({ default: m.OnboardingWizard })),
  { ssr: false, loading: () => null }
);
import { useOnboardingWizard } from '@/components/ui/OnboardingWizard';
const SectionAnalytiques = dynamic(
  () => import('@/components/dashboard/SectionAnalytiques').then((m) => ({ default: m.SectionAnalytiques })),
  { ssr: false, loading: () => <div className="skeleton h-64 rounded-xl" /> }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string, t: Translations): string {
  const r = t.dashboard.relative;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return r.now;
  if (mins < 60) return `${r.agoPrefix}${mins} ${r.min}${r.agoSuffix}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${r.agoPrefix}${hrs}${r.hour}${r.agoSuffix}`;
  return new Intl.DateTimeFormat(t.dateLocale, { day: '2-digit', month: 'short' }).format(new Date(iso));
}

/** Libellé traduit d'un type d'opération, avec repli sur le code brut. */
function typeLabel(t: Translations, type: string): string {
  return (t.dashboard.txTypes as Record<string, string>)[type] ?? type;
}

/** Classe de badge `gm-badge-*` selon le type d'opération (voir mockup-system.css). */
function badgeClass(type: string): string {
  switch (type) {
    case 'depot': return 'gm-badge gm-badge-depot';
    case 'retrait': return 'gm-badge gm-badge-retrait';
    case 'cash_in': return 'gm-badge gm-badge-cashin';
    case 'cash_out': return 'gm-badge gm-badge-cashout';
    case 'transfert': return 'gm-badge gm-badge-transfert';
    default: return 'gm-badge';
  }
}

const OPERATEUR_COULEURS: Record<string, string> = {
  orange_money: '#FF6B00',
  mtn_momo: '#FFCC00',
  wave: '#1DA7E8',
  moov: '#00A651',
  airtel: '#E60000',
};

function libelleOperateur(op: string): string {
  return op.replace(/_/g, ' ');
}

function statutLabel(t: Translations, statut: Transaction['statut']): string {
  return t.dashboard.txStatuts[statut] ?? statut;
}

/** Trend de carte à partir d'un pourcentage de variation réel. */
function trendVariation(pct: number | undefined, t: Translations): GmTrend | undefined {
  if (pct === undefined || pct === null || Number.isNaN(pct)) return undefined;
  return {
    sens: pct >= 0 ? 'up' : 'down',
    label: `${pct >= 0 ? '↑' : '↓'} ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% ${t.dashboard.vsYesterday}`,
    infobulle: t.dashboard.variationTooltip,
  };
}

const CHIFFRE = (n: number) => n.toLocaleString('fr-FR');
const TIRET = '—';

// ─── Blocs réutilisables ──────────────────────────────────────────────────────

function GrilleSquelette({ n = 4 }: { n?: number }) {
  return (
    <GmCardGrid>
      {[...Array(n)].map((_, i) => <SkeletonCard key={i} />)}
    </GmCardGrid>
  );
}

/** État d'erreur API — affiché quand le backend est inaccessible. */
function ErreurStats() {
  const { refresh } = useDashboardStats();
  return (
    <div style={{
      padding: '40px 24px', textAlign: 'center',
      background: 'var(--gm-surface, #fff)',
      border: '1.5px solid var(--gm-danger-subtle, #fecaca)',
      borderRadius: 16, margin: '16px 0',
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--gm-danger, #dc2626)', marginBottom: 8 }}>
        Impossible de charger les statistiques
      </p>
      <p style={{ fontSize: 14, color: 'var(--gm-text-muted, #6b7280)', marginBottom: 20 }}>
        Le serveur est temporairement inaccessible. Vérifiez votre connexion puis réessayez.
      </p>
      <button
        onClick={() => refresh()}
        style={{
          padding: '10px 24px', borderRadius: 10, border: 'none',
          background: 'var(--gm-primary, #009E00)', color: '#fff',
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        🔄 Réessayer
      </button>
    </div>
  );
}

/** Bannière d'alertes — même anatomie que `.ai-banner` de la maquette. */
function BanniereAlertes({
  titre,
  message,
  actions,
}: {
  titre: string;
  message: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="gm-ai-banner">
      <div className="gm-ai-icon">⚠️</div>
      <div className="gm-ai-content">
        <div className="gm-ai-label">{titre}</div>
        <div className="gm-ai-message">{message}</div>
      </div>
      {actions && <div className="gm-ai-actions">{actions}</div>}
    </div>
  );
}

/** Tableau « Activité récente » — colonnes de la maquette, données réelles. */
function TableauTransactions({
  transactions,
  colonneAgent = true,
}: {
  transactions: Transaction[];
  colonneAgent?: boolean;
}) {
  const t = useT();
  if (transactions.length === 0) {
    return (
      <GmTableWrap>
        <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--gm-text-2)' }}>
          {t.dashboard.noTransactionPeriod}
        </div>
      </GmTableWrap>
    );
  }
  return (
    <GmTableWrap>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>{t.dashboard.txTable.hour}</th>
              <th>{t.dashboard.txTable.type}</th>
              {colonneAgent && <th>{t.dashboard.txTable.agent}</th>}
              <th>{t.dashboard.txTable.operator}</th>
              <th>{t.dashboard.txTable.client}</th>
              <th>{t.dashboard.txTable.amount}</th>
              <th>{t.dashboard.txTable.status}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td style={{ color: 'var(--gm-text-2)', fontSize: 12 }}>{formatRelative(tx.date, t)}</td>
                <td><span className={badgeClass(tx.type)}>{typeLabel(t, tx.type)}</span></td>
                {colonneAgent && (
                  <td>
                    <strong>{tx.agentNom || TIRET}</strong>
                    {tx.agenceNom && (
                      <>
                        <br />
                        <span style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>{tx.agenceNom}</span>
                      </>
                    )}
                  </td>
                )}
                <td>
                  <span className="gm-op-logo">
                    <span
                      className="gm-op-dot"
                      style={{ background: OPERATEUR_COULEURS[tx.operateur] ?? 'var(--gm-text-2)' }}
                    />
                    {libelleOperateur(tx.operateur)}
                  </span>
                </td>
                <td style={{ fontSize: 12 }}>{tx.clientNom || TIRET}</td>
                <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {CHIFFRE(tx.montant)} XOF
                </td>
                <td>
                  <GmStatusPill statut={tx.statut}>● {statutLabel(t, tx.statut)}</GmStatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GmTableWrap>
  );
}

/** Encart sparkline 7 jours (donnée réelle `sparklineData`). */
function CarteSparkline({ data }: { data: number[] }) {
  const t = useT();
  return (
    <div className="gm-section-card" style={{ marginBottom: 24 }}>
      <div className="gm-section-head">
        <div>
          <div className="gm-section-title">{t.dashboard.sparklineTitle}</div>
          <div className="gm-section-sub">{t.dashboard.sparklineSub}</div>
        </div>
      </div>
      <div style={{ padding: '16px 20px' }}>
        {/* couleur en littéral : MiniChart dérive un id de dégradé à partir de la valeur */}
        <MiniChart data={data} color="#F5B800" height={56} className="w-full" />
      </div>
    </div>
  );
}

// ─── Vue SUPER_ADMIN / ADMIN ─────────────────────────────────────────────────

function DashboardAdmin() {
  const { stats, isLoading, isError } = useDashboardStats();
  const router = useRouter();
  const t = useT();
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={6} />;
  if (isError || !stats) return <ErreurStats />;

  const alertes = [
    (stats?.alertesFloatBas ?? 0) > 0 && `${stats?.alertesFloatBas} ${t.dashboard.labels.floatLow}`,
    (stats?.alertesAgentsInactifs ?? 0) > 0 && `${stats?.alertesAgentsInactifs} ${t.dashboard.labels.inactiveAgents}`,
    (stats?.commissionsAValider ?? 0) > 0 && `${stats?.commissionsAValider} ${t.dashboard.labels.commissionsToValidate}`,
  ].filter(Boolean) as string[];

  return (
    <>
      <GmCardGrid>
        {/* Transactions */}
        <GmCard
          icone="💳"
          titre={t.dashboard.cards.transactions}
          trend={trendVariation(stats?.variationPct, t)}
          onClick={() => router.push('/dashboard/transactions')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/transactions?type=depot')}>{t.dashboard.actionsLabels.depot}</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/transactions?type=retrait')}>{t.dashboard.actionsLabels.retrait}</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.nbTransactionsJour ?? 0)} label={t.dashboard.labels.txToday} />
          <GmMetricSub icone="💰">
            <strong style={{ color: 'var(--gm-text)' }}>{formatMontant(stats?.volumeJour ?? 0)}</strong> {t.dashboard.labels.processed}
          </GmMetricSub>
        </GmCard>

        {/* Volume */}
        <GmCard
          icone="💵"
          titre={t.dashboard.cards.volumeDay}
          trend={trendVariation(stats?.variationPct, t)}
          onClick={() => router.push('/dashboard/transactions')}
          actions={<GmButton petit variante="outline" onClick={go('/dashboard/rapports')}>{t.dashboard.actionsLabels.seeReports}</GmButton>}
        >
          <GmMetric valeur={formatMontant(stats?.volumeJour ?? 0)} label={t.dashboard.labels.xofProcessedToday} />
          <GmMetricSub icone="📈">
            {t.dashboard.labels.avgPerTx}{' '}
            <strong style={{ color: 'var(--gm-text)' }}>
              {(stats?.nbTransactionsJour ?? 0) > 0
                ? formatMontant(Math.round((stats?.volumeJour ?? 0) / (stats?.nbTransactionsJour ?? 1)))
                : TIRET}
            </strong>
          </GmMetricSub>
        </GmCard>

        {/* Agents */}
        <GmCard
          icone="👤"
          titre={t.dashboard.cards.agents}
          trend={{ sens: 'up', label: `${stats?.nbAgentsActifs ?? 0} ${t.dashboard.labels.actifs}` }}
          onClick={() => router.push('/dashboard/agents')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/agents')}>{t.dashboard.actionsLabels.seeAgents}</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/agents')}>{t.dashboard.actionsLabels.createAgent}</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.nbAgentsActifs ?? 0)} label={t.dashboard.labels.activeAgents} />
          <GmMetricSub icone="🔴">
            {(stats?.alertesAgentsInactifs ?? 0) > 0 ? (
              <span style={{ color: 'var(--gm-warning)' }}>
                {stats?.alertesAgentsInactifs} {t.dashboard.labels.inactiveAgents}
              </span>
            ) : (
              t.dashboard.labels.noInactiveAgent
            )}
          </GmMetricSub>
        </GmCard>

        {/* Agences */}
        <GmCard
          icone="🏪"
          titre={t.dashboard.cards.agences}
          trend={{ sens: 'up', label: `${stats?.nbAgencesActives ?? 0} ${t.dashboard.labels.actives}` }}
          onClick={() => router.push('/dashboard/agences')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/agences')}>{t.dashboard.actionsLabels.seeAgencies}</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/agences')}>{t.dashboard.actionsLabels.newAgency}</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.nbAgencesActives ?? 0)} label={t.dashboard.labels.activeAgencies} />
          <GmMetricSub icone="👥">
            {CHIFFRE(stats?.nbAgentsActifs ?? 0)} {t.dashboard.labels.agentsSpread}
          </GmMetricSub>
        </GmCard>

        {/* Commissions */}
        <GmCard
          icone="💰"
          titre={t.dashboard.cards.commissions}
          trend={
            (stats?.commissionsAValider ?? 0) > 0
              ? { sens: 'warn', label: `${stats?.commissionsAValider} ${t.dashboard.labels.toValidate}` }
              : { sens: 'up', label: t.dashboard.labels.upToDate }
          }
          onClick={() => router.push('/dashboard/commissions')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/commissions')}>{t.dashboard.actionsLabels.validate}</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/commissions')}>{t.dashboard.actionsLabels.history}</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.commissionsAValider ?? 0)} label={t.dashboard.labels.commissionsPending} />
        </GmCard>

        {/* Float opérateurs */}
        <GmCard
          icone="🏦"
          titre={t.dashboard.cards.floatOperateurs}
          trend={
            (stats?.alertesFloatBas ?? 0) > 0
              ? { sens: 'warn', label: `⚠️ ${stats?.alertesFloatBas} ${t.dashboard.labels.floatLow}` }
              : { sens: 'up', label: t.dashboard.labels.levelsOk }
          }
          onClick={() => router.push('/dashboard/float')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/float')}>{t.dashboard.actionsLabels.refill}</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/float')}>{t.dashboard.actionsLabels.seeFloat}</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.alertesFloatBas ?? 0)} label={t.dashboard.labels.operatorsBelowThreshold} />
          <GmMetricSub icone="📊">{t.dashboard.labels.floatDetail}</GmMetricSub>
        </GmCard>
      </GmCardGrid>

      {/* Sparkline 7 jours — données réelles */}
      {stats?.sparklineData && stats.sparklineData.length > 0 && (
        <CarteSparkline data={stats.sparklineData} />
      )}

      {/* Bannière d'alertes — dérivée des vraies stats */}
      {alertes.length > 0 && (
        <BanniereAlertes
          titre={t.dashboard.alerts}
          message={<>{t.dashboard.pointsToHandle} : <strong>{alertes.join(' · ')}</strong>.</>}
          actions={
            <>
              <button className="gm-btn-ai gm-btn-ai-primary" onClick={() => router.push('/dashboard/float')}>
                {t.dashboard.actNow}
              </button>
              <button className="gm-btn-ai gm-btn-ai-ghost" onClick={() => router.push('/dashboard/commissions')}>
                {t.dashboard.seeCommissions}
              </button>
            </>
          }
        />
      )}

      {/* Activité récente */}
      <GmSectionTitle
        action={
          <a
            href="/dashboard/transactions"
            style={{ fontSize: 12, color: 'var(--gm-primary)', textDecoration: 'none', fontWeight: 500 }}
          >
            {t.common.seeAll} →
          </a>
        }
      >
        {t.dashboard.recentActivity}
      </GmSectionTitle>
      <TableauTransactions transactions={(stats?.transactionsRecentes ?? []).slice(0, 10)} />

      {/* Section analytiques (graphiques 30 jours) */}
      <SectionAnalytiques />
    </>
  );
}

// ─── Vue MANAGER ─────────────────────────────────────────────────────────────

function DashboardManager() {
  const { stats, isLoading, isError } = useDashboardStats();
  const router = useRouter();
  const t = useT();
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={3} />;
  if (isError || !stats) return <ErreurStats />;

  return (
    <>
      <GmCardGrid>
        <GmCard
          icone="💳"
          titre={t.dashboard.cards.txAgence}
          trend={trendVariation(stats?.variationPct, t)}
          onClick={() => router.push('/dashboard/transactions')}
          actions={<GmButton petit onClick={go('/dashboard/transactions?type=depot')}>{t.dashboard.actionsLabels.newTransaction}</GmButton>}
        >
          <GmMetric valeur={CHIFFRE(stats?.nbTransactionsJour ?? 0)} label={t.dashboard.labels.txToday} />
        </GmCard>

        <GmCard
          icone="💵"
          titre={t.dashboard.cards.volumeAgence}
          onClick={() => router.push('/dashboard/rapports')}
          actions={<GmButton petit variante="outline" onClick={go('/dashboard/rapports')}>{t.dashboard.actionsLabels.reports}</GmButton>}
        >
          <GmMetric valeur={formatMontant(stats?.volumeAgence ?? 0)} label={t.dashboard.labels.xofMyAgency} />
        </GmCard>

        <GmCard
          icone="👥"
          titre={t.dashboard.cards.monEquipe}
          trend={{ sens: 'up', label: `${stats?.nbAgentsSupervisés ?? 0} ${t.dashboard.labels.supervised}` }}
          onClick={() => router.push('/dashboard/agents')}
          actions={<GmButton petit onClick={go('/dashboard/agents')}>{t.dashboard.actionsLabels.seeAgents}</GmButton>}
        >
          <GmMetric valeur={CHIFFRE(stats?.nbAgentsSupervisés ?? 0)} label={t.dashboard.labels.supervisedAgents} />
        </GmCard>
      </GmCardGrid>

      {stats?.alerteFloatAgence && (
        <BanniereAlertes
          titre={t.dashboard.floatAlert.title}
          message={<>{t.dashboard.floatAlert.before} <strong>{t.dashboard.floatAlert.strong}</strong> {t.dashboard.floatAlert.after}</>}
          actions={
            <button className="gm-btn-ai gm-btn-ai-primary" onClick={() => router.push('/dashboard/float')}>
              {t.dashboard.actionsLabels.refill}
            </button>
          }
        />
      )}

      <GmSectionTitle>{t.dashboard.teamPerformance}</GmSectionTitle>
      <GmTableWrap>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>{t.common.agent}</th>
                <th>{t.dashboard.transactions}</th>
                <th>{t.common.volume}</th>
                <th>{t.common.commission}</th>
                <th>{t.common.statut}</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.performancesAgents ?? []).map((agent) => (
                <tr key={agent.id}>
                  <td><strong>{agent.nom}</strong></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{CHIFFRE(agent.nbTransactions)}</td>
                  <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{CHIFFRE(agent.volume)} XOF</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{CHIFFRE(agent.commission)} XOF</td>
                  <td>
                    <span className={agent.statut === 'actif' ? 'gm-op-status gm-status-ok' : 'gm-op-status gm-status-warn'}>
                      {agent.statut === 'actif' ? t.common.active : t.common.inactive}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GmTableWrap>

      {/* Section analytiques (graphiques 30 jours) */}
      <SectionAnalytiques />
    </>
  );
}

// ─── Vue AGENT / CAISSIER ────────────────────────────────────────────────────

function DashboardAgent() {
  const { stats, isLoading, isError } = useDashboardStats();
  const router = useRouter();
  const t = useT();
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={3} />;
  if (isError || !stats) return <ErreurStats />;

  const floatBas = (stats?.monFloat ?? 0) < 100000;

  return (
    <>
      <GmCardGrid>
        <GmCard
          icone="💳"
          titre={t.dashboard.cards.mesTransactions}
          trend={trendVariation(stats?.variationPct, t)}
          onClick={() => router.push('/dashboard/transactions')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/transactions?type=depot')}>{t.dashboard.actionsLabels.depot}</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/transactions?type=retrait')}>{t.dashboard.actionsLabels.retrait}</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.nbTransactionsJour ?? 0)} label={t.dashboard.labels.txToday} />
          <GmMetricSub icone="💰">
            <strong style={{ color: 'var(--gm-text)' }}>{formatMontant(stats?.volumeJour ?? 0)}</strong> {t.dashboard.labels.processed}
          </GmMetricSub>
        </GmCard>

        <GmCard
          icone="🏦"
          titre={t.dashboard.cards.monFloat}
          trend={floatBas
            ? { sens: 'warn', label: `⚠️ ${t.dashboard.labels.lowThreshold}` }
            : { sens: 'up', label: t.dashboard.labels.levelOk }}
          onClick={() => router.push('/dashboard/float')}
          actions={<GmButton petit onClick={go('/dashboard/float')}>{t.dashboard.actionsLabels.requestRefill}</GmButton>}
        >
          <GmMetric valeur={formatMontant(stats?.monFloat ?? 0)} label={t.dashboard.labels.xofAvailable} />
          <GmMetricSub icone={floatBas ? '🔴' : '🟢'}>
            {floatBas ? t.dashboard.labels.lowThresholdMsg : t.dashboard.labels.levelOk}
          </GmMetricSub>
        </GmCard>

        <GmCard
          icone="📈"
          titre={t.dashboard.cards.maCommission}
          onClick={() => router.push('/dashboard/commissions')}
          actions={<GmButton petit variante="outline" onClick={go('/dashboard/commissions')}>{t.dashboard.actionsLabels.detail}</GmButton>}
        >
          <GmMetric valeur={formatMontant(stats?.maCommissionMois ?? 0)} label={t.dashboard.labels.xofThisMonth} />
        </GmCard>
      </GmCardGrid>

      <GmSectionTitle
        action={
          <a
            href="/dashboard/transactions"
            style={{ fontSize: 12, color: 'var(--gm-primary)', textDecoration: 'none', fontWeight: 500 }}
          >
            {t.common.seeAll} →
          </a>
        }
      >
        {t.dashboard.myLastTransactions}
      </GmSectionTitle>
      <TableauTransactions transactions={stats?.mesTransactions ?? []} colonneAgent={false} />
    </>
  );
}

// ─── Vue AUDITEUR / VIEWER ───────────────────────────────────────────────────

function DashboardAuditeur() {
  const { stats, isLoading, isError } = useDashboardStats();
  const router = useRouter();
  const t = useT();
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={3} />;
  if (isError || !stats) return <ErreurStats />;

  return (
    <>
      <GmCardGrid>
        <GmCard
          icone="🛡️"
          titre={t.dashboard.cards.operationsAuditees}
          onClick={() => router.push('/dashboard/rapports')}
          actions={<GmButton petit variante="outline" onClick={go('/dashboard/rapports')}>{t.dashboard.actionsLabels.export}</GmButton>}
        >
          <GmMetric valeur={CHIFFRE(stats?.operationsAuditees ?? 0)} label={t.dashboard.labels.auditedOps} />
        </GmCard>

        <GmCard
          icone="💳"
          titre={t.dashboard.cards.txDuJour}
          trend={trendVariation(stats?.variationPct, t)}
          onClick={() => router.push('/dashboard/transactions')}
        >
          <GmMetric valeur={CHIFFRE(stats?.nbTransactionsJour ?? 0)} label={t.dashboard.labels.txToday} />
        </GmCard>

        <GmCard
          icone="💵"
          titre={t.dashboard.cards.volumeDay}
          onClick={() => router.push('/dashboard/rapports')}
        >
          <GmMetric valeur={formatMontant(stats?.volumeJour ?? 0)} label={t.dashboard.labels.xofProcessed} />
        </GmCard>
      </GmCardGrid>

      <GmSectionTitle>{t.dashboard.auditTable.title}</GmSectionTitle>
      <GmTableWrap>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>{t.dashboard.auditTable.action}</th>
                <th>{t.dashboard.auditTable.user}</th>
                <th>{t.dashboard.auditTable.resource}</th>
                <th>{t.dashboard.auditTable.ip}</th>
                <th>{t.common.date}</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.journalAudit ?? []).map((entry) => (
                <tr key={entry.id}>
                  <td><span className="gm-badge gm-badge-cashin">{entry.action}</span></td>
                  <td style={{ fontSize: 12 }}>{entry.utilisateur}</td>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{entry.ressource}</td>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{entry.ip}</td>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{formatRelative(entry.date, t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GmTableWrap>
    </>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────

// ─── Bannière onboarding ──────────────────────────────────────────────────────

function BanniereOnboarding({ etat, onOpen }: { etat: ReturnType<typeof useOnboardingWizard>['etat']; onOpen: () => void }) {
  const router = useRouter();
  if (!etat || etat.termine) return null;
  const restantes = etat.total - etat.completees;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
      padding: '12px 20px',
      background: 'linear-gradient(90deg, #f0fdf0 0%, #e6fff0 100%)',
      border: '1.5px solid #bbf7d0',
      borderRadius: 14, marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>⚡</span>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#166534' }}>
            Vous avez {restantes} étape{restantes > 1 ? 's' : ''} restante{restantes > 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 13, color: '#4ade80', marginLeft: 8 }}>
            — Continuez la configuration de votre réseau
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onOpen}
          style={{
            padding: '7px 16px', borderRadius: 9,
            background: '#009E00', color: '#fff',
            fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Continuer la configuration →
        </button>
        <button
          onClick={() => router.push('/dashboard/onboarding')}
          style={{
            padding: '7px 14px', borderRadius: 9,
            background: 'transparent', color: '#166534',
            fontWeight: 500, fontSize: 13,
            border: '1.5px solid #86efac',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Voir le guide
        </button>
      </div>
    </div>
  );
}

// ─── Bouton rapport mensuel avec sélecteur mois/année ────────────────────────

function RapportMensuelBtn() {
  const now = new Date();
  const [mois, setMois] = React.useState(now.getMonth() + 1);
  const [annee, setAnnee] = React.useState(now.getFullYear());
  const [open, setOpen] = React.useState(false);

  const telecharger = () => {
    window.open(`/api/v1/analytics/rapport-mensuel?annee=${annee}&mois=${mois}`, '_blank');
    setOpen(false);
  };

  const moisLabels = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];
  const annees = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <GmButton petit variante="outline" onClick={() => setOpen((o) => !o)}>
        📅 Rapport mensuel
      </GmButton>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', zIndex: 200,
          background: 'var(--gm-surface)', border: '1px solid var(--gm-border)',
          borderRadius: 10, padding: '14px 16px', minWidth: 200,
          boxShadow: '0 4px 24px rgba(0,0,0,.12)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--gm-text-1)' }}>
            Rapport mensuel PDF
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--gm-text-2)', display: 'block', marginBottom: 3 }}>Mois</label>
            <select
              value={mois}
              onChange={(e) => setMois(parseInt(e.target.value, 10))}
              style={{ width: '100%', fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--gm-border)', background: 'var(--gm-bg)', color: 'var(--gm-text-1)' }}
            >
              {moisLabels.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--gm-text-2)', display: 'block', marginBottom: 3 }}>Année</label>
            <select
              value={annee}
              onChange={(e) => setAnnee(parseInt(e.target.value, 10))}
              style={{ width: '100%', fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--gm-border)', background: 'var(--gm-bg)', color: 'var(--gm-text-1)' }}
            >
              {annees.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <GmButton petit onClick={telecharger} style={{ width: '100%' }}>
            ⬇ Télécharger
          </GmButton>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { refresh, isLoading, isMock, lastUpdated } = useDashboardStats();
  const { etat: onboardingEtat, visible: wizardVisible, dismiss: wizardDismiss, open: wizardOpen } = useOnboardingWizard();
  const router = useRouter();
  const t = useT();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Le JWT stocke roles: string[] (ex: ['SUPER_ADMIN']). On supporte aussi role: string hérité.
  const rolesArr: string[] = Array.isArray(user?.roles)
    ? user.roles.map((r: string) => r.toUpperCase())
    : [((user?.role as string) ?? '').toUpperCase()];
  const isAdmin = rolesArr.some((r) => r.includes('ADMIN') || r === 'SUPER_ADMIN' || r === 'NETWORK_ADMIN');
  const isManager = rolesArr.some((r) => r === 'AGENCY_MANAGER' || r === 'MANAGER' || r === 'SUPERVISEUR');
  const isAgent = rolesArr.some((r) => r === 'AGENT' || r === 'CASHIER' || r === 'CAISSIER');
  const isAuditeur = rolesArr.some((r) => r === 'AUDITOR' || r === 'VIEWER' || r === 'AUDITEUR');

  const heureMAJ = mounted && lastUpdated
    ? new Intl.DateTimeFormat(t.dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(lastUpdated))
    : '';

  const heure = new Date().getHours();
  const salutation = heure < 12
    ? t.dashboard.greetingMorning
    : heure < 18
      ? t.dashboard.greetingAfternoon
      : t.dashboard.greetingEvening;
  const prenom = user?.prenom ?? user?.nom ?? t.dashboard.you;

  return (
    <>
      {/* Tour d'onboarding (première connexion). Suspendu tant que le wizard
          admin est ouvert pour éviter deux modales empilées. */}
      <OnboardingTour suspended={isAdmin && wizardVisible} />

      <GmPageHeader
        titre={`${salutation}, ${prenom} 👋`}
        sousTitre={
          <>
            {t.dashboard.title}
            {heureMAJ && <> — {t.dashboard.updatedAtLabel} {heureMAJ}</>}
            {' '}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: 'var(--gm-success, #16a34a)', fontWeight: 600, verticalAlign: 'middle',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--gm-success, #16a34a)',
                animation: 'gmPulse 2s infinite',
                display: 'inline-block',
              }} />
              En direct
            </span>
            {isMock && <> · <span style={{ color: 'var(--gm-warning)' }}>{t.dashboard.demoData}</span></>}
          </>
        }
        actions={
          <>
            <GmButton petit variante="outline" onClick={() => refresh()} disabled={isLoading}>
              {isLoading ? `⏳ ${t.common.loading}` : `🔄 ${t.common.refresh}`}
            </GmButton>
            <GmButton
              petit
              data-tour="new-transaction"
              onClick={() => router.push('/dashboard/transactions?type=depot')}
            >
              + {t.dashboard.newTransaction}
            </GmButton>
            <GmButton
              petit
              variante="ghost"
              data-tour="rapports-link"
              onClick={() => router.push('/dashboard/rapports')}
            >
              📊 {t.dashboard.reportsButton}
            </GmButton>
            <RapportMensuelBtn />
          </>
        }
      />

      {/* Wizard d'onboarding (modal, 1ère connexion) */}
      {isAdmin && wizardVisible && (
        <OnboardingWizard onClose={wizardDismiss} />
      )}

      {/* Bannière "étapes restantes" */}
      {isAdmin && <BanniereOnboarding etat={onboardingEtat} onOpen={wizardOpen} />}

      {/* Checklist d'onboarding (nouveaux comptes uniquement) */}
      {isAdmin && <OnboardingChecklist />}

      {/* Dashboard adaptatif par rôle */}
      <div data-tour="dashboard-kpi">
        {isAdmin && <DashboardAdmin />}
        {isManager && <DashboardManager />}
        {isAgent && <DashboardAgent />}
        {isAuditeur && <DashboardAuditeur />}
        {!isAdmin && !isManager && !isAgent && !isAuditeur && <DashboardAdmin />}
      </div>
    </>
  );
}
