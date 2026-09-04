import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist/**', 'safari/**', 'src/public/icons/**', 'coverage/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['**/*.ts'] })),

  {
    // TypeScript already resolves identifiers; `no-undef` only adds false positives.
    files: ['**/*.ts'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions },
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.config.{js,ts}', 'vitest.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  prettier,
];
