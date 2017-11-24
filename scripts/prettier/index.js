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
const execFileSync = require('child_process').execFileSync;
const prettier = require('prettier');
const fs = require('fs');

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
    patterns: [
      // Internal forwarding modules
      'packages/*/*.js',
      // Source files
      'packages/*/src/**/*.js',
      'packages/shared/**/*.js',
    ],
    ignore: ['**/node_modules/**'],
  },
  scripts: {
    patterns: [
      // Forwarding modules that get published to npm (must be ES5)
      'packages/*/npm/**/*.js',
      // Need to work on Node
      'scripts/**/*.js',
      'fixtures/**/*.js',
    ],
    ignore: [
      '**/node_modules/**',
      // Built files and React repo clone
      'scripts/bench/benchmarks/**',
    ],
    options: {
      trailingComma: 'es5',
    },
  },
};

function exec(command, args) {
  console.log('> ' + [command].concat(args).join(' '));
  var options = {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'pipe',
    encoding: 'utf-8',
  };
  return execFileSync(command, args, options);
}

var mergeBase = exec('git', ['merge-base', 'HEAD', 'master']).trim();
var changedFiles = new Set(
  exec('git', [
    'diff',
    '-z',
    '--name-only',
    '--diff-filter=ACMRTUB',
    mergeBase,
  ]).match(/[^\0]+/g)
);

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
