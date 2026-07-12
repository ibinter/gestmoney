import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { OperatorCode } from './interfaces/operator-adapter.interface';

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // ─── Opérateurs configurés + statut ──────────────────────────────────────────

  @Get('operators')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des opérateurs configurés avec leur statut de circuit breaker' })
  @ApiResponse({ status: 200, description: 'Liste des opérateurs et leur état' })
  getOperators() {
    return this.integrationsService.getOperatorsStatus();
  }

  // ─── Synchroniser solde depuis API opérateur ──────────────────────────────────

  @Post('operators/:code/sync')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Synchroniser le solde float depuis l'API opérateur" })
  @ApiParam({ name: 'code', enum: ['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'MOCK'] })
  @ApiQuery({ name: 'agentId', required: true, description: "ID de l'agent" })
  @ApiResponse({ status: 200, description: 'Solde synchronisé' })
  @HttpCode(HttpStatus.OK)
  syncBalance(
    @Param('code') code: string,
    @Query('agentId') agentId: string,
    @Req() req: any,
  ) {
    return this.integrationsService.syncBalance(agentId, code as OperatorCode, req.user?.tenantId);
  }

  // ─── Tester connexion opérateur ───────────────────────────────────────────────

  @Post('operators/:code/test')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Tester la connexion à l'API d'un opérateur" })
  @ApiParam({ name: 'code', enum: ['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'MOCK'] })
  @ApiResponse({ status: 200, description: 'Résultat du test de connexion' })
  @HttpCode(HttpStatus.OK)
  testConnection(@Param('code') code: string) {
    return this.integrationsService.testConnection(code as OperatorCode);
  }

  // ─── Webhook entrant (public, vérifié par signature) ──────────────────────────

  @Post('webhooks/:operator')
  @ApiOperation({ summary: 'Endpoint de réception des webhooks opérateurs Mobile Money' })
  @ApiParam({ name: 'operator', enum: ['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY'] })
  @ApiResponse({ status: 200, description: 'Webhook traité' })
  @HttpCode(HttpStatus.OK)
  processWebhook(@Param('operator') operator: string, @Body() payload: any) {
    return this.integrationsService.processWebhook(operator as OperatorCode, payload);
  }

  // ─── Logs des appels API opérateurs ──────────────────────────────────────────

  @Get('logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logs des appels API vers les opérateurs' })
  @ApiQuery({ name: 'operator', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Logs paginés' })
  getLogs(
    @Req() req: any,
    @Query('operator') operator?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.integrationsService.getLogs(
      req.user?.tenantId,
      operator as OperatorCode | undefined,
      +page,
      +limit,
    );
  }

  // ─── Health de toutes les intégrations ───────────────────────────────────────

  @Get('health')
  @ApiOperation({ summary: 'Santé de toutes les intégrations opérateurs' })
  @ApiResponse({ status: 200, description: 'État de santé de chaque opérateur' })
  getHealth() {
    const statuses = this.integrationsService.getOperatorsStatus();
    const allHealthy = statuses.every((s) => s.circuitState === 'CLOSED');

    return {
      healthy: allHealthy,
      operators: statuses.map((s) => ({
        code: s.code,
        state: s.circuitState,
        enabled: s.enabled,
        failureCount: s.circuitStats.failureCount ?? 0,
        openedAt: s.circuitStats.openedAt ?? null,
      })),
      checkedAt: new Date(),
    };
  }
}
