import { loadEnv } from './env';
loadEnv(process.env);

const { logger } = await import('./logger');
const { torrentClient } = await import('./app/torrent');
const { createDbInstance } = await import('./db/client');

logger.info('Initializing database...');
createDbInstance();

logger.info('Loading existing torrents from database...');
await torrentClient.loadExistingTorrents();
logger.info('Initialization complete.');
