/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

// Based on similar script in Jest
// https://github.com/facebook/jest/blob/master/scripts/prettier.js

const chalk = require('chalk');
const glob = require('glob');
const prettier = require('prettier');
const fs = require('fs');
const listChangedFiles = require('../shared/listChangedFiles');
const {esNextPaths} = require('../shared/pathsByLanguageVersion');

const mode = process.argv[2] || 'check';
const shouldWrite = mode === 'write' || mode === 'write-changed';
const onlyChanged = mode === 'check-changed' || mode === 'write-changed';

const defaultOptions = {
  bracketSpacing: false,
  singleQuote: true,
  jsxBracketSameLine: true,
  trailingComma: 'all',
  printWidth: 80,
};
const config = {
  default: {
    patterns: ['**/*.js'],
    ignore: [
      '**/node_modules/**',
      // ESNext paths can have trailing commas.
      // We'll handle them separately below.
      ...esNextPaths,
    ],
    options: {
      trailingComma: 'es5',
    },
  },
  esNext: {
    patterns: [...esNextPaths],
    ignore: ['**/node_modules/**'],
  },
};

const changedFiles = onlyChanged ? listChangedFiles() : null;
let didWarn = false;
let didError = false;
Object.keys(config).forEach(key => {
  const patterns = config[key].patterns;
  const options = config[key].options;
  const ignore = config[key].ignore;

  const globPattern =
    patterns.length > 1 ? `{${patterns.join(',')}}` : `${patterns.join(',')}`;
  const files = glob
    .sync(globPattern, {ignore})
    .filter(f => !onlyChanged || changedFiles.has(f));

  if (!files.length) {
    return;
  }

  const args = Object.assign({}, defaultOptions, options);
  files.forEach(file => {
    try {
      const input = fs.readFileSync(file, 'utf8');
      if (shouldWrite) {
        const output = prettier.format(input, args);
        if (output !== input) {
          fs.writeFileSync(file, output, 'utf8');
        }
      } else {
        if (!prettier.check(input, args)) {
          if (!didWarn) {
            console.log(
              '\n' +
                chalk.red(
                  `  This project uses prettier to format all JavaScript code.\n`
                ) +
                chalk.dim(`    Please run `) +
                chalk.reset('yarn prettier-all') +
                chalk.dim(
                  ` and add changes to files listed below to your commit:`
                ) +
                `\n\n`
            );
            didWarn = true;
          }
          console.log(file);
        }
      }
    } catch (error) {
      didError = true;
      console.log('\n\n' + error.message);
      console.log(file);
    }
  });
});

if (didWarn || didError) {
  process.exit(1);
}
