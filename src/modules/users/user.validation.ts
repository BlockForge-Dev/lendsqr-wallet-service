import { z } from 'zod';

const bvnSchema = z
  .union([
    z
      .string()
      .trim()
      .regex(/^\d{11}$/, 'BVN must be 11 digits'),
    z.literal(''),
  ])
  .optional()
  .transform((value) => value || undefined);

export const createUserSchema = {
  body: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email().max(255),
    phone: z
      .string()
      .trim()
      .regex(/^\+?\d{7,15}$/, 'Phone must contain 7 to 15 digits'),
    bvn: bvnSchema,
  }),
};
