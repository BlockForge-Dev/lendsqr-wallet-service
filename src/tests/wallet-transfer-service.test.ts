import type { DatabaseTransaction } from '../database/transaction';
import type {
  CreateTransactionInput,
  TransactionRecord,
} from '../modules/transactions/transaction.types';
import { WalletService } from '../modules/wallets/wallet.service';
import type { WalletFundingDependencies, WalletRecord } from '../modules/wallets/wallet.types';

const createdAt = new Date('2026-05-01T10:00:00.000Z');
const trx = { transaction: true } as unknown as DatabaseTransaction;

const senderWallet: WalletRecord = {
  id: 'wallet-b',
  userId: 'sender-user',
  balanceMinor: 10_000,
  currency: 'NGN',
  createdAt,
  updatedAt: createdAt,
};

const recipientWallet: WalletRecord = {
  id: 'wallet-a',
  userId: 'recipient-user',
  balanceMinor: 2_000,
  currency: 'NGN',
  createdAt,
  updatedAt: createdAt,
};

const updatedSenderWallet: WalletRecord = {
  ...senderWallet,
  balanceMinor: 7_000,
};

const updatedRecipientWallet: WalletRecord = {
  ...recipientWallet,
  balanceMinor: 5_000,
};

const createTransactionRecord = (id: string, input: CreateTransactionInput): TransactionRecord => ({
  id,
  reference: input.reference,
  walletId: input.walletId,
  type: input.type,
  amountMinor: input.amountMinor,
  balanceBeforeMinor: input.balanceBeforeMinor,
  balanceAfterMinor: input.balanceAfterMinor,
  status: input.status,
  counterpartyWalletId: input.counterpartyWalletId ?? null,
  relatedTransactionId: input.relatedTransactionId ?? null,
  description: input.description ?? null,
  createdAt,
});

const createDependencies = (
  overrides: Partial<WalletFundingDependencies> = {},
): jest.Mocked<WalletFundingDependencies> => {
  const dependencies: jest.Mocked<WalletFundingDependencies> = {
    wallets: {
      create: jest.fn(),
      findById: jest.fn(async (walletId: string) => {
        if (walletId === senderWallet.id) {
          return senderWallet;
        }

        if (walletId === recipientWallet.id) {
          return recipientWallet;
        }

        return null;
      }),
      findByIdForUpdate: jest.fn(async (walletId: string) => {
        if (walletId === senderWallet.id) {
          return senderWallet;
        }

        if (walletId === recipientWallet.id) {
          return recipientWallet;
        }

        return null;
      }),
      updateBalance: jest.fn(async (walletId: string, balanceMinor: number) => {
        if (walletId === senderWallet.id) {
          return {
            ...senderWallet,
            balanceMinor,
          };
        }

        return {
          ...recipientWallet,
          balanceMinor,
        };
      }),
    },
    transactions: {
      create: jest.fn(async (input: CreateTransactionInput) => {
        return createTransactionRecord(
          input.type === 'TRANSFER_OUT' ? 'sender-transaction' : 'recipient-transaction',
          input,
        );
      }),
      updateRelatedTransaction: jest.fn(async (transactionId, relatedTransactionId) => {
        return {
          ...createTransactionRecord('sender-transaction', {
            reference: 'TRANSFER_OUT-reference',
            walletId: senderWallet.id,
            type: 'TRANSFER_OUT',
            amountMinor: 3_000,
            balanceBeforeMinor: 10_000,
            balanceAfterMinor: 7_000,
            status: 'SUCCESS',
            counterpartyWalletId: recipientWallet.id,
            description: 'Transfer to friend',
          }),
          id: transactionId,
          relatedTransactionId,
        };
      }),
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

describe('WalletService.transferWallet', () => {
  it('transfers between wallets atomically and links transaction records', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.transferWallet({
        senderWalletId: senderWallet.id,
        senderUserId: 'sender-user',
        recipientWalletId: recipientWallet.id,
        amountMinor: 3_000,
        description: ' Transfer to friend ',
      }),
    ).resolves.toEqual({
      senderWallet: updatedSenderWallet,
      recipientWallet: updatedRecipientWallet,
      senderTransaction: expect.objectContaining({
        id: 'sender-transaction',
        type: 'TRANSFER_OUT',
        relatedTransactionId: 'recipient-transaction',
      }),
      recipientTransaction: expect.objectContaining({
        id: 'recipient-transaction',
        type: 'TRANSFER_IN',
        relatedTransactionId: 'sender-transaction',
      }),
    });

    expect(dependencies.transactionRunner.run).toHaveBeenCalledTimes(1);
    expect(dependencies.wallets.findByIdForUpdate).toHaveBeenNthCalledWith(1, 'wallet-a', trx);
    expect(dependencies.wallets.findByIdForUpdate).toHaveBeenNthCalledWith(2, 'wallet-b', trx);
    expect(dependencies.wallets.updateBalance).toHaveBeenNthCalledWith(1, 'wallet-b', 7_000, trx);
    expect(dependencies.wallets.updateBalance).toHaveBeenNthCalledWith(2, 'wallet-a', 5_000, trx);
    expect(dependencies.transactions.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: 'TRANSFER_OUT',
        walletId: 'wallet-b',
        counterpartyWalletId: 'wallet-a',
        amountMinor: 3_000,
        balanceBeforeMinor: 10_000,
        balanceAfterMinor: 7_000,
        description: 'Transfer to friend',
      }),
      trx,
    );
    expect(dependencies.transactions.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'TRANSFER_IN',
        walletId: 'wallet-a',
        counterpartyWalletId: 'wallet-b',
        relatedTransactionId: 'sender-transaction',
        amountMinor: 3_000,
        balanceBeforeMinor: 2_000,
        balanceAfterMinor: 5_000,
        description: 'Transfer to friend',
      }),
      trx,
    );
    expect(dependencies.transactions.updateRelatedTransaction).toHaveBeenCalledWith(
      'sender-transaction',
      'recipient-transaction',
      trx,
    );
  });

  it('rejects invalid amounts before opening a transaction', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.transferWallet({
        senderWalletId: senderWallet.id,
        senderUserId: 'sender-user',
        recipientWalletId: recipientWallet.id,
        amountMinor: 0,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      errorCode: 'INVALID_AMOUNT',
    });

    expect(dependencies.transactionRunner.run).not.toHaveBeenCalled();
  });

  it('rejects same-wallet transfers before opening a transaction', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.transferWallet({
        senderWalletId: senderWallet.id,
        senderUserId: 'sender-user',
        recipientWalletId: senderWallet.id,
        amountMinor: 3_000,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      errorCode: 'SAME_WALLET_TRANSFER',
    });

    expect(dependencies.transactionRunner.run).not.toHaveBeenCalled();
  });

  it('rejects missing recipient wallets without debiting sender', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.transferWallet({
        senderWalletId: senderWallet.id,
        senderUserId: 'sender-user',
        recipientWalletId: 'missing-wallet',
        amountMinor: 3_000,
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'RECIPIENT_WALLET_NOT_FOUND',
    });

    expect(dependencies.wallets.updateBalance).not.toHaveBeenCalled();
    expect(dependencies.transactions.create).not.toHaveBeenCalled();
  });

  it('rejects missing sender wallets without crediting recipient', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.transferWallet({
        senderWalletId: 'missing-wallet',
        senderUserId: 'sender-user',
        recipientWalletId: recipientWallet.id,
        amountMinor: 3_000,
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'WALLET_NOT_FOUND',
    });

    expect(dependencies.wallets.updateBalance).not.toHaveBeenCalled();
    expect(dependencies.transactions.create).not.toHaveBeenCalled();
  });

  it('rejects unauthorized senders without mutating either wallet', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.transferWallet({
        senderWalletId: senderWallet.id,
        senderUserId: 'different-user',
        recipientWalletId: recipientWallet.id,
        amountMinor: 3_000,
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'WALLET_FORBIDDEN',
    });

    expect(dependencies.wallets.updateBalance).not.toHaveBeenCalled();
    expect(dependencies.transactions.create).not.toHaveBeenCalled();
  });

  it('rejects insufficient funds without mutating either wallet', async () => {
    const dependencies = createDependencies();
    const service = new WalletService(dependencies);

    await expect(
      service.transferWallet({
        senderWalletId: senderWallet.id,
        senderUserId: 'sender-user',
        recipientWalletId: recipientWallet.id,
        amountMinor: 10_001,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      errorCode: 'INSUFFICIENT_FUNDS',
    });

    expect(dependencies.wallets.updateBalance).not.toHaveBeenCalled();
    expect(dependencies.transactions.create).not.toHaveBeenCalled();
  });

  it('does not credit the recipient when sender debit fails', async () => {
    const dependencies = createDependencies();
    jest
      .mocked(dependencies.wallets.updateBalance)
      .mockRejectedValueOnce(new Error('debit failed'));
    const service = new WalletService(dependencies);

    await expect(
      service.transferWallet({
        senderWalletId: senderWallet.id,
        senderUserId: 'sender-user',
        recipientWalletId: recipientWallet.id,
        amountMinor: 3_000,
      }),
    ).rejects.toThrow('debit failed');

    expect(dependencies.wallets.updateBalance).toHaveBeenCalledTimes(1);
    expect(dependencies.wallets.updateBalance).toHaveBeenCalledWith('wallet-b', 7_000, trx);
    expect(dependencies.transactions.create).not.toHaveBeenCalled();
  });

  it('does not create transfer records when recipient credit fails', async () => {
    const dependencies = createDependencies();
    jest
      .mocked(dependencies.wallets.updateBalance)
      .mockResolvedValueOnce(updatedSenderWallet)
      .mockRejectedValueOnce(new Error('credit failed'));
    const service = new WalletService(dependencies);

    await expect(
      service.transferWallet({
        senderWalletId: senderWallet.id,
        senderUserId: 'sender-user',
        recipientWalletId: recipientWallet.id,
        amountMinor: 3_000,
      }),
    ).rejects.toThrow('credit failed');

    expect(dependencies.transactionRunner.run).toHaveBeenCalledTimes(1);
    expect(dependencies.wallets.updateBalance).toHaveBeenNthCalledWith(1, 'wallet-b', 7_000, trx);
    expect(dependencies.wallets.updateBalance).toHaveBeenNthCalledWith(2, 'wallet-a', 5_000, trx);
    expect(dependencies.transactions.create).not.toHaveBeenCalled();
  });
});
