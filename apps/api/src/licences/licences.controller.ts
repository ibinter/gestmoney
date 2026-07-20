import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '../common/enums/role.enum';
import { LicencesService } from './licences.service';
import { LicencesScheduler } from './licences.scheduler';
import {
  ActiverEssaiDto,
  ChangerPlanDto,
  HistoriqueQueryDto,
  LicenceProvisoireDto,
  MotifDto,
  RenouvelerDto,
} from './dto/licences.dto';

/**
 * Administration du cycle de vie des licences.
 *
 * Réservé au SUPER_ADMIN : ces routes ouvrent et ferment l'accès de clients
 * entiers. Même schéma de protection que TenantsController.
 */
@ApiTags('Licences')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN)
@Controller('licences')
export class LicencesController {
  constructor(
    private readonly licencesService: LicencesService,
    private readonly licencesScheduler: LicencesScheduler,
  ) {}

  // ─── Consultation ──────────────────────────────────────────────────────────

  @Get(':tenantId/statut')
  @ApiOperation({ summary: "Consulter le statut de licence d'un établissement" })
  @ApiParam({ name: 'tenantId', description: 'ID du tenant' })
  @ApiResponse({ status: 200, description: 'Statut consolidé de la licence' })
  getStatut(@Param('tenantId') tenantId: string) {
    return this.licencesService.getStatutLicence(tenantId);
  }

  @Get(':tenantId/historique')
  @ApiOperation({ summary: 'Historique des événements de licence' })
  @ApiParam({ name: 'tenantId', description: 'ID du tenant' })
  getHistorique(
    @Param('tenantId') tenantId: string,
    @Query() query: HistoriqueQueryDto,
  ) {
    return this.licencesService.getHistorique(tenantId, query.limit ?? 50, query.offset ?? 0);
  }

  // ─── Transitions ───────────────────────────────────────────────────────────

  @Post(':tenantId/essai')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Ouvrir la période d'essai (une seule fois par tenant)" })
  @ApiResponse({ status: 409, description: 'Essai déjà consommé' })
  activerEssai(
    @Param('tenantId') tenantId: string,
    @Body() dto: ActiverEssaiDto,
    @CurrentUser('id') agentId: string,
  ) {
    return this.licencesService.activerEssai(tenantId, { ...dto, agentId });
  }

  @Post(':tenantId/renouveler')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renouveler un abonnement',
    description:
      "Un renouvellement anticipé prolonge l'échéance courante : les jours " +
      'restants ne sont jamais perdus.',
  })
  renouveler(
    @Param('tenantId') tenantId: string,
    @Body() dto: RenouvelerDto,
    @CurrentUser('id') agentId: string,
  ) {
    return this.licencesService.renouveler(tenantId, { ...dto, agentId });
  }

  @Post(':tenantId/plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Changer de plan (montée en gamme ou rétrogradation)' })
  changerPlan(
    @Param('tenantId') tenantId: string,
    @Body() dto: ChangerPlanDto,
    @CurrentUser('id') agentId: string,
  ) {
    return this.licencesService.changerPlan(tenantId, dto.plan, {
      motif: dto.motif,
      montant: dto.montant,
      agentId,
    });
  }

  @Post(':tenantId/provisoire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accorder une licence provisoire en attendant un paiement',
    description: 'Refusée au-delà du plafond configuré (14 jours par défaut).',
  })
  @ApiResponse({ status: 400, description: 'Durée supérieure au plafond autorisé' })
  accorderProvisoire(
    @Param('tenantId') tenantId: string,
    @Body() dto: LicenceProvisoireDto,
    @CurrentUser('id') agentId: string,
  ) {
    return this.licencesService.accorderLicenceProvisoire(tenantId, dto.dureeJours, dto.motif, {
      plan: dto.plan,
      agentId,
    });
  }

  @Post(':tenantId/suspendre')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Suspendre l'accès (réversible)" })
  suspendre(
    @Param('tenantId') tenantId: string,
    @Body() dto: MotifDto,
    @CurrentUser('id') agentId: string,
  ) {
    return this.licencesService.suspendre(tenantId, dto.motif, agentId);
  }

  @Post(':tenantId/reactiver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lever une suspension' })
  reactiver(
    @Param('tenantId') tenantId: string,
    @Body() dto: MotifDto,
    @CurrentUser('id') agentId: string,
  ) {
    return this.licencesService.reactiver(tenantId, dto.motif, agentId);
  }

  @Post(':tenantId/revoquer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Révoquer définitivement la licence (irréversible)' })
  revoquer(
    @Param('tenantId') tenantId: string,
    @Body() dto: MotifDto,
    @CurrentUser('id') agentId: string,
  ) {
    return this.licencesService.revoquer(tenantId, dto.motif, agentId);
  }

  // ─── Exploitation ──────────────────────────────────────────────────────────

  @Post('taches/executer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rejouer manuellement les tâches planifiées',
    description: 'Les tâches sont idempotentes : un rejeu ne duplique rien.',
  })
  executerTaches() {
    return this.licencesScheduler.executerToutesLesTaches();
  }
}
