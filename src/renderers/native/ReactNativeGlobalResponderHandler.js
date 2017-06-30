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

var UIManager = require('UIManager');

var ReactNativeGlobalResponderHandler = {
  onChange: function(from, to, blockNativeResponder) {
    if (to !== null) {
      // TODO (bvaughn) Clean up once Stack is deprecated
      var tag = typeof to.tag !== 'number'
        ? to._rootNodeID
        : to.stateNode._nativeTag;
      UIManager.setJSResponder(tag, blockNativeResponder);
    } else {
      UIManager.clearJSResponder();
    }
  },
};

module.exports = ReactNativeGlobalResponderHandler;
