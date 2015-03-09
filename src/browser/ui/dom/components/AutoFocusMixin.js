/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AutoFocusMixin
 * @typechecks static-only
 */

'use strict';

var focusNode = require('focusNode');

var AutoFocusMixin = {
  componentDidMount: function() {
    if (this.props.autoFocus) {
      var domNode = this.getDOMNode();
      setTimeout(function () {
        focusNode(domNode);
      }, 0);
    }
  }
};

module.exports = AutoFocusMixin;
