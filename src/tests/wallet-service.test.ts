import type { DatabaseTransaction } from '../database/transaction';
import { WalletService } from '../modules/wallets/wallet.service';
import type { WalletFundingDependencies, WalletRecord } from '../modules/wallets/wallet.types';
import type { TransactionRecord } from '../modules/transactions/transaction.types';

const createdAt = new Date('2026-05-01T10:00:00.000Z');
const trx = { transaction: true } as unknown as DatabaseTransaction;

const wallet: WalletRecord = {
  id: 'wallet-123',
  userId: 'user-123',
  balanceMinor: 5_000,
  currency: 'NGN',
  createdAt,
  updatedAt: createdAt,
};

const fundedWallet: WalletRecord = {
  ...wallet,
  balanceMinor: 10_000,
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
      findByIdForUpdate: jest.fn().mockResolvedValue(wallet),
      updateBalance: jest.fn().mockResolvedValue(fundedWallet),
    },
    transactions: {
      create: jest.fn().mockResolvedValue(transaction),
      listByWalletId: jest.fn().mockResolvedValue({
        transactions: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
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

describe('WalletService.fundWallet', () => {
  it('funds a wallet and creates a FUND transaction atomically', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.fundWallet({
        walletId: 'wallet-123',
        userId: 'user-123',
        amountMinor: 5_000,
        description: ' Initial wallet funding ',
      }),
    ).resolves.toEqual({
      wallet: fundedWallet,
      transaction,
    });

    expect(dependencies.transactionRunner.run).toHaveBeenCalledTimes(1);
    expect(dependencies.wallets.findByIdForUpdate).toHaveBeenCalledWith('wallet-123', trx);
    expect(dependencies.wallets.updateBalance).toHaveBeenCalledWith('wallet-123', 10_000, trx);
    expect(dependencies.transactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        walletId: 'wallet-123',
        type: 'FUND',
        amountMinor: 5_000,
        balanceBeforeMinor: 5_000,
        balanceAfterMinor: 10_000,
        status: 'SUCCESS',
        description: 'Initial wallet funding',
      }),
      trx,
    );
    expect(jest.mocked(dependencies.transactions.create).mock.calls[0]?.[0].reference).toMatch(
      /^FUND-/,
    );
  });

  it('rejects invalid amounts before opening a transaction', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.fundWallet({
        walletId: 'wallet-123',
        userId: 'user-123',
        amountMinor: 0,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      errorCode: 'INVALID_AMOUNT',
    });

    expect(dependencies.transactionRunner.run).not.toHaveBeenCalled();
  });

  it('rejects missing wallets without updating balance', async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.wallets.findByIdForUpdate).mockResolvedValue(null);
    const service = new WalletService(dependencies);

    await expect(
      service.fundWallet({
        walletId: 'missing-wallet',
        userId: 'user-123',
        amountMinor: 5_000,
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'WALLET_NOT_FOUND',
    });

    expect(dependencies.wallets.updateBalance).not.toHaveBeenCalled();
    expect(dependencies.transactions.create).not.toHaveBeenCalled();
  });

  it('rejects wallet access for another user without updating balance', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.fundWallet({
        walletId: 'wallet-123',
        userId: 'different-user',
        amountMinor: 5_000,
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'WALLET_FORBIDDEN',
    });

    expect(dependencies.wallets.updateBalance).not.toHaveBeenCalled();
    expect(dependencies.transactions.create).not.toHaveBeenCalled();
  });

  it('does not create a transaction if balance update fails', async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.wallets.updateBalance).mockRejectedValue(new Error('update failed'));
    const service = new WalletService(dependencies);

    await expect(
      service.fundWallet({
        walletId: 'wallet-123',
        userId: 'user-123',
        amountMinor: 5_000,
      }),
    ).rejects.toThrow('update failed');

    expect(dependencies.transactions.create).not.toHaveBeenCalled();
  });
});
