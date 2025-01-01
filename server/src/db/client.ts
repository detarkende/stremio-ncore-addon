import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { resolve } from 'path';
import { env } from '@/env';
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { ExtractTablesWithRelations } from 'drizzle-orm';
import { existsSync, mkdirSync } from 'fs';

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
