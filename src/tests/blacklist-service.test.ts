import { AppError } from '../shared/errors';
import { BlacklistService } from '../modules/blacklist/blacklist.service';
import {
  ADJUTOR_KARMA_PROVIDER,
  type BlacklistCheckRecord,
  type BlacklistCheckWriter,
  type CreateBlacklistCheckInput,
  type KarmaLookupClient,
} from '../modules/blacklist/blacklist.types';

const createMockRepository = (): jest.Mocked<BlacklistCheckWriter> => {
  return {
    create: jest.fn(async (input: CreateBlacklistCheckInput): Promise<BlacklistCheckRecord> => {
      return {
        id: 'check-123',
        userId: input.userId ?? null,
        identity: input.identity,
        identityType: input.identityType,
        provider: input.provider ?? ADJUTOR_KARMA_PROVIDER,
        isBlacklisted: input.isBlacklisted,
        responsePayload: input.responsePayload,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      };
    }),
  };
};

describe('BlacklistService', () => {
  it('persists a non-blacklisted Karma check result', async () => {
    const client: jest.Mocked<KarmaLookupClient> = {
      lookupKarma: jest.fn().mockResolvedValue({
        status: 'success',
        message: 'Successful',
        data: null,
      }),
    };
    const repository = createMockRepository();
    const service = new BlacklistService(client, repository);

    const result = await service.ensureIdentityIsAllowed({
      identity: 'safe@example.com',
      identityType: 'EMAIL',
    });

    expect(result.isBlacklisted).toBe(false);
    expect(repository.create).toHaveBeenCalledWith({
      identity: 'safe@example.com',
      identityType: 'EMAIL',
      provider: ADJUTOR_KARMA_PROVIDER,
      isBlacklisted: false,
      responsePayload: {
        status: 'success',
        message: 'Successful',
        data: null,
      },
      userId: undefined,
    });
  });

  it('persists and rejects a blacklisted identity', async () => {
    const client: jest.Mocked<KarmaLookupClient> = {
      lookupKarma: jest.fn().mockResolvedValue({
        status: 'success',
        message: 'Successful',
        data: {
          karma_identity: 'bad@example.com',
          reason: 'Loan default',
        },
      }),
    };
    const repository = createMockRepository();
    const service = new BlacklistService(client, repository);

    await expect(
      service.ensureIdentityIsAllowed({
        identity: 'bad@example.com',
        identityType: 'EMAIL',
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'USER_BLACKLISTED',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        identity: 'bad@example.com',
        identityType: 'EMAIL',
        provider: ADJUTOR_KARMA_PROVIDER,
        isBlacklisted: true,
      }),
    );
  });

  it('fails closed and does not persist a check when provider verification fails', async () => {
    const client: jest.Mocked<KarmaLookupClient> = {
      lookupKarma: jest
        .fn()
        .mockRejectedValue(
          new AppError(
            'Unable to complete Karma blacklist verification',
            503,
            'BLACKLIST_PROVIDER_UNAVAILABLE',
          ),
        ),
    };
    const repository = createMockRepository();
    const service = new BlacklistService(client, repository);

    await expect(
      service.ensureIdentityIsAllowed({
        identity: 'unknown@example.com',
        identityType: 'EMAIL',
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      errorCode: 'BLACKLIST_PROVIDER_UNAVAILABLE',
    });

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('checks multiple identities sequentially', async () => {
    const client: jest.Mocked<KarmaLookupClient> = {
      lookupKarma: jest.fn().mockResolvedValue({
        status: 'success',
        message: 'Successful',
        data: null,
      }),
    };
    const repository = createMockRepository();
    const service = new BlacklistService(client, repository);

    await service.ensureIdentitiesAreAllowed([
      {
        identity: 'safe@example.com',
        identityType: 'EMAIL',
      },
      {
        identity: '08000000000',
        identityType: 'PHONE',
      },
    ]);

    expect(client.lookupKarma).toHaveBeenNthCalledWith(1, 'safe@example.com');
    expect(client.lookupKarma).toHaveBeenNthCalledWith(2, '08000000000');
    expect(repository.create).toHaveBeenCalledTimes(2);
  });
});
