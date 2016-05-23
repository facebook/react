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
} = ReactTypesOfWork;

type StateNode = {};
type EffectHandler = () => void;
type EffectTag = number;

export type Fiber = {

  tag: number,

  parent: ?Fiber,
  child: ?Fiber,
  sibling: ?Fiber,

  input: ?Object,
  output: ?Object,

  hasPendingChanges: bool,

  stateNode: StateNode,

};

var createFiber = function(tag : number, handlerTag : number) : Fiber {
  return {

    tag: tag,

    parent: null,
    child: null,
    sibling: null,

    input: null,
    output: null,

    hasPendingChanges: true,

    stateNode: {},

  };
};

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

exports.createFiberFromElement = function(element : ReactElement) {
  let fiber;
  if (typeof element.type === 'function') {
    fiber = shouldConstruct(element.type) ?
      createFiber(ClassComponent, 0) :
      createFiber(IndeterminateComponent, 0);
  } else if (typeof element.type === 'string') {
    fiber = createFiber(HostComponent, 1);
  } else {
    throw new Error('Unknown component type: ' + typeof element.type);
  }

  fiber.input = element;
  return fiber;
};
