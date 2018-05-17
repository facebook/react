/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

process.on('unhandledRejection', err => {
  throw err;
});

const chalk = require('chalk');
const runFlow = require('../flow/runFlow');
const {typedRenderers} = require('../flow/typedRenderers');

// This script is using `flow status` for a quick check with a server.
// Use it for local development.

const primaryRenderer = process.argv[2];
if (typedRenderers.indexOf(primaryRenderer) === -1) {
  console.log(
    'The ' +
      chalk.red('yarn flow') +
      ' command now requires you to pick a primary renderer:'
  );
  console.log();
  typedRenderers.forEach(renderer => {
    console.log('  * ' + chalk.cyan('yarn flow ' + renderer));
  });
  console.log();
  console.log('If you are not sure, run ' + chalk.green('yarn flow dom') + '.');
  console.log(
    'This will still typecheck non-DOM packages, although less precisely.'
  );
  console.log();
  console.log('Note that checks for all renderers will run on CI.');
  console.log(
    'You can also do this locally with ' +
      chalk.cyan('yarn flow-ci') +
      ' but it will be slow.'
  );
  console.log();
  process.exit(1);
}

runFlow(primaryRenderer, ['status']);
