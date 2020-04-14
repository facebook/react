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
import {HostComponent, HostText} from 'react-reconciler/src/ReactWorkTags';
import getComponentName from 'shared/getComponentName';
import {
  findRootFiber,
  getBoundingRect,
  getInstanceFromNode,
  getTextContent,
  isHiddenSubtree,
  matchAccessibilityRole,
  setFocusIfFocusable,
  setupIntersectionObserver,
  supportsTestSelectors,
} from './ReactFiberHostConfig';

let COMPONENT_TYPE = 0b000;
let HAS_PSEUDO_CLASS_TYPE = 0b001;
let ROLE_TYPE = 0b010;
let TEST_NAME_TYPE = 0b011;
let TEXT_TYPE = 0b100;

if (typeof Symbol === 'function' && Symbol.for) {
  const symbolFor = Symbol.for;
  COMPONENT_TYPE = symbolFor('selector.component');
  HAS_PSEUDO_CLASS_TYPE = symbolFor('selector.has_pseudo_class');
  ROLE_TYPE = symbolFor('selector.role');
  TEST_NAME_TYPE = symbolFor('selector.test_id');
  TEXT_TYPE = symbolFor('selector.text');
}

type Type = Symbol | number;

type ComponentSelector = {|
  $$typeof: Type,
  value: React$AbstractComponent<empty, mixed>,
|};

type HasPsuedoClassSelector = {|
  $$typeof: Type,
  value: Array<Selector>,
|};

type RoleSelector = {|
  $$typeof: Type,
  value: string,
|};

type TextSelector = {|
  $$typeof: Type,
  value: string,
|};

type TestNameSelector = {|
  $$typeof: Type,
  value: string,
|};

type Selector =
  | ComponentSelector
  | HasPsuedoClassSelector
  | RoleSelector
  | TextSelector
  | TestNameSelector;

export function createComponentSelector(
  component: React$AbstractComponent<empty, mixed>,
): ComponentSelector {
  return {
    $$typeof: COMPONENT_TYPE,
    value: component,
  };
}

export function createHasPsuedoClassSelector(
  selectors: Array<Selector>,
): HasPsuedoClassSelector {
  return {
    $$typeof: HAS_PSEUDO_CLASS_TYPE,
    value: selectors,
  };
}

export function createRoleSelector(role: string): RoleSelector {
  return {
    $$typeof: ROLE_TYPE,
    value: role,
  };
}

export function createTextSelector(text: string): TextSelector {
  return {
    $$typeof: TEXT_TYPE,
    value: text,
  };
}

export function createTestNameSelector(id: string): TestNameSelector {
  return {
    $$typeof: TEST_NAME_TYPE,
    value: id,
  };
}

function findRootFiberForHostRoot(hostRoot: Instance): Fiber {
  const maybeFiber = getInstanceFromNode((hostRoot: any));
  if (maybeFiber != null) {
    invariant(
      typeof maybeFiber.memoizedProps['data-testname'] === 'string',
      'Invalid host root specified. Should be either a React container or a node with a testname attribute.',
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

function matchSelector(fiber: Fiber, selector: Selector): boolean {
  switch (selector.$$typeof) {
    case COMPONENT_TYPE:
      if (fiber.type === selector.value) {
        return true;
      }
      break;
    case HAS_PSEUDO_CLASS_TYPE:
      // TODO (test-selectors) Implement this selector type.
      break;
    case ROLE_TYPE:
      if (fiber.tag === HostComponent) {
        if (
          matchAccessibilityRole(fiber, ((selector: any): RoleSelector).value)
        ) {
          return true;
        }
      }
      break;
    case TEXT_TYPE:
      if (fiber.tag === HostComponent || fiber.tag === HostText) {
        const textContent = getTextContent(fiber);
        if (
          textContent !== null &&
          textContent.indexOf(((selector: any): TextSelector).value) >= 0
        ) {
          return true;
        }
      }
      break;
    case TEST_NAME_TYPE:
      if (fiber.tag === HostComponent) {
        const dataTestID = fiber.memoizedProps['data-testname'];
        if (
          typeof dataTestID === 'string' &&
          dataTestID.toLowerCase() ===
            ((selector: any): TestNameSelector).value.toLowerCase()
        ) {
          return true;
        }
      }
      break;
    default:
      invariant(null, 'Invalid selector type %s specified', selector);
      break;
  }

  return false;
}

function selectorToString(selector: Selector): string | null {
  switch (selector.$$typeof) {
    case COMPONENT_TYPE:
      const displayName = getComponentName(selector.value) || 'Unknown';
      return `<${displayName}>`;
    case HAS_PSEUDO_CLASS_TYPE:
      // TODO (test-selectors) Implement this selector type.
      break;
    case ROLE_TYPE:
      return `[role="${((selector: any): RoleSelector).value}"]`;
    case TEXT_TYPE:
      return `"${((selector: any): TextSelector).value}"`;
    case TEST_NAME_TYPE:
      return `[data-testname="${((selector: any): TestNameSelector).value}"]`;
    default:
      invariant(null, 'Invalid selector type %s specified', selector);
      break;
  }

  return null;
}

function findPaths(root: Fiber, selectors: Array<Selector>): Array<Fiber> {
  const matchingFibers: Array<Fiber> = [];

  const stack = [root, 0];
  let index = 0;
  while (index < stack.length) {
    const fiber = ((stack[index++]: any): Fiber);
    let selectorIndex = ((stack[index++]: any): number);
    const selector = selectors[selectorIndex];

    if (fiber.tag === HostComponent && isHiddenSubtree(fiber)) {
      continue;
    } else if (matchSelector(fiber, selector)) {
      selectorIndex++;
    }

    if (selectorIndex === selectors.length) {
      matchingFibers.push(fiber);
    } else {
      let child = fiber.child;
      while (child !== null) {
        stack.push(child, selectorIndex);
        child = child.sibling;
      }
    }
  }

  return matchingFibers;
}

export function findAllNodes(
  hostRoot: Instance,
  selectors: Array<Selector>,
): Array<Instance> {
  if (!supportsTestSelectors) {
    invariant(false, 'Test selector API is not supported by this renderer.');
  }

  const root = findRootFiberForHostRoot(hostRoot);
  const matchingFibers = findPaths(root, selectors);

  const instanceRoots: Array<Instance> = [];

  const stack = Array.from(matchingFibers);
  let index = 0;
  while (index < stack.length) {
    const node = ((stack[index++]: any): Fiber);
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

export function getFindAllNodesFailureDescription(
  hostRoot: Instance,
  selectors: Array<Selector>,
): string | null {
  if (!supportsTestSelectors) {
    invariant(false, 'Test selector API is not supported by this renderer.');
  }

  const root = findRootFiberForHostRoot(hostRoot);

  let maxSelectorIndex: number = 0;
  const matchedNames = [];

  // The logic of this loop should be kept in sync with findPaths()
  const stack = [root, 0];
  let index = 0;
  while (index < stack.length) {
    const fiber = ((stack[index++]: any): Fiber);
    let selectorIndex = ((stack[index++]: any): number);
    const selector = selectors[selectorIndex];

    if (fiber.tag === HostComponent && isHiddenSubtree(fiber)) {
      continue;
    } else if (matchSelector(fiber, selector)) {
      matchedNames.push(selectorToString(selector));
      selectorIndex++;

      if (selectorIndex > maxSelectorIndex) {
        maxSelectorIndex = selectorIndex;
      }
    }

    if (selectorIndex < selectors.length) {
      let child = fiber.child;
      while (child !== null) {
        stack.push(child, selectorIndex);
        child = child.sibling;
      }
    }
  }

  if (maxSelectorIndex < selectors.length) {
    const unmatchedNames = [];
    for (let i = maxSelectorIndex; i < selectors.length; i++) {
      unmatchedNames.push(selectorToString(selectors[i]));
    }

    return (
      'findAllNodes was able to match part of the selector:\n' +
      `  ${matchedNames.join(' > ')}\n\n` +
      'No matching component was found for:\n' +
      `  ${unmatchedNames.join(' > ')}`
    );
  }

  return null;
}

export type BoundingRect = {|
  x: number,
  y: number,
  width: number,
  height: number,
|};

export function findBoundingRects(
  hostRoot: Instance,
  selectors: Array<Selector>,
): Array<BoundingRect> {
  if (!supportsTestSelectors) {
    invariant(false, 'Test selector API is not supported by this renderer.');
  }

  const instanceRoots = findAllNodes(hostRoot, selectors);

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
  selectors: Array<Selector>,
): boolean {
  if (!supportsTestSelectors) {
    invariant(false, 'Test selector API is not supported by this renderer.');
  }

  const root = findRootFiberForHostRoot(hostRoot);
  const matchingFibers = findPaths(root, selectors);

  const stack = Array.from(matchingFibers);
  let index = 0;
  while (index < stack.length) {
    const node = ((stack[index++]: any): Fiber);
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
  selectors: Array<Selector>,
  callback: (intersections: Array<{ratio: number, rect: BoundingRect}>) => void,
  options?: IntersectionObserverOptions,
): {|disconnect: () => void|} {
  if (!supportsTestSelectors) {
    invariant(false, 'Test selector API is not supported by this renderer.');
  }

  const instanceRoots = findAllNodes(hostRoot, selectors);

  const {disconnect, observe, unobserve} = setupIntersectionObserver(
    instanceRoots,
    callback,
    options,
  );

  // When React mutates the host environment, we may need to change what we're listening to.
  const commitHook = () => {
    const nextInstanceRoots = findAllNodes(hostRoot, selectors);

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
