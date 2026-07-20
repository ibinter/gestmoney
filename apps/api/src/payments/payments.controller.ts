import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { PaymentConfigService } from './payment-config.service';
import { PaymentsService } from './payments.service';
import { VouchersService } from './vouchers.service';
import { CreatePaiementDto, ListPaiementsQueryDto } from './dto/create-paiement.dto';
import { MethodesDisponiblesQueryDto } from './dto/payment-config.dto';
import { UploadProofDto } from './dto/payment-proof.dto';
import { ConsommerVoucherDto } from './dto/voucher.dto';

/**
 * Routes client. Aucune ne peut activer un paiement : la création laisse le
 * paiement en EN_ATTENTE et le téléversement d'une preuve le met au plus en
 * EN_COURS. Seuls un webhook signé (WebhooksController) ou la validation d'un
 * administrateur font passer un paiement à REUSSI.
 */
@ApiTags('Paiements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentConfigService: PaymentConfigService,
    private readonly vouchersService: VouchersService,
  ) {}

  @Get('methodes')
  @ApiOperation({
    summary: 'Méthodes de paiement disponibles pour le client',
    description:
      'Ne renvoie que les méthodes actives et compatibles avec le pays, le plan et ' +
      'la devise. Les clés secrètes ne sont jamais incluses.',
  })
  @ApiResponse({ status: 200, description: 'Liste des méthodes proposables' })
  getMethodesDisponibles(
    @Query() query: MethodesDisponiblesQueryDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.paymentConfigService.getMethodesDisponibles(
      user?.tenantId,
      query.pays,
      query.plan,
      query.devise,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un paiement (statut EN_ATTENTE)' })
  @ApiResponse({ status: 201, description: 'Paiement créé avec sa référence' })
  creerPaiement(@Body() dto: CreatePaiementDto, @CurrentUser() user: CurrentUserData) {
    return this.paymentsService.creerPaiement(dto, user?.tenantId, user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister ses paiements' })
  lister(@Query() query: ListPaiementsQueryDto, @CurrentUser() user: CurrentUserData) {
    return this.paymentsService.lister(query, user?.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un paiement' })
  @ApiParam({ name: 'id', description: 'Identifiant du paiement' })
  trouverUn(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.paymentsService.trouverParId(id, user?.tenantId);
  }

  @Post('proofs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Téléverser une preuve de paiement',
    description:
      'Refuse les doublons (même empreinte SHA256) et tout fichier autre ' +
      "qu'une image ou un PDF. Le fichier est stocké hors de toute " +
      'arborescence publique et ne valide rien par lui-même.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['paiementId', 'file'],
      properties: {
        paiementId: { type: 'string' },
        referenceTexte: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  televerserPreuve(
    @Body() dto: UploadProofDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.paymentsService.televerserPreuve(dto, file, user?.tenantId, user?.id);
  }

  @Get(':id/proofs')
  @ApiOperation({ summary: "Preuves déjà soumises pour un paiement" })
  async listerPreuves(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    // Contrôle d'appartenance avant d'exposer quoi que ce soit.
    await this.paymentsService.trouverParId(id, user?.tenantId);
    return this.paymentsService.listerPreuves(id);
  }

  @Post('vouchers/consommer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consommer un code prépayé',
    description: 'Consommation atomique : un code ne peut être utilisé qu\'une seule fois.',
  })
  @ApiResponse({ status: 409, description: 'Code déjà utilisé' })
  consommerVoucher(@Body() dto: ConsommerVoucherDto, @CurrentUser() user: CurrentUserData) {
    return this.vouchersService.consommer(dto.code, user.id, user?.tenantId);
  }
}
