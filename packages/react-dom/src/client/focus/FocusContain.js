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

const {useRef} = React;

export function FocusContain({children}) {
  const scopeRef = useRef(null);
  const keyboard = useKeyboard({onKeyDown});

  function onKeyDown(event) {
    if (event.key !== 'Tab') {
      return;
    }
    const tabbableScope = scopeRef.current;
    const tabbableNodes = tabbableScope.getScopedNodes();
    const currentIndex = tabbableNodes.indexOf(document.activeElement);
    const firstTabbableElem = tabbableNodes[0];
    const lastTabbableElem = tabbableNodes[tabbableNodes.length - 1];

    // We want to wrap focus back to start/end depending if
    // shift is pressed when tabbing.
    if (currentIndex === -1) {
      firstTabbableElem.focus();
    } else {
      const focusedElement = tabbableNodes[currentIndex];
      if (event.shiftKey) {
        if (focusedElement === firstTabbableElem) {
          lastTabbableElem.focus();
        } else {
          tabbableNodes[currentIndex - 1].focus();
        }
      } else {
        if (focusedElement === lastTabbableElem) {
          firstTabbableElem.focus();
        } else {
          tabbableNodes[currentIndex + 1].focus();
        }
      }
    }
  }

  return (
    <TabbableScope ref={scopeRef} listeners={keyboard}>
      {children}
    </TabbableScope>
  );
}
