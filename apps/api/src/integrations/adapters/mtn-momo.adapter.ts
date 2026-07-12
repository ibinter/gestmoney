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
import { MtnMomoConfig } from '../config/operators.config';

interface MtnToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expiresAt?: Date;
}

export class MtnMomoAdapter implements IOperatorAdapter {
  private readonly logger = new Logger(MtnMomoAdapter.name);

  private collectionToken?: MtnToken;
  private disbursementToken?: MtnToken;

  constructor(private readonly config: MtnMomoConfig) {}

  // ─── Auth Basic Auth → Bearer token ──────────────────────────────────────────

  private async getCollectionToken(): Promise<string> {
    if (
      this.collectionToken?.access_token &&
      this.collectionToken.expiresAt &&
      new Date() < this.collectionToken.expiresAt
    ) {
      return this.collectionToken.access_token;
    }

    const credentials = Buffer.from(
      `${this.config.collectionUserId}:${this.config.collectionApiKey}`,
    ).toString('base64');

    const data = await this.rawRequest<MtnToken>(
      '/collection/token/',
      'POST',
      undefined,
      {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': this.config.subscriptionKeyCollection,
      },
    );

    this.collectionToken = {
      ...data,
      expiresAt: new Date(Date.now() + (data.expires_in - 60) * 1000),
    };

    return this.collectionToken.access_token;
  }

  private async getDisbursementToken(): Promise<string> {
    if (
      this.disbursementToken?.access_token &&
      this.disbursementToken.expiresAt &&
      new Date() < this.disbursementToken.expiresAt
    ) {
      return this.disbursementToken.access_token;
    }

    const credentials = Buffer.from(
      `${this.config.disbursementUserId}:${this.config.disbursementApiKey}`,
    ).toString('base64');

    const data = await this.rawRequest<MtnToken>(
      '/disbursement/token/',
      'POST',
      undefined,
      {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': this.config.subscriptionKeyDisbursement,
      },
    );

    this.disbursementToken = {
      ...data,
      expiresAt: new Date(Date.now() + (data.expires_in - 60) * 1000),
    };

    return this.disbursementToken.access_token;
  }

  // ─── HTTP client ──────────────────────────────────────────────────────────────

  private async rawRequest<T>(
    path: string,
    method: string,
    body?: any,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Target-Environment': this.config.targetEnvironment,
      ...(extraHeaders ?? {}),
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

      if (res.status === 202) {
        return {} as T; // Accepted async
      }

      if (res.status === 204) {
        return {} as T;
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(`[MTN MoMo] HTTP ${res.status}: ${data?.message ?? text}`);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('[MTN MoMo] Timeout après 30s');
      throw err;
    }
  }

  private async collectionRequest<T>(
    path: string,
    method: string,
    body?: any,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const token = await this.getCollectionToken();
    return this.rawRequest<T>(path, method, body, {
      Authorization: `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': this.config.subscriptionKeyCollection,
      ...(extraHeaders ?? {}),
    });
  }

  private async disbursementRequest<T>(
    path: string,
    method: string,
    body?: any,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const token = await this.getDisbursementToken();
    return this.rawRequest<T>(path, method, body, {
      Authorization: `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': this.config.subscriptionKeyDisbursement,
      ...(extraHeaders ?? {}),
    });
  }

  // ─── Interface ────────────────────────────────────────────────────────────────

  async getBalance(accountId: string): Promise<OperatorBalance> {
    const data = await this.collectionRequest<any>(
      '/collection/v1_0/account/balance',
      'GET',
    );

    return {
      accountId,
      balance: parseFloat(data.availableBalance ?? 0),
      currency: data.currency ?? 'XOF',
      availableBalance: parseFloat(data.availableBalance ?? 0),
      lastUpdated: new Date(),
      raw: data,
    };
  }

  async cashIn(params: CashInParams): Promise<OperatorTransaction> {
    const referenceId = params.reference;

    await this.collectionRequest(
      '/collection/v1_0/requesttopay',
      'POST',
      {
        amount: String(params.amount),
        currency: params.currency,
        externalId: params.reference,
        payer: { partyIdType: 'MSISDN', partyId: this.normalizePhone(params.phone) },
        payerMessage: params.description ?? 'Cash In GESTMONEY',
        payeeNote: params.description ?? 'Cash In',
      },
      { 'X-Reference-Id': referenceId },
    );

    // Polling async
    return this.pollTransactionStatus(referenceId, 'collection', params);
  }

  async cashOut(params: CashOutParams): Promise<OperatorTransaction> {
    const referenceId = params.reference;

    await this.disbursementRequest(
      '/disbursement/v1_0/transfer',
      'POST',
      {
        amount: String(params.amount),
        currency: params.currency,
        externalId: params.reference,
        payee: { partyIdType: 'MSISDN', partyId: this.normalizePhone(params.phone) },
        payerMessage: params.description ?? 'Cash Out GESTMONEY',
        payeeNote: params.description ?? 'Cash Out',
      },
      { 'X-Reference-Id': referenceId },
    );

    return this.pollTransactionStatus(referenceId, 'disbursement', params);
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    // Tenter collection puis disbursement
    try {
      const data = await this.collectionRequest<any>(
        `/collection/v1_0/requesttopay/${transactionId}`,
        'GET',
      );
      return this.mapStatusFromData(transactionId, data);
    } catch {
      const data = await this.disbursementRequest<any>(
        `/disbursement/v1_0/transfer/${transactionId}`,
        'GET',
      );
      return this.mapStatusFromData(transactionId, data);
    }
  }

  async getStatement(accountId: string, startDate: Date, endDate: Date): Promise<OperatorStatement> {
    // MTN MoMo n'a pas d'endpoint statement officiel — retourner vide
    this.logger.warn('[MTN MoMo] getStatement non supporté nativement');
    return {
      accountId,
      startDate,
      endDate,
      transactions: [],
      openingBalance: 0,
      closingBalance: 0,
      currency: 'XOF',
    };
  }

  async verifyAccount(phone: string): Promise<AccountVerification> {
    try {
      const normalized = this.normalizePhone(phone);
      const data = await this.collectionRequest<any>(
        `/collection/v1_0/accountholder/msisdn/${normalized}/basicuserinfo`,
        'GET',
      );
      return {
        phone,
        isValid: true,
        name: `${data.given_name ?? ''} ${data.family_name ?? ''}`.trim(),
        raw: data,
      };
    } catch {
      return { phone, isValid: false };
    }
  }

  async webhook(payload: any): Promise<WebhookResult> {
    return {
      processed: true,
      transactionId: payload.externalId ?? payload.referenceId,
      status: this.mapMtnStatus(payload.status),
      raw: payload,
    };
  }

  // ─── Polling statut (async MTN) ───────────────────────────────────────────────

  private async pollTransactionStatus(
    referenceId: string,
    type: 'collection' | 'disbursement',
    params: CashInParams | CashOutParams,
    maxAttempts = 10,
    intervalMs = 3000,
  ): Promise<OperatorTransaction> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, intervalMs));

      try {
        const path =
          type === 'collection'
            ? `/collection/v1_0/requesttopay/${referenceId}`
            : `/disbursement/v1_0/transfer/${referenceId}`;

        const data: any =
          type === 'collection'
            ? await this.collectionRequest(path, 'GET')
            : await this.disbursementRequest(path, 'GET');

        const status = this.mapMtnStatus(data.status);
        if (status !== 'PENDING') {
          return {
            transactionId: referenceId,
            reference: params.reference,
            status,
            amount: params.amount,
            currency: params.currency,
            phone: params.phone,
            createdAt: new Date(),
            completedAt: status === 'COMPLETED' ? new Date() : undefined,
            errorCode: data.reason,
            errorMessage: data.reason,
            raw: data,
          };
        }
      } catch (err) {
        this.logger.warn(`[MTN MoMo] Polling erreur: ${(err as Error).message}`);
      }
    }

    // Timeout polling — retourner PENDING
    return {
      transactionId: referenceId,
      reference: params.reference,
      status: 'PENDING',
      amount: params.amount,
      currency: params.currency,
      phone: params.phone,
      createdAt: new Date(),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private normalizePhone(phone: string): string {
    return phone.replace(/^0/, '225').replace(/\+/, '').replace(/\s/g, '');
  }

  private mapMtnStatus(status: string): 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
    const map: Record<string, 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'> = {
      PENDING: 'PENDING',
      SUCCESSFUL: 'COMPLETED',
      FAILED: 'FAILED',
    };
    return map[status?.toUpperCase()] ?? 'PENDING';
  }

  private mapStatusFromData(transactionId: string, data: any): TransactionStatus {
    return {
      transactionId,
      status: this.mapMtnStatus(data.status),
      amount: parseFloat(data.amount ?? 0),
      currency: data.currency ?? 'XOF',
      errorCode: data.reason,
      errorMessage: data.reason,
      raw: data,
    };
  }
}
