import { resolve } from 'path';

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/server/db/migrations',
  schema: './src/server/db/schema',
  dialect: 'sqlite',
  dbCredentials: {
    url: resolve(process.env.ADDON_DIR ?? '', 'config/sna.db'),
  },
});
