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

if (__DEV__) {
  var checkReactTypeSpec = require('checkReactTypeSpec');
}

let index = -1;
const stack = [];

function getUnmaskedContext() {
  if (index === -1) {
    return emptyObject;
  }
  return stack[index];
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

exports.popContextProvider = function() {
  stack[index] = emptyObject;
  index--;
};

exports.pushContextProvider = function(fiber : Fiber) {
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

  const mergedContext = Object.assign({}, getUnmaskedContext(), childContext);
  index++;
  stack[index] = mergedContext;
};

exports.resetContext = function() {
  index = -1;
};

