import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['typescript', 'import'],
  settings: { react: { version: '19.2.4' } },
  overrides: [
    {
      files: ['./src/client/**/*.{ts,tsx}'],
      plugins: ['react'],
    },
    {
      files: ['./src/server/**/*.ts'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'warn',
        'typescript/consistent-type-imports': 'error',
      },
    },
  ],
});
