/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var _require = require('./ReactFiber'),
    createFiberFromElementType = _require.createFiberFromElementType;

exports.createReifiedYield = function (yieldNode) {
  var fiber = createFiberFromElementType(yieldNode.continuation, yieldNode.key);
  return {
    continuation: fiber,
    props: yieldNode.props
  };
};

exports.createUpdatedReifiedYield = function (previousYield, yieldNode) {
  return {
    continuation: previousYield.continuation,
    props: yieldNode.props
  };
};