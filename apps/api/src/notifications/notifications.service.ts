import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationChannel = 'SMS' | 'EMAIL' | 'PUSH';

export interface SendSmsOptions {
  to: string;
  message: string;
  tenantId: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  tenantId: string;
  html?: string;
}

export interface SendPushOptions {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  tenantId: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // ─── SMS via Twilio ───────────────────────────────────────────────────────────

  async sendSms(options: SendSmsOptions): Promise<void> {
    try {
      // Intégration Twilio — injecter TwilioClient en production
      // const message = await this.twilioClient.messages.create({ ... });
      this.logger.log(`[SMS] To: ${options.to} | ${options.message.substring(0, 50)}...`);

      await this.logNotification({
        tenantId: options.tenantId,
        canal: 'SMS',
        destinataire: options.to,
        contenu: options.message,
        statut: 'SENT',
      });
    } catch (error: any) {
      this.logger.error(`Erreur envoi SMS à ${options.to}: ${error.message}`);
      await this.logNotification({
        tenantId: options.tenantId,
        canal: 'SMS',
        destinataire: options.to,
        contenu: options.message,
        statut: 'FAILED',
        erreur: error.message,
      });
    }
  }

  // ─── Email via Nodemailer ────────────────────────────────────────────────────

  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      // Intégration Nodemailer — injecter le transporter en production
      this.logger.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);

      await this.logNotification({
        tenantId: options.tenantId,
        canal: 'EMAIL',
        destinataire: options.to,
        contenu: `${options.subject}: ${options.body}`,
        statut: 'SENT',
      });
    } catch (error: any) {
      this.logger.error(`Erreur envoi email à ${options.to}: ${error.message}`);
      await this.logNotification({
        tenantId: options.tenantId,
        canal: 'EMAIL',
        destinataire: options.to,
        contenu: options.subject,
        statut: 'FAILED',
        erreur: error.message,
      });
    }
  }

  // ─── Push notification ────────────────────────────────────────────────────────

  async sendPush(options: SendPushOptions): Promise<void> {
    try {
      // Intégration FCM / Expo Push — injecter le client en production
      this.logger.log(`[PUSH] UserId: ${options.userId} | ${options.title}`);

      await this.logNotification({
        tenantId: options.tenantId,
        canal: 'PUSH',
        destinataire: options.userId,
        contenu: `${options.title}: ${options.body}`,
        statut: 'SENT',
      });
    } catch (error: any) {
      this.logger.error(`Erreur push pour user ${options.userId}: ${error.message}`);
    }
  }

  // ─── Préférences utilisateur ─────────────────────────────────────────────────

  async getUserPreferences(_userId: string, _tenantId: string) {
    // notificationPreference model not yet in schema — returns default
    return { smsEnabled: true, emailEnabled: true, pushEnabled: false };
  }

  async upsertPreferences(
    _userId: string,
    preferences: {
      smsEnabled?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      emailAddress?: string;
      phoneNumber?: string;
    },
    _tenantId: string,
  ) {
    return preferences;
  }

  // ─── Historique notifications ────────────────────────────────────────────────

  async getHistory(tenantId: string, userId?: string, page = 1, limit = 20) {
    // Le schéma nomme la colonne `recipient` (et non `destinataire`) ;
    // `userId` est aussi renseigné pour les notifications PUSH.
    const where: any = { tenantId };
    if (userId) where.OR = [{ recipient: userId }, { userId }];

    const [rows, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationLog.count({ where }),
    ]);

    // Sortie en noms français : le front consomme déjà cette forme.
    const data = rows.map((n) => ({
      id: n.id,
      canal: n.channel,
      type: 'systeme',
      destinataire: n.recipient,
      titre: n.subject ?? n.channel,
      description: n.body,
      contenu: n.body,
      statut: n.status,
      erreur: n.error,
      lue: false,
      date: n.createdAt,
      createdAt: n.createdAt,
    }));

    return { data, total, page, limit };
  }

  // ─── Log interne ─────────────────────────────────────────────────────────────

  private async logNotification(data: {
    tenantId: string;
    canal: string;
    destinataire: string;
    contenu: string;
    statut: 'SENT' | 'FAILED' | 'PENDING';
    erreur?: string;
  }) {
    try {
      await this.prisma.notificationLog.create({
        data: {
          tenantId: data.tenantId,
          channel: data.canal,
          recipient: data.destinataire,
          body: data.contenu,
          status: data.statut,
          error: data.erreur,
        },
      });
    } catch {
      // Ne pas bloquer si le log échoue
    }
  }
}
