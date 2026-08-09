import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TenantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreerCampagneDto, CibleCampagne } from './dto/campaigns.dto';
import { campagneTemplate } from './templates/campagne.template';

/** Tenant fictif pour les logs de notification sans contexte tenant. */
const PLATFORM_TENANT = 'platform';

/** Taille d'un lot d'envoi */
const TAILLE_LOT = 10;

/** Délai entre deux lots (ms) */
const DELAI_LOT_MS = 100;

interface Destinataire {
  email: string;
  nom?: string;
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async creerCampagne(dto: CreerCampagneDto, createdBy: string) {
    const statut = dto.planifieeA ? 'PLANIFIEE' : 'BROUILLON';
    return this.prisma.campagneEmail.create({
      data: {
        nom: dto.nom,
        sujet: dto.sujet,
        corps: dto.corps,
        cible: dto.cible,
        statut,
        planifieeA: dto.planifieeA ? new Date(dto.planifieeA) : null,
        createdBy,
      },
    });
  }

  async lister(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.campagneEmail.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.campagneEmail.count(),
    ]);
    return { data, total, page, limit };
  }

  async trouver(id: string) {
    const c = await this.prisma.campagneEmail.findUnique({ where: { id } });
    if (!c) throw new NotFoundException(`Campagne ${id} introuvable`);
    return c;
  }

  async planifier(id: string, date: Date) {
    const c = await this.trouver(id);
    if (!['BROUILLON', 'PLANIFIEE'].includes(c.statut)) {
      throw new BadRequestException(`Impossible de planifier une campagne en statut ${c.statut}`);
    }
    return this.prisma.campagneEmail.update({
      where: { id },
      data: { statut: 'PLANIFIEE', planifieeA: date },
    });
  }

  // ─── Prévisualisation ──────────────────────────────────────────────────────

  async previsualiser(id: string) {
    const campagne = await this.trouver(id);
    const destinataires = await this.listeDestinataires(campagne.cible as CibleCampagne);
    return {
      campagne,
      count: destinataires.length,
      exemples: destinataires.slice(0, 5),
    };
  }

  // ─── Envoi ────────────────────────────────────────────────────────────────

  /**
   * Envoie une campagne immédiatement (fire-and-forget, par lots de 10).
   * Retourne le résumé de lancement ; l'envoi réel s'effectue en arrière-plan.
   */
  async envoyer(id: string) {
    const campagne = await this.trouver(id);
    if (['EN_COURS', 'TERMINEE'].includes(campagne.statut)) {
      throw new BadRequestException(`Campagne déjà ${campagne.statut.toLowerCase()}`);
    }

    const destinataires = await this.listeDestinataires(campagne.cible as CibleCampagne);
    await this.prisma.campagneEmail.update({
      where: { id },
      data: { statut: 'EN_COURS', nbDestinat: destinataires.length },
    });

    // Envoi fire-and-forget
    void this.envoyerEnArrierePlan(id, campagne.sujet, campagne.corps, destinataires);

    return { lance: true, nbDestinataires: destinataires.length };
  }

  // ─── Destinataires par cible ───────────────────────────────────────────────

  async listeDestinataires(cible: CibleCampagne): Promise<Destinataire[]> {
    const maintenant = new Date();

    switch (cible) {
      case CibleCampagne.PROSPECTS: {
        const prospects = await this.prisma.prospect.findMany({
          where: {
            email: { not: null },
            statut: { notIn: ['GAGNE', 'PERDU'] },
          },
          select: { email: true, nom: true },
        });
        return prospects
          .filter((p) => !!p.email)
          .map((p) => ({ email: p.email as string, nom: p.nom }));
      }

      case CibleCampagne.EXPIRATION_7J: {
        const dans7j = new Date(maintenant.getTime() + 7 * 24 * 3600 * 1000);
        const tenants = await this.prisma.tenant.findMany({
          where: {
            status: TenantStatus.ACTIVE,
            subscriptionEndsAt: { gte: maintenant, lte: dans7j },
          },
          include: {
            users: { where: { status: 'ACTIVE' }, select: { email: true, firstName: true }, take: 1 },
          },
        });
        return tenants
          .flatMap((t) => t.users)
          .filter((u) => !!u.email)
          .map((u) => ({ email: u.email, nom: u.firstName ?? undefined }));
      }

      case CibleCampagne.EXPIRATION_30J: {
        const dans8j = new Date(maintenant.getTime() + 8 * 24 * 3600 * 1000);
        const dans30j = new Date(maintenant.getTime() + 30 * 24 * 3600 * 1000);
        const tenants = await this.prisma.tenant.findMany({
          where: {
            status: TenantStatus.ACTIVE,
            subscriptionEndsAt: { gte: dans8j, lte: dans30j },
          },
          include: {
            users: { where: { status: 'ACTIVE' }, select: { email: true, firstName: true }, take: 1 },
          },
        });
        return tenants
          .flatMap((t) => t.users)
          .filter((u) => !!u.email)
          .map((u) => ({ email: u.email, nom: u.firstName ?? undefined }));
      }

      case CibleCampagne.SUSPENDUS: {
        const il90j = new Date(maintenant.getTime() - 90 * 24 * 3600 * 1000);
        const tenants = await this.prisma.tenant.findMany({
          where: {
            status: TenantStatus.SUSPENDED,
            updatedAt: { gte: il90j },
          },
          include: {
            users: { where: { status: 'ACTIVE' }, select: { email: true, firstName: true }, take: 1 },
          },
        });
        return tenants
          .flatMap((t) => t.users)
          .filter((u) => !!u.email)
          .map((u) => ({ email: u.email, nom: u.firstName ?? undefined }));
      }

      case CibleCampagne.TOUS_ADMINS: {
        const users = await this.prisma.user.findMany({
          where: {
            status: 'ACTIVE',
            userRoles: { some: { role: { name: 'NETWORK_ADMIN' } } },
          },
          select: { email: true, firstName: true },
        });
        return users
          .filter((u) => !!u.email)
          .map((u) => ({ email: u.email, nom: u.firstName ?? undefined }));
      }

      default:
        return [];
    }
  }

  // ─── Tâche cron ──────────────────────────────────────────────────────────

  @Cron('*/15 * * * *')
  async checkCampagnesPlanifiees() {
    const maintenant = new Date();
    const campagnes = await this.prisma.campagneEmail.findMany({
      where: {
        statut: 'PLANIFIEE',
        planifieeA: { lte: maintenant },
      },
    });

    for (const c of campagnes) {
      this.logger.log(`[CAMPAGNES] Déclenchement automatique : ${c.id} — ${c.nom}`);
      try {
        await this.envoyer(c.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`[CAMPAGNES] Échec déclenchement ${c.id} : ${msg}`);
      }
    }
  }

  // ─── Envoi en arrière-plan ────────────────────────────────────────────────

  private async envoyerEnArrierePlan(
    id: string,
    sujet: string,
    corps: string,
    destinataires: Destinataire[],
  ) {
    let nbEnvois = 0;
    let nbErreurs = 0;

    const lienDesinscription = `https://gestmoney.ibigsoft.com/desinscription?c=${id}`;
    const htmlTemplate = campagneTemplate(sujet, corps, lienDesinscription);

    for (let i = 0; i < destinataires.length; i += TAILLE_LOT) {
      const lot = destinataires.slice(i, i + TAILLE_LOT);

      await Promise.all(
        lot.map(async (dest) => {
          try {
            await this.notifications.sendEmail({
              to: dest.email,
              subject: sujet,
              body: corps,
              html: htmlTemplate,
              tenantId: PLATFORM_TENANT,
            });
            nbEnvois++;
          } catch {
            nbErreurs++;
          }
        }),
      );

      if (i + TAILLE_LOT < destinataires.length) {
        await new Promise((r) => setTimeout(r, DELAI_LOT_MS));
      }
    }

    await this.prisma.campagneEmail.update({
      where: { id },
      data: {
        statut: 'TERMINEE',
        envoyeeA: new Date(),
        nbEnvois,
        nbErreurs,
      },
    });

    this.logger.log(
      `[CAMPAGNES] ${id} terminée — envoyés: ${nbEnvois}, erreurs: ${nbErreurs}`,
    );
  }
}
