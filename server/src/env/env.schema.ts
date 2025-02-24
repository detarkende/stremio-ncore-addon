import { z } from 'zod';

export const envSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    HTTPS_PORT: z.coerce.number().default(3443),
    ADDON_DIR: z.string(),
    NCORE_USERNAME: z.string(),
    NCORE_PASSWORD: z.string(),
    TORRENTS_DIR: z.string().optional(),
    DOWNLOADS_DIR: z.string().optional(),
    NCORE_URL: z.string().url().default('https://ncore.pro'),
    CINEMETA_URL: z.string().url().default('https://v3-cinemeta.strem.io'),
    TMDB_API_KEY: z.string(),
  })
  .transform((env) => {
    return {
      ...env,
      TORRENTS_DIR: env.TORRENTS_DIR ?? `${env.ADDON_DIR}/torrents`,
      DOWNLOADS_DIR: env.DOWNLOADS_DIR ?? `${env.ADDON_DIR}/downloads`,
    };
  });

export type Env = z.infer<typeof envSchema>;
