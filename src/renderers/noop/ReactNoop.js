/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNoop
 * @flow
 */

/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */

'use strict';

var ReactFiberReconciler = require('ReactFiberReconciler');

var scheduledHighPriCallback = null;
var scheduledLowPriCallback = null;

var NoopRenderer = ReactFiberReconciler({

  createHostInstance() {

  },
  scheduleHighPriCallback(callback) {
    scheduledHighPriCallback = callback;
  },
  scheduleLowPriCallback(callback) {
    scheduledLowPriCallback = callback;
  },

});

var ReactNoop = {

  render(element : ReactElement) {

    NoopRenderer.mountNewRoot(element);

  },

  flushHighPri() {
    var cb = scheduledHighPriCallback;
    if (cb === null) {
      return;
    }
    scheduledHighPriCallback = null;
    cb();
  },

  flushLowPri(timeout : number = Infinity) {
    var cb = scheduledLowPriCallback;
    if (cb === null) {
      return;
    }
    scheduledLowPriCallback = null;
    var timeRemaining = timeout;
    cb({
      timeRemaining() {
        // Simulate a fix amount of time progressing between each call.
        timeRemaining -= 5;
        if (timeRemaining < 0) {
          timeRemaining = 0;
        }
        return timeRemaining;
      },
    });
  },

  flush() {
    ReactNoop.flushHighPri();
    ReactNoop.flushLowPri();
  },

};

module.exports = ReactNoop;
