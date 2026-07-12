import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from './gateway.service';

/**
 * DashboardStatsScheduler
 * Calcule et diffuse les statistiques dashboard toutes les 30 secondes
 * à tous les clients abonnés, par tenant.
 */
@Injectable()
export class DashboardStatsScheduler {
  private readonly logger = new Logger(DashboardStatsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayService: GatewayService,
  ) {}

  @Cron('*/30 * * * * *') // Toutes les 30 secondes
  async broadcastDashboardStats(): Promise<void> {
    try {
      // Récupérer tous les tenants actifs
      const tenants = await this.prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      // Calculer et émettre les stats pour chaque tenant en parallèle
      await Promise.allSettled(
        tenants.map((tenant) => this.computeAndEmitStats(tenant.id)),
      );
    } catch (err) {
      this.logger.error('Erreur lors du broadcast des stats dashboard', err);
    }
  }

  private async computeAndEmitStats(tenantId: string): Promise<void> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    try {
      const [
        transactionsTodayCount,
        transactionsTodayAmount,
        floatEntries,
        agentsOnlineCount,
        pendingTransactionsCount,
      ] = await Promise.all([
        // Nombre de transactions du jour
        this.prisma.transaction.count({
          where: {
            tenantId,
            createdAt: { gte: startOfDay },
          },
        }),

        // Montant total des transactions du jour
        this.prisma.transaction.aggregate({
          where: {
            tenantId,
            createdAt: { gte: startOfDay },
            status: 'COMPLETED',
          },
          _sum: { amount: true },
        }),

        // Float total par opérateur
        this.prisma.floatAccount.findMany({
          where: { tenantId },
          select: {
            operatorCode: true,
            balance: true,
            currency: true,
          },
        }),

        // Agents actifs (connectés dans les 5 dernières minutes)
        this.prisma.agent.count({
          where: {
            tenantId,
            isActive: true,
            lastActivityAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000),
            },
          },
        }).catch(() => 0), // Champ optionnel, ne pas bloquer

        // Transactions en attente
        this.prisma.transaction.count({
          where: {
            tenantId,
            status: 'PENDING',
          },
        }),
      ]);

      const floatTotal = floatEntries.reduce(
        (sum, f) => sum + (f.balance?.toNumber?.() ?? Number(f.balance) ?? 0),
        0,
      );

      const stats = {
        tenantId,
        period: 'today',
        transactions: {
          count: transactionsTodayCount,
          totalAmount: transactionsTodayAmount._sum.amount?.toNumber?.() ?? 0,
          pending: pendingTransactionsCount,
        },
        float: {
          totalBalance: floatTotal,
          byOperator: floatEntries.map((f) => ({
            operator: f.operatorCode,
            balance: f.balance?.toNumber?.() ?? Number(f.balance) ?? 0,
            currency: f.currency,
          })),
        },
        agents: {
          online: agentsOnlineCount,
        },
        generatedAt: now.toISOString(),
      };

      this.gatewayService.emitDashboardStats(tenantId, stats);
    } catch (err) {
      this.logger.warn(
        `Impossible de calculer les stats pour tenant ${tenantId}: ${err.message}`,
      );
    }
  }
}
