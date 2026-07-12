import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FloatService } from './float.service';
import {
  ApproveReplenishmentDto,
  RejectReplenishmentDto,
  ReplenishmentRequestDto,
} from './dto/replenishment-request.dto';
import { FloatThresholdDto } from './dto/float-threshold.dto';

@ApiTags('Float')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('float')
export class FloatController {
  constructor(private readonly floatService: FloatService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des comptes float (par opérateur, agence)' })
  @ApiQuery({ name: 'agenceId', required: false })
  @ApiQuery({ name: 'operateur', required: false })
  @ApiResponse({ status: 200, description: 'Liste des comptes float avec soldes' })
  getFloatAccounts(
    @Req() req: any,
    @Query('agenceId') agenceId?: string,
    @Query('operateur') operateur?: string,
  ) {
    return this.floatService.getFloatAccounts(req.user.tenantId, agenceId, operateur);
  }

  @Get('network/summary')
  @ApiOperation({ summary: 'Vue réseau consolidée du float' })
  @ApiResponse({ status: 200, description: 'Agrégats float par opérateur' })
  getNetworkSummary(@Req() req: any) {
    return this.floatService.getNetworkSummary(req.user.tenantId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Historique des mouvements float' })
  @ApiQuery({ name: 'agentId', required: false })
  @ApiQuery({ name: 'operateur', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMovements(
    @Req() req: any,
    @Query('agentId') agentId?: string,
    @Query('operateur') operateur?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.floatService.getMovements(req.user.tenantId, agentId, operateur, +page, +limit);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Alertes float (comptes sous seuil)' })
  @ApiResponse({ status: 200, description: 'Liste des alertes avec niveau de priorité' })
  getAlerts(@Req() req: any) {
    return this.floatService.getAlerts(req.user.tenantId);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Prévisions besoin float (basées sur 7 derniers jours)' })
  @ApiResponse({ status: 200, description: 'Prévisions par agent/opérateur avec priorité' })
  getForecast(@Req() req: any) {
    return this.floatService.getForecast(req.user.tenantId);
  }

  @Get('replenish/pending')
  @ApiOperation({ summary: 'Demandes de réapprovisionnement en attente' })
  @ApiResponse({ status: 200, description: 'Liste des demandes PENDING' })
  getPendingReplenishments(@Req() req: any) {
    return this.floatService.getPendingReplenishments(req.user.tenantId);
  }

  @Post('replenish')
  @ApiOperation({ summary: 'Créer une demande de réapprovisionnement' })
  @ApiResponse({ status: 201, description: 'Demande créée' })
  requestReplenishment(@Body() dto: ReplenishmentRequestDto, @Req() req: any) {
    return this.floatService.requestReplenishment(dto, req.user.tenantId, req.user.id);
  }

  @Patch('replenish/:id/approve')
  @ApiOperation({ summary: 'Approuver une demande de réapprovisionnement' })
  @ApiParam({ name: 'id', description: 'ID de la demande' })
  @ApiResponse({ status: 200, description: 'Demande approuvée et float crédité' })
  approveReplenishment(
    @Param('id') id: string,
    @Body() dto: ApproveReplenishmentDto,
    @Req() req: any,
  ) {
    return this.floatService.approveReplenishment(id, dto, req.user.tenantId, req.user.id);
  }

  @Patch('replenish/:id/reject')
  @ApiOperation({ summary: 'Rejeter une demande de réapprovisionnement' })
  @ApiParam({ name: 'id', description: 'ID de la demande' })
  @ApiResponse({ status: 200, description: 'Demande rejetée' })
  rejectReplenishment(
    @Param('id') id: string,
    @Body() dto: RejectReplenishmentDto,
    @Req() req: any,
  ) {
    return this.floatService.rejectReplenishment(id, dto, req.user.tenantId, req.user.id);
  }

  @Post('thresholds')
  @ApiOperation({ summary: "Définir les seuils d'alerte pour un compte float" })
  @ApiResponse({ status: 201, description: 'Seuils mis à jour' })
  setThresholds(@Body() dto: FloatThresholdDto, @Req() req: any) {
    return this.floatService.setThresholds(dto, req.user.tenantId);
  }

  @Get(':agentId')
  @ApiOperation({ summary: "Float d'un agent par opérateur" })
  @ApiParam({ name: 'agentId', description: "ID de l'agent" })
  @ApiResponse({ status: 200, description: 'Liste des comptes float par opérateur' })
  getAgentFloat(@Param('agentId') agentId: string, @Req() req: any) {
    return this.floatService.getAgentFloat(agentId, req.user.tenantId);
  }
}
