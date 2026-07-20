import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaiementStatut, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentConfigService } from './payment-config.service';
import { PaymentsService } from './payments.service';
import { PAYMENT_EVENTS } from './payments.events';

/**
 * Écart maximal toléré entre le montant attendu et le montant encaissé.
 * 1 unité de devise : couvre les arrondis de passerelle, rien de plus.
 * Un écart supérieur est traité comme une anomalie et n'active RIEN.
 */
const TOLERANCE_MONTANT = 1;

export interface IResultatWebhook {
  /** Vrai si l'événement a été traité par cet appel. */
  traite: boolean;
  /** Vrai si l'événement avait déjà été traité (rejeu). */
  duplique: boolean;
  /** Vrai si le paiement a été activé par cet appel. */
  active: boolean;
  message: string;
  reference?: string;
}

/** Charge utile normalisée, extraite du corps propre à chaque passerelle. */
interface IEvenementNormalise {
  eventId: string;
  reference: string;
  montant: number | null;
  devise: string | null;
  statut: string;
  providerRef: string | null;
  reussi: boolean;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
    private readonly paymentConfigService: PaymentConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── 1. Vérification de signature ───────────────────────────────────────────

  /**
   * Compare deux signatures en TEMPS CONSTANT.
   *
   * `===` sur des chaînes s'arrête au premier caractère différent : le temps de
   * réponse fuit alors la position de la divergence, ce qui permet de
   * reconstruire la signature attendue octet par octet. `timingSafeEqual`
   * compare toujours l'intégralité des tampons.
   *
   * Note : `timingSafeEqual` lève si les longueurs diffèrent — on compare donc
   * d'abord les longueurs (information non secrète), puis les contenus.
   */
  private comparerSignatures(attendue: string, recue: string): boolean {
    if (typeof attendue !== 'string' || typeof recue !== 'string') return false;

    const tamponAttendu = Buffer.from(attendue, 'utf8');
    const tamponRecu = Buffer.from(recue, 'utf8');

    if (tamponAttendu.length !== tamponRecu.length) {
      // Longueurs différentes : on effectue tout de même une comparaison
      // factice pour ne pas répondre plus vite que dans le cas nominal.
      crypto.timingSafeEqual(tamponAttendu, tamponAttendu);
      return false;
    }
    return crypto.timingSafeEqual(tamponAttendu, tamponRecu);
  }

  /**
   * Vérifie la signature HMAC-SHA256 du corps BRUT.
   *
   * Le HMAC doit être calculé sur les octets EXACTEMENT tels qu'envoyés par la
   * passerelle. Re-sérialiser un objet déjà analysé (`JSON.stringify(body)`)
   * change l'ordre des clés et les espaces, et fait échouer la vérification —
   * voir la note sur le corps brut dans WebhooksController.
   *
   * Cette méthode est appelée AVANT tout traitement : tant qu'elle n'a pas
   * renvoyé vrai, rien n'est inséré, rien n'est activé.
   */
  async verifierSignature(
    provider: string,
    corpsBrut: Buffer | string,
    signatureRecue: string,
  ): Promise<boolean> {
    if (!signatureRecue) {
      this.logger.warn(`Webhook ${provider} sans en-tête de signature : rejeté`);
      return false;
    }

    const secret = await this.resoudreSecret(provider);
    if (!secret) {
      // Aucun secret configuré : on REFUSE. Accepter « faute de secret »
      // reviendrait à ouvrir une route d'activation non authentifiée.
      this.logger.error(
        `Webhook ${provider} reçu mais aucun secret de webhook n'est configuré : rejeté. ` +
          `Renseignez « webhook_secret » dans la configuration du moyen de paiement.`,
      );
      return false;
    }

    const corps = Buffer.isBuffer(corpsBrut) ? corpsBrut : Buffer.from(corpsBrut, 'utf8');
    const hmac = crypto.createHmac('sha256', secret).update(corps).digest('hex');

    // Certaines passerelles préfixent (`sha256=…`) ou encodent en base64.
    const signatureNette = signatureRecue.replace(/^sha256=/i, '').trim();
    const hmacBase64 = crypto.createHmac('sha256', secret).update(corps).digest('base64');

    const valide =
      this.comparerSignatures(hmac, signatureNette.toLowerCase()) ||
      this.comparerSignatures(hmacBase64, signatureNette);

    if (!valide) {
      this.logger.warn(
        `Signature invalide pour un webhook ${provider} : événement rejeté, aucun paiement activé.`,
      );
    }
    return valide;
  }

  /**
   * Secret de vérification : d'abord la configuration en base (modifiable sans
   * redéploiement), sinon une variable d'environnement de repli.
   */
  private async resoudreSecret(provider: string): Promise<string | null> {
    const enBase = await this.paymentConfigService.getWebhookSecret(provider);
    if (enBase) return enBase;

    const cleEnv = `WEBHOOK_SECRET_${provider.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    return this.configService.get<string>(cleEnv) ?? null;
  }

  // ─── 2. Traitement idempotent ───────────────────────────────────────────────

  /**
   * Point d'entrée du traitement d'un webhook.
   *
   * Ordre imposé, aucune étape n'est facultative :
   *  1. la signature est vérifiée AVANT tout — signature invalide = rejet sec ;
   *  2. le WebhookEvent est INSÉRÉ d'abord. Si la contrainte
   *     @@unique([provider, eventId]) échoue (P2002), l'événement a déjà été
   *     reçu : on ressort sans rien réactiver. C'est la contrainte d'unicité
   *     de la base qui garantit l'idempotence — un `findFirst` préalable ne le
   *     ferait PAS : deux webhooks simultanés liraient tous deux « absent »
   *     avant que l'un des deux n'écrive, et le paiement serait activé deux
   *     fois ;
   *  3. le montant encaissé est rapproché du montant attendu ;
   *  4. l'activation n'a lieu qu'ici (ou par validation admin) — jamais sur
   *     l'URL de retour du navigateur, que le client contrôle entièrement.
   */
  async traiterWebhook(
    provider: string,
    corpsBrut: Buffer | string,
    signature: string,
    corpsAnalyse?: Record<string, any>,
  ): Promise<IResultatWebhook> {
    // ── Étape 1 : signature, avant toute autre chose ──────────────────────────
    const signatureValide = await this.verifierSignature(provider, corpsBrut, signature);
    if (!signatureValide) {
      // Rien n'est inséré, rien n'est activé.
      throw new UnauthorizedException('Signature de webhook invalide');
    }

    const payload =
      corpsAnalyse ?? this.analyserCorps(Buffer.isBuffer(corpsBrut) ? corpsBrut.toString('utf8') : corpsBrut);

    const evenement = this.normaliser(provider, payload);
    if (!evenement.eventId) {
      throw new BadRequestException('Événement sans identifiant : impossible de garantir l\'idempotence');
    }

    // ── Étape 2 : idempotence par contrainte d'unicité ────────────────────────
    let webhookEventId: string;
    try {
      const enregistre = await this.prisma.webhookEvent.create({
        data: {
          provider,
          eventId: evenement.eventId,
          signature: signature?.slice(0, 500) ?? null,
          payload: payload as Prisma.InputJsonValue,
          traite: false,
        },
      });
      webhookEventId = enregistre.id;
    } catch (erreur) {
      if (
        erreur instanceof Prisma.PrismaClientKnownRequestError &&
        erreur.code === 'P2002'
      ) {
        // Déjà reçu. On SORT sans rien réactiver — c'est tout l'objet de la
        // contrainte d'unicité.
        this.logger.log(
          `Webhook ${provider}/${evenement.eventId} déjà traité : rejeu ignoré (idempotence).`,
        );
        return {
          traite: false,
          duplique: true,
          active: false,
          message: 'Événement déjà traité',
          reference: evenement.reference,
        };
      }
      throw erreur;
    }

    // À partir d'ici, cet appel est le SEUL à traiter cet événement.
    try {
      return await this.appliquer(webhookEventId, provider, evenement, payload);
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      await this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { traite: true, traiteAt: new Date(), erreur: message.slice(0, 1000) },
      });
      throw erreur;
    }
  }

  // ─── 3. Rapprochement des montants et activation ────────────────────────────

  private async appliquer(
    webhookEventId: string,
    provider: string,
    evenement: IEvenementNormalise,
    payload: Record<string, any>,
  ): Promise<IResultatWebhook> {
    const cloturer = (erreur?: string) =>
      this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { traite: true, traiteAt: new Date(), erreur: erreur ?? null },
      });

    const paiement = await this.prisma.paiement.findUnique({
      where: { reference: evenement.reference },
    });

    if (!paiement) {
      const message = `Aucun paiement pour la référence ${evenement.reference}`;
      this.logger.warn(`Webhook ${provider} : ${message}`);
      await cloturer(message);
      return { traite: true, duplique: false, active: false, message };
    }

    // Paiement déjà réussi : on ne réactive pas (ceinture supplémentaire).
    if (paiement.statut === PaiementStatut.REUSSI) {
      await cloturer(null);
      return {
        traite: true,
        duplique: false,
        active: false,
        message: 'Paiement déjà validé',
        reference: paiement.reference,
      };
    }

    // Événement d'échec annoncé par la passerelle.
    if (!evenement.reussi) {
      await this.paymentsService.marquerEchoue(
        paiement.id,
        `Échec annoncé par ${provider} : ${evenement.statut}`,
        payload as Prisma.InputJsonValue,
      );
      await cloturer(null);
      return {
        traite: true,
        duplique: false,
        active: false,
        message: `Paiement en échec (${evenement.statut})`,
        reference: paiement.reference,
      };
    }

    // ── Rapprochement du montant ──────────────────────────────────────────────
    // Le montant attendu vient de `metadata.montantAttendu`, figé à la création
    // du paiement, avec repli sur la colonne `montant`.
    const metadata = (paiement.metadata ?? {}) as Record<string, any>;
    const montantAttendu = Number(metadata.montantAttendu ?? paiement.montant);
    const montantRecu = evenement.montant;

    if (montantRecu === null || Number.isNaN(montantRecu)) {
      const message = `Montant absent du webhook ${provider} : activation refusée`;
      this.logger.error(`${message} (paiement ${paiement.reference})`);
      await this.paymentsService.marquerEchoue(paiement.id, message, payload as Prisma.InputJsonValue);
      await cloturer(message);
      return { traite: true, duplique: false, active: false, message, reference: paiement.reference };
    }

    const ecart = Math.abs(montantRecu - montantAttendu);
    if (ecart > TOLERANCE_MONTANT) {
      const message =
        `Montant non conforme : attendu ${montantAttendu} ${paiement.devise}, ` +
        `reçu ${montantRecu} ${evenement.devise ?? paiement.devise} (écart ${ecart}).`;
      // Anomalie : on N'ACTIVE PAS, on marque en échec et on journalise pour
      // revue manuelle. Un sous-paiement ne doit jamais ouvrir un accès.
      this.logger.error(
        `Webhook ${provider} — paiement ${paiement.reference} : ${message} Aucune activation.`,
      );
      await this.paymentsService.marquerEchoue(paiement.id, message, payload as Prisma.InputJsonValue);
      await cloturer(message);
      return { traite: true, duplique: false, active: false, message, reference: paiement.reference };
    }

    // Devise : un montant identique dans une autre devise n'est pas le même
    // montant.
    if (
      evenement.devise &&
      evenement.devise.toUpperCase() !== paiement.devise.toUpperCase()
    ) {
      const message =
        `Devise non conforme : attendue ${paiement.devise}, reçue ${evenement.devise}.`;
      this.logger.error(`Webhook ${provider} — paiement ${paiement.reference} : ${message}`);
      await this.paymentsService.marquerEchoue(paiement.id, message, payload as Prisma.InputJsonValue);
      await cloturer(message);
      return { traite: true, duplique: false, active: false, message, reference: paiement.reference };
    }

    // ── Activation ────────────────────────────────────────────────────────────
    // C'est le SEUL endroit, avec la validation admin d'une preuve, où un
    // paiement passe à REUSSI. Aucune route de retour navigateur ne le fait :
    // une URL de retour est intégralement falsifiable par le client.
    await this.paymentsService.marquerReussi(
      paiement.id,
      evenement.providerRef,
      payload as Prisma.InputJsonValue,
    );
    await cloturer(null);

    this.logger.log(
      `Paiement ${paiement.reference} activé par webhook ${provider} ` +
        `(événement ${evenement.eventId}, montant ${montantRecu} ${paiement.devise}).`,
    );

    // Confirmation d'activation au client. Publiée APRÈS l'activation et
    // enveloppée : une notification en échec ne doit pas défaire l'encaissement
    // ni renvoyer une erreur à la passerelle, qui rejouerait alors le webhook.
    try {
      this.eventEmitter.emit(PAYMENT_EVENTS.CONFIRME_WEBHOOK, {
        paiementId: paiement.id,
        tenantId: paiement.tenantId,
        reference: paiement.reference,
        montant: montantRecu,
        devise: paiement.devise,
        userId: metadata.creePar ?? null,
        plan: metadata.plan ?? null,
        provider,
        confirmeAt: new Date(),
      });
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      this.logger.error(
        `Notification d'activation non publiée pour ${paiement.reference} : ${message}`,
      );
    }

    return {
      traite: true,
      duplique: false,
      active: true,
      message: 'Paiement validé',
      reference: paiement.reference,
    };
  }

  // ─── Normalisation par passerelle ───────────────────────────────────────────

  private analyserCorps(texte: string): Record<string, any> {
    try {
      return JSON.parse(texte);
    } catch {
      throw new BadRequestException('Corps de webhook illisible (JSON attendu)');
    }
  }

  /**
   * Ramène les charges utiles hétérogènes des passerelles à une forme commune.
   * Chaque passerelle nomme différemment les mêmes concepts ; on accepte les
   * variantes usuelles plutôt que d'imposer un format.
   */
  private normaliser(provider: string, payload: Record<string, any>): IEvenementNormalise {
    const donnees = (payload?.data ?? payload) as Record<string, any>;

    const eventId = String(
      payload?.id ??
        payload?.event_id ??
        payload?.eventId ??
        donnees?.id ??
        donnees?.transaction_id ??
        donnees?.reference ??
        '',
    );

    const reference = String(
      donnees?.reference ??
        donnees?.transaction_id ??
        donnees?.merchant_reference ??
        donnees?.cpm_trans_id ??
        payload?.reference ??
        '',
    );

    const montantBrut =
      donnees?.amount ?? donnees?.montant ?? donnees?.cpm_amount ?? payload?.amount;
    const montant =
      montantBrut === undefined || montantBrut === null ? null : Number(montantBrut);

    const devise = donnees?.currency ?? donnees?.devise ?? donnees?.cpm_currency ?? null;

    const statut = String(
      donnees?.status ?? donnees?.statut ?? payload?.status ?? payload?.event ?? '',
    ).toUpperCase();

    // Liste BLANCHE de statuts de succès : un statut inconnu n'active rien.
    const STATUTS_REUSSIS = new Set([
      'SUCCESS',
      'SUCCEEDED',
      'SUCCESSFUL',
      'COMPLETED',
      'ACCEPTED',
      'APPROVED',
      'PAID',
      'TRANSACTION.COMPLETED',
      'CHARGE.SUCCESS',
      'PAYMENT_INTENT.SUCCEEDED',
      'REUSSI',
      '00',
    ]);

    return {
      eventId,
      reference,
      montant,
      devise: devise ? String(devise) : null,
      statut,
      providerRef: donnees?.transaction_id
        ? String(donnees.transaction_id)
        : donnees?.id
          ? String(donnees.id)
          : null,
      reussi: STATUTS_REUSSIS.has(statut),
    };
  }

  /** Journal des événements reçus, pour la console d'administration. */
  async listerEvenements(provider?: string, limite = 100) {
    return this.prisma.webhookEvent.findMany({
      where: provider ? { provider } : {},
      orderBy: { createdAt: 'desc' },
      take: Math.min(limite, 500),
    });
  }
}
