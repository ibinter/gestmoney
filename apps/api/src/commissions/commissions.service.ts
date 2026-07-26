import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normaliserPagination } from '../common/utils/pagination';
import { CommissionPlanDto } from './dto/commission-plan.dto';
import {
  CalculateCommissionsDto,
  QueryCommissionDto,
  ValidatePaymentDto,
} from './dto/query-commission.dto';
import { CommissionPlanNotFoundException } from '../common/exceptions/business.exceptions';
import {
  MobileMoneyOperator,
  TransactionType,
  fromPrismaTransactionType,
  toPrismaTransactionType,
} from '../transactions/interfaces/transaction.interface';

/**
 * Service commissions — recâblé sur le schéma Prisma RÉEL.
 *
 * Modèles réels (packages/database/schema.prisma) :
 *   - CommissionPlan   : grille, rattachée à un Network (networkId) + basis
 *   - CommissionRate   : les « paliers » (transactionType, min/maxAmount, rate,
 *                        fixedAmount, et les parts agentShare/superAgentShare/
 *                        agencyShare/networkShare)
 *   - CommissionEarning: la commission générée par transaction (pas de statut)
 *   - CommissionPayment: le paiement agrégé par agent/période
 *
 * L'ancienne implémentation visait un modèle « Commission » et des champs FR
 * (operateur, paliers, partAgent…) qui n'existent pas : chaque appel jetait une
 * erreur Prisma, silencieusement avalée par le listener → AUCUNE commission
 * n'était enregistrée. Le contrat externe (DTO, réponses) est préservé pour ne
 * pas casser le frontend : on continue de parler « opérateur / paliers / part
 * agent-réseau » côté API, en mappant vers les vrais modèles en interne.
 */
@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private num(valeur: any): number {
    return valeur == null ? 0 : Number(valeur);
  }

  // ─── Résolution grille + palier (cœur du calcul) ───────────────────────────────

  /**
   * Résout la grille active et le palier applicable, puis calcule la ventilation
   * complète de la commission. Renvoie `null` si rien ne s'applique (pas de
   * réseau, pas de grille active, aucun palier pour ce type/montant, ou 0).
   */
  // ─── Helpers volume mensuel / plafond ───────────────────────────────────────

  async getVolumeMensuelAgent(
    agentId: string,
    tenantId: string,
    mois?: number,
    annee?: number,
  ): Promise<number> {
    const now = new Date();
    const m = mois ?? now.getMonth() + 1;
    const y = annee ?? now.getFullYear();
    const debut = new Date(y, m - 1, 1);
    const fin = new Date(y, m, 1);

    const agg = await this.prisma.transaction.aggregate({
      where: {
        tenantId,
        agentId,
        status: 'COMPLETED',
        createdAt: { gte: debut, lt: fin },
      },
      _sum: { amount: true },
    });
    return this.num(agg._sum.amount);
  }

  async getCommissionsMensuelles(
    agentId: string,
    tenantId: string,
    mois?: number,
    annee?: number,
  ): Promise<number> {
    const now = new Date();
    const m = mois ?? now.getMonth() + 1;
    const y = annee ?? now.getFullYear();

    const agg = await this.prisma.commissionEarning.aggregate({
      where: { tenantId, agentId, periodMonth: m, periodYear: y },
      _sum: { agentAmount: true },
    });
    return this.num(agg._sum.agentAmount);
  }

  /** Tableau synthétique des commissions d'un mois — par agent. */
  async getTableauCommissions(tenantId: string, mois: number, annee: number) {
    const earnings = await this.prisma.commissionEarning.findMany({
      where: { tenantId, periodMonth: mois, periodYear: annee },
      include: {
        agent: { select: { agentCode: true, phoneNumber: true, agencyId: true } },
        commissionPlan: { select: { name: true, typeCalcul: true, plafondMensuelAgent: true } },
      },
    });

    // Agréger par agent
    const parAgent = new Map<
      string,
      {
        agentId: string;
        agentCode: string;
        phone: string;
        agencyId: string | null;
        volumeBrut: number;
        commissionBrute: number;
        planNom: string;
        typeCalcul: string;
        plafond: number | null;
      }
    >();

    for (const e of earnings) {
      const agentId = e.agentId ?? 'unknown';
      const existing = parAgent.get(agentId);
      const montant = this.num(e.agentAmount);
      if (existing) {
        existing.volumeBrut += this.num(e.grossAmount);
        existing.commissionBrute += montant;
      } else {
        parAgent.set(agentId, {
          agentId,
          agentCode: e.agent?.agentCode ?? 'N/A',
          phone: e.agent?.phoneNumber ?? '',
          agencyId: e.agent?.agencyId ?? null,
          volumeBrut: this.num(e.grossAmount),
          commissionBrute: montant,
          planNom: e.commissionPlan?.name ?? '',
          typeCalcul: e.commissionPlan?.typeCalcul ?? 'SIMPLE',
          plafond: e.commissionPlan?.plafondMensuelAgent
            ? this.num(e.commissionPlan.plafondMensuelAgent)
            : null,
        });
      }
    }

    // Calculer le volume mensuel réel (transactions) et plafond atteint
    const lignes = await Promise.all(
      [...parAgent.values()].map(async (row) => {
        const volumeMensuel = await this.getVolumeMensuelAgent(
          row.agentId,
          tenantId,
          mois,
          annee,
        );
        const commissionNette =
          row.plafond != null
            ? Math.min(row.commissionBrute, row.plafond)
            : row.commissionBrute;
        return {
          ...row,
          volumeMensuel,
          commissionNette,
          plafondAtteint: row.plafond != null && row.commissionBrute >= row.plafond,
        };
      }),
    );

    const total = lignes.reduce((s, l) => s + l.commissionNette, 0);
    return { lignes, total, mois, annee };
  }

  /** Export CSV des commissions d'un mois (pour paiement). */
  async exporterCommissions(
    tenantId: string,
    mois: number,
    annee: number,
  ): Promise<string> {
    const { lignes } = await this.getTableauCommissions(tenantId, mois, annee);

    const entete =
      'Agent;Téléphone;Volume mensuel (FCFA);Commission brute (FCFA);Plafond atteint;Commission nette (FCFA)\n';
    const corps = lignes
      .map(
        (l) =>
          `${l.agentCode};${l.phone};${l.volumeMensuel};${l.commissionBrute};${l.plafondAtteint ? 'OUI' : 'NON'};${l.commissionNette}`,
      )
      .join('\n');
    return entete + corps;
  }

  // ─── Résolution grille + palier (cœur du calcul) ───────────────────────────────

  /**
   * Résout la grille active et le palier applicable, puis calcule la ventilation
   * complète de la commission. Renvoie `null` si rien ne s'applique (pas de
   * réseau, pas de grille active, aucun palier pour ce type/montant, ou 0).
   */
  private async resoudreCommission(params: {
    tenantId: string;
    montant: number;
    type: any;
    networkId?: string;
    operateur?: string;
    agentId?: string; // requis pour typeCalcul=PALIERS
  }): Promise<null | {
    planId: string;
    rateId: string;
    gross: number;
    agentAmount: number;
    superAgentAmount: number;
    agencyAmount: number;
    networkAmount: number;
  }> {
    let networkId = params.networkId;

    // Mapper l'opérateur (ex. ORANGE_MONEY) vers le réseau du tenant.
    if (!networkId && params.operateur) {
      const network = await this.prisma.network.findUnique({
        where: {
          tenantId_operatorCode: {
            tenantId: params.tenantId,
            operatorCode: params.operateur,
          },
        },
      });
      if (!network) return null;
      networkId = network.id;
    }
    if (!networkId) return null;

    const now = new Date();
    const plan = await this.prisma.commissionPlan.findFirst({
      where: {
        tenantId: params.tenantId,
        networkId,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      include: { rates: true, volumePaliers: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!plan) return null;

    // ── Mode PALIERS : taux déterminé par le volume mensuel de l'agent ───────
    if (plan.typeCalcul === 'PALIERS' && params.agentId) {
      const volumeMensuel = await this.getVolumeMensuelAgent(
        params.agentId,
        params.tenantId,
      );
      const palier = (plan.volumePaliers as any[])
        .sort((a, b) => this.num(b.volumeMin) - this.num(a.volumeMin))
        .find(
          (p) =>
            volumeMensuel >= this.num(p.volumeMin) &&
            (p.volumeMax == null || volumeMensuel <= this.num(p.volumeMax)),
        );

      if (!palier) return null;

      const tauxAgent = this.num(palier.tauxAgent);
      const tauxReseau = this.num(palier.tauxReseau);
      let gross = Math.round(params.montant * (tauxAgent + tauxReseau) / 100);
      if (gross <= 0) return null;

      // Appliquer le plafond mensuel si défini
      if (plan.plafondMensuelAgent) {
        const dejaGagne = await this.getCommissionsMensuelles(
          params.agentId,
          params.tenantId,
        );
        const plafond = this.num(plan.plafondMensuelAgent);
        const reste = Math.max(0, plafond - dejaGagne);
        gross = Math.min(gross, reste);
        if (gross <= 0) return null;
      }

      const totalTaux = tauxAgent + tauxReseau || 1;
      return {
        planId: plan.id,
        rateId: palier.id, // on réutilise le champ rateId pour stocker la référence
        gross,
        agentAmount: Math.round(gross * (tauxAgent / totalTaux)),
        superAgentAmount: 0,
        agencyAmount: 0,
        networkAmount: Math.round(gross * (tauxReseau / totalTaux)),
      };
    }

    if (plan.rates.length === 0) return null;

    // Les taux sont indexés sur l'enum Prisma (DEPOSIT/WITHDRAWAL…), tout comme
    // Transaction.type. On normalise donc le type reçu (qu'il vienne d'un DTO FR
    // ou d'une transaction en base) vers le même vocabulaire avant comparaison.
    const typeStr = toPrismaTransactionType(String(params.type));
    const rate = plan.rates
      .filter((r) => r.transactionType === typeStr)
      .filter(
        (r) =>
          params.montant >= this.num(r.minAmount) &&
          (r.maxAmount == null || params.montant <= this.num(r.maxAmount)),
      )
      // Palier le plus élevé applicable en premier (tri décroissant sur minAmount)
      .sort((a, b) => this.num(b.minAmount) - this.num(a.minAmount))[0];
    if (!rate) return null;

    let gross =
      rate.fixedAmount != null
        ? this.num(rate.fixedAmount)
        : Math.round(params.montant * (this.num(rate.rate) / 100));
    if (gross <= 0) return null;

    // Appliquer le plafond mensuel (SIMPLE / PROGRESSIF aussi)
    if (plan.plafondMensuelAgent && params.agentId) {
      const dejaGagne = await this.getCommissionsMensuelles(
        params.agentId,
        params.tenantId,
      );
      const plafond = this.num(plan.plafondMensuelAgent);
      const reste = Math.max(0, plafond - dejaGagne);
      gross = Math.min(gross, reste);
      if (gross <= 0) return null;
    }

    const part = (share: any) => Math.round(gross * (this.num(share) / 100));
    return {
      planId: plan.id,
      rateId: rate.id,
      gross,
      agentAmount: part(rate.agentShare),
      superAgentAmount: part(rate.superAgentShare),
      agencyAmount: part(rate.agencyShare),
      networkAmount: part(rate.networkShare),
    };
  }

  /**
   * Compat : calcul « à plat » exposé historiquement. `partReseau` regroupe tout
   * ce qui n'est pas la part agent (super-agent + agence + réseau).
   */
  async calculateCommissionAmount(
    montant: number,
    type: TransactionType,
    operateur: MobileMoneyOperator,
    tenantId: string,
  ): Promise<{ total: number; partAgent: number; partReseau: number }> {
    const c = await this.resoudreCommission({ tenantId, montant, type, operateur });
    if (!c) return { total: 0, partAgent: 0, partReseau: 0 };
    return {
      total: c.gross,
      partAgent: c.agentAmount,
      partReseau: c.superAgentAmount + c.agencyAmount + c.networkAmount,
    };
  }

  /**
   * Enregistre la commission d'une transaction. Idempotent (ne recrée pas si une
   * commission existe déjà pour cette transaction). Relit la transaction en base
   * (source autoritaire) plutôt que de se fier aux champs de l'événement.
   */
  async recordCommission(transactionId: string): Promise<void> {
    const existing = await this.prisma.commissionEarning.findFirst({
      where: { transactionId },
    });
    if (existing) return;

    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) return;

    const c = await this.resoudreCommission({
      tenantId: tx.tenantId,
      networkId: tx.networkId,
      type: tx.type,
      montant: this.num(tx.amount),
      agentId: tx.agentId ?? undefined,
    });
    if (!c) return;

    const d = tx.createdAt ?? new Date();
    await this.prisma.commissionEarning.create({
      data: {
        tenantId: tx.tenantId,
        transactionId: tx.id,
        agentId: tx.agentId,
        agencyId: tx.agencyId,
        commissionPlanId: c.planId,
        commissionRateId: c.rateId,
        grossAmount: c.gross,
        agentAmount: c.agentAmount,
        superAgentAmount: c.superAgentAmount,
        agencyAmount: c.agencyAmount,
        networkAmount: c.networkAmount,
        periodMonth: d.getMonth() + 1,
        periodYear: d.getFullYear(),
      },
    });

    // Refléter le montant de commission sur la transaction.
    await this.prisma.transaction.update({
      where: { id: tx.id },
      data: { commission: c.gross },
    });
  }

  // ─── CRUD commissions (earnings) ───────────────────────────────────────────────

  async findAll(query: QueryCommissionDto, tenantId: string) {
    const { page: p, limit: l, skip } = normaliserPagination(
      query.page,
      query.limit,
      20,
    );
    const { agentId, dateDebut, dateFin } = query;

    const where: any = { tenantId };
    if (agentId) where.agentId = agentId;
    if (dateDebut || dateFin) {
      where.createdAt = {};
      if (dateDebut) where.createdAt.gte = new Date(dateDebut);
      if (dateFin) where.createdAt.lte = new Date(dateFin);
    }

    const [earnings, total] = await Promise.all([
      this.prisma.commissionEarning.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: { select: { agentCode: true, phoneNumber: true } },
          transaction: { select: { amount: true, type: true } },
        },
      }),
      this.prisma.commissionEarning.count({ where }),
    ]);

    const data = earnings.map((e: any) => ({
      id: e.id,
      agentId: e.agentId,
      agentNom: e.agent?.agentCode ?? 'N/A',
      agenceNom: '',
      periode: `${e.periodYear}-${String(e.periodMonth).padStart(2, '0')}`,
      nbTransactions: 1,
      montantTransactions: this.num(e.transaction?.amount),
      tauxCommission: 0,
      montantCommission: this.num(e.agentAmount),
      statut: 'calculee',
      datePaiement: null,
    }));

    return { data, total, page: p, limit: l };
  }

  async getSummary(tenantId: string) {
    const [earned, paid] = await Promise.all([
      this.prisma.commissionEarning.aggregate({
        where: { tenantId },
        _sum: { agentAmount: true },
        _count: { id: true },
      }),
      this.prisma.commissionPayment.aggregate({
        where: { tenantId, status: 'PAID' },
        _sum: { netAmount: true },
        _count: { id: true },
      }),
    ]);
    return {
      calculee: {
        count: earned._count.id,
        montantTotal: this.num(earned._sum.agentAmount),
      },
      validee: { count: 0, montantTotal: 0 },
      payee: {
        count: paid._count.id,
        montantTotal: this.num(paid._sum.netAmount),
      },
    };
  }

  async getAgentCommissions(
    agentId: string,
    tenantId: string,
    query: QueryCommissionDto,
  ) {
    return this.findAll({ ...query, agentId }, tenantId);
  }

  // ─── Recalcul batch ──────────────────────────────────────────────────────────

  async recalculate(dto: CalculateCommissionsDto, tenantId: string) {
    const where: any = { tenantId, status: 'COMPLETED' };
    if (dto.agentId) where.agentId = dto.agentId;
    if (dto.dateDebut) where.createdAt = { gte: new Date(dto.dateDebut) };
    if (dto.dateFin) {
      where.createdAt = { ...(where.createdAt || {}), lte: new Date(dto.dateFin) };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: { id: true },
      take: dto.limit ?? 10_000, // plafond batch : évite un recalcul illimité sans pagination explicite
    });
    let recalculated = 0;

    for (const tx of transactions) {
      // Purger l'ancienne commission puis recalculer depuis la source.
      await this.prisma.commissionEarning.deleteMany({
        where: { transactionId: tx.id },
      });
      await this.recordCommission(tx.id);
      recalculated++;
    }

    return { recalculated };
  }

  // ─── Grilles tarifaires (plans + rates) ────────────────────────────────────────

  /** Mappe un plan Prisma réel vers la forme attendue par l'API/le frontend. */
  private mapPlan(plan: any) {
    const rates: any[] = plan.rates ?? [];
    const premier = rates[0];
    return {
      id: plan.id,
      nom: plan.name,
      description: plan.description ?? null,
      operateur: plan.network?.operatorCode ?? null,
      typeTransaction: premier?.transactionType
        ? fromPrismaTransactionType(premier.transactionType)
        : null,
      active: plan.isActive,
      typeCalcul: plan.typeCalcul ?? 'SIMPLE',
      plafondMensuelAgent: plan.plafondMensuelAgent
        ? this.num(plan.plafondMensuelAgent)
        : null,
      plafondMensuelReseau: plan.plafondMensuelReseau
        ? this.num(plan.plafondMensuelReseau)
        : null,
      partAgent: premier ? this.num(premier.agentShare) : 70,
      partReseau: premier
        ? this.num(premier.superAgentShare) +
          this.num(premier.agencyShare) +
          this.num(premier.networkShare)
        : 30,
      paliers: rates.map((r) => ({
        id: r.id,
        montantMin: this.num(r.minAmount),
        montantMax: r.maxAmount == null ? null : this.num(r.maxAmount),
        taux: this.num(r.rate),
        montantFixe: r.fixedAmount == null ? null : this.num(r.fixedAmount),
      })),
      volumePaliers: (plan.volumePaliers ?? []).map((p: any) => ({
        id: p.id,
        volumeMin: this.num(p.volumeMin),
        volumeMax: p.volumeMax == null ? null : this.num(p.volumeMax),
        tauxAgent: this.num(p.tauxAgent),
        tauxReseau: this.num(p.tauxReseau),
      })),
      createdAt: plan.createdAt,
    };
  }

  private deriverBasis(paliers: { taux?: number; montantFixe?: number }[]): any {
    if (paliers.length > 1) return 'TIERED';
    const seul = paliers[0];
    if (seul && seul.montantFixe != null && !seul.taux) return 'FIXED';
    return 'PERCENTAGE';
  }

  /** Construit les lignes CommissionRate à partir des paliers du DTO. */
  private ratesDepuisDto(dto: Partial<CommissionPlanDto>, tenantId: string) {
    // Stocker le type dans le vocabulaire enum Prisma pour correspondre à
    // Transaction.type (sinon la résolution de commission ne matcherait jamais).
    const typeStr = toPrismaTransactionType(String(dto.typeTransaction));
    const partAgent = dto.partAgent ?? 70;
    const partReseau = dto.partReseau ?? 30;
    return (dto.paliers ?? []).map((p) => ({
      tenantId,
      transactionType: typeStr,
      minAmount: p.montantMin,
      maxAmount: p.montantMax ?? null,
      rate: p.taux ?? 0,
      fixedAmount: p.montantFixe ?? null,
      // Le DTO ne propose qu'un partage agent/réseau : on l'honore en mettant le
      // reste sur la part réseau (super-agent et agence à 0 par défaut).
      agentShare: partAgent,
      superAgentShare: 0,
      agencyShare: 0,
      networkShare: partReseau,
    }));
  }

  private async resoudreNetwork(operateur: string, tenantId: string) {
    const network = await this.prisma.network.findUnique({
      where: { tenantId_operatorCode: { tenantId, operatorCode: operateur } },
    });
    if (!network) {
      throw new NotFoundException(
        `Aucun réseau configuré pour l'opérateur « ${operateur} » sur ce tenant.`,
      );
    }
    return network;
  }

  async createPlan(dto: CommissionPlanDto, tenantId: string) {
    const network = await this.resoudreNetwork(dto.operateur, tenantId);

    const plan = await this.prisma.commissionPlan.create({
      data: {
        tenantId,
        name: dto.nom,
        description: dto.description,
        networkId: network.id,
        basis: this.deriverBasis(dto.paliers),
        isActive: dto.active ?? true,
        typeCalcul: (dto as any).typeCalcul ?? 'SIMPLE',
        plafondMensuelAgent: (dto as any).plafondMensuelAgent ?? null,
        plafondMensuelReseau: (dto as any).plafondMensuelReseau ?? null,
        effectiveFrom: new Date(),
        rates: { create: this.ratesDepuisDto(dto, tenantId) },
      },
      include: { rates: true, network: true, volumePaliers: true },
    });

    return this.mapPlan(plan);
  }

  async getPlans(tenantId: string) {
    const plans = await this.prisma.commissionPlan.findMany({
      where: { tenantId },
      include: { rates: true, network: true, volumePaliers: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return plans.map((p) => this.mapPlan(p));
  }

  async getPlan(id: string, tenantId: string) {
    const plan = await this.prisma.commissionPlan.findFirst({
      where: { id, tenantId },
      include: { rates: true, network: true, volumePaliers: true },
    });
    if (!plan) throw new CommissionPlanNotFoundException(id);
    return this.mapPlan(plan);
  }

  // ─── CRUD VolumePalier ────────────────────────────────────────────────────────

  async addVolumePalier(
    planId: string,
    tenantId: string,
    dto: { volumeMin: number; volumeMax?: number; tauxAgent: number; tauxReseau?: number },
  ) {
    const plan = await this.prisma.commissionPlan.findFirst({
      where: { id: planId, tenantId },
    });
    if (!plan) throw new CommissionPlanNotFoundException(planId);

    const palier = await this.prisma.volumePalier.create({
      data: {
        planId,
        volumeMin: dto.volumeMin,
        volumeMax: dto.volumeMax ?? null,
        tauxAgent: dto.tauxAgent,
        tauxReseau: dto.tauxReseau ?? 0,
      },
    });

    // Basculer le plan en mode PALIERS
    await this.prisma.commissionPlan.update({
      where: { id: planId },
      data: { typeCalcul: 'PALIERS' },
    });

    return palier;
  }

  async deleteVolumePalier(palierId: string, planId: string, tenantId: string) {
    const plan = await this.prisma.commissionPlan.findFirst({
      where: { id: planId, tenantId },
    });
    if (!plan) throw new CommissionPlanNotFoundException(planId);
    await this.prisma.volumePalier.delete({ where: { id: palierId } });
    return { deleted: true };
  }

  /** Simulateur : commission nette estimée pour un volume donné sur un plan. */
  simulerCommission(
    plan: any,
    volumeMensuel: number,
    montantTransaction: number,
  ): { tauxAgent: number; commissionBrute: number; plafondMensuel: number | null } {
    if (plan.typeCalcul === 'PALIERS') {
      const palier = (plan.volumePaliers ?? [])
        .slice()
        .sort((a: any, b: any) => b.volumeMin - a.volumeMin)
        .find(
          (p: any) =>
            volumeMensuel >= p.volumeMin &&
            (p.volumeMax == null || volumeMensuel <= p.volumeMax),
        );
      const tauxAgent = palier?.tauxAgent ?? 0;
      const commissionBrute = Math.round(montantTransaction * (tauxAgent / 100));
      return { tauxAgent, commissionBrute, plafondMensuel: plan.plafondMensuelAgent };
    }
    // SIMPLE : premier palier
    const premier = plan.paliers?.[0];
    const taux = premier?.taux ?? 0;
    return {
      tauxAgent: taux * (plan.partAgent / 100),
      commissionBrute: Math.round(montantTransaction * (taux / 100) * (plan.partAgent / 100)),
      plafondMensuel: plan.plafondMensuelAgent,
    };
  }

  async updatePlan(
    id: string,
    dto: Partial<CommissionPlanDto>,
    tenantId: string,
  ) {
    const plan = await this.prisma.commissionPlan.findFirst({
      where: { id, tenantId },
      include: { rates: true },
    });
    if (!plan) throw new CommissionPlanNotFoundException(id);

    const data: any = {};
    if (dto.nom !== undefined) data.name = dto.nom;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.active !== undefined) data.isActive = dto.active;
    if ((dto as any).typeCalcul !== undefined) data.typeCalcul = (dto as any).typeCalcul;
    if ((dto as any).plafondMensuelAgent !== undefined) data.plafondMensuelAgent = (dto as any).plafondMensuelAgent;
    if ((dto as any).plafondMensuelReseau !== undefined) data.plafondMensuelReseau = (dto as any).plafondMensuelReseau;

    if (dto.paliers) {
      // Conserver le type de transaction et le partage existants si le DTO
      // partiel ne les fournit pas (évite d'écraser par des valeurs par défaut).
      const rateRef = plan.rates[0];
      const dtoComplet: Partial<CommissionPlanDto> = {
        ...dto,
        typeTransaction:
          dto.typeTransaction ?? (rateRef?.transactionType as any),
        partAgent: dto.partAgent ?? (rateRef ? Number(rateRef.agentShare) : 70),
        partReseau:
          dto.partReseau ??
          (rateRef
            ? Number(rateRef.superAgentShare) +
              Number(rateRef.agencyShare) +
              Number(rateRef.networkShare)
            : 30),
      };
      data.basis = this.deriverBasis(dto.paliers);
      data.rates = {
        deleteMany: {},
        create: this.ratesDepuisDto(dtoComplet, tenantId),
      };
    }

    const updated = await this.prisma.commissionPlan.update({
      where: { id },
      data,
      include: { rates: true, network: true, volumePaliers: true },
    });

    return this.mapPlan(updated);
  }

  // ─── Paiements ────────────────────────────────────────────────────────────────

  /**
   * Valide le paiement d'un lot de commissions : agrège les CommissionEarning
   * sélectionnés par agent et crée un CommissionPayment (statut PAID) par agent.
   *
   * NB : le schéma CommissionEarning ne porte pas d'indicateur « payé » ni de
   * lien vers le paiement ; il n'y a donc pas de garde stricte contre un double
   * paiement du même lot. Restreindre le lot via `commissionIds`/période avant
   * validation. Une évolution de schéma (flag payé + FK paymentId) est requise
   * pour une idempotence forte.
   */
  async validatePayment(
    dto: ValidatePaymentDto,
    tenantId: string,
    userId: string,
  ) {
    const where: any = { tenantId };
    if (dto.commissionIds?.length) where.id = { in: dto.commissionIds };
    if (dto.agentId) where.agentId = dto.agentId;
    if (dto.dateDebut) where.createdAt = { gte: new Date(dto.dateDebut) };
    if (dto.dateFin) {
      where.createdAt = { ...(where.createdAt || {}), lte: new Date(dto.dateFin) };
    }

    const earnings = await this.prisma.commissionEarning.findMany({ where, take: 10_000 });
    if (!earnings.length) {
      throw new NotFoundException('Aucune commission à payer trouvée');
    }

    // Regrouper par agent.
    const parAgent = new Map<string | null, typeof earnings>();
    for (const e of earnings) {
      const cle = e.agentId ?? null;
      const liste = parAgent.get(cle) ?? [];
      liste.push(e);
      parAgent.set(cle, liste);
    }

    const now = new Date();
    const periodMonth = now.getMonth() + 1;
    const periodYear = now.getFullYear();

    const payments = await this.prisma.$transaction(
      [...parAgent.entries()].map(([agentId, liste]) => {
        const totalAgent = liste.reduce((s, e) => s + this.num(e.agentAmount), 0);
        return this.prisma.commissionPayment.create({
          data: {
            tenantId,
            agentId: agentId ?? undefined,
            periodMonth,
            periodYear,
            totalEarnings: totalAgent,
            deductions: 0,
            netAmount: totalAgent,
            status: 'PAID',
            approvedById: userId,
            paidAt: now,
          },
        });
      }),
    );

    const montantTotal = earnings.reduce(
      (s, e) => s + this.num(e.agentAmount),
      0,
    );

    this.logger.log(
      `Paiement batch validé: ${earnings.length} commissions, ${payments.length} paiement(s), ${montantTotal} FCFA`,
    );

    return {
      paiements: payments.length,
      commissionsPayees: earnings.length,
      montantTotal,
    };
  }

  async getPayments(tenantId: string, page?: number, limit?: number) {
    const { page: p, limit: l, skip } = normaliserPagination(page, limit, 20);
    const [rows, total] = await Promise.all([
      this.prisma.commissionPayment.findMany({
        where: { tenantId },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commissionPayment.count({ where: { tenantId } }),
    ]);

    const data = rows.map((r: any) => ({
      id: r.id,
      agentId: r.agentId,
      periode: `${r.periodYear}-${String(r.periodMonth).padStart(2, '0')}`,
      montantTotal: this.num(r.netAmount),
      statut: r.status,
      datePaiement: r.paidAt,
      createdAt: r.createdAt,
    }));

    return { data, total, page: p, limit: l };
  }
}
