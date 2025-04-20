import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const SERVER_URL = 'http://localhost:3000';

// https://vitejs.dev/config/
export default defineConfig({
  server: { proxy: { '/api': SERVER_URL, '/manifest.json': SERVER_URL }, port: 3001 },
  plugins: [react()],
  build: { outDir: path.resolve(__dirname, '../dist/client'), emptyOutDir: true },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@server': path.resolve(__dirname, '../dist/server/'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
