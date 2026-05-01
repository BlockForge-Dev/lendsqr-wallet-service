import type { DatabaseTransaction } from '../../database/transaction';

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
