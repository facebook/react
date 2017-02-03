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
} = require('ReactFiberStack');

const invariant = require('invariant');

export type HostContext<C, CX> = {
  getHostContext() : CX,
  getRootHostContainer() : C,
  popHostContainer(fiber : Fiber) : void,
  popHostContext(fiber : Fiber) : void,
  pushHostContainer(fiber : Fiber, container : C) : void,
  pushHostContext(fiber : Fiber) : void,
  resetHostContainer() : void,
};

module.exports = function<T, P, I, TI, PI, C, CX, PL>(
  config : HostConfig<T, P, I, TI, PI, C, CX, PL>
) : HostContext<C, CX> {
  const {
    getChildHostContext,
    getRootHostContext,
  } = config;

  let contextStackCursor : StackCursor<?CX> = createCursor((null: ?CX));
  let contextFiberStackCursor : StackCursor<?Fiber> = createCursor((null: ?Fiber));
  let rootInstanceStackCursor : StackCursor<?C> = createCursor((null: ?C));

  function getRootHostContainer() : C {
    const rootInstance = rootInstanceStackCursor.current;
    invariant(
      rootInstance != null,
      'Expected root container to exist.'
    );
    return rootInstance;
  }

  function pushHostContainer(fiber : Fiber, nextRootInstance : C) {
    // Push current root instance onto the stack;
    // This allows us to reset root when portals are popped.
    push(rootInstanceStackCursor, nextRootInstance, fiber);

    const nextRootContext = getRootHostContext(nextRootInstance);

    // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.
    push(contextFiberStackCursor, fiber, fiber);
    push(contextStackCursor, nextRootContext, fiber);
  }

  function popHostContainer(fiber : Fiber) {
    pop(contextStackCursor, fiber);
    pop(contextFiberStackCursor, fiber);
    pop(rootInstanceStackCursor, fiber);
  }

  function getHostContext() : CX {
    const context = contextStackCursor.current;
    invariant(
      context != null,
      'Expected host context to exist.'
    );
    return context;
  }

  function pushHostContext(fiber : Fiber) : void {
    const rootInstance = rootInstanceStackCursor.current;
    invariant(
      rootInstance != null,
      'Expected root host context to exist.'
    );

    const context = contextStackCursor.current || emptyObject;
    const nextContext = getChildHostContext(context, fiber.type, rootInstance);

    // Don't push this Fiber's context unless it's unique.
    if (context === nextContext) {
      return;
    }

    // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.
    push(contextFiberStackCursor, fiber, fiber);
    push(contextStackCursor, nextContext, fiber);
  }

  function popHostContext(fiber : Fiber) : void {
    // Do not pop unless this Fiber provided the current context.
    // pushHostContext() only pushes Fibers that provide unique contexts.
    if (contextFiberStackCursor.current !== fiber) {
      return;
    }

    pop(contextStackCursor, fiber);
    pop(contextFiberStackCursor, fiber);
  }

  function resetHostContainer() {
    contextStackCursor.current = null;
    rootInstanceStackCursor.current = null;
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
