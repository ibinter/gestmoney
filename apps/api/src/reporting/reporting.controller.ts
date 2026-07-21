import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ReportingService } from './reporting.service';
import { AuditService } from '../audit/audit.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ScheduleReportDto } from './dto/schedule-report.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { ReportFormat } from './interfaces/report.interface';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Journalise un EXPORT serveur (§27) sans jamais bloquer ni faire échouer le
   * téléchargement : fire-and-forget, toute erreur est avalée.
   */
  private tracerExport(
    user: CurrentUserData,
    req: Request,
    resource: string,
    details: any,
  ): void {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      typeof forwarded === 'string' && forwarded.length > 0
        ? forwarded.split(',')[0].trim()
        : req.ip;
    const userAgent =
      typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    void Promise.resolve(
      this.auditService.log('EXPORT', user.id, resource, details, user.tenantId, ip, userAgent),
    ).catch(() => undefined);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des rapports générés (historique)' })
  @ApiResponse({ status: 200, description: 'Liste des rapports' })
  listReports(@CurrentUser() user: CurrentUserData) {
    return this.reportingService.listReports(user.tenantId);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Générer un rapport (PDF, CSV, XLSX)' })
  @ApiResponse({ status: 201, description: 'Rapport généré' })
  async generateReport(
    @Body() dto: GenerateReportDto,
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.reportingService.generateReport(dto, user.tenantId, user.id);
    this.tracerExport(user, req, 'reports', {
      reportId: report.id,
      type: dto.type,
      format: dto.format,
    });

    if (dto.format === ReportFormat.PDF) {
      const pdfBuffer = this.reportingService.generatePDFReport(report);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-${report.id}.html"`);
      res.send(pdfBuffer);
      return;
    }

    if (dto.format === ReportFormat.CSV) {
      const headers = Object.keys(report.data);
      const csv = this.reportingService.exportToCSV([report.data], headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-${report.id}.csv"`);
      res.send(csv);
      return;
    }

    return report;
  }

  @Get('templates')
  @ApiOperation({ summary: 'Modèles de rapports disponibles' })
  getTemplates() {
    return this.reportingService.getTemplates();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Données dashboard (stats agrégées temps réel)' })
  async getDashboard(@CurrentUser() user: CurrentUserData) {
    return this.reportingService.getDashboardData(user.tenantId);
  }

  @Get('kpi')
  @ApiOperation({ summary: 'KPIs principaux (CA, croissance, top agents, etc.)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getKPIs(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.reportingService.getKPIs(user.tenantId, { start, end });
  }

  @Get('daily')
  @ApiOperation({ summary: 'Rapport journalier automatique' })
  @ApiQuery({ name: 'date', required: false, type: String })
  async getDailyReport(@CurrentUser() user: CurrentUserData, @Query('date') date?: string) {
    return this.reportingService.generateDailyReport(user.tenantId, date ? new Date(date) : new Date());
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Rapport mensuel' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getMonthlyReport(
    @CurrentUser() user: CurrentUserData,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const now = new Date();
    return this.reportingService.generateMonthlyReport(
      user.tenantId,
      month ?? now.getMonth() + 1,
      year ?? now.getFullYear(),
    );
  }

  @Get('agents-performance')
  @ApiOperation({ summary: 'Performance par agent' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getAgentsPerformance(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.reportingService.getAgentsPerformance(user.tenantId, { start, end });
  }

  @Get('operators-comparison')
  @ApiOperation({ summary: 'Comparaison opérateurs' })
  async getOperatorsComparison(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.reportingService.getOperatorsComparison(user.tenantId, { start, end });
  }

  @Get('float-usage')
  @ApiOperation({ summary: 'Utilisation float par période' })
  async getFloatUsage(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.reportingService.getFloatUsage(user.tenantId, { start, end });
  }

  @Get('commissions-summary')
  @ApiOperation({ summary: 'Résumé commissions' })
  async getCommissionsSummary(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.reportingService.getCommissionsSummary(user.tenantId, { start, end });
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Planifier un rapport récurrent' })
  @HttpCode(HttpStatus.CREATED)
  scheduleReport(@Body() dto: ScheduleReportDto, @CurrentUser() user: CurrentUserData) {
    return this.reportingService.scheduleReport(dto, user.tenantId);
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Liste des rapports planifiés' })
  listScheduled(@CurrentUser() user: CurrentUserData) {
    return this.reportingService.listScheduled(user.tenantId);
  }

  @Delete('schedule/:id')
  @ApiOperation({ summary: 'Supprimer une planification' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteScheduled(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    this.reportingService.deleteScheduled(id, user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Télécharger un rapport par ID' })
  async getReport(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = this.reportingService.getReportById(id, user.tenantId);
    this.tracerExport(user, req, 'reports', { reportId: id, format: 'PDF' });
    const pdfBuffer = this.reportingService.generatePDFReport(report);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="rapport-${id}.html"`);
    res.send(pdfBuffer);
  }
}
