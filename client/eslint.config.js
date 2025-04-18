import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
import react from 'eslint-plugin-react';
import css from '@eslint/css';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { js, ts, import: importPlugin, react },
    extends: ['js/recommended', 'ts/recommended', react.configs.flat.recommended],
    settings: { react: { version: 'detect' } },
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
