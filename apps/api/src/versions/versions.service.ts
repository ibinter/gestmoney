import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateVersionDto } from './dto/versions.dto';

@Injectable()
export class VersionsService {
  private readonly logger = new Logger(VersionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Liste toutes les versions publiées avec le flag `vue` pour l'utilisateur.
   */
  async listerVersions(userId: string) {
    const versions = await this.prisma.versionLogiciel.findMany({
      where: { publiee: true },
      orderBy: { publishedAt: 'desc' },
      include: {
        vues: { where: { userId } },
      },
    });

    return versions.map((v) => ({
      id: v.id,
      version: v.version,
      titre: v.titre,
      description: v.description,
      type: v.type,
      publishedAt: v.publishedAt,
      createdAt: v.createdAt,
      vue: v.vues.length > 0,
    }));
  }

  /**
   * Retourne la dernière version publiée non vue par l'utilisateur,
   * ou null si tout a été vu.
   */
  async derniereNonVue(userId: string) {
    // IDs déjà vus
    const vues = await this.prisma.versionVue.findMany({
      where: { userId },
      select: { versionId: true },
    });
    const vusIds = vues.map((v) => v.versionId);

    const version = await this.prisma.versionLogiciel.findFirst({
      where: {
        publiee: true,
        id: { notIn: vusIds.length > 0 ? vusIds : ['__none__'] },
      },
      orderBy: { publishedAt: 'desc' },
    });

    if (!version) return null;

    return {
      id: version.id,
      version: version.version,
      titre: version.titre,
      description: version.description,
      type: version.type,
      publishedAt: version.publishedAt,
      vue: false,
    };
  }

  /**
   * Marque une version comme vue pour l'utilisateur (upsert).
   */
  async marquerVue(userId: string, versionId: string) {
    const version = await this.prisma.versionLogiciel.findUnique({
      where: { id: versionId },
    });
    if (!version) throw new NotFoundException('Version introuvable');

    await this.prisma.versionVue.upsert({
      where: { userId_versionId: { userId, versionId } },
      update: {},
      create: { userId, versionId },
    });

    return { success: true };
  }

  /**
   * Crée une nouvelle version (SUPERADMIN uniquement).
   */
  async creerVersion(dto: CreateVersionDto) {
    const version = await this.prisma.versionLogiciel.create({
      data: {
        version: dto.version,
        titre: dto.titre,
        description: dto.description,
        type: dto.type,
        publiee: dto.publiee ?? false,
        publishedAt: dto.publiee ? new Date() : null,
      },
    });
    this.logger.log(`Version ${version.version} créée (id=${version.id})`);
    return version;
  }

  /**
   * Publie une version et envoie un email à tous les admins tenant.
   */
  async publierVersion(id: string) {
    const version = await this.prisma.versionLogiciel.findUnique({
      where: { id },
    });
    if (!version) throw new NotFoundException('Version introuvable');

    const updated = await this.prisma.versionLogiciel.update({
      where: { id },
      data: { publiee: true, publishedAt: new Date() },
    });

    // Notifier les admins de tous les tenants actifs
    this.notifierAdmins(updated).catch((err) =>
      this.logger.error('Erreur envoi notifications version', err),
    );

    return updated;
  }

  private async notifierAdmins(version: {
    version: string;
    titre: string;
    type: string;
  }) {
    // Récupérer tous les users avec le rôle NETWORK_ADMIN ou admin de tenant
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        role: { name: { in: ['SUPER_ADMIN', 'NETWORK_ADMIN'] } },
      },
      include: { user: { select: { email: true, firstName: true } } },
    });

    const emails = [...new Set(userRoles.map((ur) => ur.user.email))];
    this.logger.log(
      `Publication version ${version.version} — notification de ${emails.length} admin(s)`,
    );

    for (const email of emails) {
      try {
        await this.notifications.sendEmail({
          to: email,
          subject: `[GESTMONEY] Nouvelle version ${version.version} — ${version.titre}`,
          body: `Une nouvelle version ${version.type} de GESTMONEY (${version.version}) est disponible : ${version.titre}. Connectez-vous pour découvrir les nouveautés.`,
          tenantId: 'system',
        });
      } catch (err) {
        this.logger.warn(`Impossible d'envoyer l'email à ${email}`, err);
      }
    }
  }
}
