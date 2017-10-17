/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
