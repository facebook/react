/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactScope} from 'shared/ReactTypes';
import type {KeyboardEvent} from 'react-interactions/events/keyboard';

import React from 'react';
import {useKeyboard} from 'react-interactions/events/keyboard';
import {
  focusPrevious,
  focusNext,
} from 'react-interactions/accessibility/focus-control';

type TabFocusProps = {
  children: React.Node,
  contain?: boolean,
  scope: ReactScope,
};

const {useRef} = React;

const TabFocus = React.forwardRef(
  ({children, contain, scope: Scope}: TabFocusProps, ref): React.Node => {
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
            focusPrevious(scope, event, contain);
          } else {
            focusNext(scope, event, contain);
          }
        }
      },
    });

    return (
      <Scope
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
      </Scope>
    );
  },
);

export default TabFocus;
