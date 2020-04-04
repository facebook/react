/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {ReactSyntheticEvent} from 'legacy-events/ReactSyntheticEventType';

import {HostComponent} from 'react-reconciler/src/ReactWorkTags';
import getListener from './getListener';

function getParent(inst: Fiber | null): Fiber | null {
  if (inst === null) {
    return null;
  }
  do {
    inst = inst.return;
    // TODO: If this is a HostRoot we might want to bail out.
    // That is depending on if we want nested subtrees (layers) to bubble
    // events to their parent. We could also go through parentNode on the
    // host node but that wouldn't work for React Native and doesn't let us
    // do the portal feature.
  } while (inst && inst.tag !== HostComponent);
  if (inst) {
    return inst;
  }
  return null;
}

/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */
function getLowestCommonAncestor(instA: Fiber, instB: Fiber): Fiber | null {
  let nodeA = instA;
  let nodeB = instB;
  let depthA = 0;
  for (let tempA = nodeA; tempA; tempA = getParent(tempA)) {
    depthA++;
  }
  let depthB = 0;
  for (let tempB = nodeB; tempB; tempB = getParent(tempB)) {
    depthB++;
  }

  // If A is deeper, crawl up.
  while (depthA - depthB > 0) {
    nodeA = getParent(nodeA);
    depthA--;
  }

  // If B is deeper, crawl up.
  while (depthB - depthA > 0) {
    nodeB = getParent(nodeB);
    depthB--;
  }

  // Walk in lockstep until we find a match.
  let depth = depthA;
  while (depth--) {
    if (nodeA === nodeB || (nodeB !== null && nodeA === nodeB.alternate)) {
      return nodeA;
    }
    nodeA = getParent(nodeA);
    nodeB = getParent(nodeB);
  }
  return null;
}

function accumulateEnterLeaveListenersForEvent(
  event: ReactSyntheticEvent,
  target: Fiber,
  common: Fiber | null,
  capture: boolean,
): void {
  const registrationName = event.dispatchConfig.registrationName;
  if (registrationName === undefined) {
    return;
  }
  const dispatchListeners = [];
  const dispatchInstances = [];
  const dispatchCurrentTargets = [];

  let instance = target;
  while (instance !== null) {
    if (instance === common) {
      break;
    }
    const {alternate, stateNode, tag} = instance;
    if (alternate !== null && alternate === common) {
      break;
    }
    if (tag === HostComponent && stateNode !== null) {
      const currentTarget = stateNode;
      if (capture) {
        const captureListener = getListener(instance, registrationName);
        if (captureListener != null) {
          // Capture listeners/instances should go at the start, so we
          // unshift them to the start of the array.
          dispatchListeners.unshift(captureListener);
          dispatchInstances.unshift(instance);
          dispatchCurrentTargets.unshift(currentTarget);
        }
      } else {
        const bubbleListener = getListener(instance, registrationName);
        if (bubbleListener != null) {
          // Bubble listeners/instances should go at the end, so we
          // push them to the end of the array.
          dispatchListeners.push(bubbleListener);
          dispatchInstances.push(instance);
          dispatchCurrentTargets.push(currentTarget);
        }
      }
    }
    instance = instance.return;
  }
  // To prevent allocation to the event unless we actually
  // have listeners we check the length of one of the arrays.
  if (dispatchListeners.length > 0) {
    event._dispatchListeners = dispatchListeners;
    event._dispatchInstances = dispatchInstances;
    event._dispatchCurrentTargets = dispatchCurrentTargets;
  }
}

export default function accumulateEnterLeaveListeners(
  leaveEvent: ReactSyntheticEvent,
  enterEvent: ReactSyntheticEvent,
  from: Fiber | null,
  to: Fiber | null,
): void {
  const common = from && to ? getLowestCommonAncestor(from, to) : null;

  if (from !== null) {
    accumulateEnterLeaveListenersForEvent(leaveEvent, from, common, false);
  }
  if (to !== null) {
    accumulateEnterLeaveListenersForEvent(enterEvent, to, common, true);
  }
}
