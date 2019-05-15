/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';

import {
  HostComponent,
  HostText,
  HostPortal,
  SuspenseComponent,
  Fragment,
} from 'shared/ReactWorkTags';

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

// TODO: should this be under a DEV onlyflag in the future?
export function getEventComponentHostChildrenCount(
  eventComponentFiber: Fiber,
): number {
  const eventComponentInstance = eventComponentFiber.stateNode;
  let hostChildrenCount = 0;
  let node = eventComponentFiber.child;
  let parent = eventComponentFiber;

  while (node !== null) {
    if (isFiberSuspenseAndTimedOut(node)) {
      const fallbackChild = getSuspenseFallbackChild(node);
      if (fallbackChild !== null) {
        node = fallbackChild;
        continue;
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
        child.return = parent;
        parent = node;
        node = child;
        continue;
      }
    }
    const sibling = node.sibling;
    if (sibling !== null) {
      sibling.return = parent;
      node = sibling;
      continue;
    }
    let nextParent;
    if (isFiberSuspenseTimedOutChild(node)) {
      nextParent = getSuspenseFiberFromTimedOutChild(node);
    } else {
      nextParent = node.return;
      if (nextParent === null) {
        break;
      }
    }
    if (nextParent.stateNode === eventComponentInstance) {
      break;
    }
    parent = nextParent.return;
    node = nextParent.sibling;
  }
  return hostChildrenCount;
}
