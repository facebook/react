/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {Instance} from './ReactFiberHostConfig';

import invariant from 'shared/invariant';
import {HostComponent} from 'react-reconciler/src/ReactWorkTags';
import getComponentName from 'shared/getComponentName';
import {
  findRootFiber,
  getBoundingRect,
  getInstanceFromNode,
  isHiddenSubtree,
  setFocusIfFocusable,
  setupIntersectionObserver,
  supportsTestSelectors,
} from './ReactFiberHostConfig';

type ComponentTypeSelector = Array<React$AbstractComponent<empty, mixed>>;

function findRootFiberForHostRoot(hostRoot: Instance): Fiber {
  const maybeFiber = getInstanceFromNode((hostRoot: any));
  if (maybeFiber != null) {
    invariant(
      typeof maybeFiber.memoizedProps['data-testname'] === 'string',
      'Invalid host root specified. Should be either a React container or a node previously returned by findAllNodes().',
    );
    return ((maybeFiber: any): Fiber);
  } else {
    const root = findRootFiber(hostRoot);
    invariant(
      root !== null,
      'Could not find React container within specified host subtree.',
    );
    return root;
  }
}

function findPathsMatchingComponentTypesSelector(
  root: Fiber,
  componentTypeSelector: ComponentTypeSelector,
): Array<Fiber> {
  const componentTypePaths: Array<Fiber> = [];

  const stack = [root, 0];
  while (stack.length > 0) {
    const node = ((stack.shift(): any): Fiber);
    let componentTypeIndex = ((stack.shift(): any): number);

    if (node.type === componentTypeSelector[componentTypeIndex]) {
      componentTypeIndex++;
    }

    if (componentTypeIndex === componentTypeSelector.length) {
      componentTypePaths.push(node);
    } else {
      let child = node.child;
      while (child !== null) {
        stack.push(child, componentTypeIndex);
        child = child.sibling;
      }
    }
  }

  return componentTypePaths;
}

function matchTestName(fiber: Fiber, targetTestName: string): boolean {
  if (fiber.tag === HostComponent) {
    const dataTestName = fiber.memoizedProps['data-testname'];
    return (
      typeof dataTestName === 'string' &&
      dataTestName.toLowerCase() === targetTestName.toLowerCase()
    );
  }
  return false;
}

export function findAllNodes(
  hostRoot: Instance,
  componentTypeSelector: ComponentTypeSelector,
  dataTestName: string,
): Array<Instance> {
  if (!supportsTestSelectors) {
    invariant(false, 'Test selector API is not supported by this renderer.');
  }

  const root = findRootFiberForHostRoot(hostRoot);

  const componentTypePaths = findPathsMatchingComponentTypesSelector(
    root,
    componentTypeSelector,
  );

  const matchingInstances: Array<Instance> = [];

  const stack = Array.from(componentTypePaths);
  while (stack.length > 0) {
    const node = ((stack.shift(): any): Fiber);

    if (node.tag === HostComponent) {
      if (isHiddenSubtree(node)) {
        continue;
      }
      if (matchTestName(node, dataTestName)) {
        matchingInstances.push(node.stateNode);
      }
    }

    let child = node.child;
    while (child !== null) {
      stack.push(child);
      child = child.sibling;
    }
  }

  return matchingInstances;
}

export function getFindAllNodesFailureDescription(
  hostRoot: Instance,
  componentTypeSelector: ComponentTypeSelector,
  dataTestName: string,
): string | null {
  if (!supportsTestSelectors) {
    invariant(false, 'Test selector API is not supported by this renderer.');
  }

  const root = findRootFiberForHostRoot(hostRoot);

  const componentTypePaths: Array<Fiber> = [];

  let maxComponentTypeIndex: number = 0;
  const matchedNames = [];

  // The logic of this loop should be kept in sync with findPathsMatchingComponentTypesSelector()
  let stack = [root, 0];
  while (stack.length > 0) {
    const node = ((stack.shift(): any): Fiber);
    let componentTypeIndex = ((stack.shift(): any): number);

    if (node.type === componentTypeSelector[componentTypeIndex]) {
      matchedNames.push(getComponentName(node.type));
      componentTypeIndex++;
      if (componentTypeIndex > maxComponentTypeIndex) {
        maxComponentTypeIndex = componentTypeIndex;
      }
    }

    if (componentTypeIndex === componentTypeSelector.length) {
      componentTypePaths.push(node);
    } else {
      let child = node.child;
      while (child !== null) {
        stack.push(child, componentTypeIndex);
        child = child.sibling;
      }
    }
  }

  if (maxComponentTypeIndex < componentTypeSelector.length) {
    const unmatchedNames = [];

    for (let i = maxComponentTypeIndex; i < componentTypeSelector.length; i++) {
      unmatchedNames.push(getComponentName(componentTypeSelector[i]));
    }

    return (
      'findAllNodes was able to match part of the selector:\n' +
      `  ${matchedNames.join(' > ')}\n\n` +
      'No matching component was found for:\n' +
      `  ${unmatchedNames.join(' > ')}`
    );
  }

  const dataTestNames: Set<string> = new Set();

  stack = Array.from(componentTypePaths);

  // The logic of this loop shouild be kept in sync with Test selector API
  while (stack.length > 0) {
    const node = ((stack.shift(): any): Fiber);

    if (node.tag === HostComponent) {
      if (isHiddenSubtree(node)) {
        continue;
      }

      if (matchTestName(node, dataTestName)) {
        // If we find at least one match, there's nothing for this method to return.
        return null;
      } else {
        // If this component has a testname, add it to the set.
        const name = node.memoizedProps['data-testname'];
        if (typeof name === 'string') {
          dataTestNames.add(name);
        }
      }
    }

    let child = node.child;
    while (child !== null) {
      stack.push(child);
      child = child.sibling;
    }
  }

  return (
    `No host element was found with the test name "${dataTestName}".\n\n` +
    'The following test names were found in the matched subtree:\n' +
    '  ' +
    Array.from(dataTestNames)
      .sort((a, b) => a.localeCompare(b))
      .join('\n  ')
  );
}

function findInstanceRoots(
  hostRoot: Instance,
  componentTypeSelector: ComponentTypeSelector,
): Array<Instance> {
  const root = findRootFiberForHostRoot(hostRoot);
  const componentTypePaths = findPathsMatchingComponentTypesSelector(
    root,
    componentTypeSelector,
  );

  const instanceRoots: Array<Instance> = [];
  const stack = Array.from(componentTypePaths);
  while (stack.length > 0) {
    const node = ((stack.shift(): any): Fiber);
    if (node.tag === HostComponent) {
      if (isHiddenSubtree(node)) {
        continue;
      }
      instanceRoots.push(node.stateNode);
    } else {
      let child = node.child;
      while (child !== null) {
        stack.push(child);
        child = child.sibling;
      }
    }
  }

  return instanceRoots;
}

export type BoundingRect = {|
  x: number,
  y: number,
  width: number,
  height: number,
|};

export function findBoundingRects(
  hostRoot: Instance,
  componentTypeSelector: ComponentTypeSelector,
): Array<BoundingRect> {
  if (!supportsTestSelectors) {
    invariant(false, 'Test selector API is not supported by this renderer.');
  }

  const instanceRoots = findInstanceRoots(hostRoot, componentTypeSelector);

  const boundingRects: Array<BoundingRect> = [];
  for (let i = 0; i < instanceRoots.length; i++) {
    boundingRects.push(getBoundingRect(instanceRoots[i]));
  }

  for (let i = boundingRects.length - 1; i >= 0; i--) {
    const targetRect = boundingRects[i];
    for (let j = boundingRects.length - 1; j >= 0; j--) {
      if (i !== j) {
        const otherRect = boundingRects[j];
        if (
          targetRect.x >= otherRect.x &&
          targetRect.y >= otherRect.y &&
          targetRect.x + targetRect.width <= otherRect.x + otherRect.width &&
          targetRect.y + targetRect.height <= otherRect.y + otherRect.height
        ) {
          boundingRects.splice(i, 1);
          break;
        }
      }
    }
  }

  // TODO We may also want to combine rects that intersect or are adjacent.
  // We could at least handle the most common cases (e.g. same in one dimension).

  return boundingRects;
}

export function focusWithin(
  hostRoot: Instance,
  componentTypeSelector: ComponentTypeSelector,
): boolean {
  if (!supportsTestSelectors) {
    invariant(false, 'Test selector API is not supported by this renderer.');
  }

  const root = findRootFiberForHostRoot(hostRoot);
  const componentTypePaths = findPathsMatchingComponentTypesSelector(
    root,
    componentTypeSelector,
  );

  const stack = Array.from(componentTypePaths);
  while (stack.length > 0) {
    const node = ((stack.shift(): any): Fiber);
    if (node.tag === HostComponent) {
      if (isHiddenSubtree(node)) {
        continue;
      }
      if (setFocusIfFocusable(node.stateNode)) {
        return true;
      }
    }

    let child = node.child;
    while (child !== null) {
      stack.push(child);
      child = child.sibling;
    }
  }

  return false;
}

const commitHooks: Array<Function> = [];

export function onCommitRoot(): void {
  if (supportsTestSelectors) {
    commitHooks.forEach(commitHook => commitHook());
  }
}

export type IntersectionObserverOptions = Object;

export type ObserveVisibleRectsCallback = (
  intersections: Array<{ratio: number, rect: BoundingRect}>,
) => void;

export function observeVisibleRects(
  hostRoot: Instance,
  componentTypeSelector: ComponentTypeSelector,
  callback: (intersections: Array<{ratio: number, rect: BoundingRect}>) => void,
  options?: IntersectionObserverOptions,
): {|disconnect: () => void|} {
  if (!supportsTestSelectors) {
    invariant(false, 'Test selector API is not supported by this renderer.');
  }

  const instanceRoots = findInstanceRoots(hostRoot, componentTypeSelector);

  const {disconnect, observe, unobserve} = setupIntersectionObserver(
    instanceRoots,
    callback,
    options,
  );

  // When React mutates the host environment, we may need to change what we're listening to.
  const commitHook = () => {
    const nextInstanceRoots = findInstanceRoots(
      hostRoot,
      componentTypeSelector,
    );

    instanceRoots.forEach(target => {
      if (nextInstanceRoots.indexOf(target) < 0) {
        unobserve(target);
      }
    });

    nextInstanceRoots.forEach(target => {
      if (instanceRoots.indexOf(target) < 0) {
        observe(target);
      }
    });
  };

  commitHooks.push(commitHook);

  return {
    disconnect: () => {
      // Stop listening for React mutations:
      const index = commitHooks.indexOf(commitHook);
      if (index >= 0) {
        commitHooks.splice(index, 1);
      }

      // Disconnect the host observer:
      disconnect();
    },
  };
}
