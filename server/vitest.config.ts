import { defineConfig, mergeConfig } from 'vitest/config';
import sharedConfig from '../vitest.shared';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.ts'],
      setupFiles: ['./src/test-utils/setup.ts'],
      environment: 'node',
      alias: {
        'src/': new URL('./src/', import.meta.url).pathname,
      },
    },
  }),
);
