import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import viteReact from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';

import sharedConfig from '../vitest.shared';
import { allowClipboard } from './src/test-utils/commands';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    plugins: [
      viteReact({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      tailwindcss(),
      devtools(),
    ],
    test: {
      include: ['src/**/*.test.tsx'],
      setupFiles: ['./src/test-utils/setup.ts'],
      alias: {
        '@/': new URL('./src/', import.meta.url).pathname,
      },
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
  }),
);
