/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberContext
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { StackCursor } from 'ReactFiberStack';

var emptyObject = require('emptyObject');
var invariant = require('invariant');
var {
  getComponentName,
  isFiberMounted,
} = require('ReactFiberTreeReflection');
var {
  ClassComponent,
  HostRoot,
} = require('ReactTypeOfWork');
const {
  createCursor,
  pop,
  push,
  reset,
} = require('ReactFiberStack');

if (__DEV__) {
  var checkReactTypeSpec = require('checkReactTypeSpec');
}

let contextStackCursor : StackCursor<?Object> = createCursor((null: ?Object));
let didPerformWorkStackCursor : StackCursor<?boolean> = createCursor((null: ?boolean));

function getUnmaskedContext() {
  return contextStackCursor.current || emptyObject;
}

exports.getMaskedContext = function(workInProgress : Fiber) {
  const type = workInProgress.type;
  const contextTypes = type.contextTypes;
  if (!contextTypes) {
    return emptyObject;
  }

  const unmaskedContext = getUnmaskedContext();
  const context = {};

  for (let key in contextTypes) {
    context[key] = unmaskedContext[key];
  }

  if (__DEV__) {
    const name = getComponentName(workInProgress);
    checkReactTypeSpec(contextTypes, context, 'context', name, null, workInProgress);
  }

  return context;
};

exports.hasContextChanged = function() : boolean {
  return Boolean(didPerformWorkStackCursor.current);
};

function isContextProvider(fiber : Fiber) : boolean {
  return (
    fiber.tag === ClassComponent &&
    // Instance might be null, if the fiber errored during construction
    fiber.stateNode &&
    typeof fiber.stateNode.getChildContext === 'function'
  );
}
exports.isContextProvider = isContextProvider;

function popContextProvider(fiber : Fiber) : void {
  pop(didPerformWorkStackCursor, fiber);
  pop(contextStackCursor, fiber);
}
exports.popContextProvider = popContextProvider;

exports.pushTopLevelContextObject = function(fiber : Fiber, context : Object, didChange : boolean) : void {
  invariant(contextStackCursor.cursor == null, 'Unexpected context found on stack');

  push(contextStackCursor, context, fiber);
  push(didPerformWorkStackCursor, didChange, fiber);
};

function processChildContext(fiber : Fiber, parentContext : Object, isReconciling : boolean): Object {
  const instance = fiber.stateNode;
  const childContextTypes = fiber.type.childContextTypes;
  const childContext = instance.getChildContext();
  for (let contextKey in childContext) {
    invariant(
      contextKey in childContextTypes,
      '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
      getComponentName(fiber),
      contextKey
    );
  }
  if (__DEV__) {
    const name = getComponentName(fiber);
    // We can only provide accurate element stacks if we pass work-in-progress tree
    // during the begin or complete phase. However currently this function is also
    // called from unstable_renderSubtree legacy implementation. In this case it unsafe to
    // assume anything about the given fiber. We won't pass it down if we aren't sure.
    // TODO: remove this hack when we delete unstable_renderSubtree in Fiber.
    const workInProgress = isReconciling ? fiber : null;
    checkReactTypeSpec(childContextTypes, childContext, 'childContext', name, null, workInProgress);
  }
  return {...parentContext, ...childContext};
}
exports.processChildContext = processChildContext;

exports.pushContextProvider = function(workInProgress : Fiber, didPerformWork : boolean) : void {
  const instance = workInProgress.stateNode;
  const memoizedMergedChildContext = instance.__reactInternalMemoizedMergedChildContext;
  const canReuseMergedChildContext = !didPerformWork && memoizedMergedChildContext != null;

  let mergedContext = null;
  if (canReuseMergedChildContext) {
    mergedContext = memoizedMergedChildContext;
  } else {
    mergedContext = processChildContext(workInProgress, getUnmaskedContext(), true);
    instance.__reactInternalMemoizedMergedChildContext = mergedContext;
  }

  push(contextStackCursor, mergedContext, workInProgress);
  push(didPerformWorkStackCursor, didPerformWork, workInProgress);
};

exports.resetContext = function() : void {
  reset(contextStackCursor);
  reset(didPerformWorkStackCursor);
};

exports.findCurrentUnmaskedContext = function(fiber: Fiber) : Object {
  // Currently this is only used with renderSubtreeIntoContainer; not sure if it
  // makes sense elsewhere
  invariant(
    isFiberMounted(fiber) && fiber.tag === ClassComponent,
    'Expected subtree parent to be a mounted class component'
  );

  let node : Fiber = fiber;
  while (node.tag !== HostRoot) {
    if (isContextProvider(node)) {
      return node.stateNode.__reactInternalMemoizedMergedChildContext;
    }
    const parent = node.return;
    invariant(parent, 'Found unexpected detached subtree parent');
    node = parent;
  }
  return node.stateNode.context;
};
