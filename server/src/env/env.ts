import { logger } from '@/logger';
import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    HTTPS_PORT: z.coerce.number().default(3443),
    TORRENT_SERVER_PORT: z.coerce.number().default(8080),
    ADDON_DIR: z.string(),
    NCORE_USERNAME: z.string(),
    NCORE_PASSWORD: z.string(),
    TORRENTS_DIR: z.string().optional(),
    DOWNLOADS_DIR: z.string().optional(),
    LOGS_DIR: z.string().optional(),
    NCORE_URL: z.string().url().default('https://ncore.pro'),
    CINEMETA_URL: z.string().url().default('https://v3-cinemeta.strem.io'),
    LOCAL_IP_HOSTNAME: z.string().default('local-ip.medicmobile.org'),
    LOCAL_IP_KEYS_URL: z.string().url().default('https://local-ip.medicmobile.org/keys'),
  })
  .transform((env) => {
    return {
      ...env,
      TORRENTS_DIR: env.TORRENTS_DIR ?? `${env.ADDON_DIR}/torrents`,
      DOWNLOADS_DIR: env.DOWNLOADS_DIR ?? `${env.ADDON_DIR}/downloads`,
      LOGS_DIR: env.LOGS_DIR ?? `${env.ADDON_DIR}/logs`,
    };
  });

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

logger.info('Environment variables parsed and loaded successfully.');
