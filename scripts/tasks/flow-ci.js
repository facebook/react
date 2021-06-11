/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

// Parallelize tests across multiple tasks.
const nodeTotal = process.env.CIRCLE_NODE_TOTAL
  ? parseInt(process.env.CIRCLE_NODE_TOTAL, 10)
  : 1;
const nodeIndex = process.env.CIRCLE_NODE_INDEX
  ? parseInt(process.env.CIRCLE_NODE_INDEX, 10)
  : 0;

async function checkAll() {
  for (let i = 0; i < inlinedHostConfigs.length; i++) {
    if (i % nodeTotal === nodeIndex) {
      const rendererInfo = inlinedHostConfigs[i];
      if (rendererInfo.isFlowTyped) {
        await runFlow(rendererInfo.shortName, ['check']);
        console.log();
      }
    }
  }
}

checkAll();
