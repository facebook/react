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

import {getPublicInstance} from './ReactFiberHostConfig';

import {
  HostComponent,
  SuspenseComponent,
  ScopeComponent,
} from 'shared/ReactWorkTags';
import {enableScopeAPI} from 'shared/ReactFeatureFlags';

function isFiberSuspenseAndTimedOut(fiber: Fiber): boolean {
  return fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
}

function getSuspenseFallbackChild(fiber: Fiber): Fiber | null {
  return ((((fiber.child: any): Fiber).sibling: any): Fiber).child;
}

function collectScopedNodes(
  node: Fiber,
  fn: (type: string | Object, props: Object) => boolean,
  scopedNodes: Array<any>,
): void {
  if (enableScopeAPI) {
    if (node.tag === HostComponent) {
      const {type, memoizedProps} = node;
      if (fn(type, memoizedProps) === true) {
        scopedNodes.push(getPublicInstance(node.stateNode));
      }
    }
    let child = node.child;

    if (isFiberSuspenseAndTimedOut(node)) {
      child = getSuspenseFallbackChild(node);
    }
    if (child !== null) {
      collectScopedNodesFromChildren(child, fn, scopedNodes);
    }
  }
}

function collectScopedNodesFromChildren(
  startingChild: Fiber,
  fn: (type: string | Object, props: Object) => boolean,
  scopedNodes: Array<any>,
): void {
  let child = startingChild;
  while (child !== null) {
    collectScopedNodes(child, fn, scopedNodes);
    child = child.sibling;
  }
}

function collectNearestScopeMethods(
  node: Fiber,
  scope: ReactScope,
  childrenScopes: Array<ReactScopeMethods>,
): void {
  if (isValidScopeNode(node, scope)) {
    childrenScopes.push(node.stateNode.methods);
  } else {
    let child = node.child;

    if (isFiberSuspenseAndTimedOut(node)) {
      child = getSuspenseFallbackChild(node);
    }
    if (child !== null) {
      collectNearestChildScopeMethods(child, scope, childrenScopes);
    }
  }
}

function collectNearestChildScopeMethods(
  startingChild: Fiber | null,
  scope: ReactScope,
  childrenScopes: Array<ReactScopeMethods>,
): void {
  let child = startingChild;
  while (child !== null) {
    collectNearestScopeMethods(child, scope, childrenScopes);
    child = child.sibling;
  }
}

function isValidScopeNode(node, scope) {
  return node.tag === ScopeComponent && node.type === scope;
}

export function createScopeMethods(
  scope: ReactScope,
  instance: ReactScopeInstance,
): ReactScopeMethods {
  const fn = scope.fn;
  return {
    getChildren(): null | Array<ReactScopeMethods> {
      const currentFiber = ((instance.fiber: any): Fiber);
      const child = currentFiber.child;
      const childrenScopes = [];
      if (child !== null) {
        collectNearestChildScopeMethods(child, scope, childrenScopes);
      }
      return childrenScopes.length === 0 ? null : childrenScopes;
    },
    getChildrenFromRoot(): null | Array<ReactScopeMethods> {
      const currentFiber = ((instance.fiber: any): Fiber);
      let node = currentFiber;
      while (node !== null) {
        const parent = node.return;
        if (parent === null) {
          break;
        }
        node = parent;
        if (node.tag === ScopeComponent && node.type === scope) {
          break;
        }
      }
      const childrenScopes = [];
      collectNearestChildScopeMethods(node.child, scope, childrenScopes);
      return childrenScopes.length === 0 ? null : childrenScopes;
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
    getProps(): Object {
      const currentFiber = ((instance.fiber: any): Fiber);
      return currentFiber.memoizedProps;
    },
    getScopedNodes(): null | Array<Object> {
      const currentFiber = ((instance.fiber: any): Fiber);
      const child = currentFiber.child;
      const scopedNodes = [];
      if (child !== null) {
        collectScopedNodesFromChildren(child, fn, scopedNodes);
      }
      return scopedNodes.length === 0 ? null : scopedNodes;
    },
  };
}
