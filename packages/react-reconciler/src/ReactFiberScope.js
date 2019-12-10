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

import {getPublicInstance, getInstanceFromNode} from './ReactFiberHostConfig';

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

const emptyObject = {};

function collectScopedNodes(
  node: Fiber,
  fn: (type: string | Object, props: Object, instance: Object) => boolean,
  scopedNodes: Array<any>,
): void {
  if (enableScopeAPI) {
    if (node.tag === HostComponent) {
      const {type, memoizedProps, stateNode} = node;
      const instance = getPublicInstance(stateNode);
      if (
        instance !== null &&
        fn(type, memoizedProps || emptyObject, instance) === true
      ) {
        scopedNodes.push(instance);
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

function collectFirstScopedNode(
  node: Fiber,
  fn: (type: string | Object, props: Object, instance: Object) => boolean,
): null | Object {
  if (enableScopeAPI) {
    if (node.tag === HostComponent) {
      const {type, memoizedProps, stateNode} = node;
      const instance = getPublicInstance(stateNode);
      if (instance !== null && fn(type, memoizedProps, instance) === true) {
        return instance;
      }
    }
    let child = node.child;

    if (isFiberSuspenseAndTimedOut(node)) {
      child = getSuspenseFallbackChild(node);
    }
    if (child !== null) {
      return collectFirstScopedNodeFromChildren(child, fn);
    }
  }
  return null;
}

function collectScopedNodesFromChildren(
  startingChild: Fiber,
  fn: (type: string | Object, props: Object, instance: Object) => boolean,
  scopedNodes: Array<any>,
): void {
  let child = startingChild;
  while (child !== null) {
    collectScopedNodes(child, fn, scopedNodes);
    child = child.sibling;
  }
}

function collectFirstScopedNodeFromChildren(
  startingChild: Fiber,
  fn: (type: string | Object, props: Object, instance: Object) => boolean,
): Object | null {
  let child = startingChild;
  while (child !== null) {
    const scopedNode = collectFirstScopedNode(child, fn);
    if (scopedNode !== null) {
      return scopedNode;
    }
    child = child.sibling;
  }
  return null;
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
  return (
    node.tag === ScopeComponent &&
    node.type === scope &&
    node.stateNode !== null
  );
}

export function createScopeMethods(
  scope: ReactScope,
  instance: ReactScopeInstance,
): ReactScopeMethods {
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
    queryAllNodes(
      fn: (type: string | Object, props: Object, instance: Object) => boolean,
    ): null | Array<Object> {
      const currentFiber = ((instance.fiber: any): Fiber);
      const child = currentFiber.child;
      const scopedNodes = [];
      if (child !== null) {
        collectScopedNodesFromChildren(child, fn, scopedNodes);
      }
      return scopedNodes.length === 0 ? null : scopedNodes;
    },
    queryFirstNode(
      fn: (type: string | Object, props: Object, instance: Object) => boolean,
    ): null | Object {
      const currentFiber = ((instance.fiber: any): Fiber);
      const child = currentFiber.child;
      if (child !== null) {
        return collectFirstScopedNodeFromChildren(child, fn);
      }
      return null;
    },
    containsNode(node: Object): boolean {
      let fiber = getInstanceFromNode(node);
      while (fiber !== null) {
        if (
          fiber.tag === ScopeComponent &&
          fiber.type === scope &&
          fiber.stateNode === instance
        ) {
          return true;
        }
        fiber = fiber.return;
      }
      return false;
    },
  };
}
