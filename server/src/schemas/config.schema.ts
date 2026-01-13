import { isValidCron } from 'cron-validator';
import { z } from 'zod';
import { createUserSchema } from './user.schema';

export const createConfigSchema = z.object({
  localIp: z.ipv4(),
  remoteUrl: z.url().optional(),
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
