import { Logger } from '@nestjs/common';
import {
  IOperatorAdapter,
  CashInParams,
  CashOutParams,
  OperatorBalance,
  OperatorTransaction,
  TransactionStatus,
  OperatorStatement,
  AccountVerification,
  WebhookResult,
} from '../interfaces/operator-adapter.interface';

export class MockAdapter implements IOperatorAdapter {
  private readonly logger = new Logger(MockAdapter.name);
  private readonly FAILURE_RATE = 0.05; // 5% d'erreurs aléatoires

  // ─── Simulation delay ─────────────────────────────────────────────────────────

  private async simulateLatency(): Promise<void> {
    const delay = 100 + Math.random() * 400; // 100–500ms
    await new Promise((r) => setTimeout(r, delay));
  }

  private maybeThrow(context: string): void {
    if (Math.random() < this.FAILURE_RATE) {
      this.logger.warn(`[Mock] Erreur simulée dans ${context}`);
      throw new Error(`[Mock] Erreur aléatoire simulée dans ${context}`);
    }
  }

  private generateId(): string {
    return `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  // ─── Interface ────────────────────────────────────────────────────────────────

  async getBalance(accountId: string): Promise<OperatorBalance> {
    await this.simulateLatency();
    this.maybeThrow('getBalance');

    const balance = Math.round(Math.random() * 5_000_000 + 100_000);
    this.logger.debug(`[Mock] getBalance(${accountId}) → ${balance} XOF`);

    return {
      accountId,
      balance,
      currency: 'XOF',
      availableBalance: Math.round(balance * 0.95),
      lastUpdated: new Date(),
    };
  }

  async cashIn(params: CashInParams): Promise<OperatorTransaction> {
    await this.simulateLatency();
    this.maybeThrow('cashIn');

    const txId = this.generateId();
    this.logger.debug(`[Mock] cashIn ${params.amount} XOF → ${params.phone} | TxId: ${txId}`);

    return {
      transactionId: txId,
      reference: params.reference,
      status: 'COMPLETED',
      amount: params.amount,
      currency: params.currency,
      phone: params.phone,
      createdAt: new Date(),
      completedAt: new Date(),
    };
  }

  async cashOut(params: CashOutParams): Promise<OperatorTransaction> {
    await this.simulateLatency();
    this.maybeThrow('cashOut');

    const txId = this.generateId();
    this.logger.debug(`[Mock] cashOut ${params.amount} XOF → ${params.phone} | TxId: ${txId}`);

    return {
      transactionId: txId,
      reference: params.reference,
      status: 'COMPLETED',
      amount: params.amount,
      currency: params.currency,
      phone: params.phone,
      createdAt: new Date(),
      completedAt: new Date(),
    };
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    await this.simulateLatency();
    this.maybeThrow('getTransactionStatus');

    const statuses: Array<'PENDING' | 'COMPLETED' | 'FAILED'> = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'FAILED'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    this.logger.debug(`[Mock] getTransactionStatus(${transactionId}) → ${status}`);

    return {
      transactionId,
      status,
      amount: Math.round(Math.random() * 100_000),
      currency: 'XOF',
    };
  }

  async getStatement(accountId: string, startDate: Date, endDate: Date): Promise<OperatorStatement> {
    await this.simulateLatency();
    this.maybeThrow('getStatement');

    const count = Math.floor(Math.random() * 20) + 5;
    const transactions = Array.from({ length: count }, (_, i) => ({
      id: this.generateId(),
      date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())),
      type: (Math.random() > 0.5 ? 'CREDIT' : 'DEBIT') as 'CREDIT' | 'DEBIT',
      amount: Math.round(Math.random() * 500_000 + 1_000),
      currency: 'XOF',
      reference: `REF-MOCK-${i}`,
      description: `Transaction simulée #${i + 1}`,
    }));

    return {
      accountId,
      startDate,
      endDate,
      transactions,
      openingBalance: 2_000_000,
      closingBalance: 2_000_000 + transactions.reduce((acc, t) => acc + (t.type === 'CREDIT' ? t.amount : -t.amount), 0),
      currency: 'XOF',
    };
  }

  async verifyAccount(phone: string): Promise<AccountVerification> {
    await this.simulateLatency();

    const isValid = phone.length >= 8;
    this.logger.debug(`[Mock] verifyAccount(${phone}) → ${isValid}`);

    return {
      phone,
      isValid,
      name: isValid ? 'Client Simulé GESTMONEY' : undefined,
      accountId: isValid ? `ACC-${phone}` : undefined,
    };
  }

  async webhook(payload: any): Promise<WebhookResult> {
    await this.simulateLatency();

    return {
      processed: true,
      transactionId: payload.transactionId ?? this.generateId(),
      status: 'COMPLETED',
      raw: payload,
    };
  }
}
