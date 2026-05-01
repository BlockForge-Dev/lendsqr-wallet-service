import type { Knex } from 'knex';

import { db } from './knex';

export type DatabaseTransaction = Knex.Transaction;

export type TransactionRunner = {
  run<T>(callback: (trx: DatabaseTransaction) => Promise<T>): Promise<T>;
};

export class KnexTransactionRunner implements TransactionRunner {
  constructor(private readonly knex: Knex = db) {}

  async run<T>(callback: (trx: DatabaseTransaction) => Promise<T>): Promise<T> {
    return this.knex.transaction(callback);
  }
}

export const transactionRunner = new KnexTransactionRunner();
