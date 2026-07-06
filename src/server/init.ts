import { loadEnv } from './env';
loadEnv(process.env);

const { torrentClient } = await import('./app/torrent');
const { createDbInstance } = await import('./db/client');
const { logger } = await import('./logger');

logger.info('Initializing database...');
createDbInstance();

logger.info('Loading existing torrents from database...');
await torrentClient.loadExistingTorrents();
logger.info('Initialization complete.');
