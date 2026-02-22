import { defineConfig } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  {
    files: ['src/**/*.{ts,js}'],
    plugins: { js, ts, import: importPlugin },
    extends: ['js/recommended', 'ts/recommended'],
    languageOptions: {
      globals: globals.node,
      parserOptions: { tsconfigRootDir: __dirname },
    },
    rules: {
      'import/order': 'warn',
      'no-console': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
]);
