/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactInstrumentation
 * @flow
 */

'use strict';

// Trust the developer to only use ReactInstrumentation with a __DEV__ check
var debugTool = ((null: any): typeof ReactDebugTool);

if (__DEV__) {
  var ReactDebugTool = require('ReactDebugTool');
  debugTool = ReactDebugTool;
}

module.exports = {debugTool};
