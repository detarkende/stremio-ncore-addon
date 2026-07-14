import { defineConfig } from 'oxfmt';

export default defineConfig({
  printWidth: 90,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'always',
  sortImports: {},
  ignorePatterns: [
    'pnpm-lock.yaml',
    'src/server/db/migrations',
    '**/mocks/**',
    '**/*.gen.ts',
  ],
});
