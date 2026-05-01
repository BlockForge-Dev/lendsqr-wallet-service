import type { DatabaseTransaction } from '../database/transaction';
import type { TransactionRecord } from '../modules/transactions/transaction.types';
import { WalletService } from '../modules/wallets/wallet.service';
import type { WalletFundingDependencies, WalletRecord } from '../modules/wallets/wallet.types';

const createdAt = new Date('2026-05-01T10:00:00.000Z');
const trx = { transaction: true } as unknown as DatabaseTransaction;

const wallet: WalletRecord = {
  id: 'wallet-123',
  userId: 'user-123',
  balanceMinor: 10_000,
  currency: 'NGN',
  createdAt,
  updatedAt: createdAt,
};

const transaction: TransactionRecord = {
  id: 'transaction-123',
  reference: 'FUND-reference',
  walletId: 'wallet-123',
  type: 'FUND',
  amountMinor: 5_000,
  balanceBeforeMinor: 5_000,
  balanceAfterMinor: 10_000,
  status: 'SUCCESS',
  counterpartyWalletId: null,
  relatedTransactionId: null,
  description: 'Initial wallet funding',
  createdAt,
};

const createDependencies = (
  overrides: Partial<WalletFundingDependencies> = {},
): jest.Mocked<WalletFundingDependencies> => {
  const dependencies: jest.Mocked<WalletFundingDependencies> = {
    wallets: {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(wallet),
      findByIdForUpdate: jest.fn(),
      updateBalance: jest.fn(),
    },
    transactions: {
      create: jest.fn(),
      listByWalletId: jest.fn().mockResolvedValue({
        transactions: [transaction],
        pagination: {
          page: 2,
          limit: 10,
          total: 21,
          totalPages: 3,
        },
      }),
    },
    transactionRunner: {
      run: jest.fn(async (callback) => callback(trx)),
    },
  };

  return {
    ...dependencies,
    ...overrides,
  };
};

describe('WalletService.listWalletTransactions', () => {
  it('lists wallet transactions after checking ownership', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.listWalletTransactions({
        walletId: 'wallet-123',
        userId: 'user-123',
        page: 2,
        limit: 10,
      }),
    ).resolves.toEqual({
      transactions: [transaction],
      pagination: {
        page: 2,
        limit: 10,
        total: 21,
        totalPages: 3,
      },
    });

    expect(dependencies.wallets.findById).toHaveBeenCalledWith('wallet-123');
    expect(dependencies.transactions.listByWalletId).toHaveBeenCalledWith({
      walletId: 'wallet-123',
      page: 2,
      limit: 10,
    });
  });

  it('rejects missing wallets', async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.wallets.findById).mockResolvedValue(null);
    const service = new WalletService(dependencies);

    await expect(
      service.listWalletTransactions({
        walletId: 'missing-wallet',
        userId: 'user-123',
        page: 1,
        limit: 20,
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'WALLET_NOT_FOUND',
    });

    expect(dependencies.transactions.listByWalletId).not.toHaveBeenCalled();
  });

  it('rejects access to another user wallet', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.listWalletTransactions({
        walletId: 'wallet-123',
        userId: 'different-user',
        page: 1,
        limit: 20,
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'WALLET_FORBIDDEN',
    });

    expect(dependencies.transactions.listByWalletId).not.toHaveBeenCalled();
  });
});
