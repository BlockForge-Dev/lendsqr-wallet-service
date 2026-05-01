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
