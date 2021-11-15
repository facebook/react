/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const minimist = require('minimist');
const runESLint = require('../eslint');

console.log('Linting all files...');
// https://circleci.com/docs/2.0/env-vars/#circleci-environment-variable-descriptions
if (!process.env.CI) {
  console.log('Hint: run `yarn linc` to only lint changed files.');
}

const cliOptions = minimist(process.argv.slice(2));
if (runESLint({onlyChanged: false, ...cliOptions})) {
  console.log('Lint passed.');
} else {
  console.log('Lint failed.');
  process.exit(1);
}
