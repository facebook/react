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
  ReactEventComponent,
  ReactEventResponder,
  ReactEventComponentInstance,
} from 'shared/ReactTypes';

import {
  HostComponent,
  HostText,
  HostPortal,
  SuspenseComponent,
  Fragment,
} from 'shared/ReactWorkTags';
import {NoWork} from './ReactFiberExpirationTime';
import invariant from 'shared/invariant';

let currentlyRenderingFiber: null | Fiber = null;
let currentEventComponentInstanceIndex: number = 0;

export function prepareToReadEventComponents(workInProgress: Fiber): void {
  currentlyRenderingFiber = workInProgress;
  currentEventComponentInstanceIndex = 0;
}

export function updateEventComponentInstance<T, E, C>(
  eventComponent: ReactEventComponent<T, E, C>,
  props: Object,
): void {
  const responder = eventComponent.responder;
  invariant(
    responder.allowEventHooks,
    'The "%s" event responder cannot be used via the "useEvent" hook.',
    responder.displayName,
  );
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
  if (currentEventComponentInstanceIndex === events.length) {
    let responderState = null;
    const getInitialState = responder.getInitialState;
    if (getInitialState !== undefined) {
      responderState = getInitialState(props);
    }
    const eventComponentInstance = createEventComponentInstance(
      ((currentlyRenderingFiber: any): Fiber),
      props,
      responder,
      null,
      responderState || {},
      true,
    );
    events.push(eventComponentInstance);
    currentEventComponentInstanceIndex++;
  } else {
    const eventComponentInstance = events[currentEventComponentInstanceIndex++];
    eventComponentInstance.responder = responder;
    eventComponentInstance.props = props;
    eventComponentInstance.currentFiber = ((currentlyRenderingFiber: any): Fiber);
  }
}

export function createEventComponentInstance<T, E, C>(
  currentFiber: Fiber,
  props: Object,
  responder: ReactEventResponder<T, E, C>,
  rootInstance: mixed,
  state: Object,
  isHook: boolean,
): ReactEventComponentInstance<T, E, C> {
  return {
    currentFiber,
    isHook,
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
