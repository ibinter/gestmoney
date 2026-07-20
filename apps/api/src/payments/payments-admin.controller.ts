import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProofStatut, VoucherStatut } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SansLicence } from '../common/decorators/sans-licence.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { RoleType } from '../common/enums/role.enum';
import { IContexteAudit, PaymentConfigService } from './payment-config.service';
import { PaymentsService } from './payments.service';
import { VouchersService } from './vouchers.service';
import { WebhookService } from './webhook.service';
import {
  CreatePaymentConfigDto,
  ToggleConfigDto,
  UpdatePaymentConfigDto,
} from './dto/payment-config.dto';
import { RejeterProofDto } from './dto/payment-proof.dto';
import { GenererVouchersDto, ListVouchersQueryDto } from './dto/voucher.dto';
import { ListPaiementsQueryDto } from './dto/create-paiement.dto';

/**
 * Administration des paiements.
 *
 * Double garde, comme dans TenantsController : JwtAuthGuard authentifie, puis
 * RolesGuard restreint aux profils d'administration. Aucune route de ce
 * contrôleur n'expose `secrets` — PaymentConfigService masque systématiquement
 * ce champ, et `getSecrets()` n'est appelée nulle part ici.
 */
@ApiTags('Paiements — Administration')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
// Validation des preuves et des encaissements : même raison que
// PaymentsController, côté opérateur. C'est ce chemin qui réactive les licences.
@SansLicence()
@Controller('admin/payments')
export class PaymentsAdminController {
  constructor(
    private readonly paymentConfigService: PaymentConfigService,
    private readonly paymentsService: PaymentsService,
    private readonly vouchersService: VouchersService,
    private readonly webhookService: WebhookService,
  ) {}

  /** Contexte d'audit : identité de l'administrateur et IP d'origine. */
  private contexte(req: Request, user: CurrentUserData): IContexteAudit {
    const entete = req.headers['x-forwarded-for'];
    const ipAddress =
      (Array.isArray(entete) ? entete[0] : entete)?.split(',')[0].trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      undefined;
    return { userId: user?.id, ipAddress };
  }

  // ─── Configuration des moyens de paiement ───────────────────────────────────

  @Post('configs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une configuration de moyen de paiement',
    description: 'Les secrets sont chiffrés au repos et ne sont jamais renvoyés.',
  })
  creerConfig(
    @Body() dto: CreatePaymentConfigDto,
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    return this.paymentConfigService.creer(dto, this.contexte(req, user));
  }

  @Get('configs')
  @ApiOperation({ summary: 'Lister les configurations (secrets masqués)' })
  @ApiQuery({ name: 'tenantId', required: false })
  listerConfigs(@Query('tenantId') tenantId?: string) {
    return this.paymentConfigService.listerToutes(tenantId);
  }

  @Get('configs/:id')
  @ApiOperation({ summary: 'Détail d\'une configuration (secrets masqués)' })
  @ApiParam({ name: 'id' })
  trouverConfig(@Param('id') id: string) {
    return this.paymentConfigService.trouverUne(id);
  }

  @Patch('configs/:id')
  @ApiOperation({ summary: 'Modifier une configuration (journalisée)' })
  @ApiParam({ name: 'id' })
  majConfig(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentConfigDto,
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    return this.paymentConfigService.mettreAJour(id, dto, this.contexte(req, user));
  }

  @Patch('configs/:id/activation')
  @ApiOperation({ summary: 'Activer / désactiver une méthode' })
  @ApiParam({ name: 'id' })
  basculerConfig(
    @Param('id') id: string,
    @Body() dto: ToggleConfigDto,
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    return this.paymentConfigService.basculerActivation(id, dto.actif, this.contexte(req, user));
  }

  @Delete('configs/:id')
  @ApiOperation({ summary: 'Supprimer une configuration' })
  @ApiParam({ name: 'id' })
  supprimerConfig(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    return this.paymentConfigService.supprimer(id, this.contexte(req, user));
  }

  // ─── Journal d'audit ────────────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({
    summary: 'Journal des modifications de configuration',
    description:
      'Les valeurs de secrets y figurent masquées (***) : leur contenu en clair ' +
      "n'est jamais journalisé.",
  })
  @ApiQuery({ name: 'configId', required: false })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  journalAudit(@Query('configId') configId?: string, @Query('limite') limite?: number) {
    return this.paymentConfigService.getJournalAudit(configId, limite ? Number(limite) : 100);
  }

  @Get('webhooks/events')
  @ApiOperation({ summary: 'Événements de webhook reçus' })
  @ApiQuery({ name: 'provider', required: false })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  evenementsWebhook(@Query('provider') provider?: string, @Query('limite') limite?: number) {
    return this.webhookService.listerEvenements(provider, limite ? Number(limite) : 100);
  }

  // ─── Paiements et preuves ───────────────────────────────────────────────────

  @Get('paiements')
  @ApiOperation({ summary: 'Lister tous les paiements' })
  listerPaiements(@Query() query: ListPaiementsQueryDto) {
    return this.paymentsService.lister(query);
  }

  @Get('proofs')
  @ApiOperation({ summary: 'Preuves à examiner' })
  @ApiQuery({ name: 'paiementId', required: false })
  @ApiQuery({ name: 'statut', required: false, enum: ProofStatut })
  listerPreuves(
    @Query('paiementId') paiementId?: string,
    @Query('statut') statut?: ProofStatut,
  ) {
    return this.paymentsService.listerPreuves(paiementId, statut);
  }

  @Get('proofs/:id/fichier')
  @ApiOperation({
    summary: 'Télécharger le fichier d\'une preuve',
    description:
      'Seule voie d\'accès aux fichiers de preuve : le dossier de stockage ' +
      "n'est jamais servi en statique.",
  })
  @ApiParam({ name: 'id' })
  async telechargerPreuve(@Param('id') id: string, @Res() res: Response) {
    const { contenu, mimeType, nomOriginal } = await this.paymentsService.lireFichierPreuve(id);
    // `attachment` + nosniff : le navigateur ne rend jamais le fichier en ligne,
    // ce qui neutralise un éventuel contenu actif ayant franchi les filtres.
    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(nomOriginal)}"`);
    res.send(contenu);
  }

  @Post('proofs/:id/valider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Valider une preuve et activer le paiement',
    description: 'Une des deux seules voies d\'activation, avec le webhook signé.',
  })
  @ApiParam({ name: 'id' })
  validerPreuve(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    return this.paymentsService.validerPreuve(id, user.id, this.contexte(req, user));
  }

  @Post('proofs/:id/rejeter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeter une preuve (motif obligatoire)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 400, description: 'Motif de rejet manquant ou trop court' })
  rejeterPreuve(
    @Param('id') id: string,
    @Body() dto: RejeterProofDto,
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    return this.paymentsService.rejeterPreuve(id, dto.motifRejet, user.id, this.contexte(req, user));
  }

  // ─── Vouchers ───────────────────────────────────────────────────────────────

  @Post('vouchers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Générer un lot de codes prépayés' })
  genererVouchers(@Body() dto: GenererVouchersDto, @CurrentUser() user: CurrentUserData) {
    return this.vouchersService.genererLot(dto, user?.id);
  }

  @Get('vouchers')
  @ApiOperation({ summary: 'Lister les vouchers' })
  listerVouchers(@Query() query: ListVouchersQueryDto) {
    return this.vouchersService.lister(query);
  }

  @Get('vouchers/export')
  @ApiOperation({ summary: 'Exporter les vouchers au format CSV' })
  @ApiQuery({ name: 'lot', required: false })
  @ApiQuery({ name: 'statut', required: false, enum: VoucherStatut })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exporterVouchers(
    @Res() res: Response,
    @Query('lot') lot?: string,
    @Query('statut') statut?: VoucherStatut,
  ) {
    const csv = await this.vouchersService.exporterCsv(lot, statut);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="vouchers-${lot ?? 'tous'}.csv"`,
    );
    res.send(csv);
  }

  @Get('vouchers/lots/:lot')
  @ApiOperation({ summary: 'Statistiques d\'un lot' })
  @ApiParam({ name: 'lot' })
  statistiquesLot(@Param('lot') lot: string) {
    return this.vouchersService.statistiquesLot(lot);
  }

  @Post('vouchers/lots/:lot/annuler')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler les codes encore disponibles d\'un lot' })
  @ApiParam({ name: 'lot' })
  annulerLot(@Param('lot') lot: string) {
    return this.vouchersService.annulerLot(lot);
  }
}
