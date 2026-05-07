import type { Knex } from 'knex';
import path from 'node:path';

import { env } from './env';

type DatabaseConfigOptions = {
  databaseName?: string;
  pool?: Knex.PoolConfig;
};

const buildSslConfig = (): Record<string, string | boolean> | undefined => {
  if (!env.DATABASE_SSL) {
    return undefined;
  }

  return {
    rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED,
    ...(env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA.replace(/\\n/g, '\n') } : {}),
  };
};

const getMigrationExtension = (): 'ts' | 'js' => {
  return __filename.endsWith('.ts') ? 'ts' : 'js';
};

const migrationExtension = getMigrationExtension();

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
    ssl: buildSslConfig(),
  },
  migrations: {
    directory: path.resolve(__dirname, '../database/migrations'),
    extension: migrationExtension,
    loadExtensions: [`.${migrationExtension}`],
    tableName: 'knex_migrations',
  },
  pool: options.pool ?? {
    min: 0,
    max: 10,
  },
});

export const databaseConfig = buildDatabaseConfig();
