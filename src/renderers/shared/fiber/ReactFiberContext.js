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
  getPrevious,
  pop,
  push,
  replace,
} = require('ReactFiberStack');

if (__DEV__) {
  var checkReactTypeSpec = require('checkReactTypeSpec');
}

let contextStackCursor : StackCursor<?Object> = createCursor((null: ?Object));
let didPerformWorkStackCursor : StackCursor<boolean> = createCursor(false);

exports.getMaskedContext = function(workInProgress : Fiber) {
  const type = workInProgress.type;
  const contextTypes = type.contextTypes;
  if (!contextTypes) {
    return emptyObject;
  }

  const hasOwnContext = isContextProvider(workInProgress);
  // If the fiber is a context provider itself, by the time we read its context
  // we have already pushed its own child context on the stack. A context
  // provider should not "see" its own child context. Therefore we read the
  // previous (parent) context instead for context providers.
  const unmaskedContext = hasOwnContext ?
    getPrevious(contextStackCursor) :
    contextStackCursor.current;

  const context = {};
  if (unmaskedContext != null) {
    for (let key in contextTypes) {
      context[key] = unmaskedContext[key];
    }
  }

  if (__DEV__) {
    const name = getComponentName(workInProgress);
    checkReactTypeSpec(contextTypes, context, 'context', name, null, workInProgress);
  }

  return context;
};

exports.hasContextChanged = function() : boolean {
  return didPerformWorkStackCursor.current;
};

function isContextProvider(fiber : Fiber) : boolean {
  return (
    fiber.tag === ClassComponent &&
    fiber.type.childContextTypes != null
  );
}
exports.isContextProvider = isContextProvider;

function popContextProvider(fiber : Fiber) : void {
  if (!isContextProvider(fiber)) {
    return;
  }
  pop(didPerformWorkStackCursor, fiber);
  pop(contextStackCursor, fiber);
}
exports.popContextProvider = popContextProvider;

exports.pushTopLevelContextObject = function(fiber : Fiber, context : Object, didChange : boolean) : void {
  invariant(contextStackCursor.cursor == null, 'Unexpected context found on stack');

  push(contextStackCursor, context, fiber);
  push(didPerformWorkStackCursor, didChange, fiber);
};

function processChildContext(fiber : Fiber, parentContext : ?Object, isReconciling : boolean): Object {
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

exports.pushContextProvider = function(workInProgress : Fiber) : boolean {
  if (!isContextProvider(workInProgress)) {
    return false;
  }

  const instance = workInProgress.stateNode;
  // We push the context as early as possible to ensure stack integrity.
  // If the instance does not exist yet, we will push null at first,
  // and replace it on the stack later when invalidating the context.
  const memoizedMergedChildContext = (
    instance &&
    instance.__reactInternalMemoizedMergedChildContext
  ) || null;
  push(contextStackCursor, memoizedMergedChildContext, workInProgress);
  push(didPerformWorkStackCursor, false, workInProgress);
  return true;
};

exports.invalidateContextProvider = function(workInProgress : Fiber) : void {
  const instance = workInProgress.stateNode;
  invariant(instance, 'Expected to have an instance by this point.');
  const parentContext = getPrevious(contextStackCursor);
  const mergedContext = processChildContext(workInProgress, parentContext, true);
  instance.__reactInternalMemoizedMergedChildContext = mergedContext;
  replace(contextStackCursor, mergedContext, workInProgress);
  replace(didPerformWorkStackCursor, true, workInProgress);
};

exports.resetContext = function() : void {
  contextStackCursor.current = null;
  didPerformWorkStackCursor.current = false;
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
