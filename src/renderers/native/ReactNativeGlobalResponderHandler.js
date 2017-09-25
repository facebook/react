/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeGlobalResponderHandler
 */
'use strict';

var UIManager = require('UIManager');

var ReactNativeGlobalResponderHandler = {
  onChange: function(from, to, blockNativeResponder) {
    if (to !== null) {
      UIManager.setJSResponder(to._rootNodeID, blockNativeResponder);
    } else {
      UIManager.clearJSResponder();
    }
  },
};

module.exports = ReactNativeGlobalResponderHandler;
