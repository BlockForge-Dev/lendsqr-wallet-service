import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const defaultAdjutorBaseUrl = 'https://adjutor.lendsqr.com/v2';

const booleanEnvSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off', ''].includes(normalized)) {
    return false;
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_HOST: z.string().min(1).default('localhost'),
  DATABASE_PORT: z.coerce.number().int().positive().default(3306),
  DATABASE_USER: z.string().min(1).default('root'),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_NAME: z.string().min(1).default('lendsqr_wallet_service'),
  DATABASE_SSL: booleanEnvSchema.default(false),
  DATABASE_SSL_REJECT_UNAUTHORIZED: booleanEnvSchema.default(true),
  DATABASE_SSL_CA: z.string().default(''),
  ADJUTOR_BASE_URL: z
    .union([z.string().url(), z.literal('')])
    .optional()
    .transform((value) => value || defaultAdjutorBaseUrl),
  ADJUTOR_API_KEY: z.string().default(''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`);
}

export const env = parsedEnv.data;
