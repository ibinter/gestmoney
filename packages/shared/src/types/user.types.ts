// ==============================================================================
// Types Utilisateur
// ==============================================================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  NETWORK_MANAGER = 'NETWORK_MANAGER',
  AGENCY_MANAGER = 'AGENCY_MANAGER',
  SUPER_AGENT = 'SUPER_AGENT',
  AGENT = 'AGENT',
  CASHIER = 'CASHIER',
  ACCOUNTANT = 'ACCOUNTANT',
  AUDITOR = 'AUDITOR',
  VIEWER = 'VIEWER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  twoFactorEnabled: boolean;
  twoFactorVerifiedAt?: Date;
  preferredLanguage: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Session {
  id: string;
  userId: string;
  tenantId: string;
  token: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}
