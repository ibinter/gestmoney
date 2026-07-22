import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardData,
  GeneratedReport,
  KPIData,
  ReportFormat,
  ReportFrequency,
  ReportType,
  ScheduledReport,
} from './interfaces/report.interface';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ScheduleReportDto } from './dto/schedule-report.dto';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Persistance / mapping ────────────────────────────────────────────────────

  /** Construit un nom lisible pour le rapport persisté. */
  private buildReportName(type: ReportType, period: { start: Date; end: Date }): string {
    const s = period.start.toISOString().slice(0, 10);
    const e = period.end.toISOString().slice(0, 10);
    return `Rapport ${type} (${s} → ${e})`;
  }

  /**
   * Persiste un rapport généré dans la table `generated_reports` puis renvoie un
   * objet `GeneratedReport` (forme attendue par le contrôleur/front) qui combine
   * les métadonnées persistées (id, createdAt, status) avec les données calculées
   * (`data`, `period`) qui ne sont pas stockées en base.
   */
  private async persistGeneratedReport(params: {
    tenantId: string;
    type: ReportType;
    format: ReportFormat;
    period: { start: Date; end: Date };
    data: any;
    generatedBy: string | null;
    status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  }): Promise<GeneratedReport> {
    const record = await this.prisma.generatedReport.create({
      data: {
        tenantId: params.tenantId,
        name: this.buildReportName(params.type, params.period),
        reportType: params.type,
        format: params.format,
        status: params.status ?? 'COMPLETED',
        generatedBy: params.generatedBy ?? null,
        startDate: params.period.start,
        endDate: params.period.end,
      },
    });

    return {
      id: record.id,
      tenantId: record.tenantId,
      type: params.type,
      format: params.format,
      period: params.period,
      data: params.data,
      generatedAt: record.createdAt,
      generatedBy: record.generatedBy ?? 'system',
      status: record.status as GeneratedReport['status'],
    };
  }

  /** Mappe un enregistrement Prisma `generated_reports` vers l'interface locale. */
  private mapGeneratedRecord(record: {
    id: string;
    tenantId: string;
    reportType: string;
    format: string;
    fileUrl: string | null;
    status: string;
    generatedBy: string | null;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
  }): GeneratedReport {
    return {
      id: record.id,
      tenantId: record.tenantId,
      type: record.reportType as ReportType,
      format: record.format as ReportFormat,
      period: {
        start: record.startDate ?? record.createdAt,
        end: record.endDate ?? record.createdAt,
      },
      filePath: record.fileUrl ?? undefined,
      // `data` n'est pas persisté (le modèle ne stocke que les métadonnées).
      data: null,
      generatedAt: record.createdAt,
      generatedBy: record.generatedBy ?? 'system',
      status: record.status as GeneratedReport['status'],
    };
  }

  /** Mappe un enregistrement Prisma `scheduled_reports` vers l'interface locale. */
  private mapScheduledRecord(record: {
    id: string;
    tenantId: string;
    reportType: string;
    frequency: string;
    format: string;
    recipients: string[];
    isActive: boolean;
    lastRunAt: Date | null;
    nextRunAt: Date | null;
    createdAt: Date;
  }): ScheduledReport {
    return {
      id: record.id,
      tenantId: record.tenantId,
      reportType: record.reportType as ReportType,
      frequency: record.frequency as ReportFrequency,
      sendTo: record.recipients,
      format: record.format as ReportFormat,
      isActive: record.isActive,
      lastRun: record.lastRunAt ?? undefined,
      nextRun: record.nextRunAt ?? record.createdAt,
      createdAt: record.createdAt,
    };
  }

  // ─── Rapport journalier ───────────────────────────────────────────────────────

  async generateDailyReport(
    tenantId: string,
    date: Date = new Date(),
    generatedBy: string = 'system',
    format: ReportFormat = ReportFormat.PDF,
  ): Promise<GeneratedReport> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const [txStats, commissions] = await Promise.all([
      this.buildTransactionStats(tenantId, start, end),
      this.buildCommissionStats(tenantId, start, end),
    ]);

    const reportData = {
      date: date.toISOString().slice(0, 10),
      transactions: txStats,
      commissions,
    };

    const report = await this.persistGeneratedReport({
      tenantId,
      type: ReportType.DAILY,
      format,
      period: { start, end },
      data: reportData,
      generatedBy,
    });

    this.logger.log(`Rapport journalier généré pour tenant ${tenantId}`);
    return report;
  }

  // ─── Rapport mensuel ──────────────────────────────────────────────────────────

  async generateMonthlyReport(
    tenantId: string,
    month: number,
    year: number,
    generatedBy: string = 'system',
    format: ReportFormat = ReportFormat.PDF,
  ): Promise<GeneratedReport> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const [txStats, commissions, topAgents] = await Promise.all([
      this.buildTransactionStats(tenantId, start, end),
      this.buildCommissionStats(tenantId, start, end),
      this.buildTopAgents(tenantId, start, end),
    ]);

    const reportData = { month, year, transactions: txStats, commissions, topAgents };

    return this.persistGeneratedReport({
      tenantId,
      type: ReportType.MONTHLY,
      format,
      period: { start, end },
      data: reportData,
      generatedBy,
    });
  }

  // ─── Rapport performance agent ────────────────────────────────────────────────

  async generateAgentPerformanceReport(
    agentId: string,
    period: { start: Date; end: Date },
    tenantId: string,
    generatedBy: string = 'system',
    format: ReportFormat = ReportFormat.PDF,
  ): Promise<GeneratedReport> {
    const where = {
      tenantId,
      agentId,
      createdAt: { gte: period.start, lte: period.end },
    };

    const [total, aggregate, byType] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true, commission: true, fee: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    const reportData = {
      agentId,
      period,
      totalTransactions: total,
      montantTotal: Number(aggregate._sum.amount ?? 0),
      commissionsTotal: Number(aggregate._sum.commission ?? 0),
      fraisTotal: Number(aggregate._sum.fee ?? 0),
      byType: byType.map((r) => ({
        type: r.type,
        count: r._count.id,
        montant: Number(r._sum.amount ?? 0),
      })),
    };

    return this.persistGeneratedReport({
      tenantId,
      type: ReportType.AGENT_PERFORMANCE,
      format,
      period,
      data: reportData,
      generatedBy,
    });
  }

  // ─── Dashboard data ───────────────────────────────────────────────────────────

  async getDashboardData(tenantId: string): Promise<DashboardData> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [kpis, txToday, topAgents] = await Promise.all([
      this.getKPIs(tenantId, { start: todayStart, end: now }),
      this.buildTransactionStats(tenantId, todayStart, now),
      this.buildTopAgents(tenantId, weekAgo, now),
    ]);

    const evolutionSemaine = await this.buildWeeklyEvolution(tenantId, weekAgo, now);

    return {
      kpis,
      transactionsAujourdhui: {
        total: txToday.total,
        montant: txToday.montantTotal,
        parType: txToday.byType,
        parOperateur: txToday.byOperateur,
      },
      evolutionSemaine,
      topAgents,
      alertes: [],
    };
  }

  // ─── KPIs ─────────────────────────────────────────────────────────────────────

  async getKPIs(tenantId: string, period: { start: Date; end: Date }): Promise<KPIData> {
    const where = { tenantId, createdAt: { gte: period.start, lte: period.end } };

    const prevStart = new Date(period.start);
    const prevEnd = new Date(period.end);
    const duration = period.end.getTime() - period.start.getTime();
    prevStart.setTime(prevStart.getTime() - duration);
    prevEnd.setTime(prevEnd.getTime() - duration);

    const [total, aggregate, prevAggregate, topAgentsRaw, successCount] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true, commission: true },
      }),
      this.prisma.transaction.aggregate({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['agentId'],
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 1,
      }),
      this.prisma.transaction.count({ where: { ...where, status: 'COMPLETED' } }),
    ]);

    const ca = Number(aggregate._sum.amount ?? 0);
    const prevCa = Number(prevAggregate._sum.amount ?? 0);
    const croissance = prevCa > 0 ? ((ca - prevCa) / prevCa) * 100 : 0;
    const tauxSucces = total > 0 ? (successCount / total) * 100 : 0;

    let topAgent: KPIData['topAgent'] = null;
    if (topAgentsRaw.length > 0) {
      topAgent = {
        agentId: topAgentsRaw[0].agentId,
        nom: '',
        montant: Number(topAgentsRaw[0]._sum.amount ?? 0),
      };
    }

    return {
      chiffreAffaires: ca,
      croissance: Math.round(croissance * 100) / 100,
      topAgent,
      tauxSucces: Math.round(tauxSucces * 100) / 100,
      totalTransactions: total,
      totalCommissions: Number(aggregate._sum.commission ?? 0),
      nouveauxClients: 0,
      agentsActifs: 0,
    };
  }

  // ─── Génération selon DTO ─────────────────────────────────────────────────────

  async generateReport(dto: GenerateReportDto, tenantId: string, userId: string): Promise<GeneratedReport> {
    const start = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 30 * 86400000);
    const end = dto.endDate ? new Date(dto.endDate) : new Date();

    switch (dto.type) {
      case ReportType.DAILY:
        return this.generateDailyReport(tenantId, start, userId, dto.format);
      case ReportType.MONTHLY:
        return this.generateMonthlyReport(
          tenantId,
          start.getMonth() + 1,
          start.getFullYear(),
          userId,
          dto.format,
        );
      case ReportType.AGENT_PERFORMANCE:
        if (!dto.agentId) throw new Error('agentId requis pour ce type de rapport');
        return this.generateAgentPerformanceReport(dto.agentId, { start, end }, tenantId, userId, dto.format);
      default:
        return this.generateCustomReport(tenantId, start, end, dto.type, userId, dto.format);
    }
  }

  private async generateCustomReport(
    tenantId: string,
    start: Date,
    end: Date,
    type: ReportType,
    userId: string,
    format: ReportFormat = ReportFormat.PDF,
  ): Promise<GeneratedReport> {
    const data = await this.buildTransactionStats(tenantId, start, end);
    return this.persistGeneratedReport({
      tenantId,
      type,
      format,
      period: { start, end },
      data,
      generatedBy: userId,
    });
  }

  // ─── Liste et récupération ────────────────────────────────────────────────────

  async listReports(tenantId: string): Promise<GeneratedReport[]> {
    const records = await this.prisma.generatedReport.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.mapGeneratedRecord(r));
  }

  async getReportById(id: string, tenantId: string): Promise<GeneratedReport> {
    const record = await this.prisma.generatedReport.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException(`Rapport ${id} introuvable`);
    return this.mapGeneratedRecord(record);
  }

  getTemplates() {
    return [
      { id: 'daily', name: 'Rapport journalier', type: ReportType.DAILY },
      { id: 'monthly', name: 'Rapport mensuel', type: ReportType.MONTHLY },
      { id: 'agent', name: 'Performance agent', type: ReportType.AGENT_PERFORMANCE },
      { id: 'operators', name: 'Comparaison opérateurs', type: ReportType.OPERATOR_COMPARISON },
      { id: 'float', name: 'Utilisation float', type: ReportType.FLOAT_USAGE },
      { id: 'commissions', name: 'Résumé commissions', type: ReportType.COMMISSIONS },
    ];
  }

  // ─── Planification ────────────────────────────────────────────────────────────

  async scheduleReport(dto: ScheduleReportDto, tenantId: string): Promise<ScheduledReport> {
    const nextRun = this.computeNextRun(dto.frequency);
    const record = await this.prisma.scheduledReport.create({
      data: {
        tenantId,
        name: `Planification ${dto.reportType} (${dto.frequency})`,
        reportType: dto.reportType,
        frequency: dto.frequency,
        format: dto.format,
        recipients: dto.sendTo,
        isActive: true,
        nextRunAt: nextRun,
      },
    });
    return this.mapScheduledRecord(record);
  }

  async listScheduled(tenantId: string): Promise<ScheduledReport[]> {
    const records = await this.prisma.scheduledReport.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((s) => this.mapScheduledRecord(s));
  }

  async deleteScheduled(id: string, tenantId: string): Promise<void> {
    const record = await this.prisma.scheduledReport.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException(`Planification ${id} introuvable`);
    await this.prisma.scheduledReport.delete({ where: { id: record.id } });
  }

  // ─── Export CSV ───────────────────────────────────────────────────────────────

  exportToCSV(data: Record<string, any>[], headers: string[]): string {
    const headerRow = headers.join(',');
    const rows = data.map((row) =>
      headers.map((h) => {
        const val = row[h] ?? '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(','),
    );
    return [headerRow, ...rows].join('\n');
  }

  // ─── Export PDF simple (HTML-based string) ────────────────────────────────────

  generatePDFReport(reportData: GeneratedReport): Buffer {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Rapport GESTMONEY</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
  h1 { color: #1a5276; border-bottom: 2px solid #1a5276; padding-bottom: 10px; }
  h2 { color: #2874a6; margin-top: 30px; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th { background: #1a5276; color: white; padding: 8px 12px; text-align: left; }
  td { padding: 8px 12px; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) { background: #f2f2f2; }
  .meta { color: #666; font-size: 13px; margin-bottom: 20px; }
  .kpi { display: inline-block; background: #eaf2ff; border-radius: 6px; padding: 15px 25px; margin: 8px; text-align: center; }
  .kpi .value { font-size: 24px; font-weight: bold; color: #1a5276; }
  .kpi .label { font-size: 12px; color: #666; }
</style>
</head>
<body>
  <h1>Rapport GESTMONEY — ${reportData.type}</h1>
  <p class="meta">
    Généré le : ${reportData.generatedAt.toLocaleString('fr-FR')}<br/>
    Période : ${reportData.period.start.toLocaleDateString('fr-FR')} → ${reportData.period.end.toLocaleDateString('fr-FR')}
  </p>
  <pre>${JSON.stringify(reportData.data, null, 2)}</pre>
</body>
</html>`;
    return Buffer.from(html, 'utf-8');
  }

  // ─── Rapports spécifiques ─────────────────────────────────────────────────────

  async getAgentsPerformance(tenantId: string, period: { start: Date; end: Date }) {
    const data = await this.prisma.transaction.groupBy({
      by: ['agentId'],
      where: { tenantId, status: 'COMPLETED', createdAt: { gte: period.start, lte: period.end } },
      _count: { id: true },
      _sum: { amount: true, commission: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 50,
    });
    return data.map((r) => ({
      agentId: r.agentId,
      transactions: r._count.id,
      montant: Number(r._sum.amount ?? 0),
      commissions: Number(r._sum.commission ?? 0),
    }));
  }

  async getOperatorsComparison(tenantId: string, period: { start: Date; end: Date }) {
    return this.prisma.transaction.groupBy({
      by: ['operatorCode'],
      where: { tenantId, createdAt: { gte: period.start, lte: period.end } },
      _count: { id: true },
      _sum: { amount: true, commission: true },
    });
  }

  async getFloatUsage(tenantId: string, period: { start: Date; end: Date }) {
    return this.prisma.floatAccount.findMany({
      where: { tenantId },
      select: { agentId: true, networkId: true, balance: true, updatedAt: true },
    });
  }

  async getCommissionsSummary(tenantId: string, period: { start: Date; end: Date }) {
    return this.prisma.transaction.groupBy({
      by: ['operatorCode', 'type'],
      where: {
        tenantId,
        status: 'COMPLETED',
        createdAt: { gte: period.start, lte: period.end },
      },
      _sum: { commission: true },
      _count: { id: true },
    });
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────────

  private async buildTransactionStats(tenantId: string, start: Date, end: Date) {
    const where = { tenantId, createdAt: { gte: start, lte: end } };

    const [total, aggregate, byType, byOperateur, byStatus] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true, commission: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['operatorCode'],
        where,
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      total,
      montantTotal: Number(aggregate._sum.amount ?? 0),
      commissionsTotal: Number(aggregate._sum.commission ?? 0),
      byType: Object.fromEntries(
        byType.map((r) => [r.type, { count: r._count.id, montant: Number(r._sum.amount ?? 0) }]),
      ),
      byOperateur: Object.fromEntries(
        byOperateur.map((r) => [r.operatorCode, { count: r._count.id, montant: Number(r._sum.amount ?? 0) }]),
      ),
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count.id])),
    };
  }

  private async buildCommissionStats(tenantId: string, start: Date, end: Date) {
    return this.prisma.transaction.aggregate({
      where: { tenantId, status: 'COMPLETED', createdAt: { gte: start, lte: end } },
      _sum: { commission: true },
    });
  }

  private async buildTopAgents(tenantId: string, start: Date, end: Date) {
    const data = await this.prisma.transaction.groupBy({
      by: ['agentId'],
      where: { tenantId, status: 'COMPLETED', createdAt: { gte: start, lte: end } },
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });
    return data.map((r) => ({ agentId: r.agentId, count: r._count.id, montant: Number(r._sum.amount ?? 0) }));
  }

  private async buildWeeklyEvolution(tenantId: string, start: Date, end: Date) {
    const days: Array<{ date: string; montant: number; count: number }> = [];
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);

    while (cur <= end) {
      const dayStart = new Date(cur);
      const dayEnd = new Date(cur);
      dayEnd.setHours(23, 59, 59, 999);

      const agg = await this.prisma.transaction.aggregate({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: dayStart, lte: dayEnd } },
        _sum: { amount: true },
        _count: { _all: true },
      });

      days.push({
        date: cur.toISOString().slice(0, 10),
        montant: Number(agg._sum.amount ?? 0),
        count: agg._count._all,
      });

      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }

  private computeNextRun(frequency: ReportFrequency): Date {
    const next = new Date();
    switch (frequency) {
      case ReportFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        next.setHours(7, 0, 0, 0);
        break;
      case ReportFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        next.setHours(7, 0, 0, 0);
        break;
      case ReportFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(7, 0, 0, 0);
        break;
    }
    return next;
  }
}
