import { logger } from '@server/logger';
import { z } from 'zod/v4';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000).meta({
      description:
        'The port on which the server will listen for HTTP requests (inside the container)',
    }),
    HTTPS_PORT: z.coerce.number().default(3443).meta({
      description:
        'The port on which the server will listen for HTTPS requests (inside the container)',
    }),
    TORRENT_PORT: z.coerce.number().default(6881).meta({
      description:
        'The port used for torrent seeding. This is the port that will be used by the torrent client to seed torrents.',
    }),
    DOWNLOAD_WHOLE_FILE_THRESHOLD: z.coerce
      .number()
      .positive()
      .gte(0)
      .lte(1)
      .default(0.2)
      .meta({
        description:
          'Threshold for downloading the whole file. If more than this percentage of the file is downloaded, it will be downloaded fully instead of on demand.',
      }),
    ADDON_DIR: z.string().default('/addon').meta({
      description: `The directory where the addon's files (torrents, downloads, and logs) will be placed.`,
    }),
    NCORE_USERNAME: z.string(),
    NCORE_PASSWORD: z.string(),
    TORRENTS_DIR: z.string().optional().meta({
      description:
        'Directory to store torrent files. By default, it is set to ADDON_DIR/torrents.',
    }),
    DOWNLOADS_DIR: z.string().optional().meta({
      description:
        'Directory to store downloads. By default, it is set to ADDON_DIR/downloads.',
    }),
    LOGS_DIR: z.string().optional().meta({
      description:
        'Directory to store log files. By default, it is set to ADDON_DIR/logs.',
    }),
    NCORE_URL: z.string().url().default('https://ncore.pro').meta({
      description:
        'The URL where nCore can be reached. It is only adjustable, in case the nCore URL changes in the future. Defaults to https://ncore.pro.',
    }),
    CINEMETA_URL: z.string().url().default('https://v3-cinemeta.strem.io'),
    LOCAL_IP_HOSTNAME: z.string().default('local-ip.medicmobile.org'),
    LOCAL_IP_KEYS_URL: z.string().url().default('https://local-ip.medicmobile.org/keys'),
    PRELOAD_TORRENT_THRESHOLD: z.coerce
      .number('Invalid type. Expected number.')
      .min(0, 'PRELOAD_TORRENT_THRESHOLD must be at least 0.')
      .max(1, 'PRELOAD_TORRENT_THRESHOLD must be at most 1.')
      .default(0.9)
      .meta({
        description:
          'Threshold for preloading torrents. If the torrent download progress is above this threshold, then the rest of the torrent will also be selected for download.\n\n' +
          "By default, this is set to 0.9 (90%), so that sample files and other small files in the torrent don't cause the torrent to get stuck at ~99% progress.\n" +
          'If you always want to download the whole torrent (even if you only watched a little of it), then set this number closer to 0.\n\n' +
          'Value must be between 0 and 1, where 0 is 0% and 1 is 100%.',
      }),
    PRELOAD_TORRENT_FILE_THRESHOLD: z.coerce
      .number()
      .min(0)
      .max(1)
      .default(0.2)
      .meta({
        description:
          'Threshold for preloading torrent files. If the file download progress is above this threshold, then the rest of the file will also be selected for download.\n\n' +
          'By default, this is set to 0.2 (20%), so if you have watched 20% of the movie or TV show episode, then the rest will also be preloaded\n' +
          'If you always want to download the whole file (even if you only watched a very little part of it), then set this number closer to 0.\n\n' +
          'Value must be between 0 and 1, where 0 is 0% and 1 is 100%.',
      }),
  })
  .transform((env) => {
    return {
      ...env,
      TORRENTS_DIR: env.TORRENTS_DIR ?? `${env.ADDON_DIR}/torrents`,
      DOWNLOADS_DIR: env.DOWNLOADS_DIR ?? `${env.ADDON_DIR}/downloads`,
      LOGS_DIR: env.LOGS_DIR ?? `${env.ADDON_DIR}/logs`,
    };
  });

type Env = z.infer<typeof envSchema>;
export let env: Env;

export function loadEnv(processEnv: NodeJS.ProcessEnv) {
  const envParseResult = envSchema.safeParse(processEnv);
  if (!envParseResult.success) {
    // eslint-disable-next-line no-console
    console.error(
      `\nEnvironment variables validation failed:\n\n` +
        z.prettifyError(envParseResult.error) +
        '\n\n',
    );
    process.exit(1);
  }
  env = envParseResult.data;
  logger.info('Environment variables parsed and loaded successfully.');
}
