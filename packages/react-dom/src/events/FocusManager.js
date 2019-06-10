/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import getActiveElement from '../client/getActiveElement';
import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';
import {
  isFiberSuspenseAndTimedOut,
  getSuspenseFallbackChild,
} from 'react-reconciler/src/ReactFiberEvents';
import {EventComponent, HostComponent} from 'shared/ReactWorkTags';
import type {
  FocusManagerOptions,
  ReactEventComponentInstance,
} from 'shared/ReactTypes';
import type {Fiber} from 'react-reconciler/src/ReactFiber';

function findScope(node: Element) {
  let fiber = getClosestInstanceFromNode(node);
  while (fiber !== null) {
    if (
      fiber.tag === EventComponent &&
      fiber.stateNode &&
      fiber.stateNode.responder.isFocusScope
    ) {
      return fiber.stateNode;
    }
    fiber = fiber.return;
  }
}

export function getFocusableElementsInScope(
  eventComponentInstance: ReactEventComponentInstance,
  tabbable?: boolean,
  searchNode?: Element,
): Array<HTMLElement> {
  const focusableElements = [];
  const child = ((eventComponentInstance.currentFiber: any): Fiber).child;

  if (child !== null) {
    collectFocusableElements(child, focusableElements, tabbable, searchNode);
  }
  return focusableElements;
}

function collectFocusableElements(
  node: Fiber,
  focusableElements: Array<HTMLElement>,
  tabbable?: boolean,
  searchNode?: Element,
): void {
  if (isFiberSuspenseAndTimedOut(node)) {
    const fallbackChild = getSuspenseFallbackChild(node);
    if (fallbackChild !== null) {
      collectFocusableElements(
        fallbackChild,
        focusableElements,
        tabbable,
        searchNode,
      );
    }
  } else {
    if (
      isFiberHostComponentFocusable(node, tabbable) ||
      node.stateNode === searchNode
    ) {
      focusableElements.push(node.stateNode);
    } else {
      const child = node.child;

      if (child !== null) {
        collectFocusableElements(
          child,
          focusableElements,
          tabbable,
          searchNode,
        );
      }
    }
  }
  const sibling = node.sibling;

  if (sibling !== null) {
    collectFocusableElements(sibling, focusableElements, tabbable, searchNode);
  }
}

function isFiberHostComponentFocusable(
  fiber: Fiber,
  tabbable?: boolean,
): boolean {
  if (fiber.tag !== HostComponent) {
    return false;
  }
  const {type, memoizedProps} = fiber;
  if ((tabbable && memoizedProps.tabIndex === -1) || memoizedProps.disabled) {
    return false;
  }
  const minTabIndex = tabbable ? 0 : -1;
  if (
    (memoizedProps.tabIndex != null && memoizedProps.tabIndex >= minTabIndex) ||
    memoizedProps.contentEditable === true
  ) {
    return true;
  }
  if (type === 'a' || type === 'area') {
    return !!memoizedProps.href && memoizedProps.rel !== 'ignore';
  }
  if (type === 'input') {
    return memoizedProps.type !== 'hidden' && memoizedProps.type !== 'file';
  }
  return (
    type === 'button' ||
    type === 'textarea' ||
    type === 'object' ||
    type === 'select' ||
    type === 'iframe' ||
    type === 'embed'
  );
}

function focusElement(element: ?HTMLElement) {
  if (element != null) {
    try {
      element.focus();
    } catch (err) {}
  }
}

export function moveFocusInScope(
  scope: ReactEventComponentInstance,
  node: Element,
  backwards: boolean,
  options: FocusManagerOptions = {},
) {
  let elements = getFocusableElementsInScope(scope, !!options.tabbable, node);
  if (elements.length === 0) {
    return null;
  }

  const position = elements.indexOf(node);
  const lastPosition = elements.length - 1;
  let nextElement = null;

  if (backwards) {
    if (position === 0) {
      if (options.wrap) {
        nextElement = elements[lastPosition];
      } else {
        // Out of bounds
        return null;
      }
    } else {
      nextElement = elements[position - 1];
    }
  } else {
    if (position === lastPosition) {
      if (options.wrap) {
        nextElement = elements[0];
      } else {
        // Out of bounds
        return null;
      }
    } else {
      nextElement = elements[position + 1];
    }
  }

  if (nextElement) {
    focusElement(nextElement);
    return nextElement;
  }

  return null;
}

function moveFocus(options: FocusManagerOptions = {}, backwards: boolean) {
  let node = options.from;
  if (!node) {
    node = getActiveElement();
  }

  if (!node) {
    return;
  }

  let scope = findScope(node);
  if (!scope) {
    return null;
  }

  return moveFocusInScope(scope, node, backwards, options);
}

const FocusManager = {
  focusNext(options: FocusManagerOptions = {}) {
    return moveFocus(options, false);
  },
  focusPrevious(options: FocusManagerOptions = {}) {
    return moveFocus(options, true);
  },
};

export default FocusManager;
