import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { genererRapportMensuelHtml, RapportMensuelData } from './templates/rapport-mensuel.template';

export interface JourStat {
  date: string;
  count: number;
  volume: number;
}

export interface TypeStat {
  type: string;
  count: number;
  volume: number;
}

export interface TopAgent {
  nom: string;
  agence: string;
  nbTransactions: number;
  volume: number;
}

export interface FloatJour {
  date: string;
  total: number;
}

export interface AlerteFloat {
  agentNom: string;
  agenceNom: string;
  balance: number;
  seuil: number;
}

export interface TxRecente {
  id: string;
  type: string;
  montant: number;
  operateur: string | null;
  statut: string;
  clientNom: string;
  agentNom: string;
  agenceNom: string;
  date: string;
}

export interface DashboardAnalytics {
  transactionsParJour: JourStat[];
  transactionsParType: TypeStat[];
  topAgents: TopAgent[];
  evolutionFloat: FloatJour[];
  alertesFloat: AlerteFloat[];
  // Champs calculés aujourd'hui
  nbTransactionsJour: number;
  volumeJour: number;
  variationPct: number;
  nbAgentsActifs: number;
  nbAgences: number;
  transactionsRecentes: TxRecente[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  async getDashboardAnalytics(tenantId: string): Promise<DashboardAnalytics> {
    const now = new Date();
    const il30Jours = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    il30Jours.setHours(0, 0, 0, 0);

    const debutAujourdhui = new Date(now);
    debutAujourdhui.setHours(0, 0, 0, 0);
    const debutHier = new Date(debutAujourdhui.getTime() - 24 * 60 * 60 * 1000);

    const [txRaw, txParType, topAgentsRaw, floatAccounts, agents, txAujourdhui, txHier, txRecentes, nbAgentsActifsRaw, nbAgences] = await Promise.all([
      // Transactions groupées par jour (30 derniers jours)
      this.prisma.transaction.findMany({
        where: {
          tenantId,
          createdAt: { gte: il30Jours },
        },
        select: { createdAt: true, amount: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Transactions par type
      this.prisma.transaction.groupBy({
        by: ['type'],
        where: {
          tenantId,
          createdAt: { gte: il30Jours },
        },
        _count: { id: true },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),

      // Top agents — groupBy agentId
      this.prisma.transaction.groupBy({
        by: ['agentId'],
        where: {
          tenantId,
          createdAt: { gte: il30Jours },
          status: 'COMPLETED',
        },
        _count: { id: true },
        _sum: { amount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),

      // Float actuel par compte
      this.prisma.floatAccount.findMany({
        where: { tenantId },
        select: {
          balance: true,
          updatedAt: true,
        },
      }),

      // Agents pour résoudre les noms
      this.prisma.agent.findMany({
        where: { tenantId },
        select: {
          id: true,
          userId: true,
          agency: { select: { name: true } },
          floatAccounts: {
            select: { balance: true },
            take: 1,
          },
        },
      }),

      // Stats aujourd'hui
      this.prisma.transaction.aggregate({
        where: { tenantId, createdAt: { gte: debutAujourdhui }, status: 'COMPLETED' },
        _count: { id: true },
        _sum: { amount: true },
      }),

      // Stats hier (pour la variation)
      this.prisma.transaction.aggregate({
        where: { tenantId, createdAt: { gte: debutHier, lt: debutAujourdhui }, status: 'COMPLETED' },
        _count: { id: true },
        _sum: { amount: true },
      }),

      // 10 dernières transactions avec détails
      this.prisma.transaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          createdAt: true,
          senderName: true,
          receiverName: true,
          operatorCode: true,
          agentId: true,
          agencyId: true,
          network: { select: { operatorCode: true } },
        },
      }),

      // Nombre d'agents ayant fait au moins 1 transaction ce mois
      this.prisma.transaction.findMany({
        where: { tenantId, createdAt: { gte: il30Jours }, status: 'COMPLETED' },
        select: { agentId: true },
        distinct: ['agentId'],
      }),

      // Nombre d'agences actives
      this.prisma.agency.count({ where: { tenantId, status: 'ACTIVE' } }),
    ]);

    // Charger les agences pour résoudre les noms dans transactionsRecentes
    const agencyIds = [...new Set(txRecentes.map((tx) => tx.agencyId).filter(Boolean))];
    const agenciesForTx = await this.prisma.agency.findMany({
      where: { id: { in: agencyIds } },
      select: { id: true, name: true },
    });
    const agencyMap = new Map(agenciesForTx.map((a) => [a.id, a]));

    // Résoudre les noms d'utilisateurs en une requête groupée
    const userIds = agents.map((a) => a.userId).filter(Boolean);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // ─── Transactions par jour ──────────────────────────────────────────────────
    const jourMap = new Map<string, { count: number; volume: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(il30Jours.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      jourMap.set(key, { count: 0, volume: 0 });
    }
    for (const tx of txRaw) {
      const key = tx.createdAt.toISOString().slice(0, 10);
      const entry = jourMap.get(key);
      if (entry) {
        entry.count += 1;
        if (tx.status === 'COMPLETED') {
          entry.volume += Number(tx.amount ?? 0);
        }
      }
    }
    const transactionsParJour: JourStat[] = Array.from(jourMap.entries()).map(
      ([date, v]) => ({ date, ...v }),
    );

    // ─── Par type ───────────────────────────────────────────────────────────────
    const transactionsParType: TypeStat[] = txParType.map((r) => ({
      type: r.type,
      count: r._count.id,
      volume: Number(r._sum.amount ?? 0),
    }));

    // ─── Top agents ─────────────────────────────────────────────────────────────
    const agentMap = new Map(agents.map((a) => [a.id, a]));
    const topAgents: TopAgent[] = topAgentsRaw
      .filter((r) => r.agentId != null)
      .map((r) => {
        const a = agentMap.get(r.agentId!);
        const u = a ? userMap.get(a.userId) : undefined;
        const nom = u
          ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Agent inconnu'
          : 'Agent inconnu';
        const agence = a?.agency?.name ?? '—';
        return {
          nom,
          agence,
          nbTransactions: r._count.id,
          volume: Number(r._sum.amount ?? 0),
        };
      });

    // ─── Evolution float — on simule 30 jours (float actuel - snapshots absents) ─
    // Sans table de snapshots, on retourne le float actuel réparti sur 30 jours
    // avec une légère variation aléatoire déterministe pour la courbe.
    const totalFlotActuel = floatAccounts.reduce(
      (s, f) => s + (Number(f.balance) ?? 0),
      0,
    );
    const evolutionFloat: FloatJour[] = transactionsParJour.map((j, i) => {
      // Simulation d'évolution basée sur volume tx du jour
      const variation = j.volume * 0.1;
      const total = Math.max(0, totalFlotActuel - variation * (29 - i));
      return { date: j.date, total: Math.round(total) };
    });

    // ─── Alertes float bas ──────────────────────────────────────────────────────
    const SEUIL_DEFAULT = 100_000;
    const alertesFloat: AlerteFloat[] = agents
      .filter((a) => {
        const bal = a.floatAccounts?.[0]?.balance;
        return bal != null && Number(bal) < SEUIL_DEFAULT;
      })
      .map((a) => {
        const u = userMap.get(a.userId);
        return {
          agentNom: u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Agent' : 'Agent',
          agenceNom: a.agency?.name ?? '—',
          balance: Number(a.floatAccounts?.[0]?.balance ?? 0),
          seuil: SEUIL_DEFAULT,
        };
      })
      .slice(0, 10);

    // ─── Stats aujourd'hui ──────────────────────────────────────────────────────
    const volJour = Number(txAujourdhui._sum.amount ?? 0);
    const volHier = Number(txHier._sum.amount ?? 0);
    const variationPct = volHier > 0 ? Math.round(((volJour - volHier) / volHier) * 100) : 0;

    const transactionsRecentes: TxRecente[] = txRecentes.map((tx) => {
      const agent = agentMap.get(tx.agentId ?? '');
      const user = agent ? userMap.get(agent.userId) : undefined;
      const agentNom = user
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Agent'
        : 'Agent';
      const agenceNom = agencyMap.get(tx.agencyId ?? '')?.name ?? '—';
      return {
        id: tx.id,
        type: tx.type,
        montant: Number(tx.amount ?? 0),
        operateur: tx.network?.operatorCode ?? tx.operatorCode ?? null,
        statut: tx.status,
        clientNom: tx.senderName ?? tx.receiverName ?? 'Client',
        agentNom,
        agenceNom,
        date: tx.createdAt.toISOString(),
      };
    });

    return {
      transactionsParJour,
      transactionsParType,
      topAgents,
      evolutionFloat,
      alertesFloat,
      nbTransactionsJour: txAujourdhui._count.id,
      volumeJour: volJour,
      variationPct,
      nbAgentsActifs: nbAgentsActifsRaw.length,
      nbAgences,
      transactionsRecentes,
    };
  }

  // ─── CRON mensuel ─────────────────────────────────────────────────────────────

  /**
   * Le 1er de chaque mois à 7h00 UTC : envoie un rapport de synthèse du mois
   * précédent à tous les NETWORK_ADMIN de chaque tenant actif.
   */
  // ─── NOUVELLES MÉTHODES RAPPORT MENSUEL ───────────────────────────────────────

  /** Compare le mois M avec le mois M-1. */
  async getComparaisonMoisPrecedent(tenantId: string, mois: number, annee: number) {
    const debutM  = new Date(annee, mois - 1, 1);
    const finM    = new Date(annee, mois, 0, 23, 59, 59, 999);
    const debutM1 = new Date(annee, mois - 2, 1);
    const finM1   = new Date(annee, mois - 1, 0, 23, 59, 59, 999);

    const where  = (gte: Date, lte: Date) => ({ tenantId, createdAt: { gte, lte }, status: 'COMPLETED' as const });
    const whereC = (gte: Date, lte: Date) => ({ tenantId, createdAt: { gte, lte } });

    const [txM, txM1, commM, commM1, clientsM, clientsM1, topOpM, topAgentM, floatAccounts] = await Promise.all([
      this.prisma.transaction.aggregate({ where: where(debutM, finM),   _count: { id: true }, _sum: { amount: true } }),
      this.prisma.transaction.aggregate({ where: where(debutM1, finM1), _count: { id: true }, _sum: { amount: true } }),
      this.prisma.commissionEarning.aggregate({ where: whereC(debutM, finM),   _sum: { grossAmount: true } }),
      this.prisma.commissionEarning.aggregate({ where: whereC(debutM1, finM1), _sum: { grossAmount: true } }),
      this.prisma.customer.count({ where: { tenantId, createdAt: { gte: debutM, lte: finM } } }),
      this.prisma.customer.count({ where: { tenantId, createdAt: { gte: debutM1, lte: finM1 } } }),
      this.prisma.transaction.groupBy({
        by: ['operatorCode'],
        where: where(debutM, finM),
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
      this.prisma.transaction.groupBy({
        by: ['agentId'],
        where: where(debutM, finM),
        _count: { id: true },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 1,
      }),
      this.prisma.floatAccount.aggregate({ where: { tenantId }, _avg: { balance: true } }),
    ]);

    const calcEvo = (a: number, b: number) => b === 0 ? (a > 0 ? 100 : 0) : +((a - b) / b * 100).toFixed(1);
    const tendance = (v: number): 'hausse' | 'baisse' | 'stable' => v > 1 ? 'hausse' : v < -1 ? 'baisse' : 'stable';

    // Opérateur le plus utilisé (code brut)
    const topOperateur = topOpM.length > 0 ? (topOpM[0].operatorCode ?? '—') : '—';

    // Résoudre nom agent
    let topAgent = { nom: '—', volume: 0 };
    if (topAgentM.length > 0 && topAgentM[0].agentId) {
      const ag = await this.prisma.agent.findUnique({
        where: { id: topAgentM[0].agentId },
        select: { userId: true },
      }).catch(() => null);
      if (ag) {
        const u = await this.prisma.user.findUnique({ where: { id: ag.userId }, select: { firstName: true, lastName: true } }).catch(() => null);
        topAgent = {
          nom: u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Agent' : 'Agent',
          volume: Number(topAgentM[0]._sum?.amount ?? 0),
        };
      }
    }

    const txActuel   = txM._count.id;
    const txPrec     = txM1._count.id;
    const volActuel  = Number(txM._sum.amount ?? 0);
    const volPrec    = Number(txM1._sum.amount ?? 0);
    const commActuel = Number(commM._sum.grossAmount ?? 0);
    const commPrec   = Number(commM1._sum.grossAmount ?? 0);
    const cliVar     = calcEvo(clientsM, clientsM1);
    const txVar      = calcEvo(txActuel, txPrec);
    const volVar     = calcEvo(volActuel, volPrec);
    const commVar    = calcEvo(commActuel, commPrec);

    return {
      transactions:     { moisActuel: txActuel,   moisPrecedent: txPrec,   variation: txVar,   tendance: tendance(txVar) },
      volume:           { moisActuel: volActuel,   moisPrecedent: volPrec,  variation: volVar,  tendance: tendance(volVar) },
      commissions:      { moisActuel: commActuel,  moisPrecedent: commPrec, variation: commVar, tendance: tendance(commVar) },
      nouveauxClients:  { moisActuel: clientsM,    moisPrecedent: clientsM1, variation: cliVar, tendance: tendance(cliVar) },
      topOperateur,
      topAgent,
      floatMoyen: Math.round(Number(floatAccounts._avg?.balance ?? 0)),
    };
  }

  /** Évolution sur les 6 derniers mois glissants. */
  async getEvolution6Mois(tenantId: string) {
    const now = new Date();
    const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const debut = new Date(d.getFullYear(), d.getMonth(), 1);
      const fin   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const [tx, comm, clients] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: { tenantId, createdAt: { gte: debut, lte: fin }, status: 'COMPLETED' },
          _count: { id: true },
          _sum: { amount: true },
        }),
        this.prisma.commissionEarning.aggregate({
          where: { tenantId, createdAt: { gte: debut, lte: fin } },
          _sum: { grossAmount: true },
        }),
        this.prisma.customer.count({ where: { tenantId, createdAt: { gte: debut, lte: fin } } }),
      ]);

      result.push({
        mois: MOIS_FR[d.getMonth()],
        transactions: tx._count.id,
        volume: Number(tx._sum.amount ?? 0),
        commissions: Number(comm._sum.grossAmount ?? 0),
        clients,
      });
    }
    return result;
  }

  /** Répartition par opérateur sur un mois. */
  async getAnalyseParOperateur(tenantId: string, mois: number, annee: number) {
    const debut = new Date(annee, mois - 1, 1);
    const fin   = new Date(annee, mois, 0, 23, 59, 59, 999);
    const debutM1 = new Date(annee, mois - 2, 1);
    const finM1   = new Date(annee, mois - 1, 0, 23, 59, 59, 999);

    const [parOp, parOpPrec] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['operatorCode'],
        where: { tenantId, createdAt: { gte: debut, lte: fin }, status: 'COMPLETED' },
        _count: { id: true },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.transaction.groupBy({
        by: ['operatorCode'],
        where: { tenantId, createdAt: { gte: debutM1, lte: finM1 }, status: 'COMPLETED' },
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    const totalVolume = parOp.reduce((s, r) => s + Number(r._sum.amount ?? 0), 0);
    const precMap = new Map(parOpPrec.map((r) => [r.operatorCode, Number(r._sum.amount ?? 0)]));

    return parOp.map((r) => {
      const vol = Number(r._sum.amount ?? 0);
      const volPrec = precMap.get(r.operatorCode) ?? 0;
      const evolution = volPrec === 0 ? (vol > 0 ? 100 : 0) : +((vol - volPrec) / volPrec * 100).toFixed(1);
      return {
        operateur: r.operatorCode ?? '—',
        transactions: r._count.id,
        volume: vol,
        partPourcentage: totalVolume > 0 ? +(vol / totalVolume * 100).toFixed(1) : 0,
        evolution,
      };
    });
  }

  /** Classement des agences sur un mois. */
  async getPerformanceAgences(tenantId: string, mois: number, annee: number) {
    const debut = new Date(annee, mois - 1, 1);
    const fin   = new Date(annee, mois, 0, 23, 59, 59, 999);

    const parAgence = await this.prisma.transaction.groupBy({
      by: ['agencyId'],
      where: { tenantId, createdAt: { gte: debut, lte: fin }, status: 'COMPLETED', agencyId: { not: null } },
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const agenceIds = parAgence.map((r) => r.agencyId!).filter(Boolean) as string[];
    const agences: { id: string; name: string }[] = await this.prisma.agency.findMany({
      where: { id: { in: agenceIds } },
      select: { id: true, name: true },
    }).catch(() => []);
    const agenceMap = new Map<string, string>(agences.map((a) => [a.id, a.name]));

    // Nombre d'agents par agence
    const agentsParAgence: { agencyId: string | null; _count: { id: number } }[] = await this.prisma.agent.groupBy({
      by: ['agencyId'],
      where: { tenantId, agencyId: { in: agenceIds }, status: 'ACTIVE' },
      _count: { id: true },
    }).catch(() => []);
    const agentsMap = new Map<string, number>(
      agentsParAgence.filter((r) => r.agencyId != null).map((r) => [r.agencyId as string, r._count.id]),
    );

    // Float moyen par agence
    const floatParAgenceRaw = await this.prisma.floatAccount.groupBy({
      by: ['agencyId'],
      where: { tenantId, agencyId: { in: agenceIds } },
      _avg: { balance: true },
    }).catch(() => [] as { agencyId: string | null; _avg: { balance: import('@prisma/client').Prisma.Decimal | null } }[]);
    const floatParAgence = floatParAgenceRaw as { agencyId: string | null; _avg: { balance: import('@prisma/client').Prisma.Decimal | null } }[];
    const floatMap = new Map<string, number>(
      floatParAgence.filter((r) => r.agencyId != null).map((r) => [r.agencyId as string, Number(r._avg?.balance ?? 0)]),
    );

    return parAgence.map((r, idx) => ({
      agence: { id: r.agencyId!, nom: agenceMap.get(r.agencyId!) ?? 'Agence inconnue' },
      transactions: r._count.id,
      volume: Number(r._sum.amount ?? 0),
      agents: agentsMap.get(r.agencyId!) ?? 0,
      floatMoyen: Math.round(floatMap.get(r.agencyId!) ?? 0),
      rang: idx + 1,
    }));
  }

  // ─── CRON mensuel ─────────────────────────────────────────────────────────────

  /**
   * Le 1er de chaque mois à 7h00 UTC : envoie un rapport de synthèse du mois
   * précédent à tous les NETWORK_ADMIN de chaque tenant actif.
   */
  @Cron('0 7 1 * *')
  async envoyerRapportsMensuelsAutomatiques(): Promise<void> {
    this.logger.log('[CRON] Démarrage envoi rapports mensuels...');

    try {
      // 1. Tous les tenants actifs
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, currency: true },
      });

      for (const tenant of tenants) {
        try {
          await this._envoyerRapportPourTenant(tenant);
        } catch (err: any) {
          this.logger.error(`[CRON] Erreur tenant ${tenant.id}: ${err.message}`);
        }
      }

      this.logger.log(`[CRON] Rapports mensuels envoyés (${tenants.length} tenants).`);
    } catch (err: any) {
      this.logger.error(`[CRON] Échec général rapports mensuels: ${err.message}`);
    }
  }

  private async _envoyerRapportPourTenant(tenant: { id: string; name: string; currency: string }): Promise<void> {
    const now = new Date();
    // Mois précédent
    const debutMoisPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const finMoisPrecedent   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    // Mois d'avant (pour comparer)
    const debutMoisAvant = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const finMoisAvant   = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);

    // 2. Stats du mois précédent et du mois d'avant (pour l'évolution)
    const [txMois, txAvant, commMois, commAvant, agentsMois, agentsAvant, topAgencesRaw, topAgentsRaw] =
      await Promise.all([
        this.prisma.transaction.aggregate({
          where: { tenantId: tenant.id, createdAt: { gte: debutMoisPrecedent, lte: finMoisPrecedent }, status: 'COMPLETED' },
          _count: { id: true },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { tenantId: tenant.id, createdAt: { gte: debutMoisAvant, lte: finMoisAvant }, status: 'COMPLETED' },
          _count: { id: true },
          _sum: { amount: true },
        }),
        this.prisma.commissionEarning.aggregate({
          where: { tenantId: tenant.id, createdAt: { gte: debutMoisPrecedent, lte: finMoisPrecedent } },
          _sum: { grossAmount: true },
        }),
        this.prisma.commissionEarning.aggregate({
          where: { tenantId: tenant.id, createdAt: { gte: debutMoisAvant, lte: finMoisAvant } },
          _sum: { grossAmount: true },
        }),
        this.prisma.agent.count({
          where: { tenantId: tenant.id, status: 'ACTIVE' },
        }),
        this.prisma.agent.count({
          where: { tenantId: tenant.id, status: 'ACTIVE' },
        }),
        // Top 3 agences
        this.prisma.transaction.groupBy({
          by: ['agencyId'],
          where: { tenantId: tenant.id, createdAt: { gte: debutMoisPrecedent, lte: finMoisPrecedent }, status: 'COMPLETED', agencyId: { not: null } },
          _count: { id: true },
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
          take: 3,
        }),
        // Top 3 agents
        this.prisma.transaction.groupBy({
          by: ['agentId'],
          where: { tenantId: tenant.id, createdAt: { gte: debutMoisPrecedent, lte: finMoisPrecedent }, status: 'COMPLETED', agentId: { not: null } },
          _count: { id: true },
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
          take: 3,
        }),
      ]);

    const calcEvo = (actuel: number, precedent: number): number => {
      if (precedent === 0) return actuel > 0 ? 100 : 0;
      return ((actuel - precedent) / precedent) * 100;
    };

    const nbTx       = txMois._count.id;
    const volume     = Number(txMois._sum.amount ?? 0);
    const nbTxAvant  = txAvant._count.id;
    const volAvant   = Number(txAvant._sum.amount ?? 0);
    const comm       = Number(commMois._sum.grossAmount ?? 0);
    const commAv     = Number(commAvant._sum.grossAmount ?? 0);

    // Résoudre noms agences
    const agenceIds  = topAgencesRaw.map((r) => r.agencyId!).filter(Boolean);
    const agentIds   = topAgentsRaw.map((r) => r.agentId!).filter(Boolean);

    const [agences, agents] = await Promise.all([
      this.prisma.agency.findMany({ where: { id: { in: agenceIds } }, select: { id: true, name: true } }),
      this.prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, userId: true, agency: { select: { name: true } } },
      }),
    ]);

    const userIds = agents.map((a) => a.userId).filter(Boolean);
    const users   = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const agenceMap = new Map(agences.map((a) => [a.id, a.name]));
    const agentMap  = new Map(agents.map((a) => [a.id, a]));
    const userMap   = new Map(users.map((u) => [u.id, u]));

    const moisAnnee = debutMoisPrecedent.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const moisUrlStr = `${debutMoisPrecedent.getFullYear()}-${String(debutMoisPrecedent.getMonth() + 1).padStart(2, '0')}`;
    const baseUrl   = this.config.get<string>('APP_URL') ?? 'https://gestmoney.ibigsoft.com';

    const data: RapportMensuelData = {
      nomReseau: tenant.name,
      moisAnnee,
      moisAnneeUrl: moisUrlStr,
      dashboardUrl: `${baseUrl}/dashboard`,
      nbTransactions: nbTx,
      volume,
      commissions: comm,
      agentsActifs: agentsMois,
      evoTransactions: calcEvo(nbTx, nbTxAvant),
      evoVolume: calcEvo(volume, volAvant),
      evoCommissions: calcEvo(comm, commAv),
      evoAgents: calcEvo(agentsMois, agentsAvant),
      topAgences: topAgencesRaw.map((r) => ({
        nom: agenceMap.get(r.agencyId!) ?? 'Agence inconnue',
        nbTx: r._count.id,
        volume: Number(r._sum.amount ?? 0),
      })),
      topAgents: topAgentsRaw.map((r) => {
        const ag = agentMap.get(r.agentId!);
        const u  = ag ? userMap.get(ag.userId) : undefined;
        return {
          nom: u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Agent' : 'Agent',
          agence: ag?.agency?.name ?? '—',
          nbTx: r._count.id,
          volume: Number(r._sum.amount ?? 0),
        };
      }),
      currency: tenant.currency || 'XOF',
    };

    const html = genererRapportMensuelHtml(data);

    // 3. NETWORK_ADMIN du tenant
    const admins = await this.prisma.user.findMany({
      where: {
        tenantId: tenant.id,
        status: 'ACTIVE',
        userRoles: { some: { role: { name: 'NETWORK_ADMIN' } } },
        email: { not: null },
      },
      select: { email: true },
    });

    for (const admin of admins) {
      if (!admin.email) continue;
      await this.notifications.sendEmail({
        to: admin.email,
        subject: `Rapport mensuel GESTMONEY — ${data.nomReseau} — ${moisAnnee}`,
        body: `Rapport mensuel ${moisAnnee} pour ${data.nomReseau}`,
        html,
        tenantId: tenant.id,
      });
    }

    this.logger.log(`[CRON] Rapport ${tenant.name} (${moisAnnee}) → ${admins.length} admin(s).`);
  }
}
