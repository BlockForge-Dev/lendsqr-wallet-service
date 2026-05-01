import type { DatabaseTransaction } from '../../database/transaction';
import type {
  ListTransactionsResult,
  TransactionRecord,
  TransactionStore,
} from '../transactions/transaction.types';

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
  findById(walletId: string): Promise<WalletRecord | null>;
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

export type WithdrawWalletInput = {
  walletId: string;
  userId: string;
  amountMinor: number;
  description?: string;
};

export type WithdrawWalletResult = {
  wallet: WalletRecord;
  transaction: TransactionRecord;
};

export type TransferWalletInput = {
  senderWalletId: string;
  senderUserId: string;
  recipientWalletId: string;
  amountMinor: number;
  description?: string;
};

export type TransferWalletResult = {
  senderWallet: WalletRecord;
  recipientWallet: WalletRecord;
  senderTransaction: TransactionRecord;
  recipientTransaction: TransactionRecord;
};

export type ListWalletTransactionsInput = {
  walletId: string;
  userId: string;
  page: number;
  limit: number;
};

export type ListWalletTransactionsResult = ListTransactionsResult;

export type WalletServiceDependencies = {
  wallets: WalletMutationStore;
  transactions: TransactionStore;
  transactionRunner: {
    run<T>(callback: (trx: DatabaseTransaction) => Promise<T>): Promise<T>;
  };
};

export type WalletFundingDependencies = WalletServiceDependencies;
