/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

process.on('unhandledRejection', err => {
  throw err;
});

const runFlow = require('../flow/runFlow');
const inlinedHostConfigs = require('../shared/inlinedHostConfigs');

async function check(idx) {
  if (idx == null) {
    throw new Error('Expected an inlinedHostConfig index');
  }
  const rendererInfo = inlinedHostConfigs[+idx];
  if (rendererInfo.isFlowTyped) {
    await runFlow(rendererInfo.shortName, ['check']);
    console.log();
  }
}

check(process.argv[2]);
