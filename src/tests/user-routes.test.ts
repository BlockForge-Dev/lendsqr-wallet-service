import express from 'express';
import request from 'supertest';

import { errorHandler } from '../middlewares/error-handler';
import { UserController } from '../modules/users/user.controller';
import { createUserRouter } from '../modules/users/user.routes';
import type { UserService } from '../modules/users/user.service';

const createdAt = new Date('2026-05-01T10:00:00.000Z');

const createMockService = (): jest.Mocked<Pick<UserService, 'createUser'>> => ({
  createUser: jest.fn().mockResolvedValue({
    user: {
      id: 'user-123',
      firstName: 'Obinna',
      lastName: 'Victor',
      email: 'obinna@example.com',
      phone: '08000000000',
      bvn: '12345678901',
      createdAt,
      updatedAt: createdAt,
    },
    wallet: {
      id: 'wallet-123',
      userId: 'user-123',
      balanceMinor: 0,
      currency: 'NGN',
      createdAt,
      updatedAt: createdAt,
    },
  }),
});

const buildTestApp = (service = createMockService()) => {
  const app = express();
  const controller = new UserController(service as unknown as UserService);

  app.use(express.json());
  app.use('/api/v1/users', createUserRouter(controller));
  app.use(errorHandler);

  return {
    app,
    service,
  };
};

describe('POST /api/v1/users', () => {
  it('validates and forwards onboarding requests to the user service', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .post('/api/v1/users')
      .send({
        firstName: ' Obinna ',
        lastName: ' Victor ',
        email: 'OBINNA@example.com',
        phone: '08000000000',
        bvn: '12345678901',
      })
      .expect(201);

    expect(service.createUser).toHaveBeenCalledWith({
      firstName: 'Obinna',
      lastName: 'Victor',
      email: 'obinna@example.com',
      phone: '08000000000',
      bvn: '12345678901',
    });
    expect(response.body).toEqual({
      success: true,
      message: 'User onboarded successfully',
      data: {
        user: {
          id: 'user-123',
          firstName: 'Obinna',
          lastName: 'Victor',
          email: 'obinna@example.com',
          phone: '08000000000',
          bvn: '12345678901',
          createdAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
        },
        wallet: {
          id: 'wallet-123',
          userId: 'user-123',
          balanceMinor: 0,
          currency: 'NGN',
          createdAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
        },
      },
    });
  });

  it('rejects invalid onboarding requests before calling the user service', async () => {
    const { app, service } = buildTestApp();

    const response = await request(app)
      .post('/api/v1/users')
      .send({
        firstName: '',
        lastName: 'Victor',
        email: 'not-an-email',
        phone: '08000000000',
        bvn: '123',
      })
      .expect(400);

    expect(service.createUser).not.toHaveBeenCalled();
    expect(response.body.success).toBe(false);
    expect(response.body.errorCode).toBe('VALIDATION_ERROR');
  });
});
