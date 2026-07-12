// ==============================================================================
// Types Transaction Mobile Money
// ==============================================================================

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
  AIRTIME_PURCHASE = 'AIRTIME_PURCHASE',
  BILL_PAYMENT = 'BILL_PAYMENT',
  FLOAT_REPLENISHMENT = 'FLOAT_REPLENISHMENT',
  FLOAT_WITHDRAWAL = 'FLOAT_WITHDRAWAL',
  COMMISSION_PAYMENT = 'COMMISSION_PAYMENT',
  REVERSAL = 'REVERSAL',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
  DISPUTED = 'DISPUTED',
  EXPIRED = 'EXPIRED',
}

export enum ReversalReason {
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  TECHNICAL_ERROR = 'TECHNICAL_ERROR',
  FRAUD_DETECTED = 'FRAUD_DETECTED',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  OPERATOR_ERROR = 'OPERATOR_ERROR',
  COMPLIANCE = 'COMPLIANCE',
}

export interface Transaction {
  id: string;
  tenantId: string;
  reference: string;
  externalReference?: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  fee: number;
  commission: number;
  netAmount: number;
  currency: string;
  operatorCode: string;
  senderId?: string;
  senderPhone?: string;
  senderName?: string;
  receiverId?: string;
  receiverPhone?: string;
  receiverName?: string;
  agentId: string;
  agencyId: string;
  networkId: string;
  description?: string;
  metadata?: Record<string, unknown>;
  completedAt?: Date;
  failureReason?: string;
  reversalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reversal {
  id: string;
  tenantId: string;
  originalTransactionId: string;
  reference: string;
  reason: ReversalReason;
  description?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  requestedById: string;
  approvedById?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionFilter {
  tenantId?: string;
  agentId?: string;
  agencyId?: string;
  networkId?: string;
  type?: TransactionType | TransactionType[];
  status?: TransactionStatus | TransactionStatus[];
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface TransactionSummary {
  totalCount: number;
  totalAmount: number;
  totalFees: number;
  totalCommissions: number;
  byStatus: Record<TransactionStatus, number>;
  byType: Record<TransactionType, number>;
}
