import type { DatabaseTransaction, TransactionRunner } from '../../database/transaction';
import type { BlacklistLookupInput, BlacklistLookupResult } from '../blacklist/blacklist.types';
import type { CreateWalletInput, WalletRecord } from '../wallets/wallet.types';

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bvn?: string;
};

export type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bvn: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserResult = {
  user: UserRecord;
  wallet: WalletRecord;
};

export type UserStore = {
  findByEmail(email: string): Promise<UserRecord | null>;
  findByPhone(phone: string): Promise<UserRecord | null>;
  create(input: CreateUserInput, trx?: DatabaseTransaction): Promise<UserRecord>;
};

export type WalletStore = {
  create(input: CreateWalletInput, trx?: DatabaseTransaction): Promise<WalletRecord>;
};

export type BlacklistGuard = {
  ensureIdentitiesAreAllowed(identities: BlacklistLookupInput[]): Promise<BlacklistLookupResult[]>;
};

export type BlacklistCheckLinker = {
  attachToUser(checkIds: string[], userId: string, trx?: DatabaseTransaction): Promise<void>;
};

export type UserServiceDependencies = {
  users: UserStore;
  wallets: WalletStore;
  blacklist: BlacklistGuard;
  blacklistChecks: BlacklistCheckLinker;
  transactions: TransactionRunner;
};
