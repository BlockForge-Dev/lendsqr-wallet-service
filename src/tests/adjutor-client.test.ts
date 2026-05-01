import { AdjutorClient } from '../modules/blacklist/adjutor.client';

const jsonResponse = (body: unknown, status = 200): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

describe('AdjutorClient', () => {
  it('calls the Karma lookup endpoint with bearer authentication', async () => {
    const payload = {
      status: 'success',
      message: 'Successful',
      data: {
        karma_identity: 'bad@example.com',
      },
    };
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetcher.mockResolvedValue(jsonResponse(payload));

    const client = new AdjutorClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://adjutor.lendsqr.com/v2/',
      fetcher,
    });

    const result = await client.lookupKarma('bad@example.com');

    expect(result).toEqual(payload);
    expect(fetcher).toHaveBeenCalledWith(
      'https://adjutor.lendsqr.com/v2/verification/karma/bad%40example.com',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer test-api-key',
        }) as HeadersInit,
      }),
    );
  });

  it('treats provider 404 as a non-blacklisted lookup result', async () => {
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetcher.mockResolvedValue(
      jsonResponse(
        {
          status: 'error',
          message: 'Not found',
        },
        404,
      ),
    );

    const client = new AdjutorClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://adjutor.lendsqr.com/v2',
      fetcher,
    });

    await expect(client.lookupKarma('safe@example.com')).resolves.toEqual({
      status: 'error',
      message: 'Not found',
      data: null,
    });
  });

  it('fails closed when the API key is missing', async () => {
    const client = new AdjutorClient({
      apiKey: '',
      baseUrl: 'https://adjutor.lendsqr.com/v2',
      fetcher: jest.fn() as jest.MockedFunction<typeof fetch>,
    });

    await expect(client.lookupKarma('safe@example.com')).rejects.toMatchObject({
      statusCode: 503,
      errorCode: 'BLACKLIST_PROVIDER_UNAVAILABLE',
    });
  });

  it('fails closed when Adjutor returns an error response', async () => {
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetcher.mockResolvedValue(
      jsonResponse(
        {
          status: 'error',
          message: 'Invalid token',
        },
        401,
      ),
    );

    const client = new AdjutorClient({
      apiKey: 'bad-key',
      baseUrl: 'https://adjutor.lendsqr.com/v2',
      fetcher,
    });

    await expect(client.lookupKarma('safe@example.com')).rejects.toMatchObject({
      statusCode: 503,
      errorCode: 'BLACKLIST_PROVIDER_UNAVAILABLE',
    });
  });

  it('fails closed when the network request cannot be completed', async () => {
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetcher.mockRejectedValue(new Error('network down'));

    const client = new AdjutorClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://adjutor.lendsqr.com/v2',
      fetcher,
    });

    await expect(client.lookupKarma('safe@example.com')).rejects.toMatchObject({
      statusCode: 503,
      errorCode: 'BLACKLIST_PROVIDER_UNAVAILABLE',
    });
  });
});
