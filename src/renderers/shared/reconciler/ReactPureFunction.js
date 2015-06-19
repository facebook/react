/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPureFunction
 */

'use strict';

var warning = require('warning');

/**
 * This module is used to assert side-effects. In DEV mode, we track if the
 * currently executing scope is pure. If it is, then any assertion of
 * side-effects triggers a warning. There should be no side-effects in pure
 * functions.
 */

var ReactPureFunction = {};

if (__DEV__) {
  ReactPureFunction.assertSideEffect = function(message) {
    warning(
      !ReactPureFunction.isPureScope,
      message
    );
  }
  ReactPureFunction.isPureScope = false;
}

module.exports = ReactPureFunction;
