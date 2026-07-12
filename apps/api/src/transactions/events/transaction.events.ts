import { ITransaction } from '../interfaces/transaction.interface';

export const TRANSACTION_EVENTS = {
  CREATED: 'transaction.created',
  COMPLETED: 'transaction.completed',
  FAILED: 'transaction.failed',
  CANCELLED: 'transaction.cancelled',
  REVERSED: 'transaction.reversed',
} as const;

export class TransactionCreatedEvent {
  constructor(public readonly transaction: ITransaction) {}
}

export class TransactionCompletedEvent {
  constructor(public readonly transaction: ITransaction) {}
}

export class TransactionFailedEvent {
  constructor(
    public readonly transaction: ITransaction,
    public readonly reason: string,
  ) {}
}

export class TransactionCancelledEvent {
  constructor(
    public readonly transaction: ITransaction,
    public readonly cancelledBy: string,
  ) {}
}

export class TransactionReversedEvent {
  constructor(
    public readonly transaction: ITransaction,
    public readonly reversedBy: string,
  ) {}
}
