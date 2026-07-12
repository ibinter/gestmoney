export type TransactionType =
  | 'DEPOT'
  | 'RETRAIT'
  | 'CASH_IN'
  | 'CASH_OUT'
  | 'PAIEMENT_MARCHAND'
  | 'TRANSFERT'
  | 'ANNULATION'
  | 'REVERSAL';

export type TransactionStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export type MobileMoneyOperator =
  | 'ORANGE_MONEY'
  | 'MTN_MOMO'
  | 'WAVE'
  | 'MOOV_MONEY'
  | 'AIRTEL_MONEY'
  | 'M_PESA'
  | 'FREE_MONEY'
  | 'TMONEY';

export interface ITransaction {
  id: string;
  tenantId: string;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  operateur: MobileMoneyOperator;
  montant: number;
  frais: number;
  commission: number;
  agentId: string;
  agenceId: string;
  clientPhone: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ITransactionStats {
  total: number;
  montantTotal: number;
  commissionsTotal: number;
  byType: Record<TransactionType, { count: number; montant: number }>;
  byOperateur: Record<MobileMoneyOperator, { count: number; montant: number }>;
  byStatus: Record<TransactionStatus, number>;
}

export interface ITransactionSummary {
  periode: { debut: Date; fin: Date };
  stats: ITransactionStats;
  topAgents: Array<{ agentId: string; count: number; montant: number }>;
}
