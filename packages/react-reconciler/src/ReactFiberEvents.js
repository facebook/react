/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {
  ReactEventResponderImpl,
  ReactEventResponderInstance,
  EventResponderDependency,
} from 'shared/ReactTypes';

import {NoWork} from './ReactFiberExpirationTime';
import {
  HostComponent,
  HostText,
  HostPortal,
  SuspenseComponent,
  Fragment,
} from 'shared/ReactWorkTags';
import warning from 'shared/warning';

export function createEventResponderInstance<E, C>(
  props: Object,
  impl: ReactEventResponderImpl<E, C>,
  rootInstance: mixed,
  state: Object,
): ReactEventResponderInstance<E, C> {
  return {
    impl,
    props,
    rootEventTypes: null,
    rootInstance,
    state,
    targetFiber: null,
  };
}

export function isFiberSuspenseAndTimedOut(fiber: Fiber): boolean {
  return fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
}

export function getSuspenseFallbackChild(fiber: Fiber): Fiber | null {
  return ((((fiber.child: any): Fiber).sibling: any): Fiber).child;
}

export function isFiberSuspenseTimedOutChild(fiber: Fiber | null): boolean {
  if (fiber === null) {
    return false;
  }
  const parent = fiber.return;
  if (parent !== null && parent.tag === Fragment) {
    const grandParent = parent.return;

    if (
      grandParent !== null &&
      grandParent.tag === SuspenseComponent &&
      grandParent.stateNode !== null
    ) {
      return true;
    }
  }
  return false;
}

export function getSuspenseFiberFromTimedOutChild(fiber: Fiber): Fiber {
  return ((((fiber.return: any): Fiber).return: any): Fiber);
}

export function getEventComponentHostChildrenCount(
  eventComponentFiber: Fiber,
): ?number {
  if (__DEV__) {
    let hostChildrenCount = 0;
    const getHostChildrenCount = node => {
      if (isFiberSuspenseAndTimedOut(node)) {
        const fallbackChild = getSuspenseFallbackChild(node);
        if (fallbackChild !== null) {
          getHostChildrenCount(fallbackChild);
        }
      } else if (
        node.tag === HostComponent ||
        node.tag === HostText ||
        node.tag === HostPortal
      ) {
        hostChildrenCount++;
      } else {
        const child = node.child;
        if (child !== null) {
          getHostChildrenCount(child);
        }
      }
      const sibling = node.sibling;
      if (sibling !== null) {
        getHostChildrenCount(sibling);
      }
    };

    if (eventComponentFiber.child !== null) {
      getHostChildrenCount(eventComponentFiber.child);
    }

    return hostChildrenCount;
  }
}

function createEventResponderDependency<C, E>(
  impl: ReactEventResponderImpl<C, E>,
  instance: ReactEventResponderInstance<C, E>,
): EventResponderDependency<C, E> {
  return {
    impl,
    instance,
    next: null,
  };
}

export function attachEventResponderToTargetFiber(
  responderFiber: Fiber,
  targetFiber: Fiber,
): void {
  const instance = responderFiber.stateNode;
  const impl = instance.impl;
  const dependencies = targetFiber.dependencies;
  const responderDependency = createEventResponderDependency(impl, instance);
  instance.targetFiber = targetFiber;
  if (dependencies === null) {
    targetFiber.dependencies = {
      expirationTime: NoWork,
      firstContext: null,
      firstResponder: responderDependency,
    };
  } else {
    let currentResponder = dependencies.firstResponder;
    if (currentResponder === null) {
      dependencies.firstResponder = responderDependency;
    } else {
      while (currentResponder !== null) {
        if (currentResponder.impl === impl) {
          if (__DEV__) {
            warning(
              false,
              'The event responder <%s> was used multiple times for the same target.' +
                ' A target can only have a single event responder of a given type, subsequent' +
                ' responders of this type will be ignored.',
              currentResponder.impl.displayName,
            );
          }
          return;
        }
        const next = currentResponder.next;
        if (next === null) {
          currentResponder.next = responderDependency;
          break;
        }
        currentResponder = next;
      }
    }
  }
}

export function detachEventResponderFromTargetFiber(
  responderFiber: Fiber,
  targetFiber: Fiber,
): void {
  const instance = responderFiber.stateNode;
  const impl = instance.impl;
  const dependencies = targetFiber.dependencies;
  if (dependencies !== null) {
    let currentResponder = dependencies.firstResponder;
    let previousResponder = null;
    while (currentResponder !== null) {
      if (currentResponder.impl === impl) {
        if (previousResponder === null) {
          dependencies.firstResponder = null;
        } else {
          previousResponder.next = null;
        }
        return;
      }
      const next = currentResponder.next;
      previousResponder = currentResponder;
      currentResponder = next;
    }
  }
}
