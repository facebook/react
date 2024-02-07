/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {StackCursor} from './ReactFiberStack';
import type {
  Container,
  HostContext,
  TransitionStatus,
} from './ReactFiberConfig';
import type {Hook} from './ReactFiberHooks';
import type {ReactContext} from 'shared/ReactTypes';

import {
  getChildHostContext,
  getRootHostContext,
  isPrimaryRenderer,
} from './ReactFiberConfig';
import {createCursor, push, pop} from './ReactFiberStack';
import {REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';
import {enableAsyncActions, enableFormActions} from 'shared/ReactFeatureFlags';

const contextStackCursor: StackCursor<HostContext | null> = createCursor(null);
const contextFiberStackCursor: StackCursor<Fiber | null> = createCursor(null);
const rootInstanceStackCursor: StackCursor<Container | null> =
  createCursor(null);

// Represents the nearest host transition provider (in React DOM, a <form />)
// NOTE: Since forms cannot be nested, and this feature is only implemented by
// React DOM, we don't technically need this to be a stack. It could be a single
// module variable instead.
const hostTransitionProviderCursor: StackCursor<Fiber | null> =
  createCursor(null);

// TODO: This should initialize to NotPendingTransition, a constant
// imported from the fiber config. However, because of a cycle in the module
// graph, that value isn't defined during this module's initialization. I can't
// think of a way to work around this without moving that value out of the
// fiber config. For now, the "no provider" case is handled when reading,
// inside useHostTransitionStatus.
export const HostTransitionContext: ReactContext<TransitionStatus | null> = {
  $$typeof: REACT_CONTEXT_TYPE,
  _currentValue: null,
  _currentValue2: null,
  _threadCount: 0,
  Provider: (null: any),
  Consumer: (null: any),
};

function requiredContext<Value>(c: Value | null): Value {
  if (__DEV__) {
    if (c === null) {
      console.error(
        'Expected host context to exist. This error is likely caused by a bug ' +
          'in React. Please file an issue.',
      );
    }
  }
  return (c: any);
}

function getCurrentRootHostContainer(): null | Container {
  return rootInstanceStackCursor.current;
}

function getRootHostContainer(): Container {
  const rootInstance = requiredContext(rootInstanceStackCursor.current);
  return rootInstance;
}

export function getHostTransitionProvider(): Fiber | null {
  return hostTransitionProviderCursor.current;
}

function pushHostContainer(fiber: Fiber, nextRootInstance: Container): void {
  // Push current root instance onto the stack;
  // This allows us to reset root when portals are popped.
  push(rootInstanceStackCursor, nextRootInstance, fiber);
  // Track the context and the Fiber that provided it.
  // This enables us to pop only Fibers that provide unique contexts.
  push(contextFiberStackCursor, fiber, fiber);

  // Finally, we need to push the host context to the stack.
  // However, we can't just call getRootHostContext() and push it because
  // we'd have a different number of entries on the stack depending on
  // whether getRootHostContext() throws somewhere in renderer code or not.
  // So we push an empty value first. This lets us safely unwind on errors.
  push(contextStackCursor, null, fiber);
  const nextRootContext = getRootHostContext(nextRootInstance);
  // Now that we know this function doesn't throw, replace it.
  pop(contextStackCursor, fiber);
  push(contextStackCursor, nextRootContext, fiber);
}

function popHostContainer(fiber: Fiber) {
  pop(contextStackCursor, fiber);
  pop(contextFiberStackCursor, fiber);
  pop(rootInstanceStackCursor, fiber);
}

function getHostContext(): HostContext {
  const context = requiredContext(contextStackCursor.current);
  return context;
}

function pushHostContext(fiber: Fiber): void {
  if (enableFormActions && enableAsyncActions) {
    const stateHook: Hook | null = fiber.memoizedState;
    if (stateHook !== null) {
      // Only provide context if this fiber has been upgraded by a host
      // transition. We use the same optimization for regular host context below.
      push(hostTransitionProviderCursor, fiber, fiber);
    }
  }

  const context: HostContext = requiredContext(contextStackCursor.current);
  const nextContext = getChildHostContext(context, fiber.type);

  // Don't push this Fiber's context unless it's unique.
  if (context !== nextContext) {
    // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.
    push(contextFiberStackCursor, fiber, fiber);
    push(contextStackCursor, nextContext, fiber);
  }
}

function popHostContext(fiber: Fiber): void {
  if (contextFiberStackCursor.current === fiber) {
    // Do not pop unless this Fiber provided the current context.
    // pushHostContext() only pushes Fibers that provide unique contexts.
    pop(contextStackCursor, fiber);
    pop(contextFiberStackCursor, fiber);
  }

  if (enableFormActions && enableAsyncActions) {
    if (hostTransitionProviderCursor.current === fiber) {
      // Do not pop unless this Fiber provided the current context. This is mostly
      // a performance optimization, but conveniently it also prevents a potential
      // data race where a host provider is upgraded (i.e. memoizedState becomes
      // non-null) during a concurrent event. This is a bit of a flaw in the way
      // we upgrade host components, but because we're accounting for it here, it
      // should be fine.
      pop(hostTransitionProviderCursor, fiber);

      // When popping the transition provider, we reset the context value back
      // to `null`. We can do this because you're not allowd to nest forms. If
      // we allowed for multiple nested host transition providers, then we'd
      // need to reset this to the parent provider's status.
      if (isPrimaryRenderer) {
        HostTransitionContext._currentValue = null;
      } else {
        HostTransitionContext._currentValue2 = null;
      }
    }
  }
}

export {
  getHostContext,
  getCurrentRootHostContainer,
  getRootHostContainer,
  popHostContainer,
  popHostContext,
  pushHostContainer,
  pushHostContext,
};
