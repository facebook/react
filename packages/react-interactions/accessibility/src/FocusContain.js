/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {KeyboardEvent} from 'react-interactions/events/keyboard';

import React from 'react';
import {useFocusWithin} from 'react-interactions/events/focus';
import {useKeyboard} from 'react-interactions/events/keyboard';
import {
  focusPrevious,
  focusNext,
} from 'react-interactions/accessibility/focus-manager';

type FocusContainProps = {|
  children: React.Node,
  disabled?: boolean,
  scopeQuery: (type: string | Object, props: Object) => boolean,
|};

const {useLayoutEffect, useRef} = React;

const FocusContainScope = React.unstable_createScope();

export default function FocusContain({
  children,
  disabled,
  scopeQuery,
}: FocusContainProps): React.Node {
  const scopeRef = useRef(null);
  // This ensures tabbing works through the React tree (including Portals and Suspense nodes)
  const keyboard = useKeyboard({
    onKeyDown(event: KeyboardEvent): void {
      if (disabled === true || event.key !== 'Tab') {
        event.continuePropagation();
        return;
      }
      const scope = scopeRef.current;
      if (scope !== null) {
        if (event.shiftKey) {
          focusPrevious(scopeQuery, scope, event, true);
        } else {
          focusNext(scopeQuery, scope, event, true);
        }
      }
    },
  });
  const focusWithin = useFocusWithin({
    onBlurWithin: function(event) {
      if (disabled === true) {
        event.continuePropagation();
        return;
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
      if (
        scope !== null &&
        disabled !== true &&
        !scope.containsNode(document.activeElement)
      ) {
        const fistElem = scope.queryFirstNode(scopeQuery);
        if (fistElem !== null) {
          fistElem.focus();
        }
      }
    },
    [disabled],
  );

  return (
    <FocusContainScope
      ref={scopeRef}
      DEPRECATED_flareListeners={[keyboard, focusWithin]}>
      {children}
    </FocusContainScope>
  );
}
