/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';
import type {Fiber} from './ReactFiber';
import type {StackCursor} from './ReactFiberStack';
import type {ExpirationTime} from './ReactFiberExpirationTime';

export type ContextDependency<T> = {
  context: ReactContext<T>,
  observedBits: number,
  next: ContextDependency<mixed> | null,
};

import warningWithoutStack from 'shared/warningWithoutStack';
import {isPrimaryRenderer} from './ReactFiberHostConfig';
import {createCursor, push, pop} from './ReactFiberStack';
import maxSigned31BitInt from './maxSigned31BitInt';
import {NoWork} from './ReactFiberExpirationTime';
import {ContextProvider} from 'shared/ReactTypeOfWork';

import invariant from 'shared/invariant';

const valueCursor: StackCursor<mixed> = createCursor(null);
const changedBitsCursor: StackCursor<number> = createCursor(0);

let rendererSigil;
if (__DEV__) {
  // Use this to detect multiple renderers using the same context
  rendererSigil = {};
}

let currentlyRenderingFiber: Fiber | null = null;
let lastContextDependency: ContextDependency<mixed> | null = null;
let lastContext: ReactContext<any> | null = null;

export function resetContextDependences(): void {
  // This is called right before React yields execution, to ensure `readContext`
  // cannot be called outside the render phase.
  currentlyRenderingFiber = null;
  lastContextDependency = null;
  lastContext = null;
}

export function pushProvider(providerFiber: Fiber): void {
  const context: ReactContext<any> = providerFiber.type._context;

  if (isPrimaryRenderer) {
    push(changedBitsCursor, context._changedBits, providerFiber);
    push(valueCursor, context._currentValue, providerFiber);

    context._currentValue = providerFiber.pendingProps.value;
    context._changedBits = providerFiber.stateNode;
    if (__DEV__) {
      warningWithoutStack(
        context._currentRenderer === undefined ||
          context._currentRenderer === null ||
          context._currentRenderer === rendererSigil,
        'Detected multiple renderers concurrently rendering the ' +
          'same context provider. This is currently unsupported.',
      );
      context._currentRenderer = rendererSigil;
    }
  } else {
    push(changedBitsCursor, context._changedBits2, providerFiber);
    push(valueCursor, context._currentValue2, providerFiber);

    context._currentValue2 = providerFiber.pendingProps.value;
    context._changedBits2 = providerFiber.stateNode;
    if (__DEV__) {
      warningWithoutStack(
        context._currentRenderer2 === undefined ||
          context._currentRenderer2 === null ||
          context._currentRenderer2 === rendererSigil,
        'Detected multiple renderers concurrently rendering the ' +
          'same context provider. This is currently unsupported.',
      );
      context._currentRenderer2 = rendererSigil;
    }
  }
}

export function popProvider(providerFiber: Fiber): void {
  const changedBits = changedBitsCursor.current;
  const currentValue = valueCursor.current;

  pop(valueCursor, providerFiber);
  pop(changedBitsCursor, providerFiber);

  const context: ReactContext<any> = providerFiber.type._context;
  if (isPrimaryRenderer) {
    context._currentValue = currentValue;
    context._changedBits = changedBits;
  } else {
    context._currentValue2 = currentValue;
    context._changedBits2 = changedBits;
  }
}

export function propagateContextChange(
  workInProgress: Fiber,
  context: ReactContext<mixed>,
  changedBits: number,
  renderExpirationTime: ExpirationTime,
): void {
  let fiber = workInProgress.child;
  if (fiber !== null) {
    // Set the return pointer of the child to the work-in-progress fiber.
    fiber.return = workInProgress;
  }
  while (fiber !== null) {
    let nextFiber;

    // Visit this fiber.
    let dependency = fiber.firstContextDependency;
    if (dependency !== null) {
      do {
        // Check if the context matches.
        if (
          dependency.context === context &&
          (dependency.observedBits & changedBits) !== 0
        ) {
          // Match! Schedule an update on this fiber.
          if (
            fiber.expirationTime === NoWork ||
            fiber.expirationTime > renderExpirationTime
          ) {
            fiber.expirationTime = renderExpirationTime;
          }
          let alternate = fiber.alternate;
          if (
            alternate !== null &&
            (alternate.expirationTime === NoWork ||
              alternate.expirationTime > renderExpirationTime)
          ) {
            alternate.expirationTime = renderExpirationTime;
          }
          // Update the child expiration time of all the ancestors, including
          // the alternates.
          let node = fiber.return;
          while (node !== null) {
            alternate = node.alternate;
            if (
              node.childExpirationTime === NoWork ||
              node.childExpirationTime > renderExpirationTime
            ) {
              node.childExpirationTime = renderExpirationTime;
              if (
                alternate !== null &&
                (alternate.childExpirationTime === NoWork ||
                  alternate.childExpirationTime > renderExpirationTime)
              ) {
                alternate.childExpirationTime = renderExpirationTime;
              }
            } else if (
              alternate !== null &&
              (alternate.childExpirationTime === NoWork ||
                alternate.childExpirationTime > renderExpirationTime)
            ) {
              alternate.childExpirationTime = renderExpirationTime;
            } else {
              // Neither alternate was updated, which means the rest of the
              // ancestor path already has sufficient priority.
              break;
            }
            node = node.return;
          }
          // Don't scan deeper than a matching consumer. When we render the
          // consumer, we'll continue scanning from that point. This way the
          // scanning work is time-sliced.
          nextFiber = null;
        } else {
          nextFiber = fiber.child;
        }
        dependency = dependency.next;
      } while (dependency !== null);
    } else if (fiber.tag === ContextProvider) {
      // Don't scan deeper if this is a matching provider
      nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
    } else {
      // Traverse down.
      nextFiber = fiber.child;
    }

    if (nextFiber !== null) {
      // Set the return pointer of the child to the work-in-progress fiber.
      nextFiber.return = fiber;
    } else {
      // No child. Traverse to next sibling.
      nextFiber = fiber;
      while (nextFiber !== null) {
        if (nextFiber === workInProgress) {
          // We're back to the root of this subtree. Exit.
          nextFiber = null;
          break;
        }
        let sibling = nextFiber.sibling;
        if (sibling !== null) {
          // Set the return pointer of the sibling to the work-in-progress fiber.
          sibling.return = nextFiber.return;
          nextFiber = sibling;
          break;
        }
        // No more siblings. Traverse up.
        nextFiber = nextFiber.return;
      }
    }
    fiber = nextFiber;
  }
}

export function prepareToReadContext(
  workInProgress: Fiber,
  renderExpirationTime: ExpirationTime,
): boolean {
  currentlyRenderingFiber = workInProgress;
  lastContextDependency = null;
  lastContext = null;

  const firstContextDependency = workInProgress.firstContextDependency;
  if (firstContextDependency !== null) {
    // Reset the work-in-progress list
    workInProgress.firstContextDependency = null;

    // Iterate through the context dependencies and see if there were any
    // changes. If so, continue propagating the context change by scanning
    // the child subtree.
    let dependency = firstContextDependency;
    let hasPendingContext = false;
    do {
      const context = dependency.context;
      const changedBits = isPrimaryRenderer
        ? context._changedBits
        : context._changedBits2;
      if (changedBits !== 0) {
        // Resume context change propagation. We need to call this even if
        // this fiber bails out, in case deeply nested consumers observe more
        // bits than this one.
        propagateContextChange(
          workInProgress,
          context,
          changedBits,
          renderExpirationTime,
        );
        if ((changedBits & dependency.observedBits) !== 0) {
          hasPendingContext = true;
        }
      }
      dependency = dependency.next;
    } while (dependency !== null);
    return hasPendingContext;
  } else {
    return false;
  }
}

export function readContext<T>(
  context: ReactContext<T>,
  observedBits: void | number | boolean,
): T {
  if (typeof observedBits !== 'number') {
    if (observedBits === false) {
      // Do not observe updates
      observedBits = 0;
    } else {
      // Observe all updates
      observedBits = maxSigned31BitInt;
    }
  }

  if (lastContext === null) {
    invariant(
      currentlyRenderingFiber !== null,
      'Context.unstable_read(): Context can only be read while React is ' +
        'rendering, e.g. inside the render method or getDerivedStateFromProps.',
    );
    // This is the first dependency in the list
    currentlyRenderingFiber.firstContextDependency = lastContextDependency = {
      context: ((context: any): ReactContext<mixed>),
      observedBits,
      next: null,
    };
    lastContext = context;
  } else {
    // `lastContextDependency` is always non-null if `lastContext is.
    const lastDependency: ContextDependency<T> = (lastContextDependency: any);
    if (lastContext === context) {
      // Fast path. The previous context has the same type. We can reuse
      // the same node.
      lastDependency.observedBits |= observedBits;
    } else {
      // Append a new context item.
      lastContextDependency = lastDependency.next = {
        context: ((context: any): ReactContext<mixed>),
        observedBits,
        next: null,
      };
      lastContext = context;
    }
  }

  return isPrimaryRenderer ? context._currentValue : context._currentValue2;
}
