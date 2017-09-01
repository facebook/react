/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule ReactFiberComponentTreeHook
 */

'use strict';

var ReactTypeOfWork = require('ReactTypeOfWork');
var {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostComponent,
} = ReactTypeOfWork;
var describeComponentFrame = require('describeComponentFrame');
var getComponentName = require('getComponentName');

import type {Source} from 'ReactElementType';
import type {Fiber} from 'ReactFiber';

export type StackFrame = {
  name: string | null,
  source: Source | null,
};

function createStackFrame(fiber: Fiber): StackFrame {
  switch (fiber.tag) {
    case IndeterminateComponent:
    case FunctionalComponent:
    case ClassComponent:
    case HostComponent:
      const name = getComponentName(fiber);
      const source = fiber._debugSource;

      return {
        name,
        source: source != null ? source : null,
      };
    default:
      return {
        name: null,
        source: null,
      };
  }
}

function describeFiber(fiber: Fiber): string {
  switch (fiber.tag) {
    case IndeterminateComponent:
    case FunctionalComponent:
    case ClassComponent:
    case HostComponent:
      const owner = fiber._debugOwner;
      const source = fiber._debugSource;
      const name = getComponentName(fiber);
      let ownerName = null;
      if (owner) {
        ownerName = getComponentName(owner);
      }
      return describeComponentFrame(name, source, ownerName);
    default:
      return '';
  }
}

// This function can only be called with a work-in-progress fiber and
// only during begin or complete phase. Do not call it under any other
// circumstances.
function getStackAddendumByWorkInProgressFiber(workInProgress: Fiber): string {
  let info = '';
  let node = workInProgress;
  do {
    info += describeFiber(node);
    // Otherwise this return pointer might point to the wrong tree:
    node = node.return;
  } while (node);
  return info;
}

// This function can only be called with a work-in-progress fiber and
// only during begin or complete phase. Do not call it under any other
// circumstances.
function getStackFramesByWorkInProgressFiber(
  workInProgress: Fiber,
): Array<StackFrame> {
  const stackFrames = [];
  let node = workInProgress;
  do {
    stackFrames.push(createStackFrame(node));
    // Otherwise this return pointer might point to the wrong tree:
    node = node.return;
  } while (node);
  return stackFrames;
}

module.exports = {
  getStackAddendumByWorkInProgressFiber,
  getStackFramesByWorkInProgressFiber,
};
