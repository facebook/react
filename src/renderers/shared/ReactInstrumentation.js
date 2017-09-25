/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
