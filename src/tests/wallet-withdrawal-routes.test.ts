import express from 'express';
import request from 'supertest';

import { errorHandler } from '../middlewares/error-handler';
import { AppError } from '../shared/errors';
import { WalletController } from '../modules/wallets/wallet.controller';
import { createWalletRouter } from '../modules/wallets/wallet.routes';
import type { WalletService } from '../modules/wallets/wallet.service';

const createdAt = new Date('2026-05-01T10:00:00.000Z');

const createMockService = (): jest.Mocked<
  Pick<WalletService, 'withdrawWallet' | 'fundWallet'>
> => ({
  fundWallet: jest.fn(),
  withdrawWallet: jest.fn().mockResolvedValue({
    wallet: {
      id: 'wallet-123',
      userId: 'user-123',
      balanceMinor: 6_000,
      currency: 'NGN',
      createdAt,
      updatedAt: createdAt,
    },
    transaction: {
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

describe('POST /api/v1/wallets/:walletId/withdraw', () => {
  it('withdraws from a wallet for an authenticated owner request', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .post('/api/v1/wallets/wallet-123/withdraw')
      .set('x-user-id', 'user-123')
      .send({
        amount: 4_000,
        description: 'Wallet withdrawal',
      })
      .expect(200);

    expect(service.withdrawWallet).toHaveBeenCalledWith({
      walletId: 'wallet-123',
      userId: 'user-123',
      amountMinor: 4_000,
      description: 'Wallet withdrawal',
    });
    expect(response.body).toEqual({
      success: true,
      message: 'Wallet withdrawal successful',
      data: {
        wallet: {
          id: 'wallet-123',
          userId: 'user-123',
          balanceMinor: 6_000,
          currency: 'NGN',
          createdAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
        },
        transaction: {
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
          createdAt: createdAt.toISOString(),
        },
      },
    });
  });

  it('rejects unauthenticated withdrawal requests', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .post('/api/v1/wallets/wallet-123/withdraw')
      .send({
        amount: 4_000,
      })
      .expect(401);

    expect(service.withdrawWallet).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      success: false,
      message: 'x-user-id header is required',
      errorCode: 'MISSING_AUTH_HEADER',
    });
  });

  it('rejects invalid amounts before calling the service', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .post('/api/v1/wallets/wallet-123/withdraw')
      .set('x-user-id', 'user-123')
      .send({
        amount: -1,
      })
      .expect(400);

    expect(service.withdrawWallet).not.toHaveBeenCalled();
    expect(response.body.success).toBe(false);
    expect(response.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('returns insufficient funds when the service rejects the withdrawal', async () => {
    const service = createMockService();
    jest
      .mocked(service.withdrawWallet)
      .mockRejectedValue(AppError.badRequest('Insufficient wallet balance', 'INSUFFICIENT_FUNDS'));
    const { app } = buildTestApp(service);

    const response = await request(app)
      .post('/api/v1/wallets/wallet-123/withdraw')
      .set('x-user-id', 'user-123')
      .send({
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
