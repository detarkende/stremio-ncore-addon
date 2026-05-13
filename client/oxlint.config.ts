import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['typescript', 'import', 'react'],
  ignorePatterns: ['src/styles.css'],
  settings: {
    react: {
      version: '19.2.4',
    },
  },
});
