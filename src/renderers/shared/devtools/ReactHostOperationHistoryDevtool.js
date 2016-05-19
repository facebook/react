/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactHostOperationHistoryDevtool
 */

'use strict';

var history = [];

var ReactHostOperationHistoryDevtool = {
  onHostOperation(debugID, type, payload) {
    history.push({
      instanceID: debugID,
      type,
      payload,
    });
  },

  clearHistory() {
    if (ReactHostOperationHistoryDevtool._preventClearing) {
      // Should only be used for tests.
      return;
    }

    history = [];
  },

  getHistory() {
    return history;
  },
};

module.exports = ReactHostOperationHistoryDevtool;
