import express from 'express';
import request from 'supertest';
import { z } from 'zod';

import { fauxAuth } from '../middlewares/faux-auth';
import { errorHandler } from '../middlewares/error-handler';
import { validateRequest } from '../middlewares/validate-request';
import { assertPositiveMinorUnitAmount, subtractMinorUnits } from '../shared/money';
import { sendSuccess } from '../shared/response';

const buildTestApp = () => {
  const testApp = express();

  testApp.use(express.json());

  testApp.get('/protected', fauxAuth, (req, res) => {
    return sendSuccess(res, 200, 'Authenticated', {
      userId: req.user?.id,
    });
  });

  testApp.post(
    '/validated',
    validateRequest({
      body: z.object({
        amount: z.number().int().positive(),
      }),
    }),
    (req, res) => {
      return sendSuccess(res, 200, 'Validated', {
        amount: req.body.amount,
      });
    },
  );

  testApp.use(errorHandler);

  return testApp;
};

describe('shared application infrastructure', () => {
  describe('fauxAuth', () => {
    it('attaches the x-user-id header to the request user', async () => {
      const response = await request(buildTestApp())
        .get('/protected')
        .set('x-user-id', 'user-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Authenticated',
        data: {
          userId: 'user-123',
        },
      });
    });

    it('rejects requests without x-user-id', async () => {
      const response = await request(buildTestApp()).get('/protected').expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'x-user-id header is required',
        errorCode: 'MISSING_AUTH_HEADER',
      });
    });
  });

  describe('validateRequest', () => {
    it('allows valid request bodies through', async () => {
      const response = await request(buildTestApp())
        .post('/validated')
        .send({ amount: 5000 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Validated',
        data: {
          amount: 5000,
        },
      });
    });

    it('returns a consistent validation error response', async () => {
      const response = await request(buildTestApp())
        .post('/validated')
        .send({ amount: -1 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Request validation failed');
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'amount',
          }),
        ]),
      );
    });
  });

  describe('money helpers', () => {
    it('accepts positive minor-unit integer amounts', () => {
      expect(() => assertPositiveMinorUnitAmount(1)).not.toThrow();
    });

    it('rejects zero, negative, and fractional amounts', () => {
      expect(() => assertPositiveMinorUnitAmount(0)).toThrow('amount must be a positive integer');
      expect(() => assertPositiveMinorUnitAmount(-100)).toThrow(
        'amount must be a positive integer',
      );
      expect(() => assertPositiveMinorUnitAmount(10.5)).toThrow(
        'amount must be a positive integer',
      );
    });

    it('prevents balances from going negative', () => {
      expect(() => subtractMinorUnits(1000, 1001)).toThrow('Insufficient wallet balance');
    });
  });
});
