import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    workspace: ['server/vitest.config.ts', 'client/vite.config.ts'],
  },
});
