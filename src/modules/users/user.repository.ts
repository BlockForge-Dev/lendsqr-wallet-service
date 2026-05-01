import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';

import { db } from '../../database/knex';
import type { DatabaseTransaction } from '../../database/transaction';
import type { CreateUserInput, UserRecord } from './user.types';

type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bvn: string | null;
  created_at: Date;
  updated_at: Date;
};

const toRecord = (row: UserRow): UserRecord => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone,
  bvn: row.bvn,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class UserRepository {
  constructor(private readonly knex: Knex = db) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.knex<UserRow>('users').where({ email }).first();

    return row ? toRecord(row) : null;
  }

  async findByPhone(phone: string): Promise<UserRecord | null> {
    const row = await this.knex<UserRow>('users').where({ phone }).first();

    return row ? toRecord(row) : null;
  }

  async create(input: CreateUserInput, trx?: DatabaseTransaction): Promise<UserRecord> {
    const id = randomUUID();
    const query = trx ?? this.knex;

    await query<UserRow>('users').insert({
      id,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      bvn: input.bvn ?? null,
    });

    const row = await query<UserRow>('users').where({ id }).first();

    if (!row) {
      throw new Error('User record was not found after creation');
    }

    return toRecord(row);
  }
}

export const userRepository = new UserRepository();
