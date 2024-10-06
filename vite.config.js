import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  server: { proxy: { '/api': 'http://localhost:3000' }, port: 3001 },
  plugins: [react()],
  build: { outDir: 'dist/client', emptyOutDir: true },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client'),
      '@server': path.resolve(__dirname, './src/server'),
    },
  },
});
