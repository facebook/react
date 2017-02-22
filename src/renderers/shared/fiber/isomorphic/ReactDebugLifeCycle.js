/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugLifeCycle
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';

type LifeCyclePhase = 'render' | 'getChildContext';

const ReactDebugLifeCycle = {
  current: (null : Fiber | null),
  phase: (null : LifeCyclePhase | null),
};

module.exports = ReactDebugLifeCycle;
