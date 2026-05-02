import { z } from 'zod';

export const walletIdParamsSchema = z.object({
  walletId: z.string().trim().min(1),
});

const descriptionSchema = z
  .union([z.string().trim().max(255), z.literal('')])
  .optional()
  .transform((value) => value || undefined);

const walletMutationBodySchema = z.object({
  amount: z.number().int().positive(),
  description: descriptionSchema,
});

export const fundWalletSchema = {
  params: walletIdParamsSchema,
  body: walletMutationBodySchema,
};

export const getWalletSchema = {
  params: walletIdParamsSchema,
};

export const withdrawWalletSchema = {
  params: walletIdParamsSchema,
  body: walletMutationBodySchema,
};

export const transferWalletSchema = {
  params: walletIdParamsSchema,
  body: walletMutationBodySchema.extend({
    recipientWalletId: z.string().trim().min(1),
  }),
};

export const listWalletTransactionsSchema = {
  params: walletIdParamsSchema,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
};
