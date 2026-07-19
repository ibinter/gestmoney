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

const STATUT_LABELS: Record<Transaction['statut'], string> = {
  success: 'Succès',
  pending: 'En attente',
  failed: 'Échouée',
};

/** Trend de carte à partir d'un pourcentage de variation réel. */
function trendVariation(pct: number | undefined): GmTrend | undefined {
  if (pct === undefined || pct === null || Number.isNaN(pct)) return undefined;
  return {
    sens: pct >= 0 ? 'up' : 'down',
    label: `${pct >= 0 ? '↑' : '↓'} ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs hier`,
    infobulle: 'Variation par rapport à la veille',
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
  if (transactions.length === 0) {
    return (
      <GmTableWrap>
        <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--gm-text-2)' }}>
          Aucune transaction sur la période.
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
              <th>Heure</th>
              <th>Type</th>
              {colonneAgent && <th>Agent</th>}
              <th>Opérateur</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td style={{ color: 'var(--gm-text-2)', fontSize: 12 }}>{formatRelative(tx.date)}</td>
                <td><span className={badgeClass(tx.type)}>{TYPE_LABELS[tx.type] ?? tx.type}</span></td>
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
                  <GmStatusPill statut={tx.statut}>● {STATUT_LABELS[tx.statut]}</GmStatusPill>
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
  return (
    <div className="gm-section-card" style={{ marginBottom: 24 }}>
      <div className="gm-section-head">
        <div>
          <div className="gm-section-title">Transactions — 7 derniers jours</div>
          <div className="gm-section-sub">Nombre de transactions par jour</div>
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
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={6} />;

  const alertes = [
    (stats?.alertesFloatBas ?? 0) > 0 && `${stats?.alertesFloatBas} float bas`,
    (stats?.alertesAgentsInactifs ?? 0) > 0 && `${stats?.alertesAgentsInactifs} agent(s) inactif(s)`,
    (stats?.commissionsAValider ?? 0) > 0 && `${stats?.commissionsAValider} commission(s) à valider`,
  ].filter(Boolean) as string[];

  return (
    <>
      <GmCardGrid>
        {/* Transactions */}
        <GmCard
          icone="💳"
          titre="Transactions"
          trend={trendVariation(stats?.variationPct)}
          onClick={() => router.push('/dashboard/transactions')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/transactions?type=depot')}>+ Dépôt</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/transactions?type=retrait')}>+ Retrait</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.nbTransactionsJour ?? 0)} label="transactions aujourd'hui" />
          <GmMetricSub icone="💰">
            <strong style={{ color: 'var(--gm-text)' }}>{formatMontant(stats?.volumeJour ?? 0)}</strong> traités
          </GmMetricSub>
        </GmCard>

        {/* Volume */}
        <GmCard
          icone="💵"
          titre="Volume du jour"
          trend={trendVariation(stats?.variationPct)}
          onClick={() => router.push('/dashboard/transactions')}
          actions={<GmButton petit variante="outline" onClick={go('/dashboard/rapports')}>Voir rapports</GmButton>}
        >
          <GmMetric valeur={formatMontant(stats?.volumeJour ?? 0)} label="XOF traités aujourd'hui" />
          <GmMetricSub icone="📈">
            Moyenne par transaction :{' '}
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
          titre="Agents"
          trend={{ sens: 'up', label: `${stats?.nbAgentsActifs ?? 0} actifs` }}
          onClick={() => router.push('/dashboard/agents')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/agents')}>Voir agents</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/agents')}>+ Créer agent</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.nbAgentsActifs ?? 0)} label="agents actifs" />
          <GmMetricSub icone="🔴">
            {(stats?.alertesAgentsInactifs ?? 0) > 0 ? (
              <span style={{ color: 'var(--gm-warning)' }}>
                {stats?.alertesAgentsInactifs} agent(s) inactif(s)
              </span>
            ) : (
              'Aucun agent inactif'
            )}
          </GmMetricSub>
        </GmCard>

        {/* Agences */}
        <GmCard
          icone="🏪"
          titre="Agences"
          trend={{ sens: 'up', label: `${stats?.nbAgencesActives ?? 0} actives` }}
          onClick={() => router.push('/dashboard/agences')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/agences')}>Voir agences</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/agences')}>+ Nouvelle agence</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.nbAgencesActives ?? 0)} label="agences actives" />
          <GmMetricSub icone="👥">
            {CHIFFRE(stats?.nbAgentsActifs ?? 0)} agents actifs répartis
          </GmMetricSub>
        </GmCard>

        {/* Commissions */}
        <GmCard
          icone="💰"
          titre="Commissions"
          trend={
            (stats?.commissionsAValider ?? 0) > 0
              ? { sens: 'warn', label: `${stats?.commissionsAValider} à valider` }
              : { sens: 'up', label: 'À jour' }
          }
          onClick={() => router.push('/dashboard/commissions')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/commissions')}>Valider</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/commissions')}>Historique</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.commissionsAValider ?? 0)} label="commission(s) en attente de validation" />
        </GmCard>

        {/* Float opérateurs */}
        <GmCard
          icone="🏦"
          titre="Float opérateurs"
          trend={
            (stats?.alertesFloatBas ?? 0) > 0
              ? { sens: 'warn', label: `⚠️ ${stats?.alertesFloatBas} float bas` }
              : { sens: 'up', label: 'Niveaux OK' }
          }
          onClick={() => router.push('/dashboard/float')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/float')}>Réapprovisionner</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/float')}>Voir float</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.alertesFloatBas ?? 0)} label="opérateur(s) sous le seuil" />
          <GmMetricSub icone="📊">Détail des soldes par opérateur dans la page Float</GmMetricSub>
        </GmCard>
      </GmCardGrid>

      {/* Sparkline 7 jours — données réelles */}
      {stats?.sparklineData && stats.sparklineData.length > 0 && (
        <CarteSparkline data={stats.sparklineData} />
      )}

      {/* Bannière d'alertes — dérivée des vraies stats */}
      {alertes.length > 0 && (
        <BanniereAlertes
          titre="Alertes"
          message={<>Points à traiter : <strong>{alertes.join(' · ')}</strong>.</>}
          actions={
            <>
              <button className="gm-btn-ai gm-btn-ai-primary" onClick={() => router.push('/dashboard/float')}>
                Agir maintenant
              </button>
              <button className="gm-btn-ai gm-btn-ai-ghost" onClick={() => router.push('/dashboard/commissions')}>
                Voir commissions
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
            Voir tout →
          </a>
        }
      >
        Activité récente
      </GmSectionTitle>
      <TableauTransactions transactions={(stats?.transactionsRecentes ?? []).slice(0, 10)} />
    </>
  );
}

// ─── Vue MANAGER ─────────────────────────────────────────────────────────────

function DashboardManager() {
  const { stats, isLoading } = useDashboardStats();
  const router = useRouter();
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={3} />;

  return (
    <>
      <GmCardGrid>
        <GmCard
          icone="💳"
          titre="Transactions agence"
          trend={trendVariation(stats?.variationPct)}
          onClick={() => router.push('/dashboard/transactions')}
          actions={<GmButton petit onClick={go('/dashboard/transactions?type=depot')}>+ Transaction</GmButton>}
        >
          <GmMetric valeur={CHIFFRE(stats?.nbTransactionsJour ?? 0)} label="transactions aujourd'hui" />
        </GmCard>

        <GmCard
          icone="💵"
          titre="Volume agence"
          onClick={() => router.push('/dashboard/rapports')}
          actions={<GmButton petit variante="outline" onClick={go('/dashboard/rapports')}>Rapports</GmButton>}
        >
          <GmMetric valeur={formatMontant(stats?.volumeAgence ?? 0)} label="XOF sur mon agence" />
        </GmCard>

        <GmCard
          icone="👥"
          titre="Mon équipe"
          trend={{ sens: 'up', label: `${stats?.nbAgentsSupervisés ?? 0} supervisés` }}
          onClick={() => router.push('/dashboard/agents')}
          actions={<GmButton petit onClick={go('/dashboard/agents')}>Voir agents</GmButton>}
        >
          <GmMetric valeur={CHIFFRE(stats?.nbAgentsSupervisés ?? 0)} label="agents supervisés" />
        </GmCard>
      </GmCardGrid>

      {stats?.alerteFloatAgence && (
        <BanniereAlertes
          titre="Alerte float"
          message={<>Le float de <strong>votre agence</strong> est en dessous du seuil configuré.</>}
          actions={
            <button className="gm-btn-ai gm-btn-ai-primary" onClick={() => router.push('/dashboard/float')}>
              Réapprovisionner
            </button>
          }
        />
      )}

      <GmSectionTitle>Performances de mon équipe</GmSectionTitle>
      <GmTableWrap>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Transactions</th>
                <th>Volume</th>
                <th>Commission</th>
                <th>Statut</th>
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
                      {agent.statut === 'actif' ? 'Actif' : 'Inactif'}
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
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={3} />;

  const floatBas = (stats?.monFloat ?? 0) < 100000;

  return (
    <>
      <GmCardGrid>
        <GmCard
          icone="💳"
          titre="Mes transactions"
          trend={trendVariation(stats?.variationPct)}
          onClick={() => router.push('/dashboard/transactions')}
          actions={
            <>
              <GmButton petit onClick={go('/dashboard/transactions?type=depot')}>+ Dépôt</GmButton>
              <GmButton petit variante="outline" onClick={go('/dashboard/transactions?type=retrait')}>+ Retrait</GmButton>
            </>
          }
        >
          <GmMetric valeur={CHIFFRE(stats?.nbTransactionsJour ?? 0)} label="transactions aujourd'hui" />
          <GmMetricSub icone="💰">
            <strong style={{ color: 'var(--gm-text)' }}>{formatMontant(stats?.volumeJour ?? 0)}</strong> traités
          </GmMetricSub>
        </GmCard>

        <GmCard
          icone="🏦"
          titre="Mon float"
          trend={floatBas ? { sens: 'warn', label: '⚠️ Seuil bas' } : { sens: 'up', label: 'Niveau correct' }}
          onClick={() => router.push('/dashboard/float')}
          actions={<GmButton petit onClick={go('/dashboard/float')}>Demander un réappro</GmButton>}
        >
          <GmMetric valeur={formatMontant(stats?.monFloat ?? 0)} label="XOF disponibles" />
          <GmMetricSub icone={floatBas ? '🔴' : '🟢'}>
            {floatBas ? 'Seuil bas — contactez votre manager' : 'Niveau correct'}
          </GmMetricSub>
        </GmCard>

        <GmCard
          icone="📈"
          titre="Ma commission"
          onClick={() => router.push('/dashboard/commissions')}
          actions={<GmButton petit variante="outline" onClick={go('/dashboard/commissions')}>Détail</GmButton>}
        >
          <GmMetric valeur={formatMontant(stats?.maCommissionMois ?? 0)} label="XOF ce mois" />
        </GmCard>
      </GmCardGrid>

      <GmSectionTitle
        action={
          <a
            href="/dashboard/transactions"
            style={{ fontSize: 12, color: 'var(--gm-primary)', textDecoration: 'none', fontWeight: 500 }}
          >
            Voir tout →
          </a>
        }
      >
        Mes dernières transactions
      </GmSectionTitle>
      <TableauTransactions transactions={stats?.mesTransactions ?? []} colonneAgent={false} />
    </>
  );
}

// ─── Vue AUDITEUR / VIEWER ───────────────────────────────────────────────────

function DashboardAuditeur() {
  const { stats, isLoading } = useDashboardStats();
  const router = useRouter();
  const go = (href: string) => (e: React.MouseEvent) => { e.stopPropagation(); router.push(href); };

  if (isLoading) return <GrilleSquelette n={3} />;

  return (
    <>
      <GmCardGrid>
        <GmCard
          icone="🛡️"
          titre="Opérations auditées"
          onClick={() => router.push('/dashboard/rapports')}
          actions={<GmButton petit variante="outline" onClick={go('/dashboard/rapports')}>Exporter</GmButton>}
        >
          <GmMetric valeur={CHIFFRE(stats?.operationsAuditees ?? 0)} label="opérations auditées" />
        </GmCard>

        <GmCard
          icone="💳"
          titre="Transactions du jour"
          trend={trendVariation(stats?.variationPct)}
          onClick={() => router.push('/dashboard/transactions')}
        >
          <GmMetric valeur={CHIFFRE(stats?.nbTransactionsJour ?? 0)} label="transactions aujourd'hui" />
        </GmCard>

        <GmCard
          icone="💵"
          titre="Volume du jour"
          onClick={() => router.push('/dashboard/rapports')}
        >
          <GmMetric valeur={formatMontant(stats?.volumeJour ?? 0)} label="XOF traités" />
        </GmCard>
      </GmCardGrid>

      <GmSectionTitle>Journal d'audit récent</GmSectionTitle>
      <GmTableWrap>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Utilisateur</th>
                <th>Ressource</th>
                <th>IP</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.journalAudit ?? []).map((entry) => (
                <tr key={entry.id}>
                  <td><span className="gm-badge gm-badge-cashin">{entry.action}</span></td>
                  <td style={{ fontSize: 12 }}>{entry.utilisateur}</td>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{entry.ressource}</td>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{entry.ip}</td>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{formatRelative(entry.date)}</td>
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

  const heure = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';
  const prenom = user?.prenom ?? user?.nom ?? 'vous';

  return (
    <>
      {/* Tour d'onboarding (première connexion) */}
      <OnboardingTour />

      <GmPageHeader
        titre={`${salutation}, ${prenom} 👋`}
        sousTitre={
          <>
            Tableau de bord
            {heureMAJ && <> — mis à jour à {heureMAJ}</>}
            {isMock && <> · <span style={{ color: 'var(--gm-warning)' }}>données de démonstration</span></>}
          </>
        }
        actions={
          <>
            <GmButton petit variante="outline" onClick={() => refresh()} disabled={isLoading}>
              {isLoading ? '⏳ Chargement…' : '🔄 Actualiser'}
            </GmButton>
            <GmButton
              petit
              data-tour="new-transaction"
              onClick={() => router.push('/dashboard/transactions?type=depot')}
            >
              + Nouvelle transaction
            </GmButton>
            <GmButton
              petit
              variante="ghost"
              data-tour="rapports-link"
              onClick={() => router.push('/dashboard/rapports')}
            >
              📊 Rapports
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
