import { loadEnv } from './env';
loadEnv(process.env);

const { logger } = await import('./logger');
const { torrentStore } = await import('./app/torrent');
const { createDbInstance } = await import('./db/client');

logger.info('Initializing database...');
createDbInstance();

logger.info('Loading existing torrents from database...');
await torrentStore.loadExistingTorrents();
logger.info('Initialization complete.');
