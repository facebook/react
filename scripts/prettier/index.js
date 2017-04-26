/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const {format} = require('prettier');
const {readFileSync, writeFileSync} = require('fs');
const {red, dim, reset} = require('chalk');
const {sync} = require('glob');

const shouldWrite = process.argv[2] === 'write';

const defaultOptions = {
  bracketSpacing: false,
  singleQuote: true,
  jsxBracketSameLine: true,
  trailingComma: 'all',
};
const configs = [
  // default
  {
    patterns: ['src/**/*.js'],
    ignore: ['**/third_party/**', '**/node_modules/**'],
  },
  // scripts
  {
    patterns: ['scripts/**/*.js'],
    ignore: ['**/bench/**'],
    options: {
      trailingComma: 'es5',
    },
  },
];

configs.forEach(({patterns, options = {}, ignore}) => {
  if (patterns.length > 1) {
    patterns = `{${patterns.join(',')}}`;
  } else {
    patterns = patterns.join(',');
  }

  options = Object.assign({}, defaultOptions, options);

  const files = sync(patterns, {ignore});

  files.forEach(file => {
    const source = readFileSync(file, 'utf-8');
    const output = format(source, options);

    // The `prettier.check` method does not work correctly
    // https://github.com/prettier/prettier/pull/1424
    if (output !== source) {
      if (shouldWrite) {
        try {
          writeFileSync(file, output, 'utf-8');
        } catch (error) {
          console.log(red(`Unable to write file: ${file}`), error);
          process.exit(2);
        }
      } else {
        console.log(
          '\n' +
            red(
              `  This project uses prettier to format all JavaScript code.\n`
            ) +
            dim(`    Please run `) +
            reset('yarn prettier') +
            dim(` and add changes to files listed above to your commit.`) +
            `\n`
        );
        process.exit(1);
      }
    }
  });
});
