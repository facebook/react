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
} = require('ReactFiberTreeReflection');
var {
  ClassComponent,
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
    return null;
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

exports.isContextProvider = function(fiber : Fiber) : boolean {
  return (
    fiber.tag === ClassComponent &&
    typeof fiber.stateNode.getChildContext === 'function'
  );
};

exports.popContextProvider = function() : void {
  contextStack[index] = emptyObject;
  didPerformWorkStack[index] = false;
  index--;
};

exports.pushContextProvider = function(fiber : Fiber, didPerformWork : boolean) : void {
  const instance = fiber.stateNode;
  const childContextTypes = fiber.type.childContextTypes;

  const memoizedMergedChildContext = instance.__reactInternalMemoizedMergedChildContext;
  const canReuseMergedChildContext = !didPerformWork && memoizedMergedChildContext != null;

  let mergedContext = null;
  if (canReuseMergedChildContext) {
    mergedContext = memoizedMergedChildContext;
  } else {
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
    mergedContext = {...getUnmaskedContext(), ...childContext};
    instance.__reactInternalMemoizedMergedChildContext = mergedContext;
  }

  index++;
  contextStack[index] = mergedContext;
  didPerformWorkStack[index] = didPerformWork;
};

exports.resetContext = function() : void {
  index = -1;
};

