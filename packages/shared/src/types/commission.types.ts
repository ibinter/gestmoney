// ==============================================================================
// Types Commission
// ==============================================================================

export enum CommissionBasis {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  TIERED = 'TIERED',
}

export enum CommissionPaymentStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export interface CommissionPlan {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  networkId: string;
  basis: CommissionBasis;
  rates: CommissionRate[];
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionRate {
  id: string;
  tenantId: string;
  commissionPlanId: string;
  transactionType: string;
  minAmount?: number;
  maxAmount?: number;
  rate: number;
  fixedAmount?: number;
  agentShare: number;
  superAgentShare: number;
  agencyShare: number;
  networkShare: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionEarning {
  id: string;
  tenantId: string;
  transactionId: string;
  agentId?: string;
  superAgentId?: string;
  agencyId?: string;
  commissionPlanId: string;
  commissionRateId: string;
  grossAmount: number;
  agentAmount: number;
  superAgentAmount: number;
  agencyAmount: number;
  networkAmount: number;
  currency: string;
  periodMonth: number;
  periodYear: number;
  createdAt: Date;
}

export interface CommissionPayment {
  id: string;
  tenantId: string;
  agentId?: string;
  superAgentId?: string;
  agencyId?: string;
  periodMonth: number;
  periodYear: number;
  totalEarnings: number;
  deductions: number;
  netAmount: number;
  currency: string;
  status: CommissionPaymentStatus;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: Date;
  approvedById?: string;
  createdAt: Date;
  updatedAt: Date;
}
