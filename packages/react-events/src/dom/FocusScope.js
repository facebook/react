/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {
  ReactDOMEventResponder,
  ReactDOMResponderEvent,
  ReactDOMResponderContext,
  ReactDOMEventComponentInstance,
} from 'shared/ReactDOMTypes';
import type {Fiber} from 'react-reconciler/src/ReactFiber';

import React from 'react';
import {
  isFiberSuspenseAndTimedOut,
  getSuspenseFallbackChild,
} from 'react-reconciler/src/ReactFiberEvents';
import {HostComponent} from 'shared/ReactWorkTags';
import invariant from 'shared/invariant';

type FocusScopeProps = {
  autoFocus: boolean,
  contain: boolean,
  restoreFocus: boolean,
  getFocusManager: (focusManager: FocusManager) => void,
};

type FocusScopeState = {
  nodeToRestore: null | HTMLElement,
  currentFocusedNode: null | HTMLElement,
};

type FocusManagerOptions = {
  from?: HTMLElement,
  tabbable?: boolean,
  wrap?: boolean,
};

type FocusManager = {
  focusNext(opts: ?FocusManagerOptions): ?HTMLElement,
  focusPrevious(opts: ?FocusManagerOptions): ?HTMLElement,
};

const targetEventTypes = [{name: 'keydown', passive: false}];
const rootEventTypes = [{name: 'focus', passive: true}];

function getFocusableElementsInScope(
  eventComponentInstance: ReactDOMEventComponentInstance,
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

function moveFocusInScope(
  scope: ReactDOMEventComponentInstance,
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

function moveFocus(
  scope: ReactDOMEventComponentInstance,
  options: FocusManagerOptions = {},
  backwards: boolean,
) {
  let node = options.from;
  if (!node) {
    let doc = typeof document !== 'undefined' ? document : null;
    node = doc && doc.activeElement;
  }

  if (!node) {
    return;
  }

  return moveFocusInScope(scope, node, backwards, options);
}

function createFocusManager(
  scope: ReactDOMEventComponentInstance,
): FocusManager {
  return {
    focusNext(options: ?FocusManagerOptions) {
      return moveFocus(scope, options || {}, false);
    },
    focusPrevious(options: ?FocusManagerOptions) {
      return moveFocus(scope, options || {}, true);
    },
  };
}

function getFirstFocusableElement(
  context: ReactDOMResponderContext,
  state: FocusScopeState,
): ?HTMLElement {
  const elements = getFocusableElementsInScope(context.getCurrentInstance());
  if (elements.length > 0) {
    return elements[0];
  }
}

const FocusScopeResponder: ReactDOMEventResponder = {
  displayName: 'FocusScope',
  targetEventTypes,
  rootEventTypes,
  createInitialState(): FocusScopeState {
    return {
      nodeToRestore: null,
      currentFocusedNode: null,
    };
  },
  allowMultipleHostChildren: true,
  allowEventHooks: false,
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ) {
    const {type, nativeEvent} = event;

    if (type === 'keydown' && nativeEvent.key === 'Tab') {
      const focusedElement = context.getActiveDocument().activeElement;
      if (
        focusedElement !== null &&
        context.isTargetWithinEventComponent(focusedElement)
      ) {
        const {altkey, ctrlKey, metaKey, shiftKey} = (nativeEvent: any);
        // Skip if any of these keys are being pressed
        if (altkey || ctrlKey || metaKey) {
          return;
        }

        const nextElement = moveFocusInScope(
          context.getCurrentInstance(),
          focusedElement,
          shiftKey,
          {
            tabbable: true,
            wrap: props.contain,
          },
        );

        if (!nextElement) {
          context.continueLocalPropagation();
        } else {
          state.currentFocusedNode = nextElement;
          ((nativeEvent: any): KeyboardEvent).preventDefault();
        }
      }
    }
  },
  onRootEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ) {
    const {target} = event;

    // Handle global focus containment
    if (props.contain) {
      if (!context.isTargetWithinEventComponent(target)) {
        const currentFocusedNode = state.currentFocusedNode;
        if (currentFocusedNode !== null) {
          focusElement(currentFocusedNode);
        } else if (props.autoFocus) {
          const firstElement = getFirstFocusableElement(context, state);
          focusElement(firstElement);
        }
      }
    }
  },
  onMount(
    context: ReactDOMResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ): void {
    if (props.restoreFocus) {
      state.nodeToRestore = context.getActiveDocument().activeElement;
    }
    if (props.autoFocus) {
      const firstElement = getFirstFocusableElement(context, state);
      focusElement(firstElement);
    }
    if (props.getFocusManager) {
      props.getFocusManager(createFocusManager(context.getCurrentInstance()));
    }
  },
  onUnmount(
    context: ReactDOMResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ): void {
    if (props.restoreFocus && state.nodeToRestore !== null) {
      focusElement(state.nodeToRestore);
    }
  },
};

export const FocusScopeEventComponent = React.unstable_createEvent(
  FocusScopeResponder,
  'FocusScope',
);

const FocusScopeContext: React.Context<FocusManager> = React.createContext();

export function FocusScope(props: FocusScopeProps) {
  let internalFocusManager: ?FocusManager;
  let focusManager = React.useRef({
    focusNext(options: FocusManagerOptions = {}) {
      invariant(
        internalFocusManager != null,
        'Attempt to use a focus manager method on an unmounted component.',
      );
      return internalFocusManager.focusNext(options);
    },
    focusPrevious(options: FocusManagerOptions = {}) {
      invariant(
        internalFocusManager != null,
        'Attempt to use a focus manager method on an unmounted component.',
      );
      return internalFocusManager.focusPrevious(options);
    },
  });

  props = {
    ...props,
    getFocusManager(manager) {
      internalFocusManager = manager;
    },
  };

  return React.createElement(FocusScopeContext.Provider, {
    value: focusManager.current,
    children: React.createElement(FocusScopeEventComponent, props),
  });
}

export function useFocusManager(): FocusManager {
  let focusManager = React.useContext(FocusScopeContext);
  invariant(
    focusManager != null,
    'Tried to call useFocusManager outside of a FocusScope subtree.',
  );
  return focusManager;
}
