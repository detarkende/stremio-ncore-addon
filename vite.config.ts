import path from 'node:path';

import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import fullstack from '@vite-fullstack/plugin';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  server: {
    allowedHosts: true,
  },
  plugins: [
    devtools(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './routes',
    }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
    fullstack(),
    viteStaticCopy({
      environment: 'server',
      targets: [
        {
          src: [path.resolve(import.meta.dirname, './src/server/db/migrations/**/*')],
          dest: './migrations',
          rename: { stripBase: 3 },
        },
      ],
    }),
  ],
});
