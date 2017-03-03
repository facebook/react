/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AutoFocusUtils
 */

'use strict';

var ReactDOMComponentTree = require('ReactDOMComponentTree');

var focusNode = require('fbjs/lib/focusNode');

var AutoFocusUtils = {
  focusDOMComponent: function() {
    focusNode(ReactDOMComponentTree.getNodeFromInstance(this));
  },
};

module.exports = AutoFocusUtils;
