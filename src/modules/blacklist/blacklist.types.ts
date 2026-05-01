export const ADJUTOR_KARMA_PROVIDER = 'ADJUTOR_KARMA' as const;

export type BlacklistIdentityType = 'EMAIL' | 'PHONE' | 'BVN';

export type AdjutorKarmaData = {
  karma_identity?: string;
  amount_in_contention?: string;
  reason?: string | null;
  default_date?: string | null;
  karma_type?: {
    karma?: string;
  };
  karma_identity_type?: {
    identity_type?: string;
  };
  reporting_entity?: {
    name?: string;
    email?: string;
  };
};

export type AdjutorKarmaLookupResponse = {
  status?: string;
  message?: string;
  data?: AdjutorKarmaData | AdjutorKarmaData[] | null;
  meta?: Record<string, unknown>;
};

export type CreateBlacklistCheckInput = {
  identity: string;
  identityType: BlacklistIdentityType;
  provider?: typeof ADJUTOR_KARMA_PROVIDER;
  isBlacklisted: boolean;
  responsePayload: AdjutorKarmaLookupResponse;
  userId?: string;
};

export type BlacklistCheckRecord = {
  id: string;
  userId: string | null;
  identity: string;
  identityType: BlacklistIdentityType;
  provider: typeof ADJUTOR_KARMA_PROVIDER;
  isBlacklisted: boolean;
  responsePayload: AdjutorKarmaLookupResponse;
  createdAt: Date;
};

export type BlacklistLookupInput = {
  identity: string;
  identityType: BlacklistIdentityType;
  userId?: string;
};

export type BlacklistLookupResult = {
  isBlacklisted: boolean;
  check: BlacklistCheckRecord;
};

export type KarmaLookupClient = {
  lookupKarma(identity: string): Promise<AdjutorKarmaLookupResponse>;
};

export type BlacklistCheckWriter = {
  create(input: CreateBlacklistCheckInput): Promise<BlacklistCheckRecord>;
};
