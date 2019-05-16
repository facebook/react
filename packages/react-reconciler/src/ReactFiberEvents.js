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
