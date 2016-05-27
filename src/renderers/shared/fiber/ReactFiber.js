/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiber
 * @flow
 */

'use strict';

var ReactTypesOfWork = require('ReactTypesOfWork');
var {
  IndeterminateComponent,
  ClassComponent,
  HostComponent,
  CoroutineComponent,
  YieldComponent,
} = ReactTypesOfWork;

var ReactElement = require('ReactElement');

import type { ReactCoroutine, ReactYield } from 'ReactCoroutine';

export type Fiber = {

  // Tag identifying the type of fiber.
  tag: number,

  // Singly Linked List Tree Structure.
  parent: ?Fiber, // Consider a regenerated temporary parent stack instead.
  child: ?Fiber,
  sibling: ?Fiber,

  // Input is the data coming into process this fiber. Arguments.
  input: any, // This type will be more specific once we overload the tag.
  // Output is the return value of this fiber, or a linked list of return values
  // if this returns multiple values. Such as a fragment.
  output: any, // This type will be more specific once we overload the tag.

  // Used by multi-stage coroutines.
  stage: number, // Consider reusing the tag field instead.

  // This will be used to quickly determine if a subtree has no pending changes.
  hasPendingChanges: bool,

  // The local state associated with this fiber.
  stateNode: ?Object,

};

var createFiber = function(tag : number) : Fiber {
  return {

    tag: tag,

    parent: null,
    child: null,
    sibling: null,

    input: null,
    output: null,

    stage: 0,

    hasPendingChanges: true,

    stateNode: null,

  };
};

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

exports.createFiberFromElement = function(element : ReactElement) {
  const fiber = exports.createFiberFromElementType(element.type);
  if (typeof element.type === 'object') {
    // Hacky McHack
    element = ReactElement(fiber.input, null, element.ref, null, null, null, element.props);
  }
  fiber.input = element;
  return fiber;
};

exports.createFiberFromElementType = function(type : mixed) {
  let fiber;
  if (typeof type === 'function') {
    fiber = shouldConstruct(type) ?
      createFiber(ClassComponent) :
      createFiber(IndeterminateComponent);
  } else if (typeof type === 'string') {
    fiber = createFiber(HostComponent);
  } else if (typeof type === 'object' && type !== null) {
    // Currently assumed to be a continuation and therefore is a fiber already.
    fiber = type;
  } else {
    throw new Error('Unknown component type: ' + typeof type);
  }
  return fiber;
};

exports.createFiberFromCoroutine = function(coroutine : ReactCoroutine) {
  const fiber = createFiber(CoroutineComponent);
  fiber.input = coroutine;
  return fiber;
};

exports.createFiberFromYield = function(yieldNode : ReactYield) {
  const fiber = createFiber(YieldComponent);
  return fiber;
};
