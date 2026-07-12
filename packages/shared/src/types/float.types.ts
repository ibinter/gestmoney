// ==============================================================================
// Types Float (Gestion de la liquidité)
// ==============================================================================

export enum FloatMovementType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum ReplenishmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface FloatAccount {
  id: string;
  tenantId: string;
  agentId?: string;
  agencyId?: string;
  networkId: string;
  accountNumber: string;
  balance: number;
  reservedBalance: number;
  availableBalance: number;
  currency: string;
  minimumBalance: number;
  maximumBalance: number;
  isActive: boolean;
  lastMovementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FloatMovement {
  id: string;
  tenantId: string;
  floatAccountId: string;
  transactionId?: string;
  type: FloatMovementType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  description: string;
  reference: string;
  performedById: string;
  createdAt: Date;
}

export interface FloatThreshold {
  id: string;
  tenantId: string;
  floatAccountId: string;
  warningLevel: number;
  criticalLevel: number;
  autoReplenishEnabled: boolean;
  autoReplenishAmount?: number;
  notifyEmails: string[];
  notifyPhones: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReplenishmentRequest {
  id: string;
  tenantId: string;
  floatAccountId: string;
  requestedById: string;
  requestedAmount: number;
  approvedAmount?: number;
  currency: string;
  status: ReplenishmentStatus;
  reason?: string;
  rejectionReason?: string;
  approvedById?: string;
  approvedAt?: Date;
  paymentReference?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
