import { isValidCron } from 'cron-validator';
import { z } from 'zod';
import { createUserSchema } from './user.schema';

export const createConfigSchema = z.object({
  addonLocation: z.union([
    z.object({
      local: z.literal(false),
      location: z
        .string()
        .min(1, 'Addon URL must not be empty.')
        .url()
        .refine((v) => !v.endsWith('/'), 'Addon URL must not end with a slash.'),
    }),
    z.object({
      local: z.literal(true),
      location: z.ipv4().min(1, 'Local network IP must not be empty'),
    }),
  ]),
  admin: createUserSchema,
  deleteAfterHitnrun: z.union([
    z.object({ enabled: z.literal(false), cron: z.literal('') }),
    z.object({
      enabled: z.literal(true),
      cron: z.string().min(1).refine(isValidCron, 'Invalid cron expression.'),
    }),
  ]),
});

export type CreateConfigRequest = z.infer<typeof createConfigSchema>;

export const updateConfigSchema = createConfigSchema.omit({
  admin: true,
});

export type UpdateConfigRequest = z.infer<typeof updateConfigSchema>;
