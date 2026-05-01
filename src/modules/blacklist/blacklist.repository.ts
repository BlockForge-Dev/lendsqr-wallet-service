import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';

import { db } from '../../database/knex';
import {
  ADJUTOR_KARMA_PROVIDER,
  type BlacklistCheckRecord,
  type CreateBlacklistCheckInput,
} from './blacklist.types';

type BlacklistCheckRow = {
  id: string;
  user_id: string | null;
  identity: string;
  identity_type: BlacklistCheckRecord['identityType'];
  provider: typeof ADJUTOR_KARMA_PROVIDER;
  is_blacklisted: number | boolean;
  response_payload: string | Record<string, unknown>;
  created_at: Date;
};

const toRecord = (row: BlacklistCheckRow): BlacklistCheckRecord => ({
  id: row.id,
  userId: row.user_id,
  identity: row.identity,
  identityType: row.identity_type,
  provider: row.provider,
  isBlacklisted: Boolean(row.is_blacklisted),
  responsePayload:
    typeof row.response_payload === 'string'
      ? (JSON.parse(row.response_payload) as BlacklistCheckRecord['responsePayload'])
      : (row.response_payload as BlacklistCheckRecord['responsePayload']),
  createdAt: row.created_at,
});

export class BlacklistRepository {
  constructor(private readonly knex: Knex = db) {}

  async create(input: CreateBlacklistCheckInput): Promise<BlacklistCheckRecord> {
    const id = randomUUID();

    await this.knex<BlacklistCheckRow>('blacklist_checks').insert({
      id,
      user_id: input.userId ?? null,
      identity: input.identity,
      identity_type: input.identityType,
      provider: input.provider ?? ADJUTOR_KARMA_PROVIDER,
      is_blacklisted: input.isBlacklisted,
      response_payload: JSON.stringify(input.responsePayload),
    });

    const row = await this.knex<BlacklistCheckRow>('blacklist_checks').where({ id }).first();

    if (!row) {
      throw new Error('Blacklist check record was not found after creation');
    }

    return toRecord(row);
  }
}

export const blacklistRepository = new BlacklistRepository();
