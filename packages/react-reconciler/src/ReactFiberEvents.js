/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber, Dependencies} from './ReactFiber';
import type {
  RefObject,
  ReactEventResponder,
  ReactEventResponderInstance,
  ReactEventResponderHook,
} from 'shared/ReactTypes';

import {
  HostComponent,
  HostText,
  HostPortal,
  SuspenseComponent,
  Fragment,
} from 'shared/ReactWorkTags';
import {NoWork} from './ReactFiberExpirationTime';

let currentlyRenderingFiber: null | Fiber = null;
let currentEventResponderHookIndex: number = 0;

export function prepareToReadEventComponents(workInProgress: Fiber): void {
  currentlyRenderingFiber = workInProgress;
  currentEventResponderHookIndex = 0;
}

export function updateEventResponderHooks<E, C>(
  responder: ReactEventResponder<E, C>,
  ref: null | RefObject,
  props: Object,
): void {
  let events;
  let dependencies: Dependencies | null = ((currentlyRenderingFiber: any): Fiber)
    .dependencies;
  if (dependencies === null) {
    events = [];
    dependencies = ((currentlyRenderingFiber: any): Fiber).dependencies = {
      expirationTime: NoWork,
      firstContext: null,
      events,
    };
  } else {
    events = dependencies.events;
    if (events === null) {
      dependencies.events = events = [];
    }
  }
  if (currentEventResponderHookIndex === events.length) {
    const eventResponderHook = createEventResponderHook(props, ref, responder);
    events.push(eventResponderHook);
    currentEventResponderHookIndex++;
  } else {
    const eventResponderHook = events[currentEventResponderHookIndex++];
    // We don't update responder or ref, as they remain constant from
    // when the hook gets mounted.
    eventResponderHook.props = props;
  }
}

function createEventResponderHook<E, C>(
  props: Object,
  ref: null | RefObject,
  responder: ReactEventResponder<E, C>,
): ReactEventResponderHook<E, C> {
  return {
    instance: null,
    props,
    ref,
    responder,
  };
}

export function createEventResponderInstance<E, C>(
  currentFiber: Fiber,
  props: Object,
  responder: ReactEventResponder<E, C>,
  rootInstance: mixed,
  state: Object,
): ReactEventResponderInstance<E, C> {
  return {
    currentFiber,
    props,
    responder,
    rootEventTypes: null,
    rootInstance,
    state,
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

export function forEachEventResponderHookOnFiber<E, C>(
  fiber: Fiber,
  cb: (ReactEventResponderHook<E, C>, Fiber) => void,
): void {
  const dependencies = fiber.dependencies;
  if (dependencies !== null) {
    const events = dependencies.events;
    if (events !== null) {
      for (let i = 0, len = events.length; i < len; i++) {
        cb(events[i], fiber);
      }
    }
  }
}
