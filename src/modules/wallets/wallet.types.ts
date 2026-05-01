import type { DatabaseTransaction } from '../../database/transaction';
import type { TransactionRecord, TransactionStore } from '../transactions/transaction.types';

export type CreateWalletInput = {
  userId: string;
  balanceMinor?: number;
  currency?: string;
};

export type WalletRecord = {
  id: string;
  userId: string;
  balanceMinor: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WalletStore = {
  create(input: CreateWalletInput, trx?: DatabaseTransaction): Promise<WalletRecord>;
};

export type WalletMutationStore = WalletStore & {
  findByIdForUpdate(walletId: string, trx: DatabaseTransaction): Promise<WalletRecord | null>;
  updateBalance(
    walletId: string,
    balanceMinor: number,
    trx: DatabaseTransaction,
  ): Promise<WalletRecord>;
};

export type FundWalletInput = {
  walletId: string;
  userId: string;
  amountMinor: number;
  description?: string;
};

export type FundWalletResult = {
  wallet: WalletRecord;
  transaction: TransactionRecord;
};

export type WalletFundingDependencies = {
  wallets: WalletMutationStore;
  transactions: TransactionStore;
  transactionRunner: {
    run<T>(callback: (trx: DatabaseTransaction) => Promise<T>): Promise<T>;
  };
};
