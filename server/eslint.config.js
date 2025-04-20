import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  {
    files: ['**/*.{ts,js}'],
    plugins: { js, ts, import: importPlugin },
    extends: ['js/recommended', 'ts/recommended'],
    languageOptions: { globals: globals.node },
    rules: {
      'import/order': 'warn',
      'no-console': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
]);
