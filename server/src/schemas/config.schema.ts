import z from 'zod';
import cron from 'node-cron';
import { type User, UserRole, userSchema } from './user.schema';
import { languageSchema } from './language.schema';
import { resolutionSchema } from './resolution.schema';

export const configSchema = z
  .object({
    PORT: z.number({ coerce: true }).default(3000),
    APP_SECRET: z.string().min(10),
    ADDON_URL: z.string().url(),
    DOWNLOADS_DIR: z.string(),
    TORRENTS_DIR: z.string(),
    NCORE_URL: z.string().url().default('https://ncore.pro'),
    NCORE_USERNAME: z.string(),
    NCORE_PASSWORD: z.string(),
    DELETE_AFTER_HITNRUN: z.boolean({ coerce: true }).default(false),
    DELETE_AFTER_HITNRUN_CRON: z
      .string()
      .refine(cron.validate, { message: 'Invalid cron expression' })
      .default('0 2 * * *'),
    ADMIN_USERNAME: z.string(),
    ADMIN_PASSWORD: z.string(),
    ADMIN_PREFERRED_LANGUAGE: languageSchema,
    ADMIN_PREFERRED_RESOLUTIONS: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.array(resolutionSchema)),
    USERS: z
      .string()
      .default('[]')
      .transform((str, ctx): unknown => {
        try {
          return JSON.parse(str);
        } catch {
          ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
          return z.NEVER;
        }
      })
      .pipe(z.array(userSchema)),
  })
  .transform((config) => {
    return {
      ...config,
      USERS: [
        ...config.USERS.map((user) => ({ ...user, role: UserRole.USER })),
        {
          username: config.ADMIN_USERNAME,
          password: config.ADMIN_PASSWORD,
          role: UserRole.ADMIN,
          preferred_lang: config.ADMIN_PREFERRED_LANGUAGE,
          preferred_resolutions: config.ADMIN_PREFERRED_RESOLUTIONS,
        },
      ] satisfies User[],
    };
  });
