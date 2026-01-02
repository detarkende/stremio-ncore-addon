import { defineConfig, mergeConfig } from 'vitest/config';
import sharedConfig from './vitest.shared';

export default defineConfig({
  test: {
    ...sharedConfig.test,
    projects: ['server', 'client'],
  },
});
