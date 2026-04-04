import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', '.next', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Unused vars — warn, but allow underscore-prefixed
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // From code-cleanliness.md — Rule 1: 3 params max
      'max-params': ['error', 3],

      // From code-cleanliness.md — Rule 8/18: Don't mutate function arguments
      'no-param-reassign': 'error',

      // From code-cleanliness.md — Rule 20: Prefer immutability
      'prefer-const': 'error',

      // From code-cleanliness.md — Rule 35: Throw Error objects, not strings
      'no-throw-literal': 'error',

      // From code-cleanliness.md — Rule 37: No `any` as a shortcut
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/layout.tsx', '**/loading.tsx', '**/error.tsx', '**/not-found.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);
