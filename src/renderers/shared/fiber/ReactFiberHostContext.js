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
  popHostContainer() : void,
  popHostContext(fiber : Fiber) : void,
  pushHostContainer(container : C) : void,
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

  // TODO (bvaughn) Pass the host container fiber to push()
  function pushHostContainer(nextRootInstance : C) {
    // Push current root instance onto the stack;
    // This allows us to reset root when portals are popped.
    push(rootInstanceStackCursor, nextRootInstance, null);

    const nextRootContext = getRootHostContext(nextRootInstance);

    push(contextStackCursor, nextRootContext, null);
  }

  // TODO (bvaughn) Pass the host container fiber to pop()
  function popHostContainer() {
    pop(contextStackCursor, null);
    pop(rootInstanceStackCursor, null);
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

    push(contextStackCursor, nextContext, fiber);
  }

  function popHostContext(fiber : Fiber) : void {
    if (contextStackCursor.current == null) {
      return;
    }

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
