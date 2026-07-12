// ==============================================================================
// Types Client / Fidélité
// ==============================================================================

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLACKLISTED = 'BLACKLISTED',
}

export enum LoyaltyTransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST',
}

export interface Customer {
  id: string;
  tenantId: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  nationalId?: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  country: string;
  status: CustomerStatus;
  kycVerified: boolean;
  kycVerifiedAt?: Date;
  totalTransactions: number;
  totalVolume: number;
  lastTransactionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAccount {
  id: string;
  tenantId: string;
  customerId: string;
  networkId: string;
  accountNumber: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyPoint {
  id: string;
  tenantId: string;
  customerId: string;
  transactionId?: string;
  type: LoyaltyTransactionType;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  expiresAt?: Date;
  createdAt: Date;
}
