import type { DatabaseTransaction } from '../../database/transaction';

export type TransactionType = 'FUND' | 'WITHDRAW' | 'TRANSFER_IN' | 'TRANSFER_OUT';
export type TransactionStatus = 'SUCCESS' | 'FAILED';

export type CreateTransactionInput = {
  reference: string;
  walletId: string;
  type: TransactionType;
  amountMinor: number;
  balanceBeforeMinor: number;
  balanceAfterMinor: number;
  status: TransactionStatus;
  counterpartyWalletId?: string | null;
  relatedTransactionId?: string | null;
  description?: string | null;
};

export type TransactionRecord = {
  id: string;
  reference: string;
  walletId: string;
  type: TransactionType;
  amountMinor: number;
  balanceBeforeMinor: number;
  balanceAfterMinor: number;
  status: TransactionStatus;
  counterpartyWalletId: string | null;
  relatedTransactionId: string | null;
  description: string | null;
  createdAt: Date;
};

export type TransactionStore = {
  create(input: CreateTransactionInput, trx?: DatabaseTransaction): Promise<TransactionRecord>;
  updateRelatedTransaction?(
    transactionId: string,
    relatedTransactionId: string,
    trx?: DatabaseTransaction,
  ): Promise<TransactionRecord>;
};
