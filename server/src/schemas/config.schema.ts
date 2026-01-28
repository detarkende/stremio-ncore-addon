import { isValidCron } from 'cron-validator';
import { z } from 'zod/v4';
import { createUserSchema } from './user.schema';

export const createConfigSchema = z.object({
  localIp: z.ipv4(),
  remoteUrl: z.url().or(z.literal('')),
  admin: createUserSchema,
  deleteAfterHitnrun: z
    .object({
      enabled: z.boolean(),
      cron: z.string(),
    })
    .refine(
      (cronConfig) => {
        if (cronConfig.enabled) {
          return isValidCron(cronConfig.cron);
        }
        return true;
      },
      { path: ['cron'], message: 'Invalid cron expression' },
    ),
});

export type CreateConfigRequest = z.infer<typeof createConfigSchema>;

export const updateConfigSchema = createConfigSchema.omit({
  admin: true,
});

export type UpdateConfigRequest = z.infer<typeof updateConfigSchema>;
