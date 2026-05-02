import type { DatabaseTransaction } from '../database/transaction';
import { AppError } from '../shared/errors';
import { UserService } from '../modules/users/user.service';
import type {
  CreateUserInput,
  UserRecord,
  UserServiceDependencies,
} from '../modules/users/user.types';
import type { WalletRecord } from '../modules/wallets/wallet.types';

const createdAt = new Date('2026-05-01T10:00:00.000Z');
const updatedAt = new Date('2026-05-01T10:00:00.000Z');
const trx = { transaction: true } as unknown as DatabaseTransaction;

const user: UserRecord = {
  id: 'user-123',
  firstName: 'Obinna',
  lastName: 'Victor',
  email: 'obinna@example.com',
  phone: '08000000000',
  bvn: '12345678901',
  createdAt,
  updatedAt,
};

const wallet: WalletRecord = {
  id: 'wallet-123',
  userId: 'user-123',
  balanceMinor: 0,
  currency: 'NGN',
  createdAt,
  updatedAt,
};

const input: CreateUserInput = {
  firstName: ' Obinna ',
  lastName: ' Victor ',
  email: 'OBINNA@example.com',
  phone: '08000000000',
  bvn: '12345678901',
};

const createDependencies = (
  overrides: Partial<UserServiceDependencies> = {},
): jest.Mocked<UserServiceDependencies> => {
  const dependencies: jest.Mocked<UserServiceDependencies> = {
    users: {
      findByEmail: jest.fn().mockResolvedValue(null),
      findByPhone: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(user),
    },
    wallets: {
      create: jest.fn().mockResolvedValue(wallet),
    },
    blacklist: {
      ensureIdentitiesAreAllowed: jest.fn().mockResolvedValue([
        {
          isBlacklisted: false,
          check: {
            id: 'check-email',
            userId: null,
            identity: 'obinna@example.com',
            identityType: 'EMAIL',
            provider: 'ADJUTOR_KARMA',
            isBlacklisted: false,
            responsePayload: {
              data: null,
            },
            createdAt,
          },
        },
        {
          isBlacklisted: false,
          check: {
            id: 'check-phone',
            userId: null,
            identity: '08000000000',
            identityType: 'PHONE',
            provider: 'ADJUTOR_KARMA',
            isBlacklisted: false,
            responsePayload: {
              data: null,
            },
            createdAt,
          },
        },
        {
          isBlacklisted: false,
          check: {
            id: 'check-bvn',
            userId: null,
            identity: '12345678901',
            identityType: 'BVN',
            provider: 'ADJUTOR_KARMA',
            isBlacklisted: false,
            responsePayload: {
              data: null,
            },
            createdAt,
          },
        },
      ]),
    },
    blacklistChecks: {
      attachToUser: jest.fn().mockResolvedValue(undefined),
    },
    transactions: {
      run: jest.fn(async (callback) => callback(trx)),
    },
  };

  return {
    ...dependencies,
    ...overrides,
  };
};

describe('UserService', () => {
  it('creates a user and wallet after duplicate and blacklist checks pass', async () => {
    const dependencies = createDependencies();
    const service = new UserService(dependencies);

    await expect(service.createUser(input)).resolves.toEqual({
      user,
      wallet,
    });

    expect(dependencies.users.findByEmail).toHaveBeenCalledWith('obinna@example.com');
    expect(dependencies.users.findByPhone).toHaveBeenCalledWith('08000000000');
    expect(dependencies.blacklist.ensureIdentitiesAreAllowed).toHaveBeenCalledWith([
      {
        identity: 'obinna@example.com',
        identityType: 'EMAIL',
      },
      {
        identity: '08000000000',
        identityType: 'PHONE',
      },
      {
        identity: '12345678901',
        identityType: 'BVN',
      },
    ]);
    expect(dependencies.transactions.run).toHaveBeenCalledTimes(1);
    expect(dependencies.users.create).toHaveBeenCalledWith(
      {
        firstName: 'Obinna',
        lastName: 'Victor',
        email: 'obinna@example.com',
        phone: '08000000000',
        bvn: '12345678901',
      },
      trx,
    );
    expect(dependencies.wallets.create).toHaveBeenCalledWith(
      {
        userId: 'user-123',
        balanceMinor: 0,
        currency: 'NGN',
      },
      trx,
    );
    expect(dependencies.blacklistChecks.attachToUser).toHaveBeenCalledWith(
      ['check-email', 'check-phone', 'check-bvn'],
      'user-123',
      trx,
    );
  });

  it('rejects duplicate email before calling Karma', async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.users.findByEmail).mockResolvedValue(user);
    const service = new UserService(dependencies);

    await expect(service.createUser(input)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'DUPLICATE_EMAIL',
    });

    expect(dependencies.users.findByPhone).not.toHaveBeenCalled();
    expect(dependencies.blacklist.ensureIdentitiesAreAllowed).not.toHaveBeenCalled();
    expect(dependencies.transactions.run).not.toHaveBeenCalled();
  });

  it('rejects duplicate phone before calling Karma', async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.users.findByPhone).mockResolvedValue(user);
    const service = new UserService(dependencies);

    await expect(service.createUser(input)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'DUPLICATE_PHONE',
    });

    expect(dependencies.blacklist.ensureIdentitiesAreAllowed).not.toHaveBeenCalled();
    expect(dependencies.transactions.run).not.toHaveBeenCalled();
  });

  it('does not create user or wallet when Karma rejects the identity', async () => {
    const dependencies = createDependencies();
    jest
      .mocked(dependencies.blacklist.ensureIdentitiesAreAllowed)
      .mockRejectedValue(
        AppError.forbidden('User failed Karma blacklist check', 'USER_BLACKLISTED'),
      );
    const service = new UserService(dependencies);

    await expect(service.createUser(input)).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'USER_BLACKLISTED',
    });

    expect(dependencies.users.create).not.toHaveBeenCalled();
    expect(dependencies.wallets.create).not.toHaveBeenCalled();
    expect(dependencies.transactions.run).not.toHaveBeenCalled();
  });

  it('fails closed without persistence when Karma verification cannot be completed', async () => {
    const dependencies = createDependencies();
    jest
      .mocked(dependencies.blacklist.ensureIdentitiesAreAllowed)
      .mockRejectedValue(
        new AppError(
          'Karma blacklist verification could not be completed',
          503,
          'BLACKLIST_PROVIDER_UNAVAILABLE',
        ),
      );
    const service = new UserService(dependencies);

    await expect(service.createUser(input)).rejects.toMatchObject({
      statusCode: 503,
      errorCode: 'BLACKLIST_PROVIDER_UNAVAILABLE',
    });

    expect(dependencies.users.create).not.toHaveBeenCalled();
    expect(dependencies.wallets.create).not.toHaveBeenCalled();
    expect(dependencies.blacklistChecks.attachToUser).not.toHaveBeenCalled();
    expect(dependencies.transactions.run).not.toHaveBeenCalled();
  });

  it('does not create a wallet if user creation fails inside the transaction', async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.users.create).mockRejectedValue(new Error('insert failed'));
    const service = new UserService(dependencies);

    await expect(service.createUser(input)).rejects.toThrow('insert failed');

    expect(dependencies.transactions.run).toHaveBeenCalledTimes(1);
    expect(dependencies.wallets.create).not.toHaveBeenCalled();
    expect(dependencies.blacklistChecks.attachToUser).not.toHaveBeenCalled();
  });
});
