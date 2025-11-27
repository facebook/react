/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  root: true, // Stop ESLint from looking for parent configs
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2020: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // This is a dev tool that uses console for output
    'no-for-of-loops/no-for-of-loops': 'off', // Not applicable for dev tools
    'react-internal/no-production-logging': 'off', // Dev tool output
    'react-internal/warning-args': 'off', // Dev tool output
    'react-internal/safe-string-coercion': 'off', // Not production code
    'es/no-optional-chaining': 'off', // ES2020 is fine for dev tools
    'dot-notation': 'off', // Bracket notation needed for process.env
    'no-restricted-syntax': 'off', // substring is fine
  },
  ignorePatterns: ['dist', 'node_modules', '__tests__', 'scripts/**/*.js', 'fixtures/**'],
  overrides: [
    {
      files: ['scripts/**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off', // Node.js scripts use require
      },
    },
  ],
};

