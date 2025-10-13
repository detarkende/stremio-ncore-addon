import { loadExistingTorrents } from './app/torrent';
import { createDbInstance } from './db/client';
import { loadEnv } from './env';

loadEnv(process.env);
createDbInstance();

await loadExistingTorrents();
