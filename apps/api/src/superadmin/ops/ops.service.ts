import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normaliserPagination } from '../../common/utils/pagination';
import { seedDemoTenant } from '@gestmoney/database';
import { LicencesService } from '../../licences/licences.service';

/**
 * Service de consultation (LECTURE SEULE) pour la console SuperAdmin :
 * Paiements de la plateforme, Licences par établissement et Analytics.
 *
 * RÈGLE D'HONNÊTETÉ : ce service ne fabrique aucun chiffre. Toute métrique
 * sans source réelle en base est renvoyée à `null` — la page affiche « — ».
 * La validation/remboursement des paiements NE vit PAS ici : elle reste dans
 * le module payments-admin. Ici, on ne fait que lire et agréger.
 */
@Injectable()
export class OpsService {
  constructor(
    private prisma: PrismaService,
    private readonly licences: LicencesService,
  ) {}

  // ─── EXPORT CLIENTS / UTILISATEURS (CSV) ───────────────────────────────────

  /**
   * Exporte toute la base clients/utilisateurs de la plateforme au format CSV
   * (une ligne par compte utilisateur, joint à son établissement/tenant).
   *
   * AUCUN statut n'est exclu : démo, test, actif, expiré, suspendu, inactif…
   * tout remonte. Le paramètre `statut` (optionnel) ne fait que RESTREINDRE
   * l'export à un statut donné — jamais exclure silencieusement des comptes.
   *
   * Le statut de licence est calculé via `LicencesService` (source unique de
   * vérité, jamais dupliquée ici), mis en cache et résolu une seule fois par
   * établissement distinct.
   *
   * @param statut  filtre optionnel : valeur de StatutLicence (DEMO, ACTIVE,
   *                EXPIREE, SUSPENDUE, DECOUVERTE…) OU de statut de compte
   *                (INACTIVE, PENDING_VERIFICATION…). Comparaison insensible à
   *                la casse, appliquée au statut de licence OU au statut du compte.
   */
  async exporterClientsCsv(statut?: string): Promise<string> {
    // 1. Tous les utilisateurs de la plateforme + leur établissement.
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
            plan: true,
            status: true,
            settings: true,
            subscriptionEndsAt: true,
            trialEndsAt: true,
          },
        },
      },
    });

    // 2. Statut de licence par établissement distinct (résolu une seule fois).
    const tenantIds = Array.from(new Set(users.map((u) => u.tenantId)));
    const statutParTenant = new Map<string, string>();
    await Promise.all(
      tenantIds.map(async (tid) => {
        try {
          const res = await this.licences.getStatutLicenceCache(tid);
          statutParTenant.set(tid, String(res.statut ?? ''));
        } catch {
          statutParTenant.set(tid, '');
        }
      }),
    );

    // 3. Construction des lignes + filtre éventuel.
    const filtre = statut?.trim().toUpperCase();
    const entete = [
      'ID client',
      'Nom',
      'Prénoms',
      'E-mail',
      'WhatsApp',
      'Téléphone',
      'Adresse',
      'Statut',
      'Statut compte',
      'Offre / Formule',
      'Établissement',
      "Date d'inscription",
      "Date d'expiration",
    ];

    const lignes: string[][] = [];
    for (const u of users) {
      const statutLicence = statutParTenant.get(u.tenantId) || '';
      const statutCompte = String(u.status ?? '');

      // Filtre : on garde la ligne si le filtre matche le statut de licence
      // OU le statut de compte (insensible à la casse).
      if (
        filtre &&
        statutLicence.toUpperCase() !== filtre &&
        statutCompte.toUpperCase() !== filtre
      ) {
        continue;
      }

      const contact = this.lireContact(u.tenant?.settings);
      const expiration = u.tenant?.subscriptionEndsAt ?? u.tenant?.trialEndsAt ?? null;

      lignes.push([
        u.id,
        u.lastName ?? '',
        u.firstName ?? '',
        u.email ?? '',
        // WhatsApp : pas de colonne dédiée en base → on lit un éventuel contact
        // stocké dans settings, sinon on retombe sur le numéro de téléphone
        // (qui est, sur ce marché, le numéro joignable sur WhatsApp).
        contact.whatsapp || u.phone || '',
        u.phone ?? '',
        contact.adresse || '',
        statutLicence,
        statutCompte,
        String(u.tenant?.plan ?? ''),
        u.tenant?.name ?? '',
        this.formaterDate(u.createdAt),
        this.formaterDate(expiration),
      ]);
    }

    return this.versCsv(entete, lignes);
  }

  /** Lit un éventuel contact (whatsapp/adresse) stocké dans Tenant.settings. */
  private lireContact(settings: unknown): { whatsapp: string; adresse: string } {
    const s = (settings ?? {}) as Record<string, any>;
    const c = (s.contact ?? {}) as Record<string, any>;
    return {
      whatsapp: String(s.whatsapp ?? c.whatsapp ?? ''),
      adresse: String(s.adresse ?? s.address ?? c.adresse ?? c.address ?? ''),
    };
  }

  /** Date ISO courte lisible (YYYY-MM-DD HH:mm) ou chaîne vide. */
  private formaterDate(d: Date | null | undefined): string {
    if (!d) return '';
    const iso = new Date(d).toISOString();
    return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
  }

  /**
   * Sérialise en CSV (séparateur `;` — Excel FR l'ouvre en colonnes sans
   * réglage). Chaque champ est échappé (guillemets doublés) et toujours
   * entouré de guillemets pour tolérer `;`, retours à la ligne et accents.
   */
  private versCsv(entete: string[], lignes: string[][]): string {
    const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const toRow = (cols: string[]) => cols.map(esc).join(';');
    return [toRow(entete), ...lignes.map(toRow)].join('\r\n');
  }

  // ─── PAIEMENTS ────────────────────────────────────────────────────────────

  /**
   * Liste GLOBALE des paiements de tous les tenants, paginée + filtrée.
   * Filtres : statut, provider, période (dateDebut/dateFin sur createdAt),
   * recherche (référence, providerRef).
   */
  async listerPaiements(params: {
    page?: unknown;
    limit?: unknown;
    statut?: string;
    provider?: string;
    dateDebut?: string;
    dateFin?: string;
    search?: string;
  }) {
    const { page, limit, skip } = normaliserPagination(params.page, params.limit, 20);

    const where: any = {};
    if (params.statut) where.statut = params.statut;
    if (params.provider) where.provider = params.provider;
    if (params.dateDebut || params.dateFin) {
      where.createdAt = {};
      if (params.dateDebut) where.createdAt.gte = new Date(params.dateDebut);
      if (params.dateFin) where.createdAt.lte = new Date(params.dateFin);
    }
    if (params.search) {
      where.OR = [
        { reference: { contains: params.search, mode: 'insensitive' } },
        { providerRef: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [paiements, total] = await Promise.all([
      this.prisma.paiement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paiement.count({ where }),
    ]);

    // On rattache le nom de l'établissement sans jointure Prisma (le modèle
    // Paiement n'a pas de relation déclarée vers Tenant) : un seul findMany.
    const tenantIds = Array.from(
      new Set(paiements.map((p) => p.tenantId).filter((id): id is string => !!id)),
    );
    const tenants = tenantIds.length
      ? await this.prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const tenantParId = new Map(tenants.map((t) => [t.id, t]));

    return {
      data: paiements.map((p) => {
        const tenant = p.tenantId ? tenantParId.get(p.tenantId) : undefined;
        return {
          id: p.id,
          reference: p.reference,
          montant: Number(p.montant),
          devise: p.devise,
          provider: p.provider,
          providerRef: p.providerRef,
          statut: p.statut,
          tenantId: p.tenantId,
          tenantNom: tenant?.name ?? null,
          tenantSlug: tenant?.slug ?? null,
          validePar: p.validePar,
          valideAt: p.valideAt,
          rembourseAt: p.rembourseAt,
          createdAt: p.createdAt,
        };
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Agrégats globaux des paiements : total encaissé, en attente, par statut. */
  async statsPaiements() {
    const [encaisse, enAttente, parStatut, parProvider] = await Promise.all([
      this.prisma.paiement.aggregate({
        _sum: { montant: true },
        _count: true,
        where: { statut: 'REUSSI' },
      }),
      this.prisma.paiement.aggregate({
        _sum: { montant: true },
        _count: true,
        where: { statut: 'EN_ATTENTE' },
      }),
      this.prisma.paiement.groupBy({
        by: ['statut'],
        _count: { _all: true },
        _sum: { montant: true },
      }),
      this.prisma.paiement.groupBy({
        by: ['provider'],
        _count: { _all: true },
        _sum: { montant: true },
      }),
    ]);

    return {
      // « Encaissé » n'agrège que les paiements réussis. Attention : les
      // montants peuvent être de devises différentes ; on somme brut sans
      // conversion (aucune source de taux de change fiable en base).
      totalEncaisse: Number(encaisse._sum.montant ?? 0),
      nbReussis: encaisse._count,
      totalEnAttente: Number(enAttente._sum.montant ?? 0),
      nbEnAttente: enAttente._count,
      parStatut: parStatut.map((s) => ({
        statut: s.statut,
        nombre: s._count._all,
        montant: Number(s._sum.montant ?? 0),
      })),
      parProvider: parProvider.map((p) => ({
        provider: p.provider,
        nombre: p._count._all,
        montant: Number(p._sum.montant ?? 0),
      })),
    };
  }

  // ─── LICENCES ─────────────────────────────────────────────────────────────

  /**
   * Abonnements par établissement, dérivés de Tenant + du dernier LicenceEvent.
   * Statut de licence, échéance, plan. Paginé + filtre statut + recherche.
   */
  async listerLicences(params: {
    page?: unknown;
    limit?: unknown;
    statut?: string;
    search?: string;
  }) {
    const { page, limit, skip } = normaliserPagination(params.page, params.limit, 20);

    const where: any = {};
    if (params.statut) where.status = params.statut;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          country: true,
          currency: true,
          status: true,
          plan: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
          createdAt: true,
          _count: { select: { users: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    // Dernier événement de licence connu par tenant (pour le montant du dernier
    // abonnement, le motif, etc.). Un seul findMany trié, on garde le 1er par tenant.
    const tenantIds = tenants.map((t) => t.id);
    const events = tenantIds.length
      ? await this.prisma.licenceEvent.findMany({
          where: { tenantId: { in: tenantIds } },
          orderBy: { createdAt: 'desc' },
        })
      : [];
    const dernierEventParTenant = new Map<string, (typeof events)[number]>();
    for (const e of events) {
      if (e.tenantId && !dernierEventParTenant.has(e.tenantId)) {
        dernierEventParTenant.set(e.tenantId, e);
      }
    }

    return {
      data: tenants.map((t) => {
        const ev = dernierEventParTenant.get(t.id);
        const echeance = t.subscriptionEndsAt ?? t.trialEndsAt ?? null;
        return {
          id: t.id,
          tenant: t.name,
          slug: t.slug,
          pays: t.country,
          devise: t.currency,
          statut: t.status,
          plan: t.plan,
          echeance,
          trialEndsAt: t.trialEndsAt,
          subscriptionEndsAt: t.subscriptionEndsAt,
          nbUtilisateurs: t._count.users,
          // Montant issu du dernier événement de licence réel (null si aucun).
          dernierMontant: ev?.montant != null ? Number(ev.montant) : null,
          dernierEvenement: ev
            ? { type: ev.type, plan: ev.plan, motif: ev.motif, date: ev.createdAt }
            : null,
          createdAt: t.createdAt,
        };
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Historique paginé des événements de licence (tous tenants). */
  async historiqueLicences(params: {
    page?: unknown;
    limit?: unknown;
    tenantId?: string;
    type?: string;
  }) {
    const { page, limit, skip } = normaliserPagination(params.page, params.limit, 20);

    const where: any = {};
    if (params.tenantId) where.tenantId = params.tenantId;
    if (params.type) where.type = params.type;

    const [events, total] = await Promise.all([
      this.prisma.licenceEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.licenceEvent.count({ where }),
    ]);

    const tenantIds = Array.from(
      new Set(events.map((e) => e.tenantId).filter((id): id is string => !!id)),
    );
    const tenants = tenantIds.length
      ? await this.prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, name: true },
        })
      : [];
    const tenantParId = new Map(tenants.map((t) => [t.id, t]));

    return {
      data: events.map((e) => ({
        id: e.id,
        tenantId: e.tenantId,
        tenantNom: e.tenantId ? tenantParId.get(e.tenantId)?.name ?? null : null,
        type: e.type,
        plan: e.plan,
        montant: e.montant != null ? Number(e.montant) : null,
        devise: e.devise,
        dateDebut: e.dateDebut,
        dateFin: e.dateFin,
        periodeGrace: e.periodeGrace,
        motif: e.motif,
        createdAt: e.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** KPIs licences dérivés de Tenant : répartition par statut et par plan. */
  async statsLicences() {
    const [parStatut, parPlan, total] = await Promise.all([
      this.prisma.tenant.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.tenant.groupBy({ by: ['plan'], _count: { _all: true } }),
      this.prisma.tenant.count(),
    ]);

    return {
      total,
      parStatut: parStatut.map((s) => ({ statut: s.status, nombre: s._count._all })),
      parPlan: parPlan.map((p) => ({ plan: p.plan, nombre: p._count._all })),
      // Aucun moteur de facturation récurrente ne calcule un MRR/ARR fiable :
      // on ne fabrique pas ces chiffres. La page affichera « — ».
      mrr: null,
      arr: null,
    };
  }

  // ─── ANALYTICS ────────────────────────────────────────────────────────────

  /**
   * Agrégats réels de la plateforme sur une période. Toute métrique sans
   * source réelle vaut `null` (la page affiche « — »). AUCUN chiffre inventé.
   */
  async analytics(params: { dateDebut?: string; dateFin?: string }) {
    const fin = params.dateFin ? new Date(params.dateFin) : new Date();
    const debut = params.dateDebut
      ? new Date(params.dateDebut)
      : new Date(fin.getTime() - 30 * 86400000);

    const [
      tenantsParStatut,
      usersTotal,
      usersActifs,
      txPeriode,
      txMontant,
      paiementsReussis,
      nbEvents,
    ] = await Promise.all([
      this.prisma.tenant.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.transaction.count({
        where: { createdAt: { gte: debut, lte: fin } },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: debut, lte: fin } },
      }),
      this.prisma.paiement.aggregate({
        _sum: { montant: true },
        _count: true,
        where: { statut: 'REUSSI', createdAt: { gte: debut, lte: fin } },
      }),
      this.prisma.analyticsEvent.count({
        where: { createdAt: { gte: debut, lte: fin } },
      }),
    ]);

    // AnalyticsEvent : agrégats seulement s'il existe des événements réels.
    let evenementsParType: { type: string; nombre: number }[] | null = null;
    let sessionsUniques: number | null = null;
    let paysTop: { pays: string; sessions: number }[] | null = null;
    if (nbEvents > 0) {
      const [parType, sessions, parPays] = await Promise.all([
        this.prisma.analyticsEvent.groupBy({
          by: ['type'],
          _count: { _all: true },
          where: { createdAt: { gte: debut, lte: fin } },
          orderBy: { _count: { type: 'desc' } },
          take: 10,
        }),
        this.prisma.analyticsEvent.findMany({
          where: {
            createdAt: { gte: debut, lte: fin },
            sessionId: { not: null },
          },
          distinct: ['sessionId'],
          select: { sessionId: true },
        }),
        this.prisma.analyticsEvent.groupBy({
          by: ['pays'],
          _count: { _all: true },
          where: { createdAt: { gte: debut, lte: fin }, pays: { not: null } },
          orderBy: { _count: { pays: 'desc' } },
          take: 5,
        }),
      ]);
      evenementsParType = parType.map((e) => ({ type: e.type, nombre: e._count._all }));
      sessionsUniques = sessions.length;
      paysTop = parPays.map((p) => ({ pays: p.pays as string, sessions: p._count._all }));
    }

    return {
      periode: { debut, fin },
      tenants: {
        parStatut: tenantsParStatut.map((s) => ({
          statut: s.status,
          nombre: s._count._all,
        })),
      },
      utilisateurs: { total: usersTotal, actifs: usersActifs },
      transactions: {
        nombre: txPeriode,
        montant: Number(txMontant._sum.amount ?? 0),
      },
      paiements: {
        nbReussis: paiementsReussis._count,
        montantReussi: Number(paiementsReussis._sum.montant ?? 0),
      },
      // Métriques web : réelles si AnalyticsEvent est alimenté, sinon null.
      web:
        nbEvents > 0
          ? {
              nbEvenements: nbEvents,
              sessionsUniques,
              evenementsParType,
              paysTop,
            }
          : null,
      // Pas de source fiable pour ces indicateurs marketing : « — ».
      tauxRebond: null,
      tauxConversion: null,
    };
  }

  // ─── SEED DÉMO ───────────────────────────────────────────────────────────

  /**
   * Crée (ou vérifie l'existence de) un tenant de démonstration complet :
   * 3 agences, 8 agents, 50 clients, 200 transactions, journal comptable,
   * tickets support, licence PRO. Idempotent grâce aux upserts.
   */
  async seedDemo() {
    const rapport = await seedDemoTenant(this.prisma as any);
    return { ok: true, rapport };
  }
}
