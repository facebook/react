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
  getFiberPropsFromDomNodeInstance,
} from '../ReactFireMaps';
import {CLICK, DOUBLE_CLICK} from './ReactFireEventTypes';
import type {ProxyContext} from './ReactFireEvents';
import {
  capturedEventNameToPropNameMap,
  eventNameToPropNameMap,
} from './ReactFireEvents';
import {SyntheticEvent} from './synthetic/ReactFireSyntheticEvent';

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

function getEventListenerFromDOMNode(
  domNode: Element | Node,
  eventName: string,
  capturePhase: boolean,
) {
  const props = getFiberPropsFromDomNodeInstance(domNode);
  if (props === undefined) {
    return;
  }
  let propName;

  if (capturePhase) {
    const captureEvent = eventName + 'Capture';
    if (props.hasOwnProperty(captureEvent)) {
      propName = captureEvent;
    } else {
      propName = capturedEventNameToPropNameMap.get(eventName);
    }
  } else {
    if (props.hasOwnProperty(eventName)) {
      propName = eventName;
    } else {
      propName = eventNameToPropNameMap.get(eventName);
    }
  }
  if (propName !== undefined) {
    return props[propName];
  }
}

function triggerEventHandler(
  fiber: Fiber,
  syntheticEvent: SyntheticEvent,
  domNode: Element | Node,
  eventName: string,
  capturePhase: boolean,
) {
  const eventListener = getEventListenerFromDOMNode(
    domNode,
    eventName,
    capturePhase,
  );
  if (eventListener === undefined) {
    return;
  }
  syntheticEvent.currentTarget = domNode;
  invokeGuardedCallbackAndCatchFirstError(
    eventName,
    eventListener,
    undefined,
    syntheticEvent,
  );
}

function dispatchEventHandler(
  syntheticEvent: SyntheticEvent,
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
  const {eventName} = proxyContext;
  triggerEventHandler(fiber, syntheticEvent, domNode, eventName, capturePhase);
  if (syntheticEvent.isPropagationStopped()) {
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

export function traverseTwoPhase(
  syntheticEvent: SyntheticEvent,
  proxyContext: ProxyContext,
) {
  let {fiber} = proxyContext;
  let i;
  let stopped;
  const path = [];
  while (fiber != null) {
    path.push(fiber);
    fiber = getParent(fiber);
  }

  for (i = path.length; i-- > 0; ) {
    stopped = dispatchEventHandler(syntheticEvent, path[i], true, proxyContext);
    if (stopped) {
      return;
    }
  }
  for (i = 0; i < path.length; i++) {
    stopped = dispatchEventHandler(
      syntheticEvent,
      path[i],
      false,
      proxyContext,
    );
    if (stopped) {
      return;
    }
  }
  releaseSyntheticEvent(syntheticEvent);
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
  fromSyntheticEvent: SyntheticEvent,
  toSyntheticEvent: SyntheticEvent,
  from: Fiber,
  to: Fiber,
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
  proxyContext.eventName = `onMouseLeave`;
  for (let i = 0; i < pathFrom.length; i++) {
    dispatchEventHandler(fromSyntheticEvent, pathFrom[i], false, proxyContext);
  }
  proxyContext.eventName = `onMouseEnter`;
  for (let i = pathTo.length; i-- > 0; ) {
    dispatchEventHandler(toSyntheticEvent, pathTo[i], false, proxyContext);
  }
  releaseSyntheticEvent(fromSyntheticEvent);
  releaseSyntheticEvent(toSyntheticEvent);
}

function releaseSyntheticEvent(syntheticEvent: SyntheticEvent) {
  if (
    !syntheticEvent.isPersistent() &&
    !syntheticEvent.nativeEvent._testUtils
  ) {
    syntheticEvent.constructor.release(syntheticEvent);
  }
}
