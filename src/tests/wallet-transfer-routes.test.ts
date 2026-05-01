import express from 'express';
import request from 'supertest';

import { errorHandler } from '../middlewares/error-handler';
import { AppError } from '../shared/errors';
import { WalletController } from '../modules/wallets/wallet.controller';
import { createWalletRouter } from '../modules/wallets/wallet.routes';
import type { WalletService } from '../modules/wallets/wallet.service';

const createdAt = new Date('2026-05-01T10:00:00.000Z');

const createMockService = (): jest.Mocked<
  Pick<WalletService, 'fundWallet' | 'withdrawWallet' | 'transferWallet'>
> => ({
  fundWallet: jest.fn(),
  withdrawWallet: jest.fn(),
  transferWallet: jest.fn().mockResolvedValue({
    senderWallet: {
      id: 'sender-wallet',
      userId: 'sender-user',
      balanceMinor: 7_000,
      currency: 'NGN',
      createdAt,
      updatedAt: createdAt,
    },
    recipientWallet: {
      id: 'recipient-wallet',
      userId: 'recipient-user',
      balanceMinor: 5_000,
      currency: 'NGN',
      createdAt,
      updatedAt: createdAt,
    },
    senderTransaction: {
      id: 'sender-transaction',
      reference: 'TRANSFER_OUT-reference',
      walletId: 'sender-wallet',
      type: 'TRANSFER_OUT',
      amountMinor: 3_000,
      balanceBeforeMinor: 10_000,
      balanceAfterMinor: 7_000,
      status: 'SUCCESS',
      counterpartyWalletId: 'recipient-wallet',
      relatedTransactionId: 'recipient-transaction',
      description: 'Transfer to friend',
      createdAt,
    },
    recipientTransaction: {
      id: 'recipient-transaction',
      reference: 'TRANSFER_IN-reference',
      walletId: 'recipient-wallet',
      type: 'TRANSFER_IN',
      amountMinor: 3_000,
      balanceBeforeMinor: 2_000,
      balanceAfterMinor: 5_000,
      status: 'SUCCESS',
      counterpartyWalletId: 'sender-wallet',
      relatedTransactionId: 'sender-transaction',
      description: 'Transfer to friend',
      createdAt,
    },
  }),
});

const buildTestApp = (service = createMockService()) => {
  const app = express();
  const controller = new WalletController(service as unknown as WalletService);

  app.use(express.json());
  app.use('/api/v1/wallets', createWalletRouter(controller));
  app.use(errorHandler);

  return {
    app,
    service,
  };
};

describe('POST /api/v1/wallets/:walletId/transfers', () => {
  it('transfers from an authenticated sender wallet', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .post('/api/v1/wallets/sender-wallet/transfers')
      .set('x-user-id', 'sender-user')
      .send({
        recipientWalletId: 'recipient-wallet',
        amount: 3_000,
        description: 'Transfer to friend',
      })
      .expect(200);

    expect(service.transferWallet).toHaveBeenCalledWith({
      senderWalletId: 'sender-wallet',
      senderUserId: 'sender-user',
      recipientWalletId: 'recipient-wallet',
      amountMinor: 3_000,
      description: 'Transfer to friend',
    });
    expect(response.body).toEqual({
      success: true,
      message: 'Wallet transfer successful',
      data: {
        senderWallet: {
          id: 'sender-wallet',
          userId: 'sender-user',
          balanceMinor: 7_000,
          currency: 'NGN',
          createdAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
        },
        recipientWallet: {
          id: 'recipient-wallet',
          userId: 'recipient-user',
          balanceMinor: 5_000,
          currency: 'NGN',
          createdAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
        },
        senderTransaction: {
          id: 'sender-transaction',
          reference: 'TRANSFER_OUT-reference',
          walletId: 'sender-wallet',
          type: 'TRANSFER_OUT',
          amountMinor: 3_000,
          balanceBeforeMinor: 10_000,
          balanceAfterMinor: 7_000,
          status: 'SUCCESS',
          counterpartyWalletId: 'recipient-wallet',
          relatedTransactionId: 'recipient-transaction',
          description: 'Transfer to friend',
          createdAt: createdAt.toISOString(),
        },
        recipientTransaction: {
          id: 'recipient-transaction',
          reference: 'TRANSFER_IN-reference',
          walletId: 'recipient-wallet',
          type: 'TRANSFER_IN',
          amountMinor: 3_000,
          balanceBeforeMinor: 2_000,
          balanceAfterMinor: 5_000,
          status: 'SUCCESS',
          counterpartyWalletId: 'sender-wallet',
          relatedTransactionId: 'sender-transaction',
          description: 'Transfer to friend',
          createdAt: createdAt.toISOString(),
        },
      },
    });
  });

  it('rejects unauthenticated transfer requests', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .post('/api/v1/wallets/sender-wallet/transfers')
      .send({
        recipientWalletId: 'recipient-wallet',
        amount: 3_000,
      })
      .expect(401);

    expect(service.transferWallet).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      success: false,
      message: 'x-user-id header is required',
      errorCode: 'MISSING_AUTH_HEADER',
    });
  });

  it('rejects invalid transfer requests before calling the service', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .post('/api/v1/wallets/sender-wallet/transfers')
      .set('x-user-id', 'sender-user')
      .send({
        recipientWalletId: '',
        amount: -1,
      })
      .expect(400);

    expect(service.transferWallet).not.toHaveBeenCalled();
    expect(response.body.success).toBe(false);
    expect(response.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('returns insufficient funds when the service rejects the transfer', async () => {
    const service = createMockService();
    jest
      .mocked(service.transferWallet)
      .mockRejectedValue(AppError.badRequest('Insufficient wallet balance', 'INSUFFICIENT_FUNDS'));
    const { app } = buildTestApp(service);

    const response = await request(app)
      .post('/api/v1/wallets/sender-wallet/transfers')
      .set('x-user-id', 'sender-user')
      .send({
        recipientWalletId: 'recipient-wallet',
        amount: 10_001,
      })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Insufficient wallet balance',
      errorCode: 'INSUFFICIENT_FUNDS',
    });
  });
});
