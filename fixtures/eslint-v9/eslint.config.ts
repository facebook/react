import type {Linter} from 'eslint';
import * as reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  reactHooks.configs['recommended'],
  {
    rules: {
      'react-hooks/exhaustive-deps': 'error',
    },
  },
] satisfies Linter.Config[];
