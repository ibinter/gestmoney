import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../push/push.service';
import { UpdateConfigAlertesDto } from './dto/alertes.dto';
import { normaliserPagination } from '../common/utils/pagination';

export type TypeAlerte = 'FLOAT_BAS' | 'TRANSACTION_SUSPECTE' | 'EXPIRATION' | 'AUDIT_QUOTIDIEN' | 'RECHARGE_FLOAT';
export type SeveriteAlerte = 'INFO' | 'WARNING' | 'CRITICAL';

@Injectable()
export class AlertesService {
  private readonly logger = new Logger(AlertesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  // ─── Configuration ──────────────────────────────────────────────────────────

  async getConfig(tenantId: string) {
    const existing = await this.prisma.configAlertes.findUnique({
      where: { tenantId },
    });
    if (existing) return existing;

    // Créer avec les valeurs par défaut
    return this.prisma.configAlertes.create({
      data: { tenantId, emailsAlerte: [] },
    });
  }

  async updateConfig(tenantId: string, dto: UpdateConfigAlertesDto) {
    return this.prisma.configAlertes.upsert({
      where: { tenantId },
      update: { ...dto },
      create: { tenantId, emailsAlerte: [], ...dto },
    });
  }

  // ─── Émission d'alertes ──────────────────────────────────────────────────────

  private async emettreAlerte(
    tenantId: string,
    type: TypeAlerte,
    titre: string,
    detail: string,
    severite: SeveriteAlerte,
  ) {
    return this.prisma.alerteEmise.create({
      data: { tenantId, type, titre, detail, severite },
    });
  }

  // ─── Cron : floats bas toutes les 30 minutes ─────────────────────────────────

  @Cron('*/30 * * * *')
  async verifierFloatsBas() {
    this.logger.debug('Vérification des floats bas…');

    // Récupérer tous les tenants actifs avec leur config
    const configs = await this.prisma.configAlertes.findMany({
      where: {
        alerteFloatInApp: true,
        tenant: { status: 'ACTIVE' },
      },
      include: { tenant: { select: { id: true } } },
    });

    for (const config of configs) {
      const tenantId = config.tenantId;
      const seuil = config.seuilFloatBas;

      // Comptes float sous le seuil
      const comptesBasSeuil = await this.prisma.floatAccount.findMany({
        where: {
          tenantId,
          balance: { lt: seuil },
        },
        include: {
          agent: { select: { firstName: true, lastName: true } },
          network: { select: { name: true } },
        },
      });

      for (const compte of comptesBasSeuil) {
        const agentNom = `${compte.agent?.firstName ?? ''} ${compte.agent?.lastName ?? ''}`.trim();
        const operateur = compte.network?.name ?? 'Inconnu';
        const solde = Number(compte.balance);

        // Anti-duplication : max 1 alerte par agent par 4h
        const quatreHeuresAvant = new Date(Date.now() - 4 * 60 * 60 * 1000);
        const dejaEmise = await this.prisma.alerteEmise.findFirst({
          where: {
            tenantId,
            type: 'FLOAT_BAS',
            detail: { contains: compte.agentId },
            createdAt: { gte: quatreHeuresAvant },
          },
        });

        if (dejaEmise) continue;

        await this.emettreAlerte(
          tenantId,
          'FLOAT_BAS',
          `Float bas — ${agentNom} (${operateur})`,
          `Agent ${compte.agentId} | Solde actuel : ${solde.toLocaleString('fr-CI')} FCFA < seuil ${seuil.toLocaleString('fr-CI')} FCFA`,
          'WARNING',
        );

        // Notification push aux admins du tenant (fire-and-forget)
        void this.push.envoyerAuxAdmins(tenantId, {
          title: '⚠️ Float bas',
          body: `Le float de ${agentNom} (${operateur}) est sous le seuil (${solde.toLocaleString('fr-CI')} FCFA)`,
          icon: '/icons/icon-192.svg',
          data: { url: '/dashboard/float' },
        }).catch((err: Error) => this.logger.warn(`Push float bas échoué : ${err.message}`));

        // Notification email si activée
        if (config.alerteFloatEmail) {
          const destinataires = [
            ...(config.emailsAlerte ?? []),
          ];
          for (const email of destinataires) {
            await this.notifications.sendEmail({
              to: email,
              subject: `[GESTMONEY] Float bas — ${agentNom}`,
              body: `Le float de l'agent ${agentNom} (${operateur}) est sous le seuil.\nSolde : ${solde.toLocaleString('fr-CI')} FCFA`,
              tenantId,
            }).catch((err) => this.logger.warn(`Email float bas échoué : ${err.message}`));
          }
        }
      }
    }
  }

  // ─── Vérification transaction suspecte (appelé à la création) ───────────────

  async verifierTransactionSuspecte(
    tenantId: string,
    montant: number,
    transactionId: string,
    detail: string,
  ) {
    const config = await this.getConfig(tenantId);
    if (montant <= config.seuilVolumeTransaction) return;

    await this.emettreAlerte(
      tenantId,
      'TRANSACTION_SUSPECTE',
      `Transaction suspecte — ${montant.toLocaleString('fr-CI')} FCFA`,
      `Transaction ${transactionId} : montant ${montant.toLocaleString('fr-CI')} FCFA > seuil ${config.seuilVolumeTransaction.toLocaleString('fr-CI')} FCFA. ${detail}`,
      'CRITICAL',
    );

    if (config.alerteTransactionEmail) {
      for (const email of config.emailsAlerte ?? []) {
        await this.notifications.sendEmail({
          to: email,
          subject: `[GESTMONEY] Transaction suspecte détectée`,
          body: `Transaction ${transactionId} de ${montant.toLocaleString('fr-CI')} FCFA dépasse le seuil configuré.`,
          tenantId,
        }).catch((err) => this.logger.warn(`Email transaction suspecte échoué : ${err.message}`));
      }
    }
  }

  // ─── Cron : expiration licences chaque matin à 8h ────────────────────────────

  @Cron('0 8 * * *')
  async verifierExpirationsLicences() {
    this.logger.debug('Vérification des expirations de licences…');

    const maintenant = new Date();
    const dans7j  = new Date(maintenant.getTime() + 7  * 24 * 60 * 60 * 1000);
    const dans30j = new Date(maintenant.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Tenants avec expiration dans 7 jours
    const expirent7j = await this.prisma.tenant.findMany({
      where: {
        subscriptionEndsAt: { gte: maintenant, lte: dans7j },
        status: 'ACTIVE',
      },
      include: { configAlertes: true },
    });

    for (const tenant of expirent7j) {
      if (tenant.configAlertes?.alerteExpirationJ7 === false) continue;
      await this.emettreAlerte(
        tenant.id,
        'EXPIRATION',
        'Abonnement expire dans 7 jours',
        `L'abonnement du tenant "${tenant.name}" expire le ${tenant.subscriptionEndsAt?.toLocaleDateString('fr-CI')}.`,
        'WARNING',
      );
    }

    // Tenants avec expiration dans 30 jours
    const expirent30j = await this.prisma.tenant.findMany({
      where: {
        subscriptionEndsAt: { gte: dans7j, lte: dans30j },
        status: 'ACTIVE',
      },
      include: { configAlertes: true },
    });

    for (const tenant of expirent30j) {
      if (tenant.configAlertes?.alerteExpirationJ30 === false) continue;
      await this.emettreAlerte(
        tenant.id,
        'EXPIRATION',
        'Abonnement expire dans 30 jours',
        `L'abonnement du tenant "${tenant.name}" expire le ${tenant.subscriptionEndsAt?.toLocaleDateString('fr-CI')}.`,
        'INFO',
      );
    }
  }

  // ─── Lecture des alertes ──────────────────────────────────────────────────────

  async getAlertes(tenantId: string, opts: { page?: number; limit?: number; lu?: boolean }) {
    const { skip, take, page } = normaliserPagination({ page: opts.page, limit: opts.limit });
    const where: Record<string, unknown> = { tenantId };
    if (opts.lu !== undefined) where.lu = opts.lu;

    const [alertes, total] = await Promise.all([
      this.prisma.alerteEmise.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.alerteEmise.count({ where }),
    ]);

    return { alertes, total, page, limit: take };
  }

  async marquerLue(id: string, tenantId: string) {
    return this.prisma.alerteEmise.updateMany({
      where: { id, tenantId },
      data: { lu: true },
    });
  }

  async marquerToutesLues(tenantId: string) {
    return this.prisma.alerteEmise.updateMany({
      where: { tenantId, lu: false },
      data: { lu: true },
    });
  }

  async compterNonLues(tenantId: string) {
    return this.prisma.alerteEmise.count({ where: { tenantId, lu: false } });
  }
}
