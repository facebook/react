/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {TabbableScope} from './TabbableScope';
import {useKeyboard} from 'react-events/keyboard';

type TabFocusControllerProps = {
  children: React.Node,
  contain?: boolean,
};

type KeyboardEventType = 'keydown' | 'keyup';

type KeyboardEvent = {|
  altKey: boolean,
  ctrlKey: boolean,
  isComposing: boolean,
  key: string,
  metaKey: boolean,
  shiftKey: boolean,
  target: Element | Document,
  type: KeyboardEventType,
  timeStamp: number,
  defaultPrevented: boolean,
|};

type ControllerHandle = {|
  focusFirst: () => void,
  focusNext: () => boolean,
  focusPrevious: () => boolean,
  getNextController: () => null | ControllerHandle,
  getPreviousController: () => null | ControllerHandle,
|};

const {useImperativeHandle, useRef} = React;

function getTabbableNodes(scopeRef) {
  const tabbableScope = scopeRef.current;
  const tabbableNodes = tabbableScope.getScopedNodes();
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

export const TabFocusController = React.forwardRef(
  ({children, contain}: TabFocusControllerProps, ref): React.Node => {
    const scopeRef = useRef(null);
    const keyboard = useKeyboard({
      onKeyDown(event: KeyboardEvent): boolean {
        if (event.key !== 'Tab') {
          return true;
        }
        if (event.shiftKey) {
          return focusPrevious();
        } else {
          return focusNext();
        }
      },
      preventKeys: ['Tab', ['Tab', {shiftKey: true}]],
    });

    function focusFirst(): void {
      const [, firstTabbableElem] = getTabbableNodes(scopeRef);
      firstTabbableElem.focus();
    }

    function focusNext(): boolean {
      const [
        tabbableNodes,
        firstTabbableElem,
        lastTabbableElem,
        currentIndex,
        focusedElement,
      ] = getTabbableNodes(scopeRef);

      if (focusedElement === null) {
        firstTabbableElem.focus();
      } else if (focusedElement === lastTabbableElem) {
        if (contain === true) {
          firstTabbableElem.focus();
        } else {
          return true;
        }
      } else {
        tabbableNodes[currentIndex + 1].focus();
      }
      return false;
    }

    function focusPrevious(): boolean {
      const [
        tabbableNodes,
        firstTabbableElem,
        lastTabbableElem,
        currentIndex,
        focusedElement,
      ] = getTabbableNodes(scopeRef);

      if (focusedElement === null) {
        firstTabbableElem.focus();
      } else if (focusedElement === firstTabbableElem) {
        if (contain === true) {
          lastTabbableElem.focus();
        } else {
          return true;
        }
      } else {
        tabbableNodes[currentIndex - 1].focus();
      }
      return false;
    }

    function getPreviousController(): null | ControllerHandle {
      const tabbableScope = scopeRef.current;
      const allScopes = tabbableScope.getChildrenFromRoot();
      if (allScopes === null) {
        return null;
      }
      const currentScopeIndex = allScopes.indexOf(tabbableScope);
      if (currentScopeIndex <= 0) {
        return null;
      }
      return allScopes[currentScopeIndex - 1].getHandle();
    }

    function getNextController(): null | ControllerHandle {
      const tabbableScope = scopeRef.current;
      const allScopes = tabbableScope.getChildrenFromRoot();
      if (allScopes === null) {
        return null;
      }
      const currentScopeIndex = allScopes.indexOf(tabbableScope);
      if (
        currentScopeIndex === -1 ||
        currentScopeIndex === allScopes.length - 1
      ) {
        return null;
      }
      return allScopes[currentScopeIndex + 1].getHandle();
    }

    const controllerHandle: ControllerHandle = {
      focusFirst,
      focusNext,
      focusPrevious,
      getNextController,
      getPreviousController,
    };

    useImperativeHandle(ref, () => controllerHandle);

    return (
      <TabbableScope
        ref={scopeRef}
        handle={controllerHandle}
        listeners={keyboard}>
        {children}
      </TabbableScope>
    );
  },
);
