// ==============================================================================
// Types Comptabilité
// ==============================================================================

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum JournalEntryStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

export interface AccountChart {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  type: AccountType;
  parentId?: string;
  isActive: boolean;
  normalBalance: 'DEBIT' | 'CREDIT';
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  reference: string;
  description: string;
  status: JournalEntryStatus;
  totalDebit: number;
  totalCredit: number;
  currency: string;
  entryDate: Date;
  fiscalYearId: string;
  lines: JournalLine[];
  createdById: string;
  postedById?: string;
  postedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
  currency: string;
}

export interface Ledger {
  id: string;
  tenantId: string;
  accountId: string;
  journalLineId: string;
  debit: number;
  credit: number;
  balance: number;
  currency: string;
  entryDate: Date;
  fiscalYearId: string;
  createdAt: Date;
}

export interface FiscalYear {
  id: string;
  tenantId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isClosed: boolean;
  closedAt?: Date;
  closedById?: string;
  createdAt: Date;
  updatedAt: Date;
}
