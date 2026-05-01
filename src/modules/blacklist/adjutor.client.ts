import { env } from '../../config/env';
import { AppError } from '../../shared/errors';
import type { AdjutorKarmaLookupResponse, KarmaLookupClient } from './blacklist.types';

type AdjutorClientOptions = {
  apiKey?: string;
  baseUrl?: string;
  fetcher?: typeof fetch;
};

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

const parseJsonResponse = async (response: Response): Promise<AdjutorKarmaLookupResponse> => {
  try {
    return (await response.json()) as AdjutorKarmaLookupResponse;
  } catch {
    return {
      status: 'error',
      message: response.statusText,
      data: null,
    };
  }
};

export class AdjutorClient implements KarmaLookupClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(options: AdjutorClientOptions = {}) {
    this.apiKey = options.apiKey ?? env.ADJUTOR_API_KEY;
    this.baseUrl = trimTrailingSlashes(options.baseUrl ?? env.ADJUTOR_BASE_URL);
    this.fetcher = options.fetcher ?? fetch;
  }

  async lookupKarma(identity: string): Promise<AdjutorKarmaLookupResponse> {
    if (!this.apiKey) {
      throw new AppError(
        'Adjutor API key is not configured',
        503,
        'BLACKLIST_PROVIDER_UNAVAILABLE',
      );
    }

    const url = `${this.baseUrl}/verification/karma/${encodeURIComponent(identity)}`;
    let response: Response;

    try {
      response = await this.fetcher(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
    } catch {
      throw new AppError(
        'Unable to complete Karma blacklist verification',
        503,
        'BLACKLIST_PROVIDER_UNAVAILABLE',
      );
    }

    const payload = await parseJsonResponse(response);

    if (response.status === 404) {
      return {
        ...payload,
        data: null,
      };
    }

    if (!response.ok) {
      throw new AppError(
        'Unable to complete Karma blacklist verification',
        503,
        'BLACKLIST_PROVIDER_UNAVAILABLE',
        {
          providerStatusCode: response.status,
          providerMessage: payload.message,
        },
      );
    }

    return payload;
  }
}

export const adjutorClient = new AdjutorClient();
