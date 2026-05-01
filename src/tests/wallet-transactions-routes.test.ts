import express from 'express';
import request from 'supertest';

import { errorHandler } from '../middlewares/error-handler';
import { AppError } from '../shared/errors';
import { WalletController } from '../modules/wallets/wallet.controller';
import { createWalletRouter } from '../modules/wallets/wallet.routes';
import type { WalletService } from '../modules/wallets/wallet.service';

const createdAt = new Date('2026-05-01T10:00:00.000Z');

const createMockService = (): jest.Mocked<
  Pick<WalletService, 'fundWallet' | 'withdrawWallet' | 'transferWallet' | 'listWalletTransactions'>
> => ({
  fundWallet: jest.fn(),
  withdrawWallet: jest.fn(),
  transferWallet: jest.fn(),
  listWalletTransactions: jest.fn().mockResolvedValue({
    transactions: [
      {
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
      },
    ],
    pagination: {
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
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

describe('GET /api/v1/wallets/:walletId/transactions', () => {
  it('returns paginated wallet transaction history for the owner', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .get('/api/v1/wallets/wallet-123/transactions?page=2&limit=10')
      .set('x-user-id', 'user-123')
      .expect(200);

    expect(service.listWalletTransactions).toHaveBeenCalledWith({
      walletId: 'wallet-123',
      userId: 'user-123',
      page: 2,
      limit: 10,
    });
    expect(response.body).toEqual({
      success: true,
      message: 'Wallet transactions retrieved successfully',
      data: {
        transactions: [
          {
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
            createdAt: createdAt.toISOString(),
          },
        ],
        pagination: {
          page: 2,
          limit: 10,
          total: 21,
          totalPages: 3,
        },
      },
    });
  });

  it('defaults pagination values', async () => {
    const { app, service } = buildTestApp();

    await request(app)
      .get('/api/v1/wallets/wallet-123/transactions')
      .set('x-user-id', 'user-123')
      .expect(200);

    expect(service.listWalletTransactions).toHaveBeenCalledWith({
      walletId: 'wallet-123',
      userId: 'user-123',
      page: 1,
      limit: 20,
    });
  });

  it('rejects unauthenticated transaction history requests', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app).get('/api/v1/wallets/wallet-123/transactions').expect(401);

    expect(service.listWalletTransactions).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      success: false,
      message: 'x-user-id header is required',
      errorCode: 'MISSING_AUTH_HEADER',
    });
  });

  it('rejects invalid pagination values before calling the service', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .get('/api/v1/wallets/wallet-123/transactions?page=0&limit=101')
      .set('x-user-id', 'user-123')
      .expect(400);

    expect(service.listWalletTransactions).not.toHaveBeenCalled();
    expect(response.body.success).toBe(false);
    expect(response.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('returns forbidden when the service rejects wallet ownership', async () => {
    const service = createMockService();
    jest
      .mocked(service.listWalletTransactions)
      .mockRejectedValue(
        AppError.forbidden('You are not allowed to operate on this wallet', 'WALLET_FORBIDDEN'),
      );
    const { app } = buildTestApp(service);

    const response = await request(app)
      .get('/api/v1/wallets/wallet-123/transactions')
      .set('x-user-id', 'different-user')
      .expect(403);

    expect(response.body).toEqual({
      success: false,
      message: 'You are not allowed to operate on this wallet',
      errorCode: 'WALLET_FORBIDDEN',
    });
  });
});
