import type { Knex } from 'knex';
import path from 'node:path';

import { env } from './env';

type DatabaseConfigOptions = {
  databaseName?: string;
  pool?: Knex.PoolConfig;
};

export const buildDatabaseConfig = (options: DatabaseConfigOptions = {}): Knex.Config => ({
  client: 'mysql2',
  connection: {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: options.databaseName ?? env.DATABASE_NAME,
    supportBigNumbers: true,
    bigNumberStrings: true,
  },
  migrations: {
    directory: path.resolve(__dirname, '../database/migrations'),
    extension: 'ts',
    tableName: 'knex_migrations',
  },
  pool: options.pool ?? {
    min: 0,
    max: 10,
  },
});

export const databaseConfig = buildDatabaseConfig();
