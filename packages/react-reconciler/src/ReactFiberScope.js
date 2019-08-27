/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {
  ReactScope,
  ReactScopeInstance,
  ReactScopeMethods,
} from 'shared/ReactTypes';

import {
  HostComponent,
  SuspenseComponent,
  ScopeComponent,
} from 'shared/ReactWorkTags';

function isFiberSuspenseAndTimedOut(fiber: Fiber): boolean {
  return fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
}

function getSuspenseFallbackChild(fiber: Fiber): Fiber | null {
  return ((((fiber.child: any): Fiber).sibling: any): Fiber).child;
}

function collectScopeNodes(
  node: Fiber,
  fn: (type: string | Object, props: Object) => boolean,
  scopedNodes: Array<any>,
): void {
  if (node.tag === HostComponent) {
    const {type, memoizedProps} = node;
    if (fn(type, memoizedProps) === true) {
      scopedNodes.push(node.stateNode);
    }
  }
  let child = node.child;

  if (isFiberSuspenseAndTimedOut(node)) {
    child = getSuspenseFallbackChild(node);
  }
  if (child !== null) {
    collectScopeNodesFromChildren(child, fn, scopedNodes);
  }
}

function collectScopeNodesFromChildren(
  startingChild: Fiber,
  fn: (type: string | Object, props: Object) => boolean,
  scopedNodes: Array<any>,
): void {
  let child = startingChild;
  while (child !== null) {
    collectScopeNodes(child, fn, scopedNodes);
    child = child.sibling;
  }
}

export function createScopeMethods(
  scope: ReactScope,
  instance: ReactScopeInstance,
): ReactScopeMethods {
  const fn = scope.fn;
  return {
    getChildren(): null | Array<ReactScopeMethods> {
      return null;
    },
    getParent(): null | ReactScopeMethods {
      let node = ((instance.fiber: any): Fiber).return;
      while (node !== null) {
        if (node.tag === ScopeComponent && node.type === scope) {
          return node.stateNode.methods;
        }
        node = node.return;
      }
      return null;
    },
    getScopedNodes(): null | Array<Object> {
      const currentFiber = ((instance.fiber: any): Fiber);
      const child = currentFiber.child;
      const scopedNodes = [];
      if (child !== null) {
        collectScopeNodesFromChildren(child, fn, scopedNodes);
      }
      return scopedNodes.length === 0 ? null : scopedNodes;
    },
  };
}
