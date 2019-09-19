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

export function focusNext(
  scope: ReactScopeMethods,
  contain?: boolean,
): boolean {
  const [
    tabbableNodes,
    firstTabbableElem,
    lastTabbableElem,
    currentIndex,
    focusedElement,
  ] = getTabbableNodes(scope);

  if (focusedElement === null) {
    focusElem(firstTabbableElem);
  } else if (focusedElement === lastTabbableElem) {
    if (contain === true) {
      focusElem(firstTabbableElem);
    } else {
      return true;
    }
  } else {
    focusElem((tabbableNodes: any)[currentIndex + 1]);
  }
  return false;
}

export function focusPrevious(
  scope: ReactScopeMethods,
  contain?: boolean,
): boolean {
  const [
    tabbableNodes,
    firstTabbableElem,
    lastTabbableElem,
    currentIndex,
    focusedElement,
  ] = getTabbableNodes(scope);

  if (focusedElement === null) {
    focusElem(firstTabbableElem);
  } else if (focusedElement === firstTabbableElem) {
    if (contain === true) {
      focusElem(lastTabbableElem);
    } else {
      return true;
    }
  } else {
    focusElem((tabbableNodes: any)[currentIndex - 1]);
  }
  return false;
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
      onKeyDown(event: KeyboardEvent): boolean {
        if (event.key !== 'Tab') {
          return true;
        }
        const scope = scopeRef.current;
        if (scope !== null) {
          if (event.shiftKey) {
            return focusPrevious(scope, contain);
          } else {
            return focusNext(scope, contain);
          }
        }
        return true;
      },
      preventKeys: ['Tab', ['Tab', {shiftKey: true}]],
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
