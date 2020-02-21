/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';

import {HostComponent, HostPortal, HostRoot} from './ReactWorkTags';
import {enableModernEventSystem} from './ReactFeatureFlags';

export function getParent(
  inst: Fiber,
  alwaysTraversePortals?: boolean,
): null | Fiber {
  if (enableModernEventSystem) {
    let node = inst.return;

    while (node !== null) {
      if (node.tag === HostPortal && !alwaysTraversePortals) {
        let grandNode = node;
        const portalNode = node.stateNode.containerInfo;
        while (grandNode !== null) {
          // If we find a root that is actually a parent in the DOM tree
          // then we don't continue with getting the parent, as that root
          // will have its own event listener.
          if (
            grandNode.tag === HostRoot &&
            grandNode.stateNode.containerInfo.contains(portalNode)
          ) {
            return null;
          }
          grandNode = grandNode.return;
        }
      } else if (node.tag === HostComponent) {
        return node;
      }
      node = node.return;
    }
    return null;
  } else {
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
}

/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */
export function getLowestCommonAncestor(instA, instB) {
  let depthA = 0;
  for (let tempA = instA; tempA; tempA = getParent(tempA, true)) {
    depthA++;
  }
  let depthB = 0;
  for (let tempB = instB; tempB; tempB = getParent(tempB, true)) {
    depthB++;
  }

  // If A is deeper, crawl up.
  while (depthA - depthB > 0) {
    instA = getParent(instA, true);
    depthA--;
  }

  // If B is deeper, crawl up.
  while (depthB - depthA > 0) {
    instB = getParent(instB, true);
    depthB--;
  }

  // Walk in lockstep until we find a match.
  let depth = depthA;
  while (depth--) {
    if (instA === instB || instA === instB.alternate) {
      return instA;
    }
    instA = getParent(instA, true);
    instB = getParent(instB, true);
  }
  return null;
}

/**
 * Return if A is an ancestor of B.
 */
export function isAncestor(instA, instB) {
  while (instB) {
    if (instA === instB || instA === instB.alternate) {
      return true;
    }
    instB = getParent(instB, true);
  }
  return false;
}

/**
 * Return the parent instance of the passed-in instance.
 */
export function getParentInstance(inst) {
  return getParent(inst);
}

/**
 * Simulates the traversal of a two-phase, capture/bubble event dispatch.
 */
export function traverseTwoPhase(inst, fn, arg) {
  const path = [];
  while (inst) {
    path.push(inst);
    inst = getParent(inst);
  }
  let i;
  for (i = path.length; i-- > 0; ) {
    fn(path[i], 'captured', arg);
  }
  for (i = 0; i < path.length; i++) {
    fn(path[i], 'bubbled', arg);
  }
}

/**
 * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
 * should would receive a `mouseEnter` or `mouseLeave` event.
 *
 * Does not invoke the callback on the nearest common ancestor because nothing
 * "entered" or "left" that element.
 */
export function traverseEnterLeave(from, to, fn, argFrom, argTo) {
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
    from = getParent(from, true);
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
    to = getParent(to, true);
  }
  for (let i = 0; i < pathFrom.length; i++) {
    fn(pathFrom[i], 'bubbled', argFrom);
  }
  for (let i = pathTo.length; i-- > 0; ) {
    fn(pathTo[i], 'captured', argTo);
  }
}
