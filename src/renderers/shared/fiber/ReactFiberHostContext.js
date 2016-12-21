/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberHostContext
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { HostConfig } from 'ReactFiberReconciler';
import type { StackCursor } from 'ReactFiberStack';

const emptyObject = require('emptyObject');

const {
  createCursor,
  pop,
  push,
  reset,
} = require('ReactFiberStack');

export type HostContext<C, CX> = {
  getHostContext() : CX,
  getRootHostContainer() : C,
  popHostContainer(fiber : Fiber) : void,
  popHostContext(fiber : Fiber) : void,
  pushHostContainer(fiber : Fiber, container : C) : void,
  pushHostContext(fiber : Fiber) : void,
  resetHostContainer() : void,
};

module.exports = function<T, P, I, TI, C, CX>(
  config : HostConfig<T, P, I, TI, C, CX>
) : HostContext<C, CX> {
  const {
    getChildHostContext,
    getRootHostContext,
  } = config;

  let contextStackCursor : StackCursor<?CX> = createCursor((null: ?CX));
  let rootInstanceStackCursor : StackCursor<?C> = createCursor((null: ?C));

  function getRootHostContainer() : C {
    if (rootInstanceStackCursor.current == null) {
      throw new Error('Expected root container to exist.');
    }
    return rootInstanceStackCursor.current;
  }

  function pushHostContainer(fiber : Fiber, nextRootInstance : C) {
    // Push current root instance onto the stack;
    // This allows us to reset root when portals are popped.
    push(rootInstanceStackCursor, nextRootInstance, fiber);

    const nextRootContext = getRootHostContext(nextRootInstance);

    // TODO (bvaughn) Push context-providing Fiber with its own cursor
    push(contextStackCursor, nextRootContext, fiber);
  }

  function popHostContainer(fiber : Fiber) {
    pop(contextStackCursor, fiber);
    // TODO (bvaughn) Pop context-providing Fiber with its own cursor
    pop(rootInstanceStackCursor, fiber);
  }

  function getHostContext() : CX {
    if (contextStackCursor.current == null) {
      throw new Error('Expected host context to exist.');
    }

    return contextStackCursor.current;
  }

  function pushHostContext(fiber : Fiber) : void {
    if (rootInstanceStackCursor.current == null) {
      throw new Error('Expected root host context to exist.');
    }

    const context = contextStackCursor.current || emptyObject;
    const rootInstance = rootInstanceStackCursor.current;
    const nextContext = getChildHostContext(context, fiber.type, rootInstance);

    if (context === nextContext) {
      return;
    }

    // TODO (bvaughn) Push context-providing Fiber with its own cursor
    push(contextStackCursor, nextContext, fiber);
  }

  function popHostContext(fiber : Fiber) : void {
    if (contextStackCursor.current == null) {
      return;
    }

    // TODO (bvaughn) Check context-providing Fiber and only pop if it matches
    pop(contextStackCursor, fiber);
  }

  function resetHostContainer() {
    reset(contextStackCursor);
    reset(rootInstanceStackCursor);
  }

  return {
    getHostContext,
    getRootHostContainer,
    popHostContainer,
    popHostContext,
    pushHostContainer,
    pushHostContext,
    resetHostContainer,
  };
};
