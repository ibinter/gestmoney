// ==============================================================================
// GESTMONEY - Exports du package database
// ==============================================================================

export { PrismaClient } from '@prisma/client';
export type {
  Transaction,
  Agent,
  Agency,
  FloatAccount,
  CommissionEarning,
  CommissionPlan,
  User,
  Tenant,
  KycVerification,
  AuditLog,
  IntegrationLog,
  NotificationLog,
  ExchangeRate,
  ScheduledReport,
  GeneratedReport,
} from '@prisma/client';

export { prisma } from './client';
export * from '@prisma/client';
