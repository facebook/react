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

export function getSuspenseChild(fiber: Fiber): Fiber | null {
  return (((fiber.child: any): Fiber): Fiber).child;
}

export function isFiberSuspenseChild(fiber: Fiber | null): boolean {
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

export function getSuspenseFiberFromChild(fiber: Fiber): Fiber {
  return ((((fiber.return: any): Fiber).return: any): Fiber);
}

export function getEventComponentHostChildrenCount(
  eventComponentFiber: Fiber,
): number {
  const eventComponentInstance = eventComponentFiber.stateNode;
  let hostChildrenCount = 0;
  let node = eventComponentFiber.child;
  while (node !== null) {
    if (node.tag === SuspenseComponent) {
      const suspendedChild = isFiberSuspenseAndTimedOut(node)
        ? getSuspenseFallbackChild(node)
        : getSuspenseChild(node);
      if (suspendedChild !== null) {
        node = suspendedChild;
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
        node = child;
        continue;
      }
    }
    const sibling = node.sibling;
    if (sibling !== null) {
      node = sibling;
      continue;
    }
    let parent;
    if (isFiberSuspenseChild(node)) {
      parent = getSuspenseFiberFromChild(node);
    } else {
      parent = node.return;
      if (parent === null) {
        break;
      }
    }
    if (parent.stateNode === eventComponentInstance) {
      break;
    }
    node = parent.sibling;
  }
  return hostChildrenCount;
}
