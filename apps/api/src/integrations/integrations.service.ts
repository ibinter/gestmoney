import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import {
  IOperatorAdapter,
  OperatorCode,
  CashInParams,
  CashOutParams,
  OperatorBalance,
  OperatorTransaction,
} from './interfaces/operator-adapter.interface';
import { CircuitBreaker, CircuitBreakerState } from './utils/circuit-breaker.util';
import { executeWithRetry } from './utils/retry.util';
import { loadOperatorsConfig } from './config/operators.config';
import { OrangeMoneyAdapter } from './adapters/orange-money.adapter';
import { MtnMomoAdapter } from './adapters/mtn-momo.adapter';
import { WaveAdapter } from './adapters/wave.adapter';
import { MoovMoneyAdapter } from './adapters/moov-money.adapter';
import { AirtelMoneyAdapter } from './adapters/airtel-money.adapter';
import { MockAdapter } from './adapters/mock.adapter';

const INTEGRATION_EVENTS = {
  CASH_IN_SUCCESS: 'integration.cashin.success',
  CASH_IN_FAILED: 'integration.cashin.failed',
  CASH_OUT_SUCCESS: 'integration.cashout.success',
  CASH_OUT_FAILED: 'integration.cashout.failed',
  BALANCE_SYNCED: 'integration.balance.synced',
  WEBHOOK_RECEIVED: 'integration.webhook.received',
};

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly adapters = new Map<OperatorCode, IOperatorAdapter>();
  private readonly circuitBreakers = new Map<OperatorCode, CircuitBreaker>();
  private readonly config = loadOperatorsConfig();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.initAdapters();
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────

  private initAdapters(): void {
    const isDev = process.env.NODE_ENV !== 'production';

    // En développement, MOCK est l'adapter par défaut
    this.adapters.set('MOCK', new MockAdapter());

    if (!isDev || this.config.orangeMoney.enabled) {
      this.adapters.set('ORANGE_MONEY', new OrangeMoneyAdapter(this.config.orangeMoney));
    }
    if (!isDev || this.config.mtnMomo.enabled) {
      this.adapters.set('MTN_MOMO', new MtnMomoAdapter(this.config.mtnMomo));
    }
    if (!isDev || this.config.wave.enabled) {
      this.adapters.set('WAVE', new WaveAdapter(this.config.wave));
    }
    if (!isDev || this.config.moovMoney.enabled) {
      this.adapters.set('MOOV_MONEY', new MoovMoneyAdapter(this.config.moovMoney));
    }
    if (!isDev || this.config.airtelMoney.enabled) {
      this.adapters.set('AIRTEL_MONEY', new AirtelMoneyAdapter(this.config.airtelMoney));
    }

    // Circuit breakers pour chaque opérateur
    for (const code of this.adapters.keys()) {
      this.circuitBreakers.set(
        code,
        new CircuitBreaker(code, { failureThreshold: 5, recoveryTimeoutMs: 30 * 60 * 1000 }),
      );
    }

    this.logger.log(`Adapters initialisés: ${[...this.adapters.keys()].join(', ')}`);
  }

  // ─── Sélection adapter ────────────────────────────────────────────────────────

  getAdapter(operator: OperatorCode): IOperatorAdapter {
    const isDev = process.env.NODE_ENV !== 'production';
    const effectiveOperator = isDev && !this.config[this.operatorConfigKey(operator)]?.enabled
      ? 'MOCK'
      : operator;

    const adapter = this.adapters.get(effectiveOperator);
    if (!adapter) {
      throw new NotFoundException(`Adapter non trouvé pour l'opérateur: ${operator}`);
    }
    return adapter;
  }

  private operatorConfigKey(code: OperatorCode): keyof typeof this.config {
    const map: Record<OperatorCode, keyof typeof this.config> = {
      ORANGE_MONEY: 'orangeMoney',
      MTN_MOMO: 'mtnMomo',
      WAVE: 'wave',
      MOOV_MONEY: 'moovMoney',
      AIRTEL_MONEY: 'airtelMoney',
      MOCK: 'orangeMoney', // fallback
    };
    return map[code];
  }

  // ─── Retry + Circuit Breaker ──────────────────────────────────────────────────

  private async executeProtected<T>(
    operator: OperatorCode,
    fn: () => Promise<T>,
    context: string,
    maxRetries = 3,
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(operator);

    if (!breaker) {
      return executeWithRetry(fn, maxRetries, 1000, context);
    }

    return breaker.execute(() =>
      executeWithRetry(fn, maxRetries, 1000, `${operator}:${context}`),
    );
  }

  // ─── Log appel API ────────────────────────────────────────────────────────────

  private async logApiCall(data: {
    operator: OperatorCode;
    endpoint: string;
    durationMs: number;
    status: 'SUCCESS' | 'ERROR';
    errorMessage?: string;
    tenantId?: string;
    reference?: string;
  }): Promise<void> {
    try {
      await (this.prisma as any).integrationLog?.create({
        data: {
          operator: data.operator,
          endpoint: data.endpoint,
          durationMs: data.durationMs,
          status: data.status,
          errorMessage: data.errorMessage,
          tenantId: data.tenantId,
          reference: data.reference,
          createdAt: new Date(),
        },
      });
    } catch {
      // Table peut ne pas exister encore — log seulement
      this.logger.debug(
        `IntegrationLog: ${data.operator} ${data.endpoint} ${data.status} (${data.durationMs}ms)`,
      );
    }
  }

  // ─── Operations ───────────────────────────────────────────────────────────────

  async cashIn(
    operator: OperatorCode,
    params: CashInParams,
    tenantId?: string,
    agentId?: string,
  ): Promise<OperatorTransaction> {
    const adapter = this.getAdapter(operator);
    const start = Date.now();

    try {
      const result = await this.executeProtected(operator, () => adapter.cashIn(params), 'cashIn');

      await this.logApiCall({
        operator,
        endpoint: 'cashIn',
        durationMs: Date.now() - start,
        status: 'SUCCESS',
        tenantId,
        reference: params.reference,
      });

      this.eventEmitter.emit(INTEGRATION_EVENTS.CASH_IN_SUCCESS, {
        operator,
        result,
        tenantId,
        agentId,
      });

      return result;
    } catch (err: any) {
      await this.logApiCall({
        operator,
        endpoint: 'cashIn',
        durationMs: Date.now() - start,
        status: 'ERROR',
        errorMessage: err.message,
        tenantId,
        reference: params.reference,
      });

      this.eventEmitter.emit(INTEGRATION_EVENTS.CASH_IN_FAILED, {
        operator,
        error: err.message,
        params,
        tenantId,
        agentId,
      });

      throw err;
    }
  }

  async cashOut(
    operator: OperatorCode,
    params: CashOutParams,
    tenantId?: string,
    agentId?: string,
  ): Promise<OperatorTransaction> {
    const adapter = this.getAdapter(operator);
    const start = Date.now();

    try {
      const result = await this.executeProtected(operator, () => adapter.cashOut(params), 'cashOut');

      await this.logApiCall({
        operator,
        endpoint: 'cashOut',
        durationMs: Date.now() - start,
        status: 'SUCCESS',
        tenantId,
        reference: params.reference,
      });

      this.eventEmitter.emit(INTEGRATION_EVENTS.CASH_OUT_SUCCESS, {
        operator,
        result,
        tenantId,
        agentId,
      });

      return result;
    } catch (err: any) {
      await this.logApiCall({
        operator,
        endpoint: 'cashOut',
        durationMs: Date.now() - start,
        status: 'ERROR',
        errorMessage: err.message,
        tenantId,
        reference: params.reference,
      });

      this.eventEmitter.emit(INTEGRATION_EVENTS.CASH_OUT_FAILED, {
        operator,
        error: err.message,
        params,
        tenantId,
        agentId,
      });

      throw err;
    }
  }

  async syncBalance(agentId: string, operator: OperatorCode, tenantId: string): Promise<OperatorBalance> {
    const floatAccount = await this.prisma.floatAccount.findFirst({
      where: { agentId, operateur: operator as any, tenantId },
    });

    if (!floatAccount) {
      throw new NotFoundException(`Compte float introuvable pour agent ${agentId} / opérateur ${operator}`);
    }

    const adapter = this.getAdapter(operator);
    const start = Date.now();

    try {
      const balance = await this.executeProtected(
        operator,
        () => adapter.getBalance(floatAccount.id),
        'getBalance',
      );

      // Mettre à jour le float en DB
      await this.prisma.floatAccount.update({
        where: { id: floatAccount.id },
        data: { solde: balance.balance, updatedAt: new Date() },
      });

      await this.logApiCall({
        operator,
        endpoint: 'getBalance',
        durationMs: Date.now() - start,
        status: 'SUCCESS',
        tenantId,
      });

      this.eventEmitter.emit(INTEGRATION_EVENTS.BALANCE_SYNCED, {
        operator,
        agentId,
        balance,
        tenantId,
      });

      return balance;
    } catch (err: any) {
      await this.logApiCall({
        operator,
        endpoint: 'getBalance',
        durationMs: Date.now() - start,
        status: 'ERROR',
        errorMessage: err.message,
        tenantId,
      });
      throw err;
    }
  }

  async syncAllBalances(tenantId: string): Promise<Record<string, any>> {
    const floatAccounts = await this.prisma.floatAccount.findMany({
      where: { tenantId },
      include: { agent: true },
    });

    const results: Record<string, any> = {};

    for (const account of floatAccounts) {
      const key = `${account.agentId}:${account.operateur}`;
      try {
        const balance = await this.syncBalance(
          account.agentId,
          account.operateur as OperatorCode,
          tenantId,
        );
        results[key] = { success: true, balance };
      } catch (err: any) {
        results[key] = { success: false, error: err.message };
      }
    }

    return results;
  }

  async processWebhook(operator: OperatorCode, payload: any): Promise<any> {
    const adapter = this.getAdapter(operator);
    const result = await adapter.webhook(payload);

    this.eventEmitter.emit(INTEGRATION_EVENTS.WEBHOOK_RECEIVED, {
      operator,
      result,
      payload,
    });

    return result;
  }

  // ─── Health / Status ──────────────────────────────────────────────────────────

  getOperatorsStatus(): Array<{
    code: OperatorCode;
    circuitState: CircuitBreakerState;
    circuitStats: any;
    enabled: boolean;
  }> {
    return [...this.adapters.keys()].map((code) => {
      const breaker = this.circuitBreakers.get(code);
      const configKey = this.operatorConfigKey(code);
      const cfg = code !== 'MOCK' ? (this.config as any)[configKey] : null;

      return {
        code,
        circuitState: breaker?.getState() ?? CircuitBreakerState.CLOSED,
        circuitStats: breaker?.getStats() ?? {},
        enabled: code === 'MOCK' ? true : (cfg?.enabled ?? false),
      };
    });
  }

  async testConnection(operator: OperatorCode): Promise<{ success: boolean; durationMs: number; error?: string }> {
    const adapter = this.getAdapter(operator);
    const start = Date.now();

    try {
      await adapter.getBalance('test-account');
      return { success: true, durationMs: Date.now() - start };
    } catch (err: any) {
      return { success: false, durationMs: Date.now() - start, error: err.message };
    }
  }

  async getLogs(
    tenantId?: string,
    operator?: OperatorCode,
    page = 1,
    limit = 50,
  ): Promise<any> {
    try {
      const where: any = {};
      if (tenantId) where.tenantId = tenantId;
      if (operator) where.operator = operator;

      const [data, total] = await Promise.all([
        (this.prisma as any).integrationLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        (this.prisma as any).integrationLog.count({ where }),
      ]);

      return { data, total, page, limit };
    } catch {
      return { data: [], total: 0, page, limit, note: 'Table integrationLog non disponible' };
    }
  }
}
