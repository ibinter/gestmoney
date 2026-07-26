import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PushSubscriptionDto, PushPayload } from './dto/push.dto';

/**
 * Import OPTIONNEL de web-push.
 *
 * Si le paquet n'est pas installé, les notifications push tombent en simulation
 * (log uniquement) sans jamais bloquer le flux métier.
 * Pour activer l'envoi réel :
 *   pnpm add web-push @types/web-push --filter @gestmoney/api
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let webpush: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  webpush = require('web-push');
} catch {
  webpush = null;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private vapidPublicKey: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    if (!webpush) {
      this.logger.warn(
        '[PUSH] Le paquet « web-push » n\'est pas installé — notifications push désactivées. ' +
        'Exécutez : pnpm add web-push @types/web-push --filter @gestmoney/api',
      );
      return;
    }

    const publicKey  = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject    = this.configService.get<string>('VAPID_SUBJECT') ?? 'mailto:support@gestmoney.ibigsoft.com';

    if (!publicKey || !privateKey) {
      // Générer une paire à titre indicatif et afficher dans les logs pour que
      // l'opérateur puisse les copier dans ses variables d'environnement.
      const keys = webpush.generateVAPIDKeys();
      this.logger.warn(
        '[PUSH] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY absents. ' +
        'Copiez ces valeurs dans votre .env puis redémarrez :\n' +
        `  VAPID_PUBLIC_KEY=${keys.publicKey}\n` +
        `  VAPID_PRIVATE_KEY=${keys.privateKey}`,
      );
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.vapidPublicKey = publicKey;
    this.logger.log('[PUSH] web-push initialisé avec les clés VAPID.');
  }

  // ─── Clé publique VAPID (exposée au front) ──────────────────────────────────

  getVapidPublicKey(): string | null {
    return this.vapidPublicKey;
  }

  // ─── Abonnements ────────────────────────────────────────────────────────────

  async abonner(
    userId: string,
    tenantId: string,
    dto: PushSubscriptionDto,
  ): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        tenantId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        userAgent: dto.userAgent,
      },
      update: {
        userId,
        tenantId,
        p256dh: dto.p256dh,
        auth: dto.auth,
        userAgent: dto.userAgent,
      },
    });
    this.logger.log(`[PUSH] Abonnement enregistré pour userId=${userId}`);
  }

  async desabonner(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
    this.logger.log(`[PUSH] Abonnement supprimé pour endpoint=${endpoint.substring(0, 60)}…`);
  }

  // ─── Envoi ───────────────────────────────────────────────────────────────────

  async envoyerNotification(userId: string, payload: PushPayload): Promise<void> {
    if (!webpush || !this.vapidPublicKey) {
      this.logger.warn(`[PUSH-SIMULATION] userId=${userId} | ${payload.title}`);
      return;
    }
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    await this.envoyerVersSubs(subs, payload);
  }

  async envoyerAuTenant(tenantId: string, payload: PushPayload): Promise<void> {
    if (!webpush || !this.vapidPublicKey) {
      this.logger.warn(`[PUSH-SIMULATION] tenantId=${tenantId} | ${payload.title}`);
      return;
    }
    const subs = await this.prisma.pushSubscription.findMany({ where: { tenantId } });
    await this.envoyerVersSubs(subs, payload);
  }

  async envoyerAuxAdmins(tenantId: string, payload: PushPayload): Promise<void> {
    if (!webpush || !this.vapidPublicKey) {
      this.logger.warn(`[PUSH-SIMULATION] admins tenantId=${tenantId} | ${payload.title}`);
      return;
    }

    // Récupère les userId ayant un rôle NETWORK_ADMIN, AGENCY_MANAGER ou ADMIN
    const adminRoles = await this.prisma.role.findMany({
      where: {
        tenantId,
        name: { in: ['NETWORK_ADMIN', 'AGENCY_MANAGER', 'ADMIN', 'admin', 'SUPER_ADMIN'] },
      },
      select: { id: true },
    });

    if (adminRoles.length === 0) return;

    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId: { in: adminRoles.map((r) => r.id) } },
      select: { userId: true },
    });

    const userIds = [...new Set(userRoles.map((ur) => ur.userId))];
    if (userIds.length === 0) return;

    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId: { in: userIds }, tenantId },
    });
    await this.envoyerVersSubs(subs, payload);
  }

  // ─── Interne ─────────────────────────────────────────────────────────────────

  private async envoyerVersSubs(
    subs: Array<{ endpoint: string; p256dh: string; auth: string }>,
    payload: PushPayload,
  ): Promise<void> {
    const body = JSON.stringify({
      title:   payload.title,
      body:    payload.body,
      icon:    payload.icon    ?? '/icons/icon-192.svg',
      badge:   payload.badge   ?? '/icons/icon-192.svg',
      data:    payload.data    ?? {},
      vibrate: payload.vibrate ?? [100, 50, 100],
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
          );
        } catch (err: any) {
          // 410 Gone = subscription expirée → on la supprime proprement
          if (err?.statusCode === 410) {
            this.logger.warn(`[PUSH] Subscription expirée, suppression : ${sub.endpoint.substring(0, 60)}…`);
            await this.prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => undefined);
          } else {
            this.logger.error(`[PUSH] Erreur envoi notification : ${err?.message}`);
          }
        }
      }),
    );
  }
}
