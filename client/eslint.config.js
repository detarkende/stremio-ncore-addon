import { defineConfig, globalIgnores } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import react from 'eslint-plugin-react';
import css from '@eslint/css';
import importPlugin from 'eslint-plugin-import';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  // ...tanstackConfig,
  globalIgnores(['src/styles.css']),
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { js, ts, import: importPlugin, react },
    extends: ['js/recommended', 'ts/recommended', react.configs.flat.recommended],
    settings: { react: { version: 'detect' } },
    languageOptions: {
      parserOptions: { tsconfigRootDir: __dirname },
    },
    rules: {
      'import/order': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    files: ['src/**/*.css'],
    plugins: { css },
    language: 'css/css',
    extends: ['css/recommended'],
    rules: {
      'css/no-invalid-at-rules': 'off',
    },
  },
]);
