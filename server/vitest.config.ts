import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./src/test-utils/setup.ts'],
    sequence: {
      shuffle: true,
    },
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      reportsDirectory: './coverage',
      clean: true,
      enabled: true,
      exclude: ['**/*.test.ts', 'coverage/**', 'src/test-utils/**', 'src/exports.ts'],
    },
  },
  plugins: [tsconfigPaths()],
});
