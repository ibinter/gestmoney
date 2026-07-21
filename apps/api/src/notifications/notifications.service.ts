import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { normaliserPagination } from '../common/utils/pagination';

/**
 * Import OPTIONNEL de Nodemailer.
 *
 * Le paquet peut ne pas être installé dans l'environnement (aucune installation
 * réseau n'est déclenchée ici). S'il est absent, l'envoi d'email retombe
 * proprement sur le simple log, avec un avertissement clair, sans jamais lever
 * d'exception qui casserait le flux métier. Pour activer l'envoi réel :
 *   pnpm add nodemailer && pnpm add -D @types/nodemailer
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodemailerModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  nodemailerModule = require('nodemailer');
} catch {
  nodemailerModule = null;
}

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

  /**
   * Transport SMTP construit paresseusement puis réutilisé.
   * `undefined` = pas encore initialisé ; `null` = SMTP indisponible (repli log).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transporter: any | null | undefined = undefined;

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

  /**
   * Envoie réellement un email via SMTP lorsque `SMTP_HOST` est configuré et
   * que `nodemailer` est installé ; sinon, retombe sur le simple log.
   *
   * GARANTIE (§20) : un email qui échoue n'interrompt JAMAIS le flux métier
   * (inscription, activation, paiement). Toute erreur est capturée puis
   * seulement journalisée — aucune exception ne remonte à l'appelant.
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    const transport = this.obtenirTransport();

    // Repli : pas de transport disponible → comportement historique (log seul).
    if (!transport) {
      this.logger.log(`[EMAIL simulé] To: ${options.to} | Subject: ${options.subject}`);
      await this.logNotification({
        tenantId: options.tenantId,
        canal: 'EMAIL',
        destinataire: options.to,
        sujet: options.subject,
        contenu: options.body,
        statut: 'SENT',
      });
      return;
    }

    try {
      const from =
        this.configService.get<string>('MAIL_FROM') ??
        this.configService.get<string>('EMAIL_FROM');
      const replyTo = this.configService.get<string>('MAIL_REPLY_TO');

      await transport.sendMail({
        from,
        to: options.to,
        replyTo: replyTo && replyTo.trim() ? replyTo.trim() : undefined,
        subject: options.subject,
        text: options.body,
        html: options.html ?? this.construireHtml(options.subject, options.body),
      });

      this.logger.log(`[EMAIL] Envoyé à ${options.to} | Subject: ${options.subject}`);
      await this.logNotification({
        tenantId: options.tenantId,
        canal: 'EMAIL',
        destinataire: options.to,
        sujet: options.subject,
        contenu: options.body,
        statut: 'SENT',
      });
    } catch (error: any) {
      // Jamais de throw : on journalise l'échec et on laisse le flux métier vivre.
      this.logger.error(`Erreur envoi email à ${options.to}: ${error.message}`);
      await this.logNotification({
        tenantId: options.tenantId,
        canal: 'EMAIL',
        destinataire: options.to,
        sujet: options.subject,
        contenu: options.body,
        statut: 'FAILED',
        erreur: error.message,
      });
    }
  }

  /**
   * Construit (une seule fois) le transport SMTP à partir des variables
   * d'environnement. Renvoie `null` si aucun `SMTP_HOST` n'est configuré ou si
   * `nodemailer` n'est pas installé : l'appelant retombe alors sur le log.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private obtenirTransport(): any | null {
    if (this.transporter !== undefined) return this.transporter;

    const host = this.configService.get<string>('SMTP_HOST');
    if (!host || !host.trim()) {
      // Aucun SMTP configuré : mode simulation silencieux (repli historique).
      this.transporter = null;
      return null;
    }

    if (!nodemailerModule) {
      this.logger.warn(
        'SMTP_HOST est configuré mais le paquet « nodemailer » n\'est pas installé : ' +
          'les emails restent simulés (log). Exécutez « pnpm add nodemailer && ' +
          'pnpm add -D @types/nodemailer » pour activer l\'envoi réel.',
      );
      this.transporter = null;
      return null;
    }

    const port = Number(this.configService.get<string>('SMTP_PORT')) || 587;
    const secureBrut = String(
      this.configService.get<string>('SMTP_SECURE') ?? '',
    ).toLowerCase();
    // secure = true pour le port 465 (SMTPS) ou si demandé explicitement.
    const secure = secureBrut === 'true' || port === 465;

    const user = this.configService.get<string>('SMTP_USER');
    const pass =
      this.configService.get<string>('SMTP_PASS') ??
      this.configService.get<string>('SMTP_PASSWORD');

    try {
      this.transporter = nodemailerModule.createTransport({
        host,
        port,
        secure,
        auth: user ? { user, pass } : undefined,
      });
      this.logger.log(`Transport SMTP initialisé (${host}:${port}, secure=${secure}).`);
    } catch (error: any) {
      this.logger.error(`Initialisation du transport SMTP impossible : ${error.message}`);
      this.transporter = null;
    }

    return this.transporter;
  }

  /**
   * Enveloppe le corps texte des gabarits dans un email HTML brandé et
   * responsive. Le corps est échappé puis converti ligne à ligne : aucune
   * donnée n'est interprétée comme du HTML.
   */
  private construireHtml(subject: string, body: string): string {
    const echapper = (s: string): string =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const lignesHtml = body
      .split('\n')
      .map((ligne) => (ligne.trim() === '' ? '<br/>' : `<p style="margin:0 0 10px;">${echapper(ligne)}</p>`))
      .join('');

    const from =
      this.configService.get<string>('MAIL_FROM') ??
      this.configService.get<string>('EMAIL_FROM') ??
      'GESTMONEY';

    return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${echapper(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#0f766e;padding:20px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">GESTMONEY</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-size:15px;line-height:1.6;">
                ${lignesHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
                <p style="margin:0;">${echapper(from)}</p>
                <p style="margin:6px 0 0;">Cet email vous est envoyé automatiquement. Merci de ne pas partager vos identifiants.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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

  async getHistory(tenantId: string, userId?: string, page?: number, limit?: number) {
    // Le schéma nomme la colonne `recipient` (et non `destinataire`) ;
    // `userId` est aussi renseigné pour les notifications PUSH.
    const { page: p, limit: l, skip } = normaliserPagination(page, limit, 20);
    const where: any = { tenantId };
    if (userId) where.OR = [{ recipient: userId }, { userId }];

    const [rows, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        skip,
        take: l,
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

    return { data, total, page: p, limit: l };
  }

  // ─── Log interne ─────────────────────────────────────────────────────────────

  private async logNotification(data: {
    tenantId: string;
    canal: string;
    destinataire: string;
    contenu: string;
    statut: 'SENT' | 'FAILED' | 'PENDING';
    erreur?: string;
    sujet?: string;
  }) {
    try {
      await this.prisma.notificationLog.create({
        data: {
          tenantId: data.tenantId,
          channel: data.canal,
          recipient: data.destinataire,
          subject: data.sujet,
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
