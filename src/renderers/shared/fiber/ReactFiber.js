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

  handler: EffectHandler,
  handlerTag: EffectTag,

  hasPendingChanges: bool,

  stateNode: StateNode,

};

module.exports = function(tag : number) : Fiber {
  return {

    tag: tag,

    parent: null,
    child: null,
    sibling: null,

    input: null,
    output: null,

    handler: function() {},
    handlerTag: 0,

    hasPendingChanges: true,

    stateNode: {},

  };
};
