import process from 'node:process';

import { deleteOldTorrentsScheduler } from './app/config/config.schedule';
import { torrentClient } from './app/torrent';
import { closeDbInstance } from './db/client';
import { logger } from './logger';

type ShutdownServer = {
  close: (callback: (error?: Error) => void) => void;
  closeIdleConnections?: () => void;
  closeAllConnections?: () => void;
};

const shutdownTimeoutMs = 10_000;
const shutdownSignalReasons: Partial<Record<NodeJS.Signals, string>> = {
  SIGINT: 'interrupt from the terminal',
  SIGTERM: 'termination requested by the operating system or process manager',
  SIGHUP: 'terminal session ended or parent process requested hangup',
  SIGQUIT: 'quit requested by the terminal',
};

function closeServer(server: ShutdownServer, serverName: string) {
  return new Promise<void>((resolve, reject) => {
    logger.info({ serverName }, `Closing ${serverName} server listener...`);
    server.closeIdleConnections?.();
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      logger.info({ serverName }, `${serverName} server listener closed.`);
      resolve();
    });
  });
}

async function destroyBackgroundWork() {
  const errors: unknown[] = [];

  try {
    logger.info('Stopping scheduled background work...');
    deleteOldTorrentsScheduler.destroy();
    logger.info('Scheduled background work stopped.');
  } catch (error: unknown) {
    errors.push(error);
    logger.error({ error }, 'Failed to stop scheduled background work.');
  }

  try {
    logger.info('Stopping torrent client...');
    await torrentClient.destroy();
    logger.info('Torrent client stopped.');
  } catch (error: unknown) {
    errors.push(error);
    logger.error({ error }, 'Failed to stop torrent client.');
  }

  try {
    logger.info('Closing database connection...');
    closeDbInstance();
    logger.info('Database connection closed.');
  } catch (error: unknown) {
    errors.push(error);
    logger.error({ error }, 'Failed to close database connection.');
  }

  return errors;
}

async function gracefulShutdown(
  signal: NodeJS.Signals,
  servers: {
    http: ShutdownServer;
    https: ShutdownServer;
  },
) {
  const reason = shutdownSignalReasons[signal] ?? 'shutdown requested';

  logger.info(
    { signal, reason },
    'Received shutdown signal; beginning graceful shutdown.',
  );

  const cleanup = (async () => {
    const errors: unknown[] = [];

    await Promise.all(
      Object.entries(servers).map(async ([key, server]) => {
        const serverName = key.toUpperCase();
        try {
          await closeServer(server, serverName);
        } catch (error) {
          errors.push(error);
          logger.error(
            { error, serverName },
            `Failed to close ${serverName} server listener.`,
          );
        }
      }),
    );
    errors.push(...(await destroyBackgroundWork()));

    return errors;
  })();

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Graceful shutdown timed out after ${shutdownTimeoutMs}ms`));
    }, shutdownTimeoutMs).unref();
  });

  try {
    const cleanupErrors = await Promise.race([cleanup, timeout]);

    if (cleanupErrors.length > 0) {
      logger.error(
        { signal, errorCount: cleanupErrors.length },
        'Graceful shutdown finished with cleanup errors; exiting process with failure.',
      );
      process.exit(1);
    }

    logger.info({ signal }, 'Graceful shutdown complete. Exiting process.');
    process.exit(0);
  } catch (error) {
    logger.error(
      { error, signal },
      'Graceful shutdown did not complete cleanly; forcing process exit.',
    );

    for (const server of [servers.http, servers.https]) {
      server.closeAllConnections?.();
    }

    process.exit(1);
  }
}

export function registerGracefulShutdown(servers: {
  http: ShutdownServer;
  https: ShutdownServer;
}) {
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'] as const) {
    process.once(signal, () => {
      void gracefulShutdown(signal, servers);
    });
  }
}
