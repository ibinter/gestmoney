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

  // ─── SMS (Twilio conditionnel) ────────────────────────────────────────────────
  //
  // Comportement :
  //   - Si TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER sont définis
  //     → envoi réel via Twilio (nécessite: pnpm add twilio --filter @gestmoney/api)
  //   - Sinon → log WARN structuré (mode simulation, aucune exception levée)
  //
  // Le statut en base est 'SENT' dans les deux cas pour ne pas bloquer le flux
  // métier ; 'FAILED' est réservé aux erreurs réseau/Twilio réelles.

  async sendSms(options: SendSmsOptions): Promise<void> {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken  = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER');

    if (accountSid && authToken && fromNumber) {
      // ── Envoi réel via Twilio ──────────────────────────────────────────────
      // Le paquet twilio peut ne pas être installé dans l'environnement.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let twilioModule: any = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        twilioModule = require('twilio');
      } catch {
        this.logger.warn(
          '[SMS-CONFIG] TWILIO_* configuré mais le paquet « twilio » n\'est pas installé. ' +
          'Exécutez « pnpm add twilio --filter @gestmoney/api » pour activer l\'envoi réel. ' +
          `SMS simulé → ${options.to}: ${options.message.substring(0, 60)}`,
        );
        await this.logNotification({
          tenantId: options.tenantId,
          canal: 'SMS',
          destinataire: options.to,
          contenu: options.message,
          statut: 'SENT',
        });
        return;
      }

      try {
        const client = twilioModule(accountSid, authToken);
        await client.messages.create({
          body: options.message,
          from: fromNumber,
          to: options.to,
        });
        this.logger.log(`[SMS] Envoyé via Twilio → ${options.to}`);
        await this.logNotification({
          tenantId: options.tenantId,
          canal: 'SMS',
          destinataire: options.to,
          contenu: options.message,
          statut: 'SENT',
        });
      } catch (error: any) {
        this.logger.error(`[SMS] Échec Twilio pour ${options.to}: ${error.message}`);
        await this.logNotification({
          tenantId: options.tenantId,
          canal: 'SMS',
          destinataire: options.to,
          contenu: options.message,
          statut: 'FAILED',
          erreur: error.message,
        });
      }
    } else {
      // ── Mode simulation (variables Twilio absentes) ────────────────────────
      this.logger.warn(
        `[SMS-SIMULATION] TWILIO_* non configurés — SMS non envoyé. ` +
        `Destinataire: ${options.to} | Message: ${options.message.substring(0, 80)}`,
      );
      await this.logNotification({
        tenantId: options.tenantId,
        canal: 'SMS',
        destinataire: options.to,
        contenu: options.message,
        statut: 'SENT',
      });
    }
  }

  // ─── Détection du mode démonstration ─────────────────────────────────────────

  /**
   * Lecture LÉGÈRE : un tenant est en démonstration si `settings.demoMode` vaut
   * `true` OU si `settings.licence.statut` vaut `'DEMO'`. Toute erreur de lecture
   * est absorbée (retour `false`) : la détection démo ne doit jamais casser un
   * flux d'envoi. Volontairement sans injection de LicencesService pour éviter la
   * dépendance circulaire NotificationsModule ↔ LicencesModule.
   */
  private async estTenantEnDemo(tenantId: string): Promise<boolean> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      });
      const settings = (tenant?.settings ?? {}) as Record<string, any>;
      return settings.demoMode === true || settings.licence?.statut === 'DEMO';
    } catch (error: any) {
      this.logger.warn(
        `Détection du mode démo impossible pour le tenant ${tenantId}: ${error?.message ?? error}`,
      );
      return false;
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
    // §4.5 cahier : en mode démonstration, aucun e-mail réel n'est envoyé.
    // Lecture LÉGÈRE du tenant via Prisma (pas d'injection de LicencesService :
    // NotificationsModule est importé par LicencesModule, l'injection créerait
    // une dépendance circulaire). Si le tenantId n'est pas fourni, on ne change
    // rien au comportement historique.
    if (options.tenantId && (await this.estTenantEnDemo(options.tenantId))) {
      this.logger.debug(
        `[EMAIL bloqué — démo] Envoi supprimé pour le tenant ${options.tenantId} ` +
          `(to: ${options.to} | subject: ${options.subject})`,
      );
      return;
    }

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

  // ─── Notifications in-app ────────────────────────────────────────────────────

  async creerInApp(
    userId: string,
    tenantId: string,
    type: string,
    titre: string,
    message: string,
    lien?: string,
  ) {
    try {
      return await this.prisma.notificationInApp.create({
        data: { userId, tenantId, type, titre, message, lien },
      });
    } catch {
      // Ne jamais bloquer le flux métier
    }
  }

  async listerInApp(
    userId: string,
    tenantId: string,
    opts: { limit?: number; lue?: boolean; type?: string; page?: number } = {},
  ) {
    const limit = opts.limit ?? 20;
    const page = Math.max(1, opts.page ?? 1);
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { userId, tenantId };
    if (opts.lue !== undefined) where.lu = opts.lue;
    if (opts.type) where.type = opts.type;

    const [rows, total] = await Promise.all([
      this.prisma.notificationInApp.findMany({
        where,
        orderBy: [{ lu: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.notificationInApp.count({ where }),
    ]);

    return {
      data: rows.map((n) => ({
        id: n.id,
        type: n.type.toLowerCase(),
        titre: n.titre,
        description: n.message,
        lue: n.lu,
        date: n.createdAt,
        lien: n.lien ?? undefined,
      })),
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async marquerInAppLue(id: string, userId: string) {
    try {
      return await this.prisma.notificationInApp.updateMany({
        where: { id, userId },
        data: { lu: true },
      });
    } catch {
      return null;
    }
  }

  async marquerToutesInAppLues(userId: string, tenantId: string) {
    try {
      return await this.prisma.notificationInApp.updateMany({
        where: { userId, tenantId, lu: false },
        data: { lu: true },
      });
    } catch {
      return null;
    }
  }

  async compterInAppNonLues(userId: string, tenantId: string) {
    try {
      return await this.prisma.notificationInApp.count({
        where: { userId, tenantId, lu: false },
      });
    } catch {
      return 0;
    }
  }

  async supprimerInApp(id: string, userId: string) {
    try {
      return await this.prisma.notificationInApp.deleteMany({
        where: { id, userId },
      });
    } catch {
      return null;
    }
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
