// ==============================================================================
// Types Tenant (Multi-tenant)
// ==============================================================================

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
}

export enum TenantPlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM',
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  status: TenantStatus;
  plan: TenantPlan;
  country: string;
  currency: string;
  timezone: string;
  locale: string;
  settings: TenantSettings;
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  allowedOperators: string[];
  maxAgents: number;
  maxAgencies: number;
  enableFraudDetection: boolean;
  enableLoyalty: boolean;
  enableInventory: boolean;
  enablePayroll: boolean;
  commissionEnabled: boolean;
  twoFactorRequired: boolean;
  sessionTimeoutMinutes: number;
  maintenanceMode: boolean;
}
