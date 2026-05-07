import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';

import { db } from '../../database/knex';
import type { DatabaseTransaction } from '../../database/transaction';
import {
  ADJUTOR_KARMA_PROVIDER,
  type AdjutorKarmaLookupResponse,
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
  response_payload: Buffer | string | Record<string, unknown> | null;
  created_at: Date;
};

export const parseBlacklistResponsePayload = (
  payload: BlacklistCheckRow['response_payload'],
): AdjutorKarmaLookupResponse => {
  if (!payload) {
    return {
      data: null,
    };
  }

  if (Buffer.isBuffer(payload)) {
    return parseBlacklistResponsePayload(payload.toString('utf8'));
  }

  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload) as AdjutorKarmaLookupResponse | string;

      return typeof parsed === 'string' ? parseBlacklistResponsePayload(parsed) : parsed;
    } catch {
      return {
        status: 'unknown',
        message: 'Stored provider payload could not be parsed',
        data: null,
        meta: {
          rawPayload: payload,
        },
      };
    }
  }

  return payload as AdjutorKarmaLookupResponse;
};

const toRecord = (row: BlacklistCheckRow): BlacklistCheckRecord => ({
  id: row.id,
  userId: row.user_id,
  identity: row.identity,
  identityType: row.identity_type,
  provider: row.provider,
  isBlacklisted: Boolean(row.is_blacklisted),
  responsePayload: parseBlacklistResponsePayload(row.response_payload),
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

  async attachToUser(checkIds: string[], userId: string, trx?: DatabaseTransaction): Promise<void> {
    if (checkIds.length === 0) {
      return;
    }

    const query = trx ?? this.knex;

    await query<BlacklistCheckRow>('blacklist_checks').whereIn('id', checkIds).update({
      user_id: userId,
    });
  }
}

export const blacklistRepository = new BlacklistRepository();
