export type OperatorCode = 'ORANGE_MONEY' | 'MTN_MOMO' | 'WAVE' | 'MOOV_MONEY' | 'AIRTEL_MONEY' | 'MOCK';

export interface CashInParams {
  phone: string;
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CashOutParams {
  phone: string;
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface OperatorBalance {
  accountId: string;
  balance: number;
  currency: string;
  availableBalance: number;
  lastUpdated: Date;
  raw?: any;
}

export interface OperatorTransaction {
  transactionId: string;
  reference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount: number;
  currency: string;
  phone: string;
  createdAt: Date;
  completedAt?: Date;
  errorCode?: string;
  errorMessage?: string;
  raw?: any;
}

export interface TransactionStatus {
  transactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount?: number;
  currency?: string;
  errorCode?: string;
  errorMessage?: string;
  raw?: any;
}

export interface OperatorStatement {
  accountId: string;
  startDate: Date;
  endDate: Date;
  transactions: Array<{
    id: string;
    date: Date;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    currency: string;
    reference: string;
    description?: string;
  }>;
  openingBalance: number;
  closingBalance: number;
  currency: string;
  raw?: any;
}

export interface AccountVerification {
  phone: string;
  isValid: boolean;
  name?: string;
  accountId?: string;
  raw?: any;
}

export interface WebhookResult {
  processed: boolean;
  transactionId?: string;
  status?: string;
  raw?: any;
}

export interface IOperatorAdapter {
  getBalance(accountId: string): Promise<OperatorBalance>;
  cashIn(params: CashInParams): Promise<OperatorTransaction>;
  cashOut(params: CashOutParams): Promise<OperatorTransaction>;
  getTransactionStatus(transactionId: string): Promise<TransactionStatus>;
  getStatement(accountId: string, startDate: Date, endDate: Date): Promise<OperatorStatement>;
  verifyAccount(phone: string): Promise<AccountVerification>;
  webhook(payload: any): Promise<WebhookResult>;
}
