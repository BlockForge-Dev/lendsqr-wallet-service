import { AppError } from '../../shared/errors';
import { adjutorClient } from './adjutor.client';
import { blacklistRepository } from './blacklist.repository';
import {
  ADJUTOR_KARMA_PROVIDER,
  type AdjutorKarmaLookupResponse,
  type BlacklistCheckWriter,
  type BlacklistLookupInput,
  type BlacklistLookupResult,
  type KarmaLookupClient,
} from './blacklist.types';

const hasKarmaData = (response: AdjutorKarmaLookupResponse): boolean => {
  if (!response.data) {
    return false;
  }

  if (Array.isArray(response.data)) {
    return response.data.length > 0;
  }

  return Object.keys(response.data).length > 0;
};

export class BlacklistService {
  constructor(
    private readonly client: KarmaLookupClient = adjutorClient,
    private readonly checks: BlacklistCheckWriter = blacklistRepository,
  ) {}

  async checkIdentity(input: BlacklistLookupInput): Promise<BlacklistLookupResult> {
    const responsePayload = await this.client.lookupKarma(input.identity);
    const isBlacklisted = hasKarmaData(responsePayload);

    const check = await this.checks.create({
      identity: input.identity,
      identityType: input.identityType,
      provider: ADJUTOR_KARMA_PROVIDER,
      isBlacklisted,
      responsePayload,
      userId: input.userId,
    });

    return {
      isBlacklisted,
      check,
    };
  }

  async ensureIdentityIsAllowed(input: BlacklistLookupInput): Promise<BlacklistLookupResult> {
    const result = await this.checkIdentity(input);

    if (result.isBlacklisted) {
      throw AppError.forbidden('User failed Karma blacklist check', 'USER_BLACKLISTED', {
        identity: input.identity,
        identityType: input.identityType,
        blacklistCheckId: result.check.id,
      });
    }

    return result;
  }

  async ensureIdentitiesAreAllowed(
    identities: BlacklistLookupInput[],
  ): Promise<BlacklistLookupResult[]> {
    const results: BlacklistLookupResult[] = [];

    for (const identity of identities) {
      results.push(await this.ensureIdentityIsAllowed(identity));
    }

    return results;
  }
}

export const blacklistService = new BlacklistService();
