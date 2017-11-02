/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HostConfig} from 'react-reconciler';
import type {Fiber} from './ReactFiber';
import type {StackCursor} from './ReactFiberStack';

import invariant from 'fbjs/lib/invariant';

import {createCursor, pop, push} from './ReactFiberStack';

declare class NoContextT {}
const NO_CONTEXT: NoContextT = ({}: any);

export type HostContext<C, CX> = {
  getHostContext(): CX,
  getRootHostContainer(): C,
  popHostContainer(fiber: Fiber): void,
  popHostContext(fiber: Fiber): void,
  pushHostContainer(fiber: Fiber, container: C): void,
  pushHostContext(fiber: Fiber): void,
  resetHostContainer(): void,
};

export default function<T, P, I, TI, PI, C, CC, CX, PL>(
  config: HostConfig<T, P, I, TI, PI, C, CC, CX, PL>,
): HostContext<C, CX> {
  const {getChildHostContext, getRootHostContext} = config;

  let contextStackCursor: StackCursor<CX | NoContextT> = createCursor(
    NO_CONTEXT,
  );
  let contextFiberStackCursor: StackCursor<Fiber | NoContextT> = createCursor(
    NO_CONTEXT,
  );
  let rootInstanceStackCursor: StackCursor<C | NoContextT> = createCursor(
    NO_CONTEXT,
  );

  function requiredContext<Value>(c: Value | NoContextT): Value {
    invariant(
      c !== NO_CONTEXT,
      'Expected host context to exist. This error is likely caused by a bug ' +
        'in React. Please file an issue.',
    );
    return (c: any);
  }

  function getRootHostContainer(): C {
    const rootInstance = requiredContext(rootInstanceStackCursor.current);
    return rootInstance;
  }

  function pushHostContainer(fiber: Fiber, nextRootInstance: C) {
    // Push current root instance onto the stack;
    // This allows us to reset root when portals are popped.
    push(rootInstanceStackCursor, nextRootInstance, fiber);

    const nextRootContext = getRootHostContext(nextRootInstance);

    // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.
    push(contextFiberStackCursor, fiber, fiber);
    push(contextStackCursor, nextRootContext, fiber);
  }

  function popHostContainer(fiber: Fiber) {
    pop(contextStackCursor, fiber);
    pop(contextFiberStackCursor, fiber);
    pop(rootInstanceStackCursor, fiber);
  }

  function getHostContext(): CX {
    const context = requiredContext(contextStackCursor.current);
    return context;
  }

  function pushHostContext(fiber: Fiber): void {
    const rootInstance = requiredContext(rootInstanceStackCursor.current);
    const context = requiredContext(contextStackCursor.current);
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

  function popHostContext(fiber: Fiber): void {
    // Do not pop unless this Fiber provided the current context.
    // pushHostContext() only pushes Fibers that provide unique contexts.
    if (contextFiberStackCursor.current !== fiber) {
      return;
    }

    pop(contextStackCursor, fiber);
    pop(contextFiberStackCursor, fiber);
  }

  function resetHostContainer() {
    contextStackCursor.current = NO_CONTEXT;
    rootInstanceStackCursor.current = NO_CONTEXT;
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
}
