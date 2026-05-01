import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';

import { db } from '../../database/knex';
import type { DatabaseTransaction } from '../../database/transaction';
import type { CreateWalletInput, WalletRecord } from './wallet.types';

type WalletRow = {
  id: string;
  user_id: string;
  balance_minor: number | string;
  currency: string;
  created_at: Date;
  updated_at: Date;
};

const toRecord = (row: WalletRow): WalletRecord => ({
  id: row.id,
  userId: row.user_id,
  balanceMinor: Number(row.balance_minor),
  currency: row.currency,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class WalletRepository {
  constructor(private readonly knex: Knex = db) {}

  async create(input: CreateWalletInput, trx?: DatabaseTransaction): Promise<WalletRecord> {
    const id = randomUUID();
    const query = trx ?? this.knex;

    await query<WalletRow>('wallets').insert({
      id,
      user_id: input.userId,
      balance_minor: input.balanceMinor ?? 0,
      currency: input.currency ?? 'NGN',
    });

    const row = await query<WalletRow>('wallets').where({ id }).first();

    if (!row) {
      throw new Error('Wallet record was not found after creation');
    }

    return toRecord(row);
  }
}

export const walletRepository = new WalletRepository();
