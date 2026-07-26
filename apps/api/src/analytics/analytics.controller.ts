import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { AnalyticsService } from './analytics.service';
import { PdfService } from '../pdf/pdf.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly pdfService: PdfService,
  ) {}

  @Get('rapport-mensuel')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Télécharger le rapport mensuel PDF' })
  @ApiQuery({ name: 'annee', required: false, type: Number, description: 'Année (défaut: année courante)' })
  @ApiQuery({ name: 'mois', required: false, type: Number, description: 'Mois 1-12 (défaut: mois courant)' })
  @ApiResponse({ status: 200, description: 'Rapport mensuel HTML/PDF' })
  async rapportMensuelPdf(
    @Req() req: any,
    @Res() res: Response,
    @Query('annee') anneeStr?: string,
    @Query('mois') moisStr?: string,
  ) {
    const now = new Date();
    const annee = anneeStr ? parseInt(anneeStr, 10) : now.getFullYear();
    const mois = moisStr ? parseInt(moisStr, 10) : now.getMonth() + 1;
    const tenantId: string = req.user.tenantId;
    const pdfBuffer = await this.pdfService.genererRapportMensuel(tenantId, annee, mois);
    const filename = `rapport-mensuel-${annee}-${String(mois).padStart(2, '0')}.html`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }

  @Get('dashboard')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.NETWORK_ADMIN,
    RoleType.AGENCY_MANAGER,
    RoleType.AGENT,
    RoleType.AUDITOR,
  )
  @ApiOperation({ summary: 'Données analytiques pour le dashboard (30 derniers jours)' })
  @ApiResponse({ status: 200, description: 'Transactions par jour, par type, top agents, float' })
  getDashboard(@Req() req: any) {
    return this.analyticsService.getDashboardAnalytics(req.user.tenantId);
  }

  @Get('comparaison')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Comparaison mois M vs M-1' })
  @ApiQuery({ name: 'mois', required: false, type: Number })
  @ApiQuery({ name: 'annee', required: false, type: Number })
  getComparaison(
    @Req() req: any,
    @Query('mois') moisStr?: string,
    @Query('annee') anneeStr?: string,
  ) {
    const now = new Date();
    const mois = moisStr ? parseInt(moisStr, 10) : now.getMonth() + 1;
    const annee = anneeStr ? parseInt(anneeStr, 10) : now.getFullYear();
    return this.analyticsService.getComparaisonMoisPrecedent(req.user.tenantId, mois, annee);
  }

  @Get('evolution-6-mois')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Évolution sur 6 mois glissants' })
  getEvolution6Mois(@Req() req: any) {
    return this.analyticsService.getEvolution6Mois(req.user.tenantId);
  }

  @Get('par-operateur')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Répartition par opérateur' })
  @ApiQuery({ name: 'mois', required: false, type: Number })
  @ApiQuery({ name: 'annee', required: false, type: Number })
  getParOperateur(
    @Req() req: any,
    @Query('mois') moisStr?: string,
    @Query('annee') anneeStr?: string,
  ) {
    const now = new Date();
    const mois = moisStr ? parseInt(moisStr, 10) : now.getMonth() + 1;
    const annee = anneeStr ? parseInt(anneeStr, 10) : now.getFullYear();
    return this.analyticsService.getAnalyseParOperateur(req.user.tenantId, mois, annee);
  }

  @Get('performance-agences')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Classement des agences' })
  @ApiQuery({ name: 'mois', required: false, type: Number })
  @ApiQuery({ name: 'annee', required: false, type: Number })
  getPerformanceAgences(
    @Req() req: any,
    @Query('mois') moisStr?: string,
    @Query('annee') anneeStr?: string,
  ) {
    const now = new Date();
    const mois = moisStr ? parseInt(moisStr, 10) : now.getMonth() + 1;
    const annee = anneeStr ? parseInt(anneeStr, 10) : now.getFullYear();
    return this.analyticsService.getPerformanceAgences(req.user.tenantId, mois, annee);
  }
}
