import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiExcludeEndpoint, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { PaymentsService } from './payments.service';
import { SansLicence } from '../common/decorators/sans-licence.decorator';

/**
 * Réception des notifications de paiement des passerelles.
 *
 * ── Pourquoi ces routes sont PUBLIQUES ──────────────────────────────────────
 * Aucun JwtAuthGuard : une passerelle de paiement est un serveur tiers, elle
 * ne porte évidemment pas de JWT d'utilisateur. L'authentification se fait par
 * la signature HMAC du corps de la requête, vérifiée par WebhookService AVANT
 * tout traitement. Une signature absente ou invalide ⇒ 401, aucun événement
 * enregistré, aucun paiement activé.
 *
 * ── Le corps BRUT est indispensable ─────────────────────────────────────────
 * Le HMAC porte sur les octets exacts émis par la passerelle. Re-sérialiser
 * l'objet déjà analysé (`JSON.stringify(req.body)`) réordonne les clés et
 * normalise les espaces : le condensé calculé ne correspond alors plus jamais
 * à la signature reçue, et TOUS les webhooks légitimes seraient rejetés.
 *
 * `apps/api/src/main.ts` crée donc l'application avec `rawBody: true`, ce qui
 * met les octets d'origine à disposition dans `req.rawBody`. NE PAS retirer
 * cette option : les webhooks de paiement cesseraient silencieusement de
 * s'authentifier.
 *
 * Le repli ci-dessous (re-sérialisation du corps analysé) ne sert que si
 * `req.rawBody` venait à manquer : il JOURNALISE UN AVERTISSEMENT et la
 * vérification échouera. C'est le comportement voulu — on refuse plutôt que
 * d'activer un abonnement sans preuve d'authenticité.
 */
@ApiTags('Webhooks de paiement')
// Notifications des passerelles : elles ne portent AUCUN JWT, donc aucun
// tenant. La garde les laisserait déjà passer faute d'identité, mais on le
// déclare explicitement — c'est par ce chemin que le paiement qui réactive la
// licence est confirmé, il ne doit jamais devenir bloquable par inadvertance.
@SansLicence()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Récupère les octets bruts. Renvoie `null` si seule la version analysée est
   * disponible, ce qui permet d'avertir explicitement.
   */
  private extraireCorpsBrut(req: RawBodyRequest<Request>): Buffer | null {
    if (req.rawBody && Buffer.isBuffer(req.rawBody) && req.rawBody.length > 0) {
      return req.rawBody;
    }
    if (Buffer.isBuffer(req.body)) {
      return req.body as unknown as Buffer;
    }
    return null;
  }

  /**
   * En-tête de signature. Chaque passerelle a le sien ; on les accepte tous
   * plutôt que d'imposer un format unique.
   */
  private extraireSignature(entetes: Record<string, any>): string {
    const candidats = [
      'x-signature',
      'x-webhook-signature',
      'x-hub-signature-256',
      'x-paystack-signature',
      'verif-hash',
      'x-fedapay-signature',
      'x-moneroo-signature',
      'x-token',
      'stripe-signature',
    ];
    for (const nom of candidats) {
      const valeur = entetes[nom];
      if (valeur) return Array.isArray(valeur) ? valeur[0] : String(valeur);
    }
    return '';
  }

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Notification de paiement d\'une passerelle (route publique)',
    description:
      'Authentifiée par signature HMAC-SHA256 du corps brut, vérifiée avant ' +
      "tout traitement. Idempotente : un même événement n'active qu'une fois.",
  })
  @ApiParam({ name: 'provider', description: 'cinetpay, moneroo, fedapay, paystack…' })
  @ApiResponse({ status: 200, description: 'Événement traité, ignoré (rejeu) ou refusé' })
  @ApiResponse({ status: 401, description: 'Signature invalide — rien n\'est activé' })
  async recevoir(
    @Param('provider') provider: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers() entetes: Record<string, any>,
    @Body() corps: any,
  ) {
    const signature = this.extraireSignature(entetes);
    let corpsBrut = this.extraireCorpsBrut(req);

    if (!corpsBrut) {
      this.logger.warn(
        `Webhook ${provider} : corps brut indisponible (rawBody non activé dans main.ts). ` +
          'Repli sur une re-sérialisation du corps analysé — la vérification HMAC ' +
          'échouera très probablement. Voir la note en tête de WebhooksController.',
      );
      corpsBrut = Buffer.from(JSON.stringify(corps ?? {}), 'utf8');
    }

    // La vérification de signature et l'idempotence sont entièrement gérées
    // par le service : le contrôleur ne décide de rien.
    return this.webhookService.traiterWebhook(provider, corpsBrut, signature, corps);
  }

  /**
   * Retour de navigateur après paiement.
   *
   * ATTENTION : cette route n'active RIEN et ne doit jamais le faire. L'URL de
   * retour est intégralement sous le contrôle du client, qui peut l'appeler à
   * la main avec n'importe quelle référence. Elle se contente de renvoyer le
   * statut réel, tel qu'il a été établi par le webhook signé ou par la
   * validation d'un administrateur.
   */
  @Post('retour/:reference')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async consulterRetour(@Param('reference') reference: string) {
    const paiement = await this.paymentsService.trouverParReference(reference);
    return {
      reference,
      statut: paiement?.statut ?? 'INCONNU',
      // Rappel explicite : consultation seule.
      message:
        'Statut consultatif. Seuls un webhook signé ou la validation d\'un ' +
        'administrateur peuvent valider un paiement.',
    };
  }
}
