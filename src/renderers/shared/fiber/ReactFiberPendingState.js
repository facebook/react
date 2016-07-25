/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberPendingState
 * @flow
 */

'use strict';

export type PendingState = {
  partialState: any,
  next: PendingState,
  tail: PendingState
} | null;

exports.createPendingState = function(partialState: mixed): PendingState {
  return {
    partialState,
    next: null,
    tail: null,
  };
};

exports.mergePendingState = function(prevState: any, queue: PendingState): any {
  if (queue === null) {
    return prevState;
  }
  let state = Object.assign({}, prevState, queue.partialState);
  while (queue = queue.next) {
    state = Object.assign(state, queue.partialState);
  }
  return state;
};
