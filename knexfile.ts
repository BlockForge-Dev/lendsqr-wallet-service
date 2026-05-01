import type { Knex } from 'knex';

import { buildDatabaseConfig } from './src/config/database';

const config: Record<string, Knex.Config> = {
  development: buildDatabaseConfig(),
  test: buildDatabaseConfig({
    databaseName: process.env.DATABASE_NAME ?? 'lendsqr_wallet_service_test',
  }),
  production: buildDatabaseConfig({
    pool: {
      min: 2,
      max: 20,
    },
  }),
};

export default config;
