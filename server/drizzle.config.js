import { defineConfig } from 'drizzle-kit';
import { resolve } from 'path';

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema',
  dialect: 'sqlite',
  dbCredentials: {
    url: resolve(process.env.ADDON_DIR, 'config/sna.db'),
  },
  casing: 'snake_case',
});
