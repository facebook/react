/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugCurrentFiber
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';

type LifeCyclePhase = 'render' | 'getChildContext';

if (__DEV__) {
  var getComponentName = require('getComponentName');
  var { getStackAddendumByWorkInProgressFiber } = require('react/lib/ReactComponentTreeHook');
}

function getCurrentFiberOwnerName() : string | null {
  if (__DEV__) {
    const fiber = ReactDebugCurrentFiber.current;
    if (fiber === null) {
      return null;
    }
    if (fiber._debugOwner != null) {
      return getComponentName(fiber._debugOwner);
    }
  }
  return null;
}

function getCurrentFiberStackAddendum() : string | null {
  if (__DEV__) {
    const fiber = ReactDebugCurrentFiber.current;
    if (fiber === null) {
      return null;
    }
    // Safe because if current fiber exists, we are reconciling,
    // and it is guaranteed to be the work-in-progress version.
    return getStackAddendumByWorkInProgressFiber(fiber);
  }
  return null;
}

var ReactDebugCurrentFiber = {
  current: (null : Fiber | null),
  phase: (null : LifeCyclePhase | null),

  getCurrentFiberOwnerName,
  getCurrentFiberStackAddendum,
};

module.exports = ReactDebugCurrentFiber;
