import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';

import { db } from '../../database/knex';
import type { DatabaseTransaction } from '../../database/transaction';
import type { CreateTransactionInput, TransactionRecord } from './transaction.types';

type TransactionRow = {
  id: string;
  reference: string;
  wallet_id: string;
  type: TransactionRecord['type'];
  amount_minor: number | string;
  balance_before_minor: number | string;
  balance_after_minor: number | string;
  status: TransactionRecord['status'];
  counterparty_wallet_id: string | null;
  related_transaction_id: string | null;
  description: string | null;
  created_at: Date;
};

const toRecord = (row: TransactionRow): TransactionRecord => ({
  id: row.id,
  reference: row.reference,
  walletId: row.wallet_id,
  type: row.type,
  amountMinor: Number(row.amount_minor),
  balanceBeforeMinor: Number(row.balance_before_minor),
  balanceAfterMinor: Number(row.balance_after_minor),
  status: row.status,
  counterpartyWalletId: row.counterparty_wallet_id,
  relatedTransactionId: row.related_transaction_id,
  description: row.description,
  createdAt: row.created_at,
});

export class TransactionRepository {
  constructor(private readonly knex: Knex = db) {}

  async create(
    input: CreateTransactionInput,
    trx?: DatabaseTransaction,
  ): Promise<TransactionRecord> {
    const id = randomUUID();
    const query = trx ?? this.knex;

    await query<TransactionRow>('transactions').insert({
      id,
      reference: input.reference,
      wallet_id: input.walletId,
      type: input.type,
      amount_minor: input.amountMinor,
      balance_before_minor: input.balanceBeforeMinor,
      balance_after_minor: input.balanceAfterMinor,
      status: input.status,
      counterparty_wallet_id: input.counterpartyWalletId ?? null,
      related_transaction_id: input.relatedTransactionId ?? null,
      description: input.description ?? null,
    });

    const row = await query<TransactionRow>('transactions').where({ id }).first();

    if (!row) {
      throw new Error('Transaction record was not found after creation');
    }

    return toRecord(row);
  }
}

export const transactionRepository = new TransactionRepository();
