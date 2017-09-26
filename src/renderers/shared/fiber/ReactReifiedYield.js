/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactReifiedYield
 * @flow
 */

'use strict';

import type {ReactYield} from 'ReactCoroutine';
import type {Fiber} from 'ReactFiber';

var {createFiberFromElementType} = require('ReactFiber');

export type ReifiedYield = {continuation: Fiber, props: Object};

exports.createReifiedYield = function(yieldNode: ReactYield): ReifiedYield {
  var fiber = createFiberFromElementType(yieldNode.continuation, yieldNode.key);
  return {
    continuation: fiber,
    props: yieldNode.props,
  };
};

exports.createUpdatedReifiedYield = function(
  previousYield: ReifiedYield,
  yieldNode: ReactYield,
): ReifiedYield {
  return {
    continuation: previousYield.continuation,
    props: yieldNode.props,
  };
};
