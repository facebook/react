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

var emptyObject = require('emptyObject');
var invariant = require('invariant');
var {
  getComponentName,
  isFiberMounted,
} = require('ReactFiberTreeReflection');
var {
  ClassComponent,
  HostContainer,
} = require('ReactTypeOfWork');

if (__DEV__) {
  var checkReactTypeSpec = require('checkReactTypeSpec');
}

let index = -1;
const contextStack : Array<Object> = [];
const didPerformWorkStack : Array<boolean> = [];

function getUnmaskedContext() {
  if (index === -1) {
    return emptyObject;
  }
  return contextStack[index];
}

exports.getMaskedContext = function(fiber : Fiber) {
  const type = fiber.type;
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
    const name = getComponentName(fiber);
    const debugID = 0; // TODO: pass a real ID
    checkReactTypeSpec(contextTypes, context, 'context', name, null, debugID);
  }

  return context;
};

exports.hasContextChanged = function() : boolean {
  return index > -1 && didPerformWorkStack[index];
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

function popContextProvider() : void {
  contextStack[index] = emptyObject;
  didPerformWorkStack[index] = false;
  index--;
}
exports.popContextProvider = popContextProvider;

exports.pushTopLevelContextObject = function(context : Object, didChange : boolean) : void {
  invariant(index === -1, 'Unexpected context found on stack');
  index++;
  contextStack[index] = context;
  didPerformWorkStack[index] = didChange;
};

function processChildContext(fiber : Fiber, parentContext : Object): Object {
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
    const debugID = 0; // TODO: pass a real ID
    checkReactTypeSpec(childContextTypes, childContext, 'childContext', name, null, debugID);
  }
  return {...parentContext, ...childContext};
}
exports.processChildContext = processChildContext;

exports.pushContextProvider = function(fiber : Fiber, didPerformWork : boolean) : void {
  const instance = fiber.stateNode;
  const memoizedMergedChildContext = instance.__reactInternalMemoizedMergedChildContext;
  const canReuseMergedChildContext = !didPerformWork && memoizedMergedChildContext != null;

  let mergedContext = null;
  if (canReuseMergedChildContext) {
    mergedContext = memoizedMergedChildContext;
  } else {
    mergedContext = processChildContext(fiber, getUnmaskedContext());
    instance.__reactInternalMemoizedMergedChildContext = mergedContext;
  }

  index++;
  contextStack[index] = mergedContext;
  didPerformWorkStack[index] = didPerformWork;
};

exports.resetContext = function() : void {
  index = -1;
};

exports.findCurrentUnmaskedContext = function(fiber: Fiber) : Object {
  // Currently this is only used with renderSubtreeIntoContainer; not sure if it
  // makes sense elsewhere
  invariant(
    isFiberMounted(fiber) && fiber.tag === ClassComponent,
    'Expected subtree parent to be a mounted class component'
  );

  let node : Fiber = fiber;
  while (node.tag !== HostContainer) {
    if (isContextProvider(node)) {
      return node.stateNode.__reactInternalMemoizedMergedChildContext;
    }
    const parent = node.return;
    invariant(parent, 'Found unexpected detached subtree parent');
    node = parent;
  }
  return node.stateNode.context;
};

exports.unwindContext = function(from : Fiber, to: Fiber) {
  let node = from;
  while (node && (node !== to) && (node.alternate !== to)) {
    if (isContextProvider(node)) {
      popContextProvider();
    }
    node = node.return;
  }
};
