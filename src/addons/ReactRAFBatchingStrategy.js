/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactRAFBatchingStrategy
 * @typechecks static-only
 */

/* global requestAnimationFrame:true */

'use strict';

var ExecutionEnvironment = require('ExecutionEnvironment');
var ReactUpdates = require('ReactUpdates');

var requestAnimationFrame = require('requestAnimationFrame');

function tick() {
  ReactUpdates.flushBatchedUpdates();
  requestAnimationFrame(tick);
}

var ReactRAFBatchingStrategy = {
  isBatchingUpdates: true,

  /**
   * Call the provided function in a context within which calls to `setState`
   * and friends are batched such that components aren't updated unnecessarily.
   */
  batchedUpdates: function(callback, a, b, c, d) {
    callback(a, b, c, d);
  }
};

if (ExecutionEnvironment.canUseDOM) {
  requestAnimationFrame(tick);
}

module.exports = ReactRAFBatchingStrategy;
