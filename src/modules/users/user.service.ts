import { transactionRunner } from '../../database/transaction';
import { AppError } from '../../shared/errors';
import { blacklistRepository } from '../blacklist/blacklist.repository';
import { blacklistService } from '../blacklist/blacklist.service';
import type { BlacklistLookupInput } from '../blacklist/blacklist.types';
import { walletRepository } from '../wallets/wallet.repository';
import { userRepository } from './user.repository';
import type { CreateUserInput, CreateUserResult, UserServiceDependencies } from './user.types';

const normalizeCreateUserInput = (input: CreateUserInput): CreateUserInput => ({
  firstName: input.firstName.trim(),
  lastName: input.lastName.trim(),
  email: input.email.trim().toLowerCase(),
  phone: input.phone.trim(),
  bvn: input.bvn?.trim() || undefined,
});

const getBlacklistIdentities = (input: CreateUserInput): BlacklistLookupInput[] => {
  const identities: BlacklistLookupInput[] = [
    {
      identity: input.email,
      identityType: 'EMAIL',
    },
    {
      identity: input.phone,
      identityType: 'PHONE',
    },
  ];

  if (input.bvn) {
    identities.push({
      identity: input.bvn,
      identityType: 'BVN',
    });
  }

  return identities;
};

export class UserService {
  constructor(
    private readonly dependencies: UserServiceDependencies = {
      users: userRepository,
      wallets: walletRepository,
      blacklist: blacklistService,
      blacklistChecks: blacklistRepository,
      transactions: transactionRunner,
    },
  ) {}

  async createUser(rawInput: CreateUserInput): Promise<CreateUserResult> {
    const input = normalizeCreateUserInput(rawInput);

    const existingEmail = await this.dependencies.users.findByEmail(input.email);

    if (existingEmail) {
      throw AppError.conflict('Email is already in use', 'DUPLICATE_EMAIL');
    }

    const existingPhone = await this.dependencies.users.findByPhone(input.phone);

    if (existingPhone) {
      throw AppError.conflict('Phone is already in use', 'DUPLICATE_PHONE');
    }

    const blacklistResults = await this.dependencies.blacklist.ensureIdentitiesAreAllowed(
      getBlacklistIdentities(input),
    );
    const blacklistCheckIds = blacklistResults.map((result) => result.check.id);

    return this.dependencies.transactions.run(async (trx) => {
      const user = await this.dependencies.users.create(input, trx);
      const wallet = await this.dependencies.wallets.create(
        {
          userId: user.id,
          balanceMinor: 0,
          currency: 'NGN',
        },
        trx,
      );

      await this.dependencies.blacklistChecks.attachToUser(blacklistCheckIds, user.id, trx);

      return {
        user,
        wallet,
      };
    });
  }
}

export const userService = new UserService();
