import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    sequence: {
      shuffle: true,
    },
    reporters: ['default'],
    coverage: {
      include: ['**/src/**/*.ts'],
      provider: 'istanbul',
      reportsDirectory: './coverage',
      reporter: ['text', 'json-summary', 'cobertura'],
      clean: true,
      enabled: true,
      exclude: [
        '**/*.test.ts',
        'coverage/**',
        '**/src/test-utils/**',
        'server/src/exports.ts',
        'server/src/db/schema/**/*.ts',
        '**/*.constants.ts',
        '**/mocks/**',
      ],
    },
  },
});
