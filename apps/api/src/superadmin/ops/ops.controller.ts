import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OpsService } from './ops.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/enums/role.enum';

/**
 * Console SuperAdmin — consultation (lecture seule) des opérations de la
 * plateforme : Paiements, Licences, Analytics. Toutes les routes sont
 * réservées au SUPER_ADMIN. Aucune action mutante ici (la validation des
 * paiements vit dans payments-admin).
 */
@ApiTags('SuperAdmin Ops')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN)
@Controller('superadmin/ops')
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  // ─── EXPORT CLIENTS / UTILISATEURS ─────────────────────────────────────────

  @Get('clients/export')
  @ApiOperation({
    summary:
      'Exporte toute la base clients/utilisateurs en CSV (tous statuts). ' +
      'Paramètre `statut` optionnel pour restreindre à un statut. SUPER_ADMIN uniquement.',
  })
  @ApiQuery({
    name: 'statut',
    required: false,
    type: String,
    description:
      'Filtre optionnel : DEMO, ESSAI, ACTIVE, DECOUVERTE, EXPIREE, SUSPENDUE, ' +
      'PROVISOIRE, GRACE, EN_ATTENTE_PAIEMENT, REVOQUEE, ou statut de compte ' +
      '(ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION). Absent = tous.',
  })
  async exporterClients(@Res() res: Response, @Query('statut') statut?: string) {
    const csv = await this.opsService.exporterClientsCsv(statut);
    const suffixe = statut?.trim() ? `-${statut.trim().toLowerCase()}` : '-tous';
    const jour = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="clients-gestmoney${suffixe}-${jour}.csv"`,
    );
    // BOM UTF-8 : Excel ouvre alors le fichier avec les accents corrects.
    res.send('﻿' + csv);
  }

  // ─── PAIEMENTS ────────────────────────────────────────────────────────────

  @Get('paiements')
  @ApiOperation({ summary: 'Liste globale des paiements de la plateforme (lecture seule)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'statut', required: false, type: String })
  @ApiQuery({ name: 'provider', required: false, type: String })
  @ApiQuery({ name: 'dateDebut', required: false, type: String })
  @ApiQuery({ name: 'dateFin', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  listerPaiements(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('statut') statut?: string,
    @Query('provider') provider?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Query('search') search?: string,
  ) {
    return this.opsService.listerPaiements({
      page,
      limit,
      statut,
      provider,
      dateDebut,
      dateFin,
      search,
    });
  }

  @Get('paiements/stats')
  @ApiOperation({ summary: 'Agrégats des paiements : encaissé, en attente, par statut/provider' })
  statsPaiements() {
    return this.opsService.statsPaiements();
  }

  // ─── LICENCES ─────────────────────────────────────────────────────────────

  @Get('licences')
  @ApiOperation({ summary: 'Abonnements par établissement (dérivés de Tenant + LicenceEvent)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'statut', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  listerLicences(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('statut') statut?: string,
    @Query('search') search?: string,
  ) {
    return this.opsService.listerLicences({ page, limit, statut, search });
  }

  @Get('licences/stats')
  @ApiOperation({ summary: 'KPIs licences : répartition par statut et par plan' })
  statsLicences() {
    return this.opsService.statsLicences();
  }

  @Get('licences/historique')
  @ApiOperation({ summary: 'Historique paginé des événements de licence' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  historiqueLicences(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tenantId') tenantId?: string,
    @Query('type') type?: string,
  ) {
    return this.opsService.historiqueLicences({ page, limit, tenantId, type });
  }

  // ─── ANALYTICS ────────────────────────────────────────────────────────────

  @Get('analytics')
  @ApiOperation({ summary: 'Agrégats réels de la plateforme sur une période' })
  @ApiQuery({ name: 'dateDebut', required: false, type: String })
  @ApiQuery({ name: 'dateFin', required: false, type: String })
  analytics(
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.opsService.analytics({ dateDebut, dateFin });
  }

  // ─── SEED DÉMO ────────────────────────────────────────────────────────────

  @Post('seed-demo')
  @ApiOperation({
    summary: 'Créer le tenant de démonstration (SUPER_ADMIN uniquement)',
    description:
      'Idempotent. Crée un tenant slug=demo-client avec 3 agences, 8 agents, ' +
      '50 clients, 200 transactions sur 30 jours, 15 écritures comptables, ' +
      '3 tickets support et une licence PROFESSIONAL (25 jours). ' +
      'Connexion : demo@gestmoney.ibigsoft.com / Demo@2026',
  })
  seedDemo() {
    return this.opsService.seedDemo();
  }
}
