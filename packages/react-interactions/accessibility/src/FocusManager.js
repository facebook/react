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
import {useFocusWithin} from 'react-interactions/events/focus';
import {
  focusFirst,
  focusPrevious,
  focusNext,
} from 'react-interactions/accessibility/focus-control';
import TabbableScope from 'react-interactions/accessibility/tabbable-scope';

type TabFocusProps = {|
  autoFocus?: boolean,
  children: React.Node,
  containFocus?: boolean,
  restoreFocus?: boolean,
  scope: ReactScope,
|};

const {useLayoutEffect, useRef} = React;

const FocusManager = React.forwardRef(
  (
    {
      autoFocus,
      children,
      containFocus,
      restoreFocus,
      scope: CustomScope,
    }: TabFocusProps,
    ref,
  ): React.Node => {
    const ScopeToUse = CustomScope || TabbableScope;
    const scopeRef = useRef(null);
    // This ensures tabbing works through the React tree (including Portals and Suspense nodes)
    const keyboard = useKeyboard({
      onKeyDown(event: KeyboardEvent): void {
        if (event.key !== 'Tab') {
          event.continuePropagation();
          return;
        }
        const scope = scopeRef.current;
        if (scope !== null) {
          if (event.shiftKey) {
            focusPrevious(scope, event, containFocus);
          } else {
            focusNext(scope, event, containFocus);
          }
        }
      },
    });
    const focusWithin = useFocusWithin({
      onBlurWithin: function(event) {
        if (!containFocus) {
          event.continuePropagation();
        }
        const lastNode = event.target;
        if (lastNode) {
          requestAnimationFrame(() => {
            (lastNode: any).focus();
          });
        }
      },
    });
    useLayoutEffect(
      () => {
        const scope = scopeRef.current;
        let restoreElem;
        if (restoreFocus) {
          restoreElem = document.activeElement;
        }
        if (autoFocus && scope !== null) {
          focusFirst(scope);
        }
        if (restoreElem) {
          return () => {
            (restoreElem: any).focus();
          };
        }
      },
      [scopeRef],
    );

    return (
      <ScopeToUse
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
        listeners={[keyboard, focusWithin]}>
        {children}
      </ScopeToUse>
    );
  },
);

export default FocusManager;
