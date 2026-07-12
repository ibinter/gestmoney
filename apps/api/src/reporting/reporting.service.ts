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
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  // Stockage en mémoire (à remplacer par Prisma si modèles ajoutés)
  private readonly reports: GeneratedReport[] = [];
  private readonly scheduledReports: ScheduledReport[] = [];

  constructor(private readonly prisma: PrismaService) {}

  // ─── Rapport journalier ───────────────────────────────────────────────────────

  async generateDailyReport(tenantId: string, date: Date = new Date()): Promise<GeneratedReport> {
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

    const report: GeneratedReport = {
      id: uuidv4(),
      tenantId,
      type: ReportType.DAILY,
      format: ReportFormat.PDF,
      period: { start, end },
      data: reportData,
      generatedAt: new Date(),
      generatedBy: 'system',
      status: 'COMPLETED',
    };

    this.reports.push(report);
    this.logger.log(`Rapport journalier généré pour tenant ${tenantId}`);
    return report;
  }

  // ─── Rapport mensuel ──────────────────────────────────────────────────────────

  async generateMonthlyReport(tenantId: string, month: number, year: number): Promise<GeneratedReport> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const [txStats, commissions, topAgents] = await Promise.all([
      this.buildTransactionStats(tenantId, start, end),
      this.buildCommissionStats(tenantId, start, end),
      this.buildTopAgents(tenantId, start, end),
    ]);

    const reportData = { month, year, transactions: txStats, commissions, topAgents };

    const report: GeneratedReport = {
      id: uuidv4(),
      tenantId,
      type: ReportType.MONTHLY,
      format: ReportFormat.PDF,
      period: { start, end },
      data: reportData,
      generatedAt: new Date(),
      generatedBy: 'system',
      status: 'COMPLETED',
    };

    this.reports.push(report);
    return report;
  }

  // ─── Rapport performance agent ────────────────────────────────────────────────

  async generateAgentPerformanceReport(
    agentId: string,
    period: { start: Date; end: Date },
    tenantId: string,
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
        _sum: { montant: true, commission: true, frais: true },
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
      montantTotal: aggregate._sum.amount ?? 0,
      commissionsTotal: aggregate._sum.commission ?? 0,
      fraisTotal: aggregate._sum.frais ?? 0,
      byType: byType.map((r) => ({
        type: r.type,
        count: r._count.id,
        montant: r._sum.amount ?? 0,
      })),
    };

    const report: GeneratedReport = {
      id: uuidv4(),
      tenantId,
      type: ReportType.AGENT_PERFORMANCE,
      format: ReportFormat.PDF,
      period,
      data: reportData,
      generatedAt: new Date(),
      generatedBy: 'system',
      status: 'COMPLETED',
    };

    this.reports.push(report);
    return report;
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

    const ca = aggregate._sum.amount ?? 0;
    const prevCa = prevAggregate._sum.amount ?? 0;
    const croissance = prevCa > 0 ? ((ca - prevCa) / prevCa) * 100 : 0;
    const tauxSucces = total > 0 ? (successCount / total) * 100 : 0;

    let topAgent: KPIData['topAgent'] = null;
    if (topAgentsRaw.length > 0) {
      topAgent = {
        agentId: topAgentsRaw[0].agentId,
        nom: '',
        montant: topAgentsRaw[0]._sum.amount ?? 0,
      };
    }

    return {
      chiffreAffaires: ca,
      croissance: Math.round(croissance * 100) / 100,
      topAgent,
      tauxSucces: Math.round(tauxSucces * 100) / 100,
      totalTransactions: total,
      totalCommissions: aggregate._sum.commission ?? 0,
      nouveauxClients: 0,
      agentsActifs: 0,
    };
  }

  // ─── Génération selon DTO ─────────────────────────────────────────────────────

  async generateReport(dto: GenerateReportDto, tenantId: string, userId: string): Promise<GeneratedReport> {
    const start = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 30 * 86400000);
    const end = dto.endDate ? new Date(dto.endDate) : new Date();

    let report: GeneratedReport;

    switch (dto.type) {
      case ReportType.DAILY:
        report = await this.generateDailyReport(tenantId, start);
        break;
      case ReportType.MONTHLY:
        report = await this.generateMonthlyReport(tenantId, start.getMonth() + 1, start.getFullYear());
        break;
      case ReportType.AGENT_PERFORMANCE:
        if (!dto.agentId) throw new Error('agentId requis pour ce type de rapport');
        report = await this.generateAgentPerformanceReport(dto.agentId, { start, end }, tenantId);
        break;
      default:
        report = await this.generateCustomReport(tenantId, start, end, dto.type, userId);
    }

    report.format = dto.format;
    report.generatedBy = userId;
    return report;
  }

  private async generateCustomReport(
    tenantId: string,
    start: Date,
    end: Date,
    type: ReportType,
    userId: string,
  ): Promise<GeneratedReport> {
    const data = await this.buildTransactionStats(tenantId, start, end);
    const report: GeneratedReport = {
      id: uuidv4(),
      tenantId,
      type,
      format: ReportFormat.PDF,
      period: { start, end },
      data,
      generatedAt: new Date(),
      generatedBy: userId,
      status: 'COMPLETED',
    };
    this.reports.push(report);
    return report;
  }

  // ─── Liste et récupération ────────────────────────────────────────────────────

  listReports(tenantId: string): GeneratedReport[] {
    return this.reports.filter((r) => r.tenantId === tenantId);
  }

  getReportById(id: string, tenantId: string): GeneratedReport {
    const report = this.reports.find((r) => r.id === id && r.tenantId === tenantId);
    if (!report) throw new NotFoundException(`Rapport ${id} introuvable`);
    return report;
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

  scheduleReport(dto: ScheduleReportDto, tenantId: string): ScheduledReport {
    const nextRun = this.computeNextRun(dto.frequency);
    const scheduled: ScheduledReport = {
      id: uuidv4(),
      tenantId,
      reportType: dto.reportType,
      frequency: dto.frequency,
      sendTo: dto.sendTo,
      format: dto.format,
      isActive: true,
      nextRun,
      createdAt: new Date(),
    };
    this.scheduledReports.push(scheduled);
    return scheduled;
  }

  listScheduled(tenantId: string): ScheduledReport[] {
    return this.scheduledReports.filter((s) => s.tenantId === tenantId);
  }

  deleteScheduled(id: string, tenantId: string): void {
    const idx = this.scheduledReports.findIndex((s) => s.id === id && s.tenantId === tenantId);
    if (idx === -1) throw new NotFoundException(`Planification ${id} introuvable`);
    this.scheduledReports.splice(idx, 1);
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
      montant: r._sum.amount ?? 0,
      commissions: r._sum.commission ?? 0,
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
      select: { agentId: true, operateur: true, solde: true, updatedAt: true },
    });
  }

  async getCommissionsSummary(tenantId: string, period: { start: Date; end: Date }) {
    return this.prisma.transaction.groupBy({
      by: ['operateur', 'type'],
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
      montantTotal: aggregate._sum.amount ?? 0,
      commissionsTotal: aggregate._sum.commission ?? 0,
      byType: Object.fromEntries(
        byType.map((r) => [r.type, { count: r._count.id, montant: r._sum.amount ?? 0 }]),
      ),
      byOperateur: Object.fromEntries(
        byOperateur.map((r) => [r.operatorCode, { count: r._count.id, montant: r._sum.amount ?? 0 }]),
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
    return data.map((r) => ({ agentId: r.agentId, count: r._count.id, montant: r._sum.amount ?? 0 }));
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
        montant: agg._sum.amount ?? 0,
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
