export interface Account {
  id: string;
  name: string;
  description?: string;
}

export enum TransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum ReconciliationStatus {
  UNRECONCILED = 'NAO_CONCILIADO',
  AUTOMATIC = 'AUTOMATICO',
  MANUAL = 'MANUAL',
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  reconciliation: {
    accountId: string | null;
    status: ReconciliationStatus;
  };
}

export type LearningExample = {
  description: string;
  amount: number;
  type: TransactionType;
  accountId: string;
};

export interface ReconciliationEvent {
  id: string;
  timestamp: string;
  transactionDescription: string;
  account: Account;
  method: ReconciliationStatus.AUTOMATIC | ReconciliationStatus.MANUAL;
}
