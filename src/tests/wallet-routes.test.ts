import express from 'express';
import request from 'supertest';

import { errorHandler } from '../middlewares/error-handler';
import { AppError } from '../shared/errors';
import { WalletController } from '../modules/wallets/wallet.controller';
import { createWalletRouter } from '../modules/wallets/wallet.routes';
import type { WalletService } from '../modules/wallets/wallet.service';

const createdAt = new Date('2026-05-01T10:00:00.000Z');

const createMockService = (): jest.Mocked<Pick<WalletService, 'fundWallet'>> => ({
  fundWallet: jest.fn().mockResolvedValue({
    wallet: {
      id: 'wallet-123',
      userId: 'user-123',
      balanceMinor: 10_000,
      currency: 'NGN',
      createdAt,
      updatedAt: createdAt,
    },
    transaction: {
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
      description: 'Initial funding',
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

describe('POST /api/v1/wallets/:walletId/fund', () => {
  it('funds a wallet for an authenticated owner request', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .post('/api/v1/wallets/wallet-123/fund')
      .set('x-user-id', 'user-123')
      .send({
        amount: 5_000,
        description: 'Initial funding',
      })
      .expect(200);

    expect(service.fundWallet).toHaveBeenCalledWith({
      walletId: 'wallet-123',
      userId: 'user-123',
      amountMinor: 5_000,
      description: 'Initial funding',
    });
    expect(response.body).toEqual({
      success: true,
      message: 'Wallet funded successfully',
      data: {
        wallet: {
          id: 'wallet-123',
          userId: 'user-123',
          balanceMinor: 10_000,
          currency: 'NGN',
          createdAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
        },
        transaction: {
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
          description: 'Initial funding',
          createdAt: createdAt.toISOString(),
        },
      },
    });
  });

  it('rejects unauthenticated funding requests', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .post('/api/v1/wallets/wallet-123/fund')
      .send({
        amount: 5_000,
      })
      .expect(401);

    expect(service.fundWallet).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      success: false,
      message: 'x-user-id header is required',
      errorCode: 'MISSING_AUTH_HEADER',
    });
  });

  it('rejects invalid amounts before calling the service', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .post('/api/v1/wallets/wallet-123/fund')
      .set('x-user-id', 'user-123')
      .send({
        amount: -1,
      })
      .expect(400);

    expect(service.fundWallet).not.toHaveBeenCalled();
    expect(response.body.success).toBe(false);
    expect(response.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('returns forbidden when the service rejects wallet ownership', async () => {
    const service = createMockService();
    jest
      .mocked(service.fundWallet)
      .mockRejectedValue(
        AppError.forbidden('You are not allowed to operate on this wallet', 'WALLET_FORBIDDEN'),
      );
    const { app } = buildTestApp(service);

    const response = await request(app)
      .post('/api/v1/wallets/wallet-123/fund')
      .set('x-user-id', 'other-user')
      .send({
        amount: 5_000,
      })
      .expect(403);

    expect(response.body).toEqual({
      success: false,
      message: 'You are not allowed to operate on this wallet',
      errorCode: 'WALLET_FORBIDDEN',
    });
  });
});
