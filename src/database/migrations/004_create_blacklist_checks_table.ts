import type { Knex } from 'knex';

const identityTypes = ['EMAIL', 'PHONE', 'BVN'];

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('blacklist_checks', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').nullable();
    table.string('identity', 255).notNullable();
    table.enu('identity_type', identityTypes).notNullable();
    table.string('provider', 50).notNullable().defaultTo('ADJUTOR_KARMA');
    table.boolean('is_blacklisted').notNullable();
    table.json('response_payload').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onUpdate('CASCADE')
      .onDelete('SET NULL');
    table.index(['identity', 'identity_type'], 'blacklist_checks_identity_index');
    table.index(['user_id'], 'blacklist_checks_user_id_index');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('blacklist_checks');
}
