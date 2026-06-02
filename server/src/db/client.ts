import { resolve } from 'path';

import SQLite, { type Database as SQLiteDatabase } from 'better-sqlite3';
import { type ExtractTablesWithRelations } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { env } from 'src/env';
import { ensureDirExists } from 'src/utils/files';

let db: BetterSQLite3Database<Record<string, never>> & { $client: SQLiteDatabase };

export function createDbInstance({ isTestDb = false } = {}) {
  let sqlite: SQLiteDatabase;

  if (isTestDb) {
    sqlite = new SQLite(':memory:');
  } else {
    const configDir = resolve(env.ADDON_DIR, 'config');
    ensureDirExists(configDir);
    sqlite = new SQLite(resolve(configDir, 'sna.db'));
  }

  db = drizzle({ client: sqlite, casing: 'snake_case' });

  const migrationsFolder = resolve(import.meta.dirname, './migrations');
  migrate(db, { migrationsFolder });
}

export function closeDbInstance() {
  db?.$client.close();
}

export { db };

export type Transaction = SQLiteTransaction<
  'sync',
  SQLite.RunResult,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;
