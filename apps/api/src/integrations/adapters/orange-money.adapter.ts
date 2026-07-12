import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
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
import { OrangeMoneyConfig } from '../config/operators.config';

export class OrangeMoneyAdapter implements IOperatorAdapter {
  private readonly logger = new Logger(OrangeMoneyAdapter.name);
  private accessToken?: string;
  private tokenExpiresAt?: Date;

  constructor(private readonly config: OrangeMoneyConfig) {}

  // ─── Auth OAuth2 ─────────────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }
    return this.refreshToken();
  }

  private async refreshToken(): Promise<string> {
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString('base64');

    const response = await this.request<{ access_token: string; expires_in: number }>(
      '/oauth/token',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        skipAuth: true,
      },
    );

    this.accessToken = response.access_token;
    this.tokenExpiresAt = new Date(Date.now() + (response.expires_in - 60) * 1000);

    this.logger.debug('Orange Money token rafraîchi');
    return this.accessToken;
  }

  // ─── Signature HMAC-SHA256 ────────────────────────────────────────────────────

  private signRequest(payload: string): string {
    return crypto
      .createHmac('sha256', this.config.hmacSecret)
      .update(payload)
      .digest('hex');
  }

  // ─── HTTP client interne ──────────────────────────────────────────────────────

  private async request<T>(
    path: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      skipAuth?: boolean;
    } = {},
  ): Promise<T> {
    const { method = 'GET', body, skipAuth = false } = options;
    const url = `${this.config.apiUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers ?? {}),
    };

    if (!skipAuth) {
      const token = await this.getToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (body && method !== 'GET') {
      headers['X-Signature'] = this.signRequest(body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ?? undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await res.json();

      if (!res.ok) {
        const errCode = (data as any)?.error?.code ?? res.status;
        const errMsg = (data as any)?.error?.message ?? 'Orange Money API error';
        throw new Error(`[Orange Money] ${errCode}: ${errMsg}`);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('[Orange Money] Timeout après 30s');
      }
      throw err;
    }
  }

  // ─── Interface IOperatorAdapter ───────────────────────────────────────────────

  async getBalance(accountId: string): Promise<OperatorBalance> {
    const data = await this.request<any>(`/balance?account_id=${accountId}`);

    return {
      accountId,
      balance: parseFloat(data.balance ?? data.available_balance ?? 0),
      currency: data.currency ?? 'XOF',
      availableBalance: parseFloat(data.available_balance ?? data.balance ?? 0),
      lastUpdated: new Date(data.last_updated ?? Date.now()),
      raw: data,
    };
  }

  async cashIn(params: CashInParams): Promise<OperatorTransaction> {
    const payload = JSON.stringify({
      merchant_key: this.config.merchantKey,
      currency: params.currency,
      order_id: params.reference,
      amount: params.amount,
      return_url: '',
      cancel_url: '',
      notif_url: '',
      lang: 'fr',
      reference: params.reference,
      msisdn: params.phone,
    });

    const data = await this.request<any>('/cashin', {
      method: 'POST',
      body: payload,
    });

    return this.mapTransaction(data, params);
  }

  async cashOut(params: CashOutParams): Promise<OperatorTransaction> {
    const payload = JSON.stringify({
      merchant_key: this.config.merchantKey,
      currency: params.currency,
      amount: params.amount,
      reference: params.reference,
      msisdn: params.phone,
      description: params.description ?? '',
    });

    const data = await this.request<any>('/cashout', {
      method: 'POST',
      body: payload,
    });

    return this.mapTransaction(data, params);
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    const data = await this.request<any>(`/transaction/${transactionId}`);

    return {
      transactionId,
      status: this.mapStatus(data.status),
      amount: parseFloat(data.amount ?? 0),
      currency: data.currency ?? 'XOF',
      errorCode: data.error_code,
      errorMessage: data.error_message,
      raw: data,
    };
  }

  async getStatement(accountId: string, startDate: Date, endDate: Date): Promise<OperatorStatement> {
    const from = startDate.toISOString().slice(0, 10);
    const to = endDate.toISOString().slice(0, 10);
    const data = await this.request<any>(
      `/statement?account_id=${accountId}&from=${from}&to=${to}`,
    );

    return {
      accountId,
      startDate,
      endDate,
      transactions: (data.transactions ?? []).map((t: any) => ({
        id: t.id ?? t.transaction_id,
        date: new Date(t.date ?? t.created_at),
        type: t.type === 'CR' ? 'CREDIT' : 'DEBIT',
        amount: parseFloat(t.amount ?? 0),
        currency: t.currency ?? 'XOF',
        reference: t.reference,
        description: t.description,
      })),
      openingBalance: parseFloat(data.opening_balance ?? 0),
      closingBalance: parseFloat(data.closing_balance ?? 0),
      currency: data.currency ?? 'XOF',
      raw: data,
    };
  }

  async verifyAccount(phone: string): Promise<AccountVerification> {
    try {
      const data = await this.request<any>(`/verify?msisdn=${phone}`);
      return {
        phone,
        isValid: data.is_valid ?? data.status === 'ACTIVE',
        name: data.name ?? data.subscriber_name,
        accountId: data.account_id,
        raw: data,
      };
    } catch {
      return { phone, isValid: false };
    }
  }

  async webhook(payload: any): Promise<WebhookResult> {
    const signature = payload._signature;
    const body = JSON.stringify({ ...payload, _signature: undefined });

    if (signature && this.signRequest(body) !== signature) {
      throw new Error('[Orange Money] Signature webhook invalide');
    }

    return {
      processed: true,
      transactionId: payload.order_id ?? payload.transaction_id,
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
      FAILED: 'FAILED',
      CANCELLED: 'CANCELLED',
      EXPIRED: 'FAILED',
    };
    return map[status?.toUpperCase()] ?? 'PENDING';
  }

  private mapTransaction(data: any, params: CashInParams | CashOutParams): OperatorTransaction {
    return {
      transactionId: data.transaction_id ?? data.order_id ?? params.reference,
      reference: params.reference,
      status: this.mapStatus(data.status),
      amount: params.amount,
      currency: params.currency,
      phone: params.phone,
      createdAt: new Date(data.created_at ?? Date.now()),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      errorCode: data.error_code,
      errorMessage: data.error_message,
      raw: data,
    };
  }
}
