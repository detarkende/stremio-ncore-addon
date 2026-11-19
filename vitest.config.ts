import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

import { allowClipboard } from './src/client/test-utils/commands';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    sequence: {
      shuffle: true,
    },
    reporters: ['default'],
    coverage: {
      include: ['**/src/**/*.ts', '**/src/**/*.tsx'],
      provider: 'istanbul',
      reportsDirectory: './coverage',
      reporter: ['text', 'json-summary', 'cobertura'],
      clean: true,
      enabled: true,
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        'coverage/**',
        '**/src/test-utils/**',
        'server/exports.ts',
        'server/db/schema.ts',
        '**/*.constants.ts',
        '**/mocks/**',
        '**/*.gen.ts',
        '**/constants/**',
      ],
    },
    projects: [
      // server
      {
        extends: true,
        test: {
          include: ['src/server/**/*.test.ts'],
          setupFiles: ['./src/server/test-utils/setup.ts'],
          environment: 'node',
        },
      },
      // client
      {
        extends: true,
        test: {
          include: ['src/client/**/*.test.ts', 'src/client/**/*.test.tsx'],
          setupFiles: ['./src/client/test-utils/setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false,
            commands: {
              allowClipboard,
            },
          },
        },
      },
    ],
  },
});
