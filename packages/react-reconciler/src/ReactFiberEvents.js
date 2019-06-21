/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {ReactEventComponentInstance} from 'shared/ReactTypes';
import type {EventResponder} from 'react-reconciler/src/ReactFiberHostConfig';

import {
  HostComponent,
  HostText,
  HostPortal,
  SuspenseComponent,
  Fragment,
} from 'shared/ReactWorkTags';
import invariant from 'shared/invariant';

let currentlyRenderingFiber: null | Fiber = null;
let currentEventComponentInstanceIndex: number = 0;

export function prepareToReadEventComponents(workInProgress: Fiber): void {
  currentlyRenderingFiber = workInProgress;
  currentEventComponentInstanceIndex = 0;
}

export function updateEventComponentInstance(
  responder: EventResponder,
  props: null | Object,
): void {
  invariant(
    responder.allowEventHooks,
    'The "%s" event responder cannot be used via the "useEvent" hook.',
    responder.displayName,
  );
  const dependencies = ((currentlyRenderingFiber: any): Fiber).dependencies;
  let events = dependencies.events;
  if (events === null) {
    dependencies.events = events = [];
  }
  if (currentEventComponentInstanceIndex === events.length) {
    let responderState = null;
    if (responder.createInitialState !== undefined) {
      responderState = responder.createInitialState(props);
    }
    const eventComponentInstance = createEventComponentInstance(
      ((currentlyRenderingFiber: any): Fiber),
      props,
      responder,
      null,
      responderState,
      false,
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

export function createEventComponentInstance(
  currentFiber: Fiber,
  props: null | Object,
  responder: EventResponder,
  rootInstance: mixed,
  state: null | Object,
  localPropagation: boolean,
): ReactEventComponentInstance {
  return {
    currentFiber,
    localPropagation,
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
