/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugCurrentFrame
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { DebugID } from 'ReactInstanceType';

const ReactDebugCurrentFrame = {};

if (__DEV__) {
  var {
    getStackAddendumByID,
    getStackAddendumByWorkInProgressFiber,
    getCurrentStackAddendum,
  } = require('ReactComponentTreeHook');

  // Component that is being worked on
  ReactDebugCurrentFrame.current = (null : Fiber | DebugID | null);

  // Element that is being cloned or created
  ReactDebugCurrentFrame.element = (null : *);

  ReactDebugCurrentFrame.getStackAddendum = function() : string | null {
    let stack = null;
    const current = ReactDebugCurrentFrame.current;
    const element = ReactDebugCurrentFrame.element;
    if (current !== null) {
      if (typeof current === 'number') {
        // DebugID from Stack.
        const debugID = current;
        stack = getStackAddendumByID(debugID);
      } else if (typeof current.tag === 'number') {
        // This is a Fiber.
        // The stack will only be correct if this is a work in progress
        // version and we're calling it during reconciliation.
        const workInProgress = current;
        stack = getStackAddendumByWorkInProgressFiber(workInProgress);
      }
    } else if (element !== null) {
      stack = getCurrentStackAddendum(element);
    }
    return stack;
  };
}

module.exports = ReactDebugCurrentFrame;
