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

async function checkAll() {
  for (let renderer of typedRenderers) {
    await runFlow(renderer, ['check']);
  }
}

checkAll();
