export enum ReportType {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  AGENT_PERFORMANCE = 'AGENT_PERFORMANCE',
  OPERATOR_COMPARISON = 'OPERATOR_COMPARISON',
  FLOAT_USAGE = 'FLOAT_USAGE',
  COMMISSIONS = 'COMMISSIONS',
  CUSTOM = 'CUSTOM',
}

export enum ReportFormat {
  PDF = 'PDF',
  CSV = 'CSV',
  XLSX = 'XLSX',
}

export enum ReportFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface KPIData {
  chiffreAffaires: number;
  croissance: number; // pourcentage vs période précédente
  topAgent: { agentId: string; nom: string; montant: number } | null;
  tauxSucces: number; // pourcentage transactions réussies
  totalTransactions: number;
  totalCommissions: number;
  nouveauxClients: number;
  agentsActifs: number;
}

export interface DashboardData {
  kpis: KPIData;
  transactionsAujourdhui: {
    total: number;
    montant: number;
    parType: Record<string, { count: number; montant: number }>;
    parOperateur: Record<string, { count: number; montant: number }>;
  };
  evolutionSemaine: Array<{ date: string; montant: number; count: number }>;
  topAgents: Array<{ agentId: string; count: number; montant: number }>;
  alertes: Array<{ type: string; message: string; severity: string }>;
}

export interface GeneratedReport {
  id: string;
  tenantId: string;
  type: ReportType;
  format: ReportFormat;
  period: { start: Date; end: Date };
  filePath?: string;
  data: any;
  generatedAt: Date;
  generatedBy: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface ScheduledReport {
  id: string;
  tenantId: string;
  reportType: ReportType;
  frequency: ReportFrequency;
  sendTo: string[];
  format: ReportFormat;
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
}
