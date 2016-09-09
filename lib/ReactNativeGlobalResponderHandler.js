/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeGlobalResponderHandler
 */
'use strict';

var UIManager = require('react-native/lib/UIManager');

var ReactNativeGlobalResponderHandler = {
  onChange: function (from, to, blockNativeResponder) {
    if (to !== null) {
      UIManager.setJSResponder(to._rootNodeID, blockNativeResponder);
    } else {
      UIManager.clearJSResponder();
    }
  }
};

module.exports = ReactNativeGlobalResponderHandler;