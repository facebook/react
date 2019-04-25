/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactResponderEvent,
  ReactResponderContext,
} from 'shared/ReactTypes';
import {REACT_EVENT_COMPONENT_TYPE} from 'shared/ReactSymbols';

type FocusScopeProps = {
  autoFocus: Boolean,
  restoreFocus: Boolean,
  trap: Boolean,
};

type FocusScopeState = {
  nodeToRestore: null | HTMLElement,
  currentFocusedNode: null | HTMLElement,
};

const targetEventTypes = [{name: 'keydown', passive: false}];
const rootEventTypes = [{name: 'focus', passive: true, capture: true}];

function focusFirstChildEventTarget(
  context: ReactResponderContext,
  state: FocusScopeState,
): void {
  const elements = context.getFocusableElementsInScope();
  if (elements.length > 0) {
    const firstElement = elements[0];
    firstElement.focus();
  }
}

const FocusScopeResponder = {
  targetEventTypes,
  rootEventTypes,
  createInitialState(): FocusScopeState {
    return {
      nodeToRestore: null,
      currentFocusedNode: null,
    };
  },
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ) {
    const {type, nativeEvent} = event;
    const hasOwnership =
      context.hasOwnership() || context.requestResponderOwnership();

    if (!hasOwnership) {
      return;
    }
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
        const elements = context.getFocusableElementsInScope();
        const position = elements.indexOf(focusedElement);
        const lastPosition = elements.length - 1;
        let nextElement = null;

        if (shiftKey) {
          if (position === 0) {
            if (props.trap) {
              nextElement = elements[lastPosition];
            } else {
              // Out of bounds
              context.releaseOwnership();
              return;
            }
          } else {
            nextElement = elements[position - 1];
          }
        } else {
          if (position === lastPosition) {
            if (props.trap) {
              nextElement = elements[0];
            } else {
              // Out of bounds
              context.releaseOwnership();
              return;
            }
          } else {
            nextElement = elements[position + 1];
          }
        }
        // If this element is possibly inside the scope of another
        // FocusScope responder or is out of bounds, then we release ownership.
        if (nextElement !== null) {
          if (!context.isTargetWithinEventResponderScope(nextElement)) {
            context.releaseOwnership();
          }
          nextElement.focus();
          state.currentFocusedNode = nextElement;
          ((nativeEvent: any): KeyboardEvent).preventDefault();
        }
      }
    }
  },
  onRootEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ) {
    const {target} = event;

    // Handle global trapping
    if (props.trap) {
      if (!context.isTargetWithinEventComponent(target)) {
        const currentFocusedNode = state.currentFocusedNode;
        if (currentFocusedNode !== null) {
          currentFocusedNode.focus();
        } else if (props.autoFocus) {
          focusFirstChildEventTarget(context, state);
        }
      }
    }
  },
  onMount(
    context: ReactResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ): void {
    if (props.restoreFocus) {
      state.nodeToRestore = context.getActiveDocument().activeElement;
    }
    if (props.autoFocus) {
      focusFirstChildEventTarget(context, state);
    }
  },
  onUnmount(
    context: ReactResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ): void {
    if (
      props.restoreFocus &&
      state.nodeToRestore !== null &&
      context.hasOwnership()
    ) {
      state.nodeToRestore.focus();
    }
  },
  onOwnershipChange(
    context: ReactResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ): void {
    if (!context.hasOwnership()) {
      state.currentFocusedNode = null;
    }
  },
};

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName: 'FocusScope',
  props: null,
  responder: FocusScopeResponder,
};
