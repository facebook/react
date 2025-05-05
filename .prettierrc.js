'use strict';

const {esNextPaths} = require('./scripts/shared/pathsByLanguageVersion');

/**
 * Prettier configuration
 * See https://prettier.io/docs/en/options.html for more details
 */
module.exports = {
  // Plugin for Hermes (Meta's JavaScript engine) specific parsing
  plugins: [
    'prettier-plugin-hermes-parser',
    'prettier-plugin-organize-imports', // For organizing imports automatically
  ],
  
  // Core formatting options
  bracketSpacing: false,    // No spaces between brackets in object literals
  singleQuote: true,        // Use single quotes instead of double quotes
  bracketSameLine: true,    // Put the > of a multi-line JSX element at the end of the last line
  trailingComma: 'es5',     // Default trailing commas for ES5 compatible code
  printWidth: 80,           // Line length that the printer will wrap on
  parser: 'hermes',         // Default parser
  arrowParens: 'avoid',     // Avoid parentheses around single parameter arrow functions
  semi: true,               // Add semicolons at the end of statements
  tabWidth: 2,              // Number of spaces per indentation level
  useTabs: false,           // Use spaces instead of tabs
  endOfLine: 'lf',          // Line feed only for consistent line endings

  // Configuration for specific file patterns
  overrides: [
    // Configuration files
    {
      files: ['*.code-workspace', '*.json', '*.jsonc', '*.json5'],
      options: {
        parser: 'json-stringify',
      },
    },
    // ESNext path configurations
    {
      files: esNextPaths,
      options: {
        trailingComma: 'all', // Full trailing commas for more modern code
      },
    },
    // TypeScript files
    {
      files: ['*.ts', '*.tsx'],
      options: {
        trailingComma: 'all',
        parser: 'typescript',
      },
    },
    // Markdown files
    {
      files: ['*.md', '*.mdx'],
      options: {
        parser: 'markdown',
        proseWrap: 'always',
        printWidth: 100,
      },
    },
    // CSS, SCSS, and LESS files
    {
      files: ['*.css', '*.scss', '*.less'],
      options: {
        parser: 'css',
        singleQuote: false,
      },
    },
    // GraphQL files
    {
      files: ['*.graphql', '*.gql'],
      options: {
        parser: 'graphql',
      },
    },
  ],
};