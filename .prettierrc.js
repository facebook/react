'use strict';

const {
  compilerPaths,
  esNextPaths,
  typescriptPaths,
} = require('./scripts/shared/pathsByLanguageVersion');

module.exports = {
  bracketSpacing: false,
  singleQuote: true,
  bracketSameLine: true,
  trailingComma: 'es5',
  printWidth: 80,
  parser: 'flow',
  arrowParens: 'avoid',
  overrides: [
    {
      files: ['*.code-workspace'],
      options: {
        parser: 'json-stringify',
      },
    },
    {
      files: esNextPaths,
      options: {
        trailingComma: 'all',
      },
    },
    {
      files: typescriptPaths,
      options: {
        trailingComma: 'all',
        parser: 'typescript',
      },
    },
    {
      files: compilerPaths,
      options: {
        requirePragma: false,
        parser: 'babel-ts',
        semi: true,
        singleQuote: false,
        trailingComma: 'es5',
        bracketSpacing: true,
        bracketSameLine: false,
        printWidth: 80,
        arrowParens: 'always',
      },
    },
  ],
};
