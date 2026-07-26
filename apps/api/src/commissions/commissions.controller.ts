import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { CommissionPlanDto } from './dto/commission-plan.dto';
import {
  CalculateCommissionsDto,
  QueryCommissionDto,
  ValidatePaymentDto,
} from './dto/query-commission.dto';

@ApiTags('Commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les commissions (par agent, agence, période)' })
  findAll(@Query() query: QueryCommissionDto, @Req() req: any) {
    return this.commissionsService.findAll(query, req.user.tenantId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Résumé commissions (dues, payées, en attente)' })
  getSummary(@Req() req: any) {
    return this.commissionsService.getSummary(req.user.tenantId);
  }

  @Post('calculate')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.ACCOUNTANT)
  @ApiOperation({ summary: 'Recalculer les commissions sur une période' })
  @ApiResponse({ status: 200, description: 'Nombre de commissions recalculées' })
  recalculate(@Body() dto: CalculateCommissionsDto, @Req() req: any) {
    return this.commissionsService.recalculate(dto, req.user.tenantId);
  }

  @Post('plans')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Créer une grille tarifaire de commission' })
  @ApiResponse({ status: 201, description: 'Grille créée' })
  createPlan(@Body() dto: CommissionPlanDto, @Req() req: any) {
    return this.commissionsService.createPlan(dto, req.user.tenantId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Lister les grilles tarifaires' })
  getPlans(@Req() req: any) {
    return this.commissionsService.getPlans(req.user.tenantId);
  }

  @Patch('plans/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Modifier une grille tarifaire' })
  @ApiParam({ name: 'id', description: 'ID de la grille' })
  updatePlan(
    @Param('id') id: string,
    @Body() dto: Partial<CommissionPlanDto>,
    @Req() req: any,
  ) {
    return this.commissionsService.updatePlan(id, dto, req.user.tenantId);
  }

  @Post('payments')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.ACCOUNTANT)
  @ApiOperation({ summary: 'Valider le paiement de commissions' })
  @ApiResponse({ status: 201, description: 'Paiement validé et commissions marquées PAID' })
  validatePayment(@Body() dto: ValidatePaymentDto, @Req() req: any) {
    return this.commissionsService.validatePayment(dto, req.user.tenantId, req.user.id);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Historique des paiements de commissions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPayments(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.commissionsService.getPayments(req.user.tenantId, +page, +limit);
  }

  @Get('agents/:agentId')
  @ApiOperation({ summary: "Commissions d'un agent" })
  @ApiParam({ name: 'agentId', description: "ID de l'agent" })
  getAgentCommissions(
    @Param('agentId') agentId: string,
    @Query() query: QueryCommissionDto,
    @Req() req: any,
  ) {
    return this.commissionsService.getAgentCommissions(agentId, req.user.tenantId, query);
  }

  // ─── Tableau du mois ──────────────────────────────────────────────────────────

  @Get('tableau')
  @ApiOperation({ summary: 'Tableau des commissions du mois — par agent' })
  @ApiQuery({ name: 'mois', required: false, type: Number })
  @ApiQuery({ name: 'annee', required: false, type: Number })
  getTableauCommissions(
    @Req() req: any,
    @Query('mois') mois?: number,
    @Query('annee') annee?: number,
  ) {
    const now = new Date();
    return this.commissionsService.getTableauCommissions(
      req.user.tenantId,
      mois ? +mois : now.getMonth() + 1,
      annee ? +annee : now.getFullYear(),
    );
  }

  @Get('export-csv')
  @ApiOperation({ summary: 'Export CSV des commissions du mois pour paiement' })
  @ApiQuery({ name: 'mois', required: false, type: Number })
  @ApiQuery({ name: 'annee', required: false, type: Number })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exporterCsv(
    @Req() req: any,
    @Res() res: Response,
    @Query('mois') mois?: number,
    @Query('annee') annee?: number,
  ) {
    const now = new Date();
    const m = mois ? +mois : now.getMonth() + 1;
    const y = annee ? +annee : now.getFullYear();
    const csv = await this.commissionsService.exporterCommissions(
      req.user.tenantId,
      m,
      y,
    );
    res.setHeader('Content-Disposition', `attachment; filename="commissions-${y}-${String(m).padStart(2, '0')}.csv"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send('﻿' + csv); // BOM pour Excel
  }

  // ─── Volume paliers ───────────────────────────────────────────────────────────

  @Get('plans/:id')
  @ApiOperation({ summary: 'Détail d\'une grille tarifaire (avec paliers volume)' })
  @ApiParam({ name: 'id', description: 'ID de la grille' })
  getPlan(@Param('id') id: string, @Req() req: any) {
    return this.commissionsService.getPlan(id, req.user.tenantId);
  }

  @Post('plans/:id/volume-paliers')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Ajouter un palier volume à une grille' })
  @ApiParam({ name: 'id', description: 'ID de la grille' })
  addVolumePalier(
    @Param('id') id: string,
    @Body() dto: { volumeMin: number; volumeMax?: number; tauxAgent: number; tauxReseau?: number },
    @Req() req: any,
  ) {
    return this.commissionsService.addVolumePalier(id, req.user.tenantId, dto);
  }

  @Delete('plans/:id/volume-paliers/:palierId')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Supprimer un palier volume' })
  @ApiParam({ name: 'id', description: 'ID de la grille' })
  @ApiParam({ name: 'palierId', description: 'ID du palier' })
  deleteVolumePalier(
    @Param('id') id: string,
    @Param('palierId') palierId: string,
    @Req() req: any,
  ) {
    return this.commissionsService.deleteVolumePalier(palierId, id, req.user.tenantId);
  }

  // ─── Simulateur ───────────────────────────────────────────────────────────────

  @Post('plans/:id/simuler')
  @ApiOperation({ summary: 'Simuler la commission pour un volume mensuel donné' })
  @ApiParam({ name: 'id', description: 'ID de la grille' })
  async simulerCommission(
    @Param('id') id: string,
    @Body() dto: { volumeMensuel: number; montantTransaction: number },
    @Req() req: any,
  ) {
    const plan = await this.commissionsService.getPlan(id, req.user.tenantId);
    return this.commissionsService.simulerCommission(plan, dto.volumeMensuel, dto.montantTransaction);
  }
}
