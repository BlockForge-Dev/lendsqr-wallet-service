import request from 'supertest';

import { app } from '../app';

describe('GET /health', () => {
  it('returns the service health status', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      service: 'lendsqr-wallet-service',
    });
  });
});

describe('unknown routes', () => {
  it('returns a consistent not found response', async () => {
    const response = await request(app).get('/missing-route').expect(404);

    expect(response.body).toEqual({
      success: false,
      message: 'Route GET /missing-route not found',
      errorCode: 'ROUTE_NOT_FOUND',
    });
  });
});
