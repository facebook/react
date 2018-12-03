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
import {getDomNodeEventsMap} from './ReactFireEvents';

import {HostComponent, HostRoot} from 'shared/ReactWorkTags';
import {invokeGuardedCallbackAndCatchFirstError} from 'shared/ReactErrorUtils';

function getParent(fiber) {
  do {
    fiber = fiber.return;
    // TODO: If this is a HostRoot we might want to bail out.
    // That is depending on if we want nested subtrees (layers) to bubble
    // events to their parent. We could also go through parentNode on the
    // host node but that wouldn't work for React Native and doesn't let us
    // do the portal feature.
  } while (fiber && fiber.tag !== HostComponent);
  if (fiber) {
    return fiber;
  }
  return null;
}

/**
 * Find the deepest React component completely containing the root of the
 * passed-in instance (for use when entire React trees are nested within each
 * other). If React trees are not nested, returns null.
 */
function findRootContainerNode(inst) {
  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
  // traversal, but caching is difficult to do correctly without using a
  // mutation observer to listen for all DOM changes.
  while (inst.return) {
    inst = inst.return;
  }
  if (inst.tag !== HostRoot) {
    // This can happen if we're in a detached tree.
    return null;
  }
  return inst.stateNode.containerInfo;
}

function triggerEventHandler(
  domNode,
  domNodeEventsMap,
  eventName,
  proxyContext,
  event,
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

function dispatchEventHandler(fiber, capturePhase, proxyContext) {
  const domNode = getDOMNodeFromFiber(fiber);
  // Html Nodes can be nested fe: span inside button in that scenario
  // browser does not handle disabled attribute on parent,
  // because the event listener is on document.body
  // Don't process clicks on disabled elements
  if (proxyContext.isClickEvent && domNode.disabled) {
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
  if (event.cancelBubble) {
    return true;
  }
}

export function getEventTargetAncestorFibers(targetFiber) {
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

export function traverseTwoPhase(proxyContext) {
  let {fiber} = proxyContext;
  let i;
  let stopped;
  const path = [];
  while (fiber != null) {
    path.push(fiber);
    fiber = getParent(fiber);
  }

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
export function getLowestCommonAncestor(instA, instB) {
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
    instA = getParent(instA);
    depthA--;
  }

  // If B is deeper, crawl up.
  while (depthB - depthA > 0) {
    instB = getParent(instB);
    depthB--;
  }

  // Walk in lockstep until we find a match.
  let depth = depthA;
  while (depth--) {
    if (instA === instB || instA === instB.alternate) {
      return instA;
    }
    instA = getParent(instA);
    instB = getParent(instB);
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
  from,
  to,
  mutateEventForFromPath,
  mutateEventForToPath,
  proxyContext,
) {
  const common = from && to ? getLowestCommonAncestor(from, to) : null;
  const pathFrom = [];
  while (true) {
    if (!from) {
      break;
    }
    if (from === common) {
      break;
    }
    const alternate = from.alternate;
    if (alternate !== null && alternate === common) {
      break;
    }
    pathFrom.push(from);
    from = getParent(from);
  }
  const pathTo = [];
  while (true) {
    if (!to) {
      break;
    }
    if (to === common) {
      break;
    }
    const alternate = to.alternate;
    if (alternate !== null && alternate === common) {
      break;
    }
    pathTo.push(to);
    to = getParent(to);
  }
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
