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
import { WaveConfig } from '../config/operators.config';

export class WaveAdapter implements IOperatorAdapter {
  private readonly logger = new Logger(WaveAdapter.name);

  constructor(private readonly config: WaveConfig) {}

  // ─── HTTP client ──────────────────────────────────────────────────────────────

  private async request<T>(path: string, method = 'GET', body?: any): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
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
        const msg = (data as any)?.error?.message ?? (data as any)?.message ?? 'Wave API error';
        throw new Error(`[Wave] HTTP ${res.status}: ${msg}`);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('[Wave] Timeout après 30s');
      throw err;
    }
  }

  // ─── Interface ────────────────────────────────────────────────────────────────

  async getBalance(accountId: string): Promise<OperatorBalance> {
    const data = await this.request<any>(`/business/${this.config.businessId}/balance`);

    return {
      accountId,
      balance: parseFloat(data.amount ?? data.balance ?? 0),
      currency: data.currency ?? 'XOF',
      availableBalance: parseFloat(data.available_amount ?? data.amount ?? 0),
      lastUpdated: new Date(),
      raw: data,
    };
  }

  async cashIn(params: CashInParams): Promise<OperatorTransaction> {
    const data = await this.request<any>('/checkout/sessions', 'POST', {
      amount: String(params.amount),
      currency: params.currency,
      client_reference: params.reference,
      success_url: '',
      error_url: '',
      payment_method: 'WAVE_CI',
      customer_phone_number: this.normalizePhone(params.phone),
    });

    return {
      transactionId: data.id ?? data.checkout_session_id ?? params.reference,
      reference: params.reference,
      status: this.mapStatus(data.transaction_status ?? data.payment_status),
      amount: params.amount,
      currency: params.currency,
      phone: params.phone,
      createdAt: new Date(data.created_at ?? Date.now()),
      raw: data,
    };
  }

  async cashOut(params: CashOutParams): Promise<OperatorTransaction> {
    const data = await this.request<any>('/payout', 'POST', {
      receive_amount: params.amount,
      currency: params.currency,
      mobile: this.normalizePhone(params.phone),
      client_reference: params.reference,
      name: params.description ?? 'GESTMONEY Payout',
    });

    return {
      transactionId: data.id ?? data.payout_id ?? params.reference,
      reference: params.reference,
      status: this.mapStatus(data.status),
      amount: params.amount,
      currency: params.currency,
      phone: params.phone,
      createdAt: new Date(data.timestamp ?? Date.now()),
      completedAt: data.status === 'succeeded' ? new Date() : undefined,
      errorCode: data.failure_reason,
      errorMessage: data.failure_reason,
      raw: data,
    };
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    const data = await this.request<any>(`/transactions/${transactionId}`);

    return {
      transactionId,
      status: this.mapStatus(data.status),
      amount: parseFloat(data.amount ?? 0),
      currency: data.currency ?? 'XOF',
      errorCode: data.failure_reason,
      errorMessage: data.failure_reason,
      raw: data,
    };
  }

  async getStatement(accountId: string, startDate: Date, endDate: Date): Promise<OperatorStatement> {
    const from = startDate.toISOString();
    const to = endDate.toISOString();
    const data = await this.request<any>(
      `/transactions?business_id=${this.config.businessId}&from=${from}&to=${to}`,
    );

    const txList: any[] = data.transactions ?? data.items ?? [];

    return {
      accountId,
      startDate,
      endDate,
      transactions: txList.map((t: any) => ({
        id: t.id,
        date: new Date(t.timestamp ?? t.created_at),
        type: t.type === 'CREDIT' || t.direction === 'in' ? 'CREDIT' : 'DEBIT',
        amount: parseFloat(t.amount ?? 0),
        currency: t.currency ?? 'XOF',
        reference: t.client_reference ?? t.id,
        description: t.description,
      })),
      openingBalance: 0,
      closingBalance: 0,
      currency: 'XOF',
      raw: data,
    };
  }

  async verifyAccount(phone: string): Promise<AccountVerification> {
    try {
      const normalized = this.normalizePhone(phone);
      const data = await this.request<any>(`/account-lookup?phone=${normalized}`);
      return {
        phone,
        isValid: data.account_status === 'ACTIVE' || data.is_active === true,
        name: data.full_name ?? data.name,
        accountId: data.account_id,
        raw: data,
      };
    } catch {
      return { phone, isValid: false };
    }
  }

  async webhook(payload: any): Promise<WebhookResult> {
    return {
      processed: true,
      transactionId: payload.id ?? payload.checkout_session_id,
      status: this.mapStatus(payload.payment_status ?? payload.status),
      raw: payload,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('00')) return '+' + digits.slice(2);
    if (!digits.startsWith('+')) return '+' + digits;
    return phone;
  }

  private mapStatus(status: string): 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
    const map: Record<string, 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'> = {
      pending: 'PENDING',
      processing: 'PENDING',
      succeeded: 'COMPLETED',
      complete: 'COMPLETED',
      completed: 'COMPLETED',
      failed: 'FAILED',
      error: 'FAILED',
      cancelled: 'CANCELLED',
      canceled: 'CANCELLED',
    };
    return map[status?.toLowerCase()] ?? 'PENDING';
  }
}
