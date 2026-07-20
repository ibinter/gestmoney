import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import {
  PAYMENT_EVENTS,
  PaiementConfirmeWebhookEvent,
  PaiementCreeEvent,
  PreuveRecueEvent,
  PreuveRejeteeEvent,
  PreuveValideeEvent,
} from '../payments/payments.events';
import {
  LICENCE_EVENTS,
  LicenceExpireeEvent,
  LicencePeriodeGraceEvent,
  LicenceRappelExpirationEvent,
} from '../licences/licences.events';
import {
  GabaritEmail,
  gabaritLicenceExpiree,
  gabaritPaiementConfirmeWebhook,
  gabaritPaiementCree,
  gabaritPeriodeGrace,
  gabaritPreuveRecueAdmin,
  gabaritPreuveRecueClient,
  gabaritPreuveRejetee,
  gabaritPreuveValidee,
  gabaritRappelExpiration,
} from './templates/payment-notification.templates';

/** Noms de rôles considérés comme administrateurs destinataires des alertes. */
const ROLES_ADMIN = ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATEUR', 'OWNER'];

/**
 * Notifications du module de paiement et du cycle de vie des licences.
 *
 * PRINCIPE DIRECTEUR — une notification qui échoue ne doit JAMAIS faire
 * échouer l'opération métier qui l'a déclenchée. Un paiement validé reste
 * validé même si l'email de confirmation ne part pas. Chaque abonné est donc
 * intégralement enveloppé dans `executer()`, qui capture toute erreur et se
 * contente de la journaliser.
 *
 * Le contenu des emails est centralisé dans `templates/` : ce listener ne fait
 * que résoudre les destinataires et transmettre des valeurs réelles issues des
 * événements. Aucun secret (mot de passe, code, clé, jeton, numéro de compte)
 * n'est lu ni écrit ici.
 */
@Injectable()
export class PaymentNotificationsListener {
  private readonly logger = new Logger(PaymentNotificationsListener.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─── Paiements ─────────────────────────────────────────────────────────────

  /** 1. Paiement créé, en attente de règlement et de preuve. */
  @OnEvent(PAYMENT_EVENTS.CREE)
  async onPaiementCree(event: PaiementCreeEvent): Promise<void> {
    await this.executer(PAYMENT_EVENTS.CREE, event.reference, async () => {
      const tenantId = this.exigerTenant(event.tenantId, PAYMENT_EVENTS.CREE);
      if (!tenantId) return;

      const destinataire = await this.emailClient(tenantId, event.userId);
      if (!destinataire) return;

      await this.envoyer(tenantId, destinataire, gabaritPaiementCree(event));
    });
  }

  /** 2. Preuve reçue : accusé au client + alerte de validation aux administrateurs. */
  @OnEvent(PAYMENT_EVENTS.PREUVE_RECUE)
  async onPreuveRecue(event: PreuveRecueEvent): Promise<void> {
    await this.executer(PAYMENT_EVENTS.PREUVE_RECUE, event.reference, async () => {
      const tenantId = this.exigerTenant(event.tenantId, PAYMENT_EVENTS.PREUVE_RECUE);
      if (!tenantId) return;

      const client = await this.emailClient(tenantId, event.userId);
      if (client) {
        await this.envoyer(tenantId, client, gabaritPreuveRecueClient(event));
      }

      const admins = await this.emailsAdmins(tenantId);
      const gabarit = gabaritPreuveRecueAdmin({
        ...event,
        paiementId: event.paiementId,
        preuveId: event.preuveId,
      });
      for (const admin of admins) {
        await this.envoyer(tenantId, admin, gabarit);
      }
      if (admins.length === 0) {
        this.logger.warn(
          `Aucun administrateur destinataire pour la validation du paiement ${event.reference} ` +
            `(tenant ${tenantId}). Renseignez PAYMENTS_ADMIN_EMAILS ou un rôle administrateur.`,
        );
      }
    });
  }

  /** 3a. Preuve validée : le paiement est activé. */
  @OnEvent(PAYMENT_EVENTS.PREUVE_VALIDEE)
  async onPreuveValidee(event: PreuveValideeEvent): Promise<void> {
    await this.executer(PAYMENT_EVENTS.PREUVE_VALIDEE, event.reference, async () => {
      const tenantId = this.exigerTenant(event.tenantId, PAYMENT_EVENTS.PREUVE_VALIDEE);
      if (!tenantId) return;

      const destinataire = await this.emailClient(tenantId, event.userId);
      if (!destinataire) return;

      await this.envoyer(tenantId, destinataire, gabaritPreuveValidee(event));
    });
  }

  /** 3b. Preuve rejetée : le motif est transmis au client. */
  @OnEvent(PAYMENT_EVENTS.PREUVE_REJETEE)
  async onPreuveRejetee(event: PreuveRejeteeEvent): Promise<void> {
    await this.executer(PAYMENT_EVENTS.PREUVE_REJETEE, event.reference, async () => {
      const tenantId = this.exigerTenant(event.tenantId, PAYMENT_EVENTS.PREUVE_REJETEE);
      if (!tenantId) return;

      const destinataire = await this.emailClient(tenantId, event.userId);
      if (!destinataire) return;

      await this.envoyer(tenantId, destinataire, gabaritPreuveRejetee(event));
    });
  }

  /** 4. Paiement confirmé par webhook signé : abonnement activé. */
  @OnEvent(PAYMENT_EVENTS.CONFIRME_WEBHOOK)
  async onPaiementConfirmeWebhook(event: PaiementConfirmeWebhookEvent): Promise<void> {
    await this.executer(PAYMENT_EVENTS.CONFIRME_WEBHOOK, event.reference, async () => {
      const tenantId = this.exigerTenant(event.tenantId, PAYMENT_EVENTS.CONFIRME_WEBHOOK);
      if (!tenantId) return;

      const destinataire = await this.emailClient(tenantId, event.userId);
      if (!destinataire) return;

      await this.envoyer(tenantId, destinataire, gabaritPaiementConfirmeWebhook(event));
    });
  }

  // ─── Cycle de vie des licences ─────────────────────────────────────────────

  /** 5. Rappels d'expiration J-7 / J-3 / J-1, émis par LicencesScheduler. */
  @OnEvent(LICENCE_EVENTS.RAPPEL_EXPIRATION)
  async onRappelExpiration(event: LicenceRappelExpirationEvent): Promise<void> {
    await this.executer(LICENCE_EVENTS.RAPPEL_EXPIRATION, event.tenantId, async () => {
      const gabarit = gabaritRappelExpiration({
        nomTenant: event.nomTenant,
        plan: event.plan,
        echeance: event.echeance,
        joursRestants: event.joursRestants,
      });
      await this.diffuserAuxAdmins(event.tenantId, gabarit);
    });
  }

  /** 6a. Entrée en période de grâce. */
  @OnEvent(LICENCE_EVENTS.PERIODE_GRACE)
  async onPeriodeGrace(event: LicencePeriodeGraceEvent): Promise<void> {
    await this.executer(LICENCE_EVENTS.PERIODE_GRACE, event.tenantId, async () => {
      const gabarit = gabaritPeriodeGrace({
        nomTenant: event.nomTenant,
        plan: event.plan,
        echeance: event.echeance,
        graceJusquA: event.graceJusquA,
        graceJours: event.graceJours,
      });
      await this.diffuserAuxAdmins(event.tenantId, gabarit);
    });
  }

  /** 6b. Expiration effective : accès suspendu. */
  @OnEvent(LICENCE_EVENTS.EXPIREE)
  async onLicenceExpiree(event: LicenceExpireeEvent): Promise<void> {
    await this.executer(LICENCE_EVENTS.EXPIREE, event.tenantId, async () => {
      const gabarit = gabaritLicenceExpiree({
        nomTenant: event.nomTenant,
        plan: event.plan,
        expireeAt: event.expireeAt,
      });
      await this.diffuserAuxAdmins(event.tenantId, gabarit);
    });
  }

  // ─── Interne ───────────────────────────────────────────────────────────────

  /**
   * Enveloppe TOUT abonné : une notification en échec ne remonte jamais à
   * l'appelant, elle est seulement journalisée. C'est la garantie qu'un email
   * non parti n'annule pas un paiement validé.
   */
  private async executer(
    evenement: string,
    contexte: string,
    corps: () => Promise<void>,
  ): Promise<void> {
    try {
      await corps();
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      this.logger.error(
        `Notification « ${evenement} » non envoyée pour ${contexte} : ${message}`,
      );
    }
  }

  /** Envoi unitaire : l'échec est absorbé par NotificationsService puis ici. */
  private async envoyer(
    tenantId: string,
    destinataire: string,
    gabarit: GabaritEmail,
  ): Promise<void> {
    try {
      await this.notifications.sendEmail({
        to: destinataire,
        subject: gabarit.subject,
        body: gabarit.body,
        tenantId,
      });
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      // On ne journalise pas l'adresse complète en cas d'erreur applicative :
      // le destinataire est déjà tracé dans NotificationLog.
      this.logger.error(`Échec d'envoi d'email (« ${gabarit.subject} ») : ${message}`);
    }
  }

  /** Diffuse un même email à tous les administrateurs du tenant. */
  private async diffuserAuxAdmins(tenantId: string, gabarit: GabaritEmail): Promise<void> {
    const admins = await this.emailsAdmins(tenantId);
    if (admins.length === 0) {
      this.logger.warn(
        `Aucun destinataire administrateur pour le tenant ${tenantId} : ` +
          `« ${gabarit.subject} » non envoyé.`,
      );
      return;
    }
    for (const admin of admins) {
      await this.envoyer(tenantId, admin, gabarit);
    }
  }

  /**
   * Le journal de notification exige un tenant. Un paiement sans tenant
   * (cas d'une souscription hors contexte) n'est donc pas notifié : on trace
   * l'omission plutôt que de lever.
   */
  private exigerTenant(tenantId: string | null | undefined, evenement: string): string | null {
    if (!tenantId) {
      this.logger.warn(
        `Événement « ${evenement} » sans tenant : aucune notification envoyée.`,
      );
      return null;
    }
    return tenantId;
  }

  /**
   * Adresse du client à l'origine du paiement. À défaut d'utilisateur connu,
   * on se rabat sur les administrateurs du tenant afin que la demande ne passe
   * pas inaperçue.
   */
  private async emailClient(
    tenantId: string,
    userId?: string | null,
  ): Promise<string | null> {
    if (userId) {
      const utilisateur = await this.prisma.user.findFirst({
        where: { id: userId, tenantId },
        select: { email: true },
      });
      if (utilisateur?.email) return utilisateur.email;
    }

    const admins = await this.emailsAdmins(tenantId);
    if (admins.length > 0) return admins[0];

    this.logger.warn(
      `Aucun destinataire résolu pour le tenant ${tenantId} : notification abandonnée.`,
    );
    return null;
  }

  /**
   * Administrateurs du tenant : utilisateurs portant un rôle administrateur,
   * complétés par les adresses de PAYMENTS_ADMIN_EMAILS (liste séparée par des
   * virgules) pour les déploiements sans rôle explicite.
   */
  private async emailsAdmins(tenantId: string): Promise<string[]> {
    const adresses = new Set<string>();

    try {
      const utilisateurs = await this.prisma.user.findMany({
        where: {
          tenantId,
          userRoles: { some: { role: { name: { in: ROLES_ADMIN } } } },
        },
        select: { email: true },
        take: 20,
      });
      for (const { email } of utilisateurs) {
        if (email) adresses.add(email);
      }
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      this.logger.error(`Résolution des administrateurs impossible : ${message}`);
    }

    const repli = this.config.get<string>('PAYMENTS_ADMIN_EMAILS') ?? '';
    for (const adresse of repli.split(',')) {
      const nette = adresse.trim();
      if (nette) adresses.add(nette);
    }

    return [...adresses];
  }
}
