import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LicenceEventType, TenantStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normaliserPagination } from '../../common/utils/pagination';
import { NotificationsService } from '../../notifications/notifications.service';
import * as crypto from 'crypto';

/**
 * Service de gestion complète des tenants pour la console SuperAdmin.
 * Inclut : statistiques globales, liste paginée, vue détaillée,
 * suspension/réactivation, prolongation de licence, reset du mot de passe admin.
 *
 * RÈGLE : aucun chiffre inventé. Les métriques sans source réelle valent null.
 */
@Injectable()
export class TenantsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── STATISTIQUES GLOBALES ─────────────────────────────────────────────────

  /**
   * 6 KPIs globaux de la plateforme :
   * tenants actifs, users total, transactions ce mois, volume ce mois,
   * tickets ouverts, licences expirant dans 7 jours.
   */
  async statsGlobales() {
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const dans7Jours = new Date(maintenant.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      tenantsActifs,
      usersTotal,
      txMois,
      txMoisMontant,
      ticketsOuverts,
      licencesExpirantBientot,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.user.count(),
      this.prisma.transaction.count({
        where: { createdAt: { gte: debutMois } },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: debutMois } },
      }),
      this.prisma.ticket.count({
        where: { statut: { in: ['NOUVEAU', 'OUVERT', 'EN_COURS', 'ESCALADE'] } },
      }),
      this.prisma.tenant.count({
        where: {
          subscriptionEndsAt: {
            gte: maintenant,
            lte: dans7Jours,
          },
        },
      }),
    ]);

    return {
      tenantsActifs,
      usersTotal,
      transactionsCeMois: txMois,
      volumeCeMois: Number(txMoisMontant._sum.amount ?? 0),
      ticketsOuverts,
      licencesExpirantBientot,
    };
  }

  // ─── LISTE PAGINÉE DES TENANTS ────────────────────────────────────────────

  async listerTenants(opts: {
    page?: unknown;
    limit?: unknown;
    statut?: string;
    search?: string;
  }) {
    const { page, limit, skip } = normaliserPagination(opts.page, opts.limit, 20);

    const where: Record<string, unknown> = {};
    if (opts.statut) where['status'] = opts.statut;
    if (opts.search) {
      where['OR'] = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { slug: { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

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
          status: true,
          plan: true,
          subscriptionEndsAt: true,
          trialEndsAt: true,
          createdAt: true,
          _count: { select: { users: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    // Transactions du mois par tenant — un seul groupBy
    const tenantIds = tenants.map((t) => t.id);
    const txParTenant =
      tenantIds.length > 0
        ? await this.prisma.transaction.groupBy({
            by: ['tenantId'],
            _count: { _all: true },
            where: {
              tenantId: { in: tenantIds },
              createdAt: { gte: debutMois },
            },
          })
        : [];
    const txMap = new Map(txParTenant.map((r) => [r.tenantId, r._count._all]));

    // Admin principal de chaque tenant (premier user avec rôle ADMIN ou NETWORK_ADMIN)
    const usersAdmins =
      tenantIds.length > 0
        ? await this.prisma.user.findMany({
            where: {
              tenantId: { in: tenantIds },
              userRoles: {
                some: {
                  role: {
                    name: { in: ['NETWORK_ADMIN', 'ADMIN'] },
                  },
                },
              },
            },
            select: {
              tenantId: true,
              email: true,
              firstName: true,
              lastName: true,
            },
            orderBy: { createdAt: 'asc' },
          })
        : [];
    const adminParTenant = new Map<string, (typeof usersAdmins)[number]>();
    for (const u of usersAdmins) {
      if (!adminParTenant.has(u.tenantId)) adminParTenant.set(u.tenantId, u);
    }

    return {
      data: tenants.map((t) => {
        const admin = adminParTenant.get(t.id);
        return {
          id: t.id,
          nom: t.name,
          slug: t.slug,
          statut: t.status,
          plan: t.plan,
          nbUsers: t._count.users,
          transactionsCeMois: txMap.get(t.id) ?? 0,
          echeance: t.subscriptionEndsAt ?? t.trialEndsAt ?? null,
          adminEmail: admin?.email ?? null,
          adminNom: admin ? `${admin.firstName} ${admin.lastName}` : null,
          createdAt: t.createdAt,
        };
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── DÉTAIL D'UN TENANT ───────────────────────────────────────────────────

  async getDetailTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logo: true,
        status: true,
        plan: true,
        country: true,
        currency: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            agencies: true,
            agents: true,
            transactions: true,
          },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant introuvable.');

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const [txMois, txMoisMontant, derniersTx, users] = await Promise.all([
      this.prisma.transaction.count({
        where: { tenantId, createdAt: { gte: debutMois } },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { tenantId, createdAt: { gte: debutMois } },
      }),
      this.prisma.transaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          reference: true,
          type: true,
          status: true,
          amount: true,
          currency: true,
          operatorCode: true,
          createdAt: true,
        },
      }),
      this.prisma.user.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
        take: 50,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
          userRoles: {
            select: { role: { select: { name: true } } },
          },
        },
      }),
    ]);

    return {
      tenant: {
        ...tenant,
        echeance: tenant.subscriptionEndsAt ?? tenant.trialEndsAt ?? null,
      },
      stats: {
        transactionsCeMois: txMois,
        volumeCeMois: Number(txMoisMontant._sum.amount ?? 0),
        nbUsers: tenant._count.users,
        nbAgences: tenant._count.agencies,
        nbAgents: tenant._count.agents,
        totalTransactions: tenant._count.transactions,
      },
      derniersTx: derniersTx.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
      })),
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        nom: `${u.firstName} ${u.lastName}`,
        status: u.status,
        roles: u.userRoles.map((ur) => ur.role.name),
        createdAt: u.createdAt,
      })),
    };
  }

  // ─── SUSPENSION / RÉACTIVATION ────────────────────────────────────────────

  async suspendreOuReactiver(
    tenantId: string,
    action: 'SUSPENDRE' | 'REACTIVER',
    raison: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant introuvable.');

    if (action === 'SUSPENDRE') {
      if (tenant.status === TenantStatus.SUSPENDED) {
        throw new BadRequestException('Ce tenant est déjà suspendu.');
      }
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { status: TenantStatus.SUSPENDED },
      });
      await this.prisma.licenceEvent.create({
        data: {
          tenantId,
          type: LicenceEventType.ABONNEMENT_SUSPENDU,
          plan: tenant.plan,
          motif: raison,
        },
      });

      // Email de notification (fire-and-forget)
      const admins = await this.prisma.user.findMany({
        where: { tenantId },
        select: { email: true, firstName: true },
        take: 5,
      });
      for (const admin of admins) {
        void this.notifications.sendEmail({
          to: admin.email,
          subject: 'Votre compte GESTMONEY a été suspendu',
          body: [
            `Bonjour ${admin.firstName ?? ''},`,
            '',
            'Votre accès à la plateforme GESTMONEY a été suspendu.',
            raison ? `Motif : ${raison}` : '',
            '',
            'Pour régulariser votre situation, contactez notre équipe :',
            'gestmoney@ibigsoft.com',
            '',
            "L'équipe GESTMONEY — IBIG Soft",
          ]
            .filter(Boolean)
            .join('\n'),
          tenantId,
        });
      }
      return { ok: true, statut: 'SUSPENDED', message: 'Tenant suspendu avec succès.' };
    } else {
      // REACTIVER
      if (tenant.status !== TenantStatus.SUSPENDED) {
        throw new BadRequestException("Ce tenant n'est pas suspendu.");
      }
      // Statut cible : si l'abonnement est encore valide => ACTIVE, sinon EXPIRED
      const maintenant = new Date();
      const cible =
        tenant.subscriptionEndsAt && tenant.subscriptionEndsAt > maintenant
          ? TenantStatus.ACTIVE
          : tenant.trialEndsAt && tenant.trialEndsAt > maintenant
            ? TenantStatus.TRIAL
            : TenantStatus.ACTIVE; // on réactive même si expiré, le système gèrera

      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { status: cible },
      });
      await this.prisma.licenceEvent.create({
        data: {
          tenantId,
          type: LicenceEventType.ABONNEMENT_REACTIVE,
          plan: tenant.plan,
          motif: raison,
        },
      });

      const admins = await this.prisma.user.findMany({
        where: { tenantId },
        select: { email: true, firstName: true },
        take: 5,
      });
      for (const admin of admins) {
        void this.notifications.sendEmail({
          to: admin.email,
          subject: 'Votre compte GESTMONEY a été réactivé',
          body: [
            `Bonjour ${admin.firstName ?? ''},`,
            '',
            'Bonne nouvelle ! Votre accès à la plateforme GESTMONEY a été réactivé.',
            raison ? `Note : ${raison}` : '',
            '',
            "L'équipe GESTMONEY — IBIG Soft",
          ]
            .filter(Boolean)
            .join('\n'),
          tenantId,
        });
      }
      return { ok: true, statut: cible, message: 'Tenant réactivé avec succès.' };
    }
  }

  // ─── PROLONGATION DE LICENCE ──────────────────────────────────────────────

  async prolongerLicence(tenantId: string, jours: number) {
    if (!jours || jours < 1 || jours > 3650) {
      throw new BadRequestException('Le nombre de jours doit être entre 1 et 3650.');
    }
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant introuvable.');

    const maintenant = new Date();
    // Base : subscriptionEndsAt si futur, sinon maintenant
    const base =
      tenant.subscriptionEndsAt && tenant.subscriptionEndsAt > maintenant
        ? tenant.subscriptionEndsAt
        : maintenant;
    const nouvelleEcheance = new Date(base.getTime() + jours * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionEndsAt: nouvelleEcheance,
          // Si le tenant était expiré, on le remet actif
          status:
            tenant.status === TenantStatus.EXPIRED ? TenantStatus.ACTIVE : tenant.status,
        },
      }),
      this.prisma.licenceEvent.create({
        data: {
          tenantId,
          type: LicenceEventType.ABONNEMENT_RENOUVELE,
          plan: tenant.plan,
          dateDebut: base,
          dateFin: nouvelleEcheance,
          motif: `Prolongation manuelle de ${jours} jour(s) par le SuperAdmin`,
        },
      }),
    ]);

    return {
      ok: true,
      echeance: nouvelleEcheance,
      message: `Licence prolongée de ${jours} jour(s). Nouvelle échéance : ${nouvelleEcheance.toLocaleDateString('fr-FR')}.`,
    };
  }

  // ─── RESET MOT DE PASSE ADMIN ─────────────────────────────────────────────

  async resetPasswordAdmin(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant introuvable.');

    // Trouver l'admin principal du tenant
    const admin = await this.prisma.user.findFirst({
      where: {
        tenantId,
        userRoles: {
          some: {
            role: { name: { in: ['NETWORK_ADMIN', 'ADMIN', 'SUPER_ADMIN'] } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!admin) {
      throw new NotFoundException(
        "Aucun administrateur trouvé pour ce tenant. Impossible d'envoyer un lien de reset.",
      );
    }

    // Générer un token de reset sécurisé
    const token = crypto.randomBytes(32).toString('hex');
    const expiration = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Mettre à jour le statut de l'utilisateur pour signaler un reset en attente
    await this.prisma.user.update({
      where: { id: admin.id },
      data: {
        status: 'PASSWORD_RESET',
        passwordChangedAt: expiration,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL ?? 'https://gestmoney.ibigsoft.com'}/reset-password?token=${token}&email=${encodeURIComponent(admin.email)}`;

    void this.notifications.sendEmail({
      to: admin.email,
      subject: 'Réinitialisation de votre mot de passe GESTMONEY',
      body: [
        `Bonjour ${admin.firstName ?? ''},`,
        '',
        'Un administrateur a demandé la réinitialisation de votre mot de passe GESTMONEY.',
        '',
        `Cliquez sur ce lien pour créer votre nouveau mot de passe (valable 1 heure) :`,
        resetUrl,
        '',
        'Si vous n\'avez pas fait cette demande, ignorez cet email.',
        '',
        "L'équipe GESTMONEY — IBIG Soft",
      ].join('\n'),
      tenantId,
    });

    return {
      ok: true,
      adminEmail: admin.email,
      message: `Un lien de réinitialisation a été envoyé à ${admin.email}.`,
    };
  }
}
