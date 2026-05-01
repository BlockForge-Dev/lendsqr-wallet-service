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

const withdrawnWallet: WalletRecord = {
  ...wallet,
  balanceMinor: 6_000,
};

const transaction: TransactionRecord = {
  id: 'transaction-123',
  reference: 'WITHDRAW-reference',
  walletId: 'wallet-123',
  type: 'WITHDRAW',
  amountMinor: 4_000,
  balanceBeforeMinor: 10_000,
  balanceAfterMinor: 6_000,
  status: 'SUCCESS',
  counterpartyWalletId: null,
  relatedTransactionId: null,
  description: 'Wallet withdrawal',
  createdAt,
};

const createDependencies = (
  overrides: Partial<WalletFundingDependencies> = {},
): jest.Mocked<WalletFundingDependencies> => {
  const dependencies: jest.Mocked<WalletFundingDependencies> = {
    wallets: {
      create: jest.fn(),
      findByIdForUpdate: jest.fn().mockResolvedValue(wallet),
      updateBalance: jest.fn().mockResolvedValue(withdrawnWallet),
    },
    transactions: {
      create: jest.fn().mockResolvedValue(transaction),
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

describe('WalletService.withdrawWallet', () => {
  it('withdraws from a wallet and creates a WITHDRAW transaction atomically', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.withdrawWallet({
        walletId: 'wallet-123',
        userId: 'user-123',
        amountMinor: 4_000,
        description: ' Wallet withdrawal ',
      }),
    ).resolves.toEqual({
      wallet: withdrawnWallet,
      transaction,
    });

    expect(dependencies.transactionRunner.run).toHaveBeenCalledTimes(1);
    expect(dependencies.wallets.findByIdForUpdate).toHaveBeenCalledWith('wallet-123', trx);
    expect(dependencies.wallets.updateBalance).toHaveBeenCalledWith('wallet-123', 6_000, trx);
    expect(dependencies.transactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        walletId: 'wallet-123',
        type: 'WITHDRAW',
        amountMinor: 4_000,
        balanceBeforeMinor: 10_000,
        balanceAfterMinor: 6_000,
        status: 'SUCCESS',
        description: 'Wallet withdrawal',
      }),
      trx,
    );
    expect(jest.mocked(dependencies.transactions.create).mock.calls[0]?.[0].reference).toMatch(
      /^WITHDRAW-/,
    );
  });

  it('rejects invalid amounts before opening a transaction', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.withdrawWallet({
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

  it('rejects insufficient funds without updating balance', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.withdrawWallet({
        walletId: 'wallet-123',
        userId: 'user-123',
        amountMinor: 10_001,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      errorCode: 'INSUFFICIENT_FUNDS',
    });

    expect(dependencies.wallets.updateBalance).not.toHaveBeenCalled();
    expect(dependencies.transactions.create).not.toHaveBeenCalled();
  });

  it('rejects missing wallets without updating balance', async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.wallets.findByIdForUpdate).mockResolvedValue(null);
    const service = new WalletService(dependencies);

    await expect(
      service.withdrawWallet({
        walletId: 'missing-wallet',
        userId: 'user-123',
        amountMinor: 4_000,
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
      service.withdrawWallet({
        walletId: 'wallet-123',
        userId: 'different-user',
        amountMinor: 4_000,
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'WALLET_FORBIDDEN',
    });

    expect(dependencies.wallets.updateBalance).not.toHaveBeenCalled();
    expect(dependencies.transactions.create).not.toHaveBeenCalled();
  });
});
