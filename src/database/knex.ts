import knex from 'knex';

import { databaseConfig } from '../config/database';

export const db = knex(databaseConfig);

export const closeDatabase = async (): Promise<void> => {
  await db.destroy();
};
