import {defineConfig} from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';

console.log(reactHooks.configs['recommended-latest']);

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
    plugins: {
      'react-hooks': reactHooks,
    },
    extends: ['react-hooks/recommended-latest'],
    rules: {
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]);
