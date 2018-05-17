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

const runFlow = require('../flow/runFlow');
const {typedRenderers} = require('../flow/typedRenderers');

// This script is using `flow status` for a quick check with a server.
// Use it for local development.

const primaryRenderer = process.argv[2];
if (typedRenderers.indexOf(primaryRenderer) === -1) {
  console.error(
    'You need to pass a primary renderer to yarn flow. For example:'
  );
  typedRenderers.forEach(renderer => {
    console.log('  * yarn flow ' + renderer);
  });
  console.log();
  process.exit(1);
}

runFlow(primaryRenderer, ['status']);
