import {defineConfig} from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
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
    extends: [reactHooks.configs['recommended-latest']],
    rules: {
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]);
