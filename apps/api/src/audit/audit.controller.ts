import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Journal d\'audit complet avec filtres' })
  getLogs(@Query() query: QueryAuditDto, @CurrentUser() user: CurrentUserData) {
    return this.auditService.getFilteredLogs(query, user.tenantId);
  }

  @Get('logs/user/:userId')
  @ApiOperation({ summary: 'Actions d\'un utilisateur spécifique' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getByUser(
    @Param('userId') userId: string,
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getByUser(userId, user.tenantId, page, limit);
  }

  @Get('security')
  @ApiOperation({ summary: 'Événements sécurité (connexions, tentatives, 2FA)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getSecurityEvents(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 86400000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.auditService.getSecurityEvents(user.tenantId, { start, end });
  }

  @Get('financial')
  @ApiOperation({ summary: 'Mouvements financiers audités' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFinancial(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getFinancialAudit(user.tenantId, page, limit);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export du journal d\'audit (PDF/CSV)' })
  @ApiQuery({ name: 'format', enum: ['CSV', 'PDF'], required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportLogs(
    @CurrentUser() user: CurrentUserData,
    @Res() res: Response,
    @Req() req: Request,
    @Query('format') format: 'CSV' | 'PDF' = 'CSV',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400000);
    const end = endDate ? new Date(endDate) : new Date();

    const buffer = await this.auditService.exportAuditLog(user.tenantId, { start, end }, format);

    // Traçabilité (§27) : télécharger le journal d'audit est une action sensible.
    // Route GET → non captée par l'AuditInterceptor, on la journalise ici.
    // Fire-and-forget : ne bloque ni ne fait échouer le téléchargement.
    void Promise.resolve(
      this.auditService.log(
        'EXPORT',
        user.id,
        'audit',
        { format, start, end },
        user.tenantId,
        this.ipDe(req),
        typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
      ),
    ).catch(() => undefined);

    if (format === 'CSV') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
    } else {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-log.html"');
    }
    res.send(buffer);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques audit (nb actions par type, par utilisateur)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getStats(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.auditService.getStats(user.tenantId, { start, end });
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Alertes audit (actions suspectes)' })
  getAlerts(@CurrentUser() user: CurrentUserData) {
    return this.auditService.getAlerts(user.tenantId);
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Détail d\'une entrée du journal d\'audit' })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.auditService.findById(id, user.tenantId);
  }

  /** IP réelle : `x-forwarded-for` (premier maillon) en priorité, sinon `req.ip`. */
  private ipDe(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? undefined;
  }
}
