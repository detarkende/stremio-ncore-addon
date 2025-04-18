import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { env } from '@/env';

const configDir = resolve(env.ADDON_DIR, 'config');

if (!existsSync(configDir)) {
  mkdirSync(configDir);
}

const db = drizzle(resolve(env.ADDON_DIR, 'config/sna.db'), { casing: 'snake_case' });

const migrationsFolder = resolve(import.meta.dirname, './migrations');

migrate(db, { migrationsFolder });

export { db };
export type Database = typeof db;

export type Transaction = SQLiteTransaction<
  'sync',
  Database.RunResult,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;
