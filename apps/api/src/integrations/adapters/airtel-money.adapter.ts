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
import { AirtelMoneyConfig } from '../config/operators.config';

export class AirtelMoneyAdapter implements IOperatorAdapter {
  private readonly logger = new Logger(AirtelMoneyAdapter.name);

  private accessToken?: string;
  private tokenExpiresAt?: Date;

  constructor(private readonly config: AirtelMoneyConfig) {}

  // ─── Auth OAuth2 client_credentials ──────────────────────────────────────────

  private async getToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const res = await fetch(`${this.config.apiUrl}/auth/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!res.ok) throw new Error('[Airtel Money] Échec authentification OAuth2');

    const data = await res.json() as any;
    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);

    return this.accessToken!;
  }

  // ─── HTTP client ──────────────────────────────────────────────────────────────

  private async request<T>(path: string, method = 'GET', body?: any): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;
    const token = await this.getToken();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Country': this.config.country,
      'X-Currency': this.config.currency,
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

      if (!res.ok) {
        const msg = (data as any)?.status?.message ?? 'Airtel Money API error';
        const code = (data as any)?.status?.code ?? res.status;
        throw new Error(`[Airtel Money] ${code}: ${msg}`);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('[Airtel Money] Timeout après 30s');
      throw err;
    }
  }

  // ─── Interface ────────────────────────────────────────────────────────────────

  async getBalance(accountId: string): Promise<OperatorBalance> {
    const data = await this.request<any>(`/standard/v1/users/balance?msisdn=${accountId}`);

    const balance = data?.data?.balance ?? {};
    return {
      accountId,
      balance: parseFloat(balance.available_balance ?? 0),
      currency: balance.currency ?? this.config.currency,
      availableBalance: parseFloat(balance.available_balance ?? 0),
      lastUpdated: new Date(),
      raw: data,
    };
  }

  async cashIn(params: CashInParams): Promise<OperatorTransaction> {
    const data = await this.request<any>('/merchant/v2/payments/', 'POST', {
      reference: params.reference,
      subscriber: { country: this.config.country, currency: params.currency, msisdn: params.phone },
      transaction: { amount: params.amount, country: this.config.country, currency: params.currency, id: params.reference },
    });

    return this.mapTransaction(data, params);
  }

  async cashOut(params: CashOutParams): Promise<OperatorTransaction> {
    const data = await this.request<any>('/standard/v1/disbursements/', 'POST', {
      payee: {
        msisdn: params.phone,
      },
      reference: params.reference,
      pin: '',
      transaction: {
        amount: params.amount,
        id: params.reference,
        type: 'B2C',
      },
    });

    return this.mapTransaction(data, params);
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    const data = await this.request<any>(
      `/standard/v1/payments/${transactionId}`,
    );

    const tx = data?.data?.transaction ?? {};
    return {
      transactionId,
      status: this.mapStatus(tx.status ?? data?.status?.code),
      amount: parseFloat(tx.amount ?? 0),
      currency: tx.currency ?? this.config.currency,
      errorCode: data?.status?.code,
      errorMessage: data?.status?.message,
      raw: data,
    };
  }

  async getStatement(accountId: string, startDate: Date, endDate: Date): Promise<OperatorStatement> {
    this.logger.warn('[Airtel Money] getStatement non disponible via API standard');
    return {
      accountId,
      startDate,
      endDate,
      transactions: [],
      openingBalance: 0,
      closingBalance: 0,
      currency: this.config.currency,
    };
  }

  async verifyAccount(phone: string): Promise<AccountVerification> {
    try {
      const data = await this.request<any>(`/standard/v1/users/${phone}`);
      const user = data?.data?.user ?? {};
      return {
        phone,
        isValid: user.is_barred === false || data?.status?.code === '200',
        name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
        raw: data,
      };
    } catch {
      return { phone, isValid: false };
    }
  }

  async webhook(payload: any): Promise<WebhookResult> {
    return {
      processed: true,
      transactionId: payload.transaction?.id ?? payload.id,
      status: this.mapStatus(payload.status ?? payload.transaction?.status),
      raw: payload,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private mapStatus(status: string): 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
    const map: Record<string, 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'> = {
      TS: 'COMPLETED',      // Transaction Successful
      TF: 'FAILED',         // Transaction Failed
      TP: 'PENDING',        // Transaction Pending
      '200': 'COMPLETED',
      SUCCESS: 'COMPLETED',
      FAILED: 'FAILED',
      PENDING: 'PENDING',
    };
    return map[status?.toUpperCase()] ?? 'PENDING';
  }

  private mapTransaction(data: any, params: CashInParams | CashOutParams): OperatorTransaction {
    const tx = data?.data?.transaction ?? {};
    return {
      transactionId: tx.id ?? data?.data?.id ?? params.reference,
      reference: params.reference,
      status: this.mapStatus(tx.status ?? data?.status?.code),
      amount: params.amount,
      currency: params.currency,
      phone: params.phone,
      createdAt: new Date(),
      errorCode: data?.status?.code,
      errorMessage: data?.status?.message,
      raw: data,
    };
  }
}
