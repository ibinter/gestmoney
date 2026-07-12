import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('gestmoney.db');

export interface PendingTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'CASH_IN' | 'CASH_OUT';
  amount: number;
  phone: string;
  operatorId: string;
  createdAt: string;
  synced: boolean;
}

export const offlineDb = {
  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS pending_transactions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            phone TEXT NOT NULL,
            operator_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            synced INTEGER DEFAULT 0,
            error TEXT
          )`,
          [],
          () => resolve(),
          (_, err) => { reject(err); return false; }
        );
      });
    });
  },

  savePending(tx: Omit<PendingTransaction, 'synced'>): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction((dbTx) => {
        dbTx.executeSql(
          `INSERT OR REPLACE INTO pending_transactions
           (id, type, amount, phone, operator_id, created_at, synced)
           VALUES (?, ?, ?, ?, ?, ?, 0)`,
          [tx.id, tx.type, tx.amount, tx.phone, tx.operatorId, tx.createdAt],
          () => resolve(),
          (_, err) => { reject(err); return false; }
        );
      });
    });
  },

  getPending(): Promise<PendingTransaction[]> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM pending_transactions WHERE synced = 0 ORDER BY created_at ASC',
          [],
          (_, result) => {
            const rows: PendingTransaction[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              rows.push({
                id: row.id,
                type: row.type,
                amount: row.amount,
                phone: row.phone,
                operatorId: row.operator_id,
                createdAt: row.created_at,
                synced: row.synced === 1,
              });
            }
            resolve(rows);
          },
          (_, err) => { reject(err); return false; }
        );
      });
    });
  },

  markSynced(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'UPDATE pending_transactions SET synced = 1 WHERE id = ?',
          [id],
          () => resolve(),
          (_, err) => { reject(err); return false; }
        );
      });
    });
  },

  markError(id: string, error: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'UPDATE pending_transactions SET error = ? WHERE id = ?',
          [error, id],
          () => resolve(),
          (_, err) => { reject(err); return false; }
        );
      });
    });
  },

  getPendingCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT COUNT(*) as cnt FROM pending_transactions WHERE synced = 0',
          [],
          (_, result) => resolve(result.rows.item(0).cnt),
          (_, err) => { reject(err); return false; }
        );
      });
    });
  },
};
