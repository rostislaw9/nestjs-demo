import prettier from 'eslint-config-prettier';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  ...tseslint.configs.recommended,
  prettier,
  pluginPrettierRecommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      'eslint.config.mjs',
      '**/dist/**',
      '**/node_modules/**',
      '**/test/**',
      '**/*.{spec,test}.{ts,js}',
    ],
  }
];
