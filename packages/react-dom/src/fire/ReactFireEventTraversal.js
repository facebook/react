/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  getClosestFiberFromDOMNode,
  getDOMNodeFromFiber,
} from './ReactFireInternal';
import {
  getDomNodeEventsMap,
  startEventPropagation,
  returnsTrue,
} from './ReactFireEvents';
import {CLICK, DOUBLE_CLICK} from './ReactFireEventTypes';
import type {EventData, ProxyContext} from './ReactFireEvents';

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import {HostComponent, HostRoot} from 'shared/ReactWorkTags';
import {invokeGuardedCallbackAndCatchFirstError} from 'shared/ReactErrorUtils';

function getParent(fiber: Fiber | null): Fiber | null {
  let currentFiber = fiber;
  if (!currentFiber) {
    return null;
  }
  do {
    currentFiber = currentFiber.return;
    // TODO: If this is a HostRoot we might want to bail out.
    // That is depending on if we want nested subtrees (layers) to bubble
    // events to their parent. We could also go through parentNode on the
    // host node but that wouldn't work for React Native and doesn't let us
    // do the portal feature.
  } while (currentFiber && currentFiber.tag !== HostComponent);
  if (currentFiber) {
    return currentFiber;
  }
  return null;
}

/**
 * Find the deepest React component completely containing the root of the
 * passed-in instance (for use when entire React trees are nested within each
 * other). If React trees are not nested, returns null.
 */
function findRootContainerNode(fiber: Fiber): Element | Node | null {
  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
  // traversal, but caching is difficult to do correctly without using a
  // mutation observer to listen for all DOM changes.
  while (fiber.return) {
    fiber = fiber.return;
  }
  if (fiber.tag !== HostRoot) {
    // This can happen if we're in a detached tree.
    return null;
  }
  return fiber.stateNode.containerInfo;
}

function triggerEventHandler(
  domNode: Element | Node,
  domNodeEventsMap: Map<string, EventData>,
  eventName: string,
  proxyContext: ProxyContext,
  event: Event,
) {
  const eventListener = domNodeEventsMap.get(eventName);
  if (eventListener === undefined || eventListener.handler === null) {
    return;
  }
  proxyContext.currentTarget = domNode;
  invokeGuardedCallbackAndCatchFirstError(
    eventName,
    eventListener.handler,
    undefined,
    event,
  );
}

function dispatchEventHandler(
  fiber: Fiber,
  capturePhase: boolean,
  proxyContext: ProxyContext,
) {
  const domNode = getDOMNodeFromFiber(fiber);
  if (domNode == null) {
    return;
  }
  // Html Nodes can be nested fe: span inside button in that scenario
  // browser does not handle disabled attribute on parent,
  // because the event listener is on document.body
  // Don't process clicks on disabled elements
  if (
    (proxyContext.eventName === CLICK ||
      proxyContext.eventName === DOUBLE_CLICK) &&
    (domNode: any).disabled
  ) {
    return;
  }
  const domNodeEventsMap = getDomNodeEventsMap(domNode);
  const {event, eventName} = proxyContext;
  triggerEventHandler(
    domNode,
    domNodeEventsMap,
    capturePhase ? `${eventName}-capture` : eventName,
    proxyContext,
    event,
  );
  if ((event: any).isPropagationStopped === returnsTrue) {
    return true;
  }
}

export function getEventTargetAncestorFibers(
  targetFiber: null | Fiber,
): Array<Fiber> {
  const ancestors = [];
  // Loop through the hierarchy, in case there's any nested components.
  // It's important that we build the array of ancestors before calling any
  // event handlers, because event handlers can modify the DOM, leading to
  // inconsistencies with ReactMount's node cache. See #1105.
  let ancestor = targetFiber;
  do {
    if (!ancestor) {
      break;
    }
    const root = findRootContainerNode(ancestor);
    if (!root) {
      break;
    }
    ancestors.push(ancestor);
    ancestor = getClosestFiberFromDOMNode(root);
  } while (ancestor);
  return ancestors;
}

export function traverseTwoPhase(proxyContext: ProxyContext) {
  let {fiber} = proxyContext;
  let i;
  let stopped;
  const path = [];
  while (fiber != null) {
    path.push(fiber);
    fiber = getParent(fiber);
  }
  startEventPropagation(proxyContext);

  for (i = path.length; i-- > 0; ) {
    stopped = dispatchEventHandler(path[i], true, proxyContext);
    if (stopped) {
      return;
    }
  }
  for (i = 0; i < path.length; i++) {
    stopped = dispatchEventHandler(path[i], false, proxyContext);
    if (stopped) {
      return;
    }
  }
}

/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */
export function getLowestCommonAncestor(
  instA: Fiber,
  instB: Fiber,
): null | Fiber {
  let currentInstA = instA;
  let currentInstB = instB;
  let depthA = 0;
  for (let tempA = instA; tempA; tempA = getParent(tempA)) {
    depthA++;
  }
  let depthB = 0;
  for (let tempB = instB; tempB; tempB = getParent(tempB)) {
    depthB++;
  }

  // If A is deeper, crawl up.
  while (depthA - depthB > 0) {
    currentInstA = getParent(currentInstA);
    depthA--;
  }

  // If B is deeper, crawl up.
  while (depthB - depthA > 0) {
    currentInstB = getParent(currentInstB);
    depthB--;
  }

  // Walk in lockstep until we find a match.
  let depth = depthA;
  while (depth--) {
    if (
      currentInstA === currentInstB ||
      (currentInstB !== null && currentInstA === currentInstB.alternate)
    ) {
      return currentInstA;
    }
    currentInstA = getParent(currentInstA);
    currentInstB = getParent(currentInstB);
  }
  return null;
}

/**
 * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
 * should would receive a `mouseEnter` or `mouseLeave` event.
 *
 * Does not invoke the callback on the nearest common ancestor because nothing
 * "entered" or "left" that element.
 */
export function traverseEnterLeave(
  from: Fiber,
  to: Fiber,
  mutateEventForFromPath: () => void,
  mutateEventForToPath: () => void,
  proxyContext: ProxyContext,
): void {
  let currentFrom = from;
  let currentTo = to;
  const common =
    currentFrom && currentTo
      ? getLowestCommonAncestor(currentFrom, currentTo)
      : null;
  const pathFrom = [];
  while (true) {
    if (!currentFrom) {
      break;
    }
    if (currentFrom === common) {
      break;
    }
    const alternate = currentFrom.alternate;
    if (alternate !== null && alternate === common) {
      break;
    }
    pathFrom.push(currentFrom);
    currentFrom = getParent(currentFrom);
  }
  const pathTo = [];
  while (true) {
    if (!currentTo) {
      break;
    }
    if (currentTo === common) {
      break;
    }
    const alternate = currentTo.alternate;
    if (alternate !== null && alternate === common) {
      break;
    }
    pathTo.push(currentTo);
    currentTo = getParent(currentTo);
  }
  startEventPropagation(proxyContext);
  mutateEventForFromPath();
  proxyContext.eventName = `onMouseLeave-polyfill`;
  for (let i = 0; i < pathFrom.length; i++) {
    dispatchEventHandler(pathFrom[i], false, proxyContext);
  }
  mutateEventForToPath();
  proxyContext.eventName = `onMouseEnter-polyfill`;
  for (let i = pathTo.length; i-- > 0; ) {
    dispatchEventHandler(pathTo[i], false, proxyContext);
  }
}
