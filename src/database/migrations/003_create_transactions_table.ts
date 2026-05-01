import type { Knex } from 'knex';

const transactionTypes = ['FUND', 'WITHDRAW', 'TRANSFER_IN', 'TRANSFER_OUT'];
const transactionStatuses = ['SUCCESS', 'FAILED'];

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary();
    table.string('reference', 80).notNullable().unique();
    table.uuid('wallet_id').notNullable();
    table.enu('type', transactionTypes).notNullable();
    table.bigInteger('amount_minor').unsigned().notNullable();
    table.bigInteger('balance_before_minor').unsigned().notNullable();
    table.bigInteger('balance_after_minor').unsigned().notNullable();
    table.enu('status', transactionStatuses).notNullable();
    table.uuid('counterparty_wallet_id').nullable();
    table.uuid('related_transaction_id').nullable();
    table.string('description', 255).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table
      .foreign('wallet_id')
      .references('id')
      .inTable('wallets')
      .onUpdate('CASCADE')
      .onDelete('RESTRICT');
    table
      .foreign('counterparty_wallet_id')
      .references('id')
      .inTable('wallets')
      .onUpdate('CASCADE')
      .onDelete('SET NULL');
    table
      .foreign('related_transaction_id')
      .references('id')
      .inTable('transactions')
      .onUpdate('CASCADE')
      .onDelete('SET NULL');
    table.index(['wallet_id', 'created_at'], 'transactions_wallet_created_at_index');
    table.index(['counterparty_wallet_id'], 'transactions_counterparty_wallet_id_index');
    table.check('amount_minor > 0', [], 'transactions_amount_minor_positive_check');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transactions');
}
