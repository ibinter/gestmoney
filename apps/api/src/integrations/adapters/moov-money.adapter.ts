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
import { MoovMoneyConfig } from '../config/operators.config';

// Codes réponse Moov Money
const MOOV_SUCCESS_CODES = ['000', '0', '200'];

export class MoovMoneyAdapter implements IOperatorAdapter {
  private readonly logger = new Logger(MoovMoneyAdapter.name);

  constructor(private readonly config: MoovMoneyConfig) {}

  // ─── HTTP client ──────────────────────────────────────────────────────────────

  private async request<T>(path: string, method = 'POST', body?: any): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;

    const credentials = Buffer.from(
      `${this.config.username}:${this.config.password}`,
    ).toString('base64');

    const headers: Record<string, string> = {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Country': this.config.country,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();

      // Moov retourne parfois 200 avec un code d'erreur dans le body
      const responseCode = (data as any)?.responseCode ?? (data as any)?.code;
      if (responseCode && !MOOV_SUCCESS_CODES.includes(String(responseCode))) {
        const msg = (data as any)?.responseMessage ?? (data as any)?.message ?? 'Moov Money error';
        throw new Error(`[Moov Money] Code ${responseCode}: ${msg}`);
      }

      if (!res.ok) {
        throw new Error(`[Moov Money] HTTP ${res.status}`);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('[Moov Money] Timeout après 30s');
      throw err;
    }
  }

  // ─── Interface ────────────────────────────────────────────────────────────────

  async getBalance(accountId: string): Promise<OperatorBalance> {
    const data = await this.request<any>('/account/balance', 'POST', {
      merchantCode: this.config.merchantCode,
      accountId,
    });

    return {
      accountId,
      balance: parseFloat(data.balance ?? data.solde ?? 0),
      currency: data.currency ?? 'XOF',
      availableBalance: parseFloat(data.availableBalance ?? data.balance ?? data.solde ?? 0),
      lastUpdated: new Date(),
      raw: data,
    };
  }

  async cashIn(params: CashInParams): Promise<OperatorTransaction> {
    const data = await this.request<any>('/payment/cashin', 'POST', {
      merchantCode: this.config.merchantCode,
      msisdn: params.phone,
      amount: params.amount,
      currency: params.currency,
      externalRef: params.reference,
      description: params.description ?? 'GESTMONEY CashIn',
    });

    return this.mapTransaction(data, params);
  }

  async cashOut(params: CashOutParams): Promise<OperatorTransaction> {
    const data = await this.request<any>('/payment/cashout', 'POST', {
      merchantCode: this.config.merchantCode,
      msisdn: params.phone,
      amount: params.amount,
      currency: params.currency,
      externalRef: params.reference,
      description: params.description ?? 'GESTMONEY CashOut',
    });

    return this.mapTransaction(data, params);
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    const data = await this.request<any>('/transaction/status', 'POST', {
      merchantCode: this.config.merchantCode,
      transactionId,
    });

    return {
      transactionId,
      status: this.mapStatus(data.status ?? data.transactionStatus),
      amount: parseFloat(data.amount ?? 0),
      currency: data.currency ?? 'XOF',
      errorCode: data.responseCode,
      errorMessage: data.responseMessage,
      raw: data,
    };
  }

  async getStatement(accountId: string, startDate: Date, endDate: Date): Promise<OperatorStatement> {
    const data = await this.request<any>('/account/statement', 'POST', {
      merchantCode: this.config.merchantCode,
      accountId,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    });

    const transactions: any[] = data.transactions ?? data.items ?? [];

    return {
      accountId,
      startDate,
      endDate,
      transactions: transactions.map((t: any) => ({
        id: t.transactionId ?? t.id,
        date: new Date(t.date ?? t.transactionDate),
        type: this.mapTxType(t.type ?? t.direction),
        amount: parseFloat(t.amount ?? 0),
        currency: t.currency ?? 'XOF',
        reference: t.externalRef ?? t.reference,
        description: t.description,
      })),
      openingBalance: parseFloat(data.openingBalance ?? 0),
      closingBalance: parseFloat(data.closingBalance ?? 0),
      currency: data.currency ?? 'XOF',
      raw: data,
    };
  }

  async verifyAccount(phone: string): Promise<AccountVerification> {
    try {
      const data = await this.request<any>('/account/verify', 'POST', {
        merchantCode: this.config.merchantCode,
        msisdn: phone,
      });
      return {
        phone,
        isValid: MOOV_SUCCESS_CODES.includes(String(data.responseCode ?? data.code)),
        name: data.subscriberName ?? data.name,
        accountId: data.accountId,
        raw: data,
      };
    } catch {
      return { phone, isValid: false };
    }
  }

  async webhook(payload: any): Promise<WebhookResult> {
    return {
      processed: true,
      transactionId: payload.transactionId ?? payload.externalRef,
      status: this.mapStatus(payload.status),
      raw: payload,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private mapStatus(status: string): 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
    const map: Record<string, 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'> = {
      PENDING: 'PENDING',
      INITIATED: 'PENDING',
      SUCCESS: 'COMPLETED',
      SUCCESSFUL: 'COMPLETED',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
      FAILURE: 'FAILED',
      CANCELLED: 'CANCELLED',
    };
    return map[status?.toUpperCase()] ?? 'PENDING';
  }

  private mapTxType(type: string): 'CREDIT' | 'DEBIT' {
    const credits = ['CREDIT', 'CR', 'IN', 'CASHIN'];
    return credits.includes(type?.toUpperCase()) ? 'CREDIT' : 'DEBIT';
  }

  private mapTransaction(data: any, params: CashInParams | CashOutParams): OperatorTransaction {
    return {
      transactionId: data.transactionId ?? data.id ?? params.reference,
      reference: params.reference,
      status: this.mapStatus(data.status ?? data.transactionStatus),
      amount: params.amount,
      currency: params.currency,
      phone: params.phone,
      createdAt: new Date(data.date ?? data.createdAt ?? Date.now()),
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      errorCode: data.responseCode,
      errorMessage: data.responseMessage,
      raw: data,
    };
  }
}
