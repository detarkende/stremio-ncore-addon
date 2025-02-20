// @ts-expect-error - Ignore import error. This is imported from the source of node-cron because this way we don't import node-specific code in the browser.
import validate from 'node-cron/src/pattern-validation.js';
import { z } from 'zod';
import { createUserSchema } from './user.schema';

export const createConfigSchema = z.object({
  addonUrl: z.union([
    z.object({
      local: z.literal(false),
      url: z
        .string()
        .min(1)
        .url()
        .refine((v) => !v.endsWith('/'), 'Addon URL must not end with a slash.'),
    }),
    z.object({ local: z.literal(true), url: z.literal('') }),
  ]),
  admin: createUserSchema,
  nonAdminUsers: z.array(createUserSchema),
  deleteAfterHitnrun: z.union([
    z.object({ enabled: z.literal(false), cron: z.literal('') }),
    z.object({
      enabled: z.literal(true),
      cron: z
        .string()
        .min(1)
        .refine((value) => {
          try {
            validate(value);
            return true;
          } catch {
            return false;
          }
        }, 'Invalid cron expression.'),
    }),
  ]),
});

export type CreateConfigRequest = z.infer<typeof createConfigSchema>;

export const updateConfigSchema = createConfigSchema.omit({
  admin: true,
  nonAdminUsers: true,
});

export type UpdateConfigRequest = z.infer<typeof updateConfigSchema>;
