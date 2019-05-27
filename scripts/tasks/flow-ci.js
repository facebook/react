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

async function checkAll() {
  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (let rendererInfo of inlinedHostConfigs) {
    if (rendererInfo.isFlowTyped) {
      await runFlow(rendererInfo.shortName, ['check']);
      console.log();
    }
  }
}

checkAll();
