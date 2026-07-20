import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentConfigService } from './payment-config.service';
import { PaymentsService } from './payments.service';
import { VouchersService } from './vouchers.service';
import { WebhookService } from './webhook.service';
import { PaymentsController } from './payments.controller';
import { PaymentsAdminController } from './payments-admin.controller';
import { WebhooksController } from './webhooks.controller';

/**
 * Module de paiement.
 *
 * Toute la configuration (clés, numéros de réception, coordonnées bancaires)
 * vit en base via PaymentMethodConfig : rien n'est codé en dur, et les secrets
 * sont chiffrés au repos.
 *
 * PaymentConfigService est exporté pour permettre à d'autres modules serveur
 * d'appeler les passerelles ; `getSecrets()` reste un usage strictement
 * interne et n'est exposée par aucun contrôleur.
 */
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentsController, PaymentsAdminController, WebhooksController],
  providers: [PaymentConfigService, PaymentsService, VouchersService, WebhookService],
  exports: [PaymentConfigService, PaymentsService, VouchersService, WebhookService],
})
export class PaymentsModule {}
