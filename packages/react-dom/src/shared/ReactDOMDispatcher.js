/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const Dispatcher = {
  current: null,
};

let stack = [];

function pushDispatcher(dispatcher) {
  stack.push(Dispatcher.current);
  Dispatcher.current = dispatcher;
}

function popDispatcher() {
  Dispatcher.current = stack.pop();
}

export {pushDispatcher, popDispatcher, Dispatcher};
