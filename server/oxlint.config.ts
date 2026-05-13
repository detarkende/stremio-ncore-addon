import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['typescript', 'import'],
  env: {
    node: true,
  },
  rules: {
    'no-console': 'warn',
    'typescript/consistent-type-imports': 'error',
  },
});
