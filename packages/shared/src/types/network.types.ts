// ==============================================================================
// Types Réseau Mobile Money
// ==============================================================================

export enum OperatorCode {
  ORANGE_MONEY = 'ORANGE_MONEY',
  MTN_MOMO = 'MTN_MOMO',
  WAVE = 'WAVE',
  MOOV_MONEY = 'MOOV_MONEY',
  FREE_MONEY = 'FREE_MONEY',
  AIRTEL_MONEY = 'AIRTEL_MONEY',
  MPESA = 'MPESA',
}

export enum NetworkStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum AgencyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export interface Network {
  id: string;
  tenantId: string;
  operatorCode: OperatorCode;
  name: string;
  country: string;
  currency: string;
  status: NetworkStatus;
  apiConfig?: NetworkApiConfig;
  settings: NetworkSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface NetworkApiConfig {
  baseUrl: string;
  clientId?: string;
  clientSecret?: string;
  merchantKey?: string;
  environment: 'sandbox' | 'production';
}

export interface NetworkSettings {
  minTransactionAmount: number;
  maxTransactionAmount: number;
  dailyLimit: number;
  transactionFeePercent: number;
  transactionFeeFixed: number;
}

export interface Agency {
  id: string;
  tenantId: string;
  networkId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  region: string;
  country: string;
  phone: string;
  email?: string;
  gpsCoordinates?: GpsCoordinates;
  status: AgencyStatus;
  managerId?: string;
  openingHours?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuperAgent {
  id: string;
  tenantId: string;
  agencyId: string;
  userId: string;
  agentCode: string;
  phoneNumber: string;
  nationalId: string;
  address: string;
  status: AgentStatus;
  commissionPlanId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  tenantId: string;
  superAgentId?: string;
  agencyId: string;
  userId: string;
  agentCode: string;
  phoneNumber: string;
  nationalId: string;
  address: string;
  status: AgentStatus;
  commissionPlanId?: string;
  territory?: Territory;
  createdAt: Date;
  updatedAt: Date;
}

export interface Territory {
  id: string;
  tenantId: string;
  agentId: string;
  name: string;
  description?: string;
  boundaries?: GeoPolygon;
  createdAt: Date;
  updatedAt: Date;
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}
