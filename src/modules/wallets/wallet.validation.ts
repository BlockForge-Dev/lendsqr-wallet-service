import { z } from 'zod';

export const walletIdParamsSchema = z.object({
  walletId: z.string().trim().min(1),
});

const descriptionSchema = z
  .union([z.string().trim().max(255), z.literal('')])
  .optional()
  .transform((value) => value || undefined);

export const fundWalletSchema = {
  params: walletIdParamsSchema,
  body: z.object({
    amount: z.number().int().positive(),
    description: descriptionSchema,
  }),
};
