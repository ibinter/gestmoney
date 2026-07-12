// ==============================================================================
// Types Audit & Sécurité
// ==============================================================================

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SUSPEND = 'SUSPEND',
  ACTIVATE = 'ACTIVATE',
}

export enum FraudAlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum FraudAlertStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  description?: string;
  createdAt: Date;
}

export interface FraudAlert {
  id: string;
  tenantId: string;
  transactionId?: string;
  agentId?: string;
  customerId?: string;
  severity: FraudAlertSeverity;
  status: FraudAlertStatus;
  alertType: string;
  description: string;
  riskScore: number;
  indicators: string[];
  resolvedById?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MlPrediction {
  id: string;
  tenantId: string;
  transactionId: string;
  modelName: string;
  modelVersion: string;
  fraudProbability: number;
  riskScore: number;
  features: Record<string, unknown>;
  prediction: 'FRAUD' | 'LEGITIMATE';
  confidence: number;
  processingTimeMs: number;
  createdAt: Date;
}
