import { resolve } from 'path';

import { env } from '@server/env';
import { ensureDirExists } from '@server/utils/files';
import SQLite, { type Database as SQLiteDatabase } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

function setupClient(sqlite: SQLiteDatabase) {
  return drizzle({ client: sqlite });
}

let db: ReturnType<typeof setupClient>;

export function createDbInstance({ isTestDb = false } = {}) {
  let sqlite: SQLiteDatabase;

  if (isTestDb) {
    sqlite = new SQLite(':memory:');
  } else {
    const configDir = resolve(env.ADDON_DIR, 'config');
    ensureDirExists(configDir);
    sqlite = new SQLite(resolve(configDir, 'sna.db'));
  }

  db = setupClient(sqlite);

  const migrationsFolder = resolve(import.meta.dirname, './migrations');
  migrate(db, { migrationsFolder });
}

export function closeDbInstance() {
  db?.$client.close();
}

export { db };
