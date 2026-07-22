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

// ─────────────────────────────────────────────────────────────────────────────
// Mapping type de transaction — vocabulaire métier FR (DTO/front) ⇆ enum Prisma.
//
// Les DTO et le front parlent DEPOT/RETRAIT/CASH_IN/CASH_OUT/PAIEMENT_MARCHAND…
// mais la colonne `Transaction.type` est un enum Prisma strict
// (DEPOSIT/WITHDRAWAL/TRANSFER/PAYMENT/REVERSAL/ADJUSTMENT…). Écrire « DEPOT »
// directement provoquait une erreur Prisma 500. On mappe donc à l'écriture, et
// on conserve le type métier d'origine dans metadata.uiType pour un affichage
// exact (CASH_IN et DEPOT retombent tous deux sur DEPOSIT côté enum).
// ─────────────────────────────────────────────────────────────────────────────

/** Type de transaction tel que stocké dans l'enum Prisma. */
export type PrismaTransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TRANSFER'
  | 'PAYMENT'
  | 'AIRTIME_PURCHASE'
  | 'BILL_PAYMENT'
  | 'FLOAT_REPLENISHMENT'
  | 'FLOAT_WITHDRAWAL'
  | 'COMMISSION_PAYMENT'
  | 'REVERSAL'
  | 'ADJUSTMENT';

const PRISMA_TYPES: PrismaTransactionType[] = [
  'DEPOSIT',
  'WITHDRAWAL',
  'TRANSFER',
  'PAYMENT',
  'AIRTIME_PURCHASE',
  'BILL_PAYMENT',
  'FLOAT_REPLENISHMENT',
  'FLOAT_WITHDRAWAL',
  'COMMISSION_PAYMENT',
  'REVERSAL',
  'ADJUSTMENT',
];

const FR_TO_PRISMA_TYPE: Record<TransactionType, PrismaTransactionType> = {
  DEPOT: 'DEPOSIT',
  RETRAIT: 'WITHDRAWAL',
  CASH_IN: 'DEPOSIT',
  CASH_OUT: 'WITHDRAWAL',
  PAIEMENT_MARCHAND: 'PAYMENT',
  TRANSFERT: 'TRANSFER',
  ANNULATION: 'ADJUSTMENT',
  REVERSAL: 'REVERSAL',
};

const PRISMA_TO_FR_TYPE: Record<PrismaTransactionType, TransactionType> = {
  DEPOSIT: 'DEPOT',
  WITHDRAWAL: 'RETRAIT',
  TRANSFER: 'TRANSFERT',
  PAYMENT: 'PAIEMENT_MARCHAND',
  REVERSAL: 'REVERSAL',
  ADJUSTMENT: 'ANNULATION',
  AIRTIME_PURCHASE: 'PAIEMENT_MARCHAND',
  BILL_PAYMENT: 'PAIEMENT_MARCHAND',
  FLOAT_REPLENISHMENT: 'DEPOT',
  FLOAT_WITHDRAWAL: 'RETRAIT',
  COMMISSION_PAYMENT: 'PAIEMENT_MARCHAND',
};

/**
 * FR (DTO) → enum Prisma. Idempotent : si la valeur est déjà un type Prisma
 * valide, elle est renvoyée telle quelle (permet d'appeler la fonction avec le
 * type déjà stocké sur une transaction). Défaut sûr : ADJUSTMENT.
 */
export function toPrismaTransactionType(type: string): PrismaTransactionType {
  if (PRISMA_TYPES.includes(type as PrismaTransactionType)) {
    return type as PrismaTransactionType;
  }
  return FR_TO_PRISMA_TYPE[type as TransactionType] ?? 'ADJUSTMENT';
}

/** enum Prisma → type métier FR (pour affichage). Idempotent côté FR. */
export function fromPrismaTransactionType(type: string): TransactionType {
  if (FR_TO_PRISMA_TYPE[type as TransactionType]) return type as TransactionType;
  return PRISMA_TO_FR_TYPE[type as PrismaTransactionType] ?? 'DEPOT';
}
