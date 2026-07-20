'use client';
// ============================================================
// DASHBOARD PRINCIPAL — GESTMONEY
// Présentation fidèle à /mockup/index.html (classes gm-*)
// Dashboard adaptatif par rôle utilisateur
// Rôles : SUPER_ADMIN / ADMIN | MANAGER | AGENT/CAISSIER | AUDITEUR
// ============================================================
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MiniChart } from '@/components/ui/MiniChart';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
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
  const { stats, isLoading } = useDashboardStats();
  const router = useRouter();
  const t = useT();
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={6} />;

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
    </>
  );
}

// ─── Vue MANAGER ─────────────────────────────────────────────────────────────

function DashboardManager() {
  const { stats, isLoading } = useDashboardStats();
  const router = useRouter();
  const t = useT();
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={3} />;

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
    </>
  );
}

// ─── Vue AGENT / CAISSIER ────────────────────────────────────────────────────

function DashboardAgent() {
  const { stats, isLoading } = useDashboardStats();
  const router = useRouter();
  const t = useT();
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={3} />;

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
  const { stats, isLoading } = useDashboardStats();
  const router = useRouter();
  const t = useT();
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={3} />;

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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { refresh, isLoading, isMock, lastUpdated } = useDashboardStats();
  const router = useRouter();
  const t = useT();
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
      {/* Tour d'onboarding (première connexion) */}
      <OnboardingTour />

      <GmPageHeader
        titre={`${salutation}, ${prenom} 👋`}
        sousTitre={
          <>
            {t.dashboard.title}
            {heureMAJ && <> — {t.dashboard.updatedAtLabel} {heureMAJ}</>}
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
          </>
        }
      />

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
