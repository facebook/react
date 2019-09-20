/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactScopeMethods} from 'shared/ReactTypes';
import type {KeyboardEvent} from 'react-ui/events/keyboard';

import React from 'react';
import {TabbableScope} from 'react-ui/accessibility/tabbable-scope';
import {useKeyboard} from 'react-ui/events/keyboard';

type TabFocusControllerProps = {
  children: React.Node,
  contain?: boolean,
};

const {useRef} = React;

function getTabbableNodes(scope: ReactScopeMethods) {
  const tabbableNodes = scope.getScopedNodes();
  if (tabbableNodes === null || tabbableNodes.length === 0) {
    return [null, null, null, 0, null];
  }
  const firstTabbableElem = tabbableNodes[0];
  const lastTabbableElem = tabbableNodes[tabbableNodes.length - 1];
  const currentIndex = tabbableNodes.indexOf(document.activeElement);
  let focusedElement = null;
  if (currentIndex !== -1) {
    focusedElement = tabbableNodes[currentIndex];
  }
  return [
    tabbableNodes,
    firstTabbableElem,
    lastTabbableElem,
    currentIndex,
    focusedElement,
  ];
}

export function focusFirst(scope: ReactScopeMethods): void {
  const [, firstTabbableElem] = getTabbableNodes(scope);
  focusElem(firstTabbableElem);
}

function focusElem(elem: null | HTMLElement): void {
  if (elem !== null) {
    elem.focus();
  }
}

function internalFocusNext(
  scope: ReactScopeMethods,
  event?: KeyboardEvent,
  contain?: boolean,
): void {
  const [
    tabbableNodes,
    firstTabbableElem,
    lastTabbableElem,
    currentIndex,
    focusedElement,
  ] = getTabbableNodes(scope);

  if (focusedElement === null) {
    if (event) {
      event.continuePropagation();
    }
  } else if (focusedElement === lastTabbableElem) {
    if (contain) {
      focusElem(firstTabbableElem);
      if (event) {
        event.preventDefault();
      }
    } else if (event) {
      event.continuePropagation();
    }
  } else {
    focusElem((tabbableNodes: any)[currentIndex + 1]);
    if (event) {
      event.preventDefault();
    }
  }
}

function internalFocusPrevious(
  scope: ReactScopeMethods,
  event?: KeyboardEvent,
  contain?: boolean,
): void {
  const [
    tabbableNodes,
    firstTabbableElem,
    lastTabbableElem,
    currentIndex,
    focusedElement,
  ] = getTabbableNodes(scope);

  if (focusedElement === null) {
    if (event) {
      event.continuePropagation();
    }
  } else if (focusedElement === firstTabbableElem) {
    if (contain) {
      focusElem(lastTabbableElem);
      if (event) {
        event.preventDefault();
      }
    } else if (event) {
      event.continuePropagation();
    }
  } else {
    focusElem((tabbableNodes: any)[currentIndex - 1]);
    if (event) {
      event.preventDefault();
    }
  }
}

export function focusPrevious(scope: ReactScopeMethods): void {
  internalFocusPrevious(scope);
}

export function focusNext(scope: ReactScopeMethods): void {
  internalFocusNext(scope);
}

export function getNextController(
  scope: ReactScopeMethods,
): null | ReactScopeMethods {
  const allScopes = scope.getChildrenFromRoot();
  if (allScopes === null) {
    return null;
  }
  const currentScopeIndex = allScopes.indexOf(scope);
  if (currentScopeIndex === -1 || currentScopeIndex === allScopes.length - 1) {
    return null;
  }
  return allScopes[currentScopeIndex + 1];
}

export function getPreviousController(
  scope: ReactScopeMethods,
): null | ReactScopeMethods {
  const allScopes = scope.getChildrenFromRoot();
  if (allScopes === null) {
    return null;
  }
  const currentScopeIndex = allScopes.indexOf(scope);
  if (currentScopeIndex <= 0) {
    return null;
  }
  return allScopes[currentScopeIndex - 1];
}

export const TabFocusController = React.forwardRef(
  ({children, contain}: TabFocusControllerProps, ref): React.Node => {
    const scopeRef = useRef(null);
    const keyboard = useKeyboard({
      onKeyDown(event: KeyboardEvent): void {
        if (event.key !== 'Tab') {
          event.continuePropagation();
          return;
        }
        const scope = scopeRef.current;
        if (scope !== null) {
          if (event.shiftKey) {
            internalFocusPrevious(scope, event, contain);
          } else {
            internalFocusNext(scope, event, contain);
          }
        }
      },
    });

    return (
      <TabbableScope
        ref={node => {
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else {
              ref.current = node;
            }
          }
          scopeRef.current = node;
        }}
        listeners={keyboard}>
        {children}
      </TabbableScope>
    );
  },
);
