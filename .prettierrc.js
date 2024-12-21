'use strict';

const { esNextPaths } = require('./scripts/shared/pathsByLanguageVersion');

module.exports = {
  plugins: ['prettier-plugin-hermes-parser'], // Plugin for Hermes parser support
  bracketSpacing: false, // Disable space between brackets in object literals
  singleQuote: true, // Use single quotes for strings
  bracketSameLine: true, // Put the closing bracket of multi-line JSX elements at the same line
  trailingComma: 'es5', // Use trailing commas where valid in ES5 (e.g., objects, arrays)
  printWidth: 80, // Set the maximum line length to 80 characters
  parser: 'hermes', // Use Hermes parser
  arrowParens: 'avoid', // Omit parentheses for single-argument arrow functions

  // Overrides for specific file types or patterns
  overrides: [
    // Handle .code-workspace files with a specific parser
    {
      files: ['*.code-workspace'],
      options: {
        parser: 'json-stringify', // Parse workspace files as JSON
      },
    },
    // Handle files that match esNextPaths
    {
      files: esNextPaths,
      options: {
        trailingComma: 'all', // Enable trailing commas for ESNext paths
      },
    },
    // Handle TypeScript files (*.ts, *.tsx)
    {
      files: ['*.ts', '*.tsx'],
      options: {
        trailingComma: 'all', // Enable trailing commas in TypeScript files
        parser: 'typescript', // Use TypeScript parser
      },
    },
  ],
};
