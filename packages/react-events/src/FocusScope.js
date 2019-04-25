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

const rootEventTypes = [
  {name: 'focus', passive: true, capture: true},
  {name: 'keydown', passive: false},
];

function focusFirstChildEventTarget(
  context: ReactResponderContext,
  state: FocusScopeState,
): void {
  const elements = context.getFocusableElementsInScope();
  if (elements.length > 0) {
    const firstElement = elements[0];
    firstElement.focus();
    state.currentFocusedNode = firstElement;
  }
}

function focusLastChildEventTarget(
  context: ReactResponderContext,
  state: FocusScopeState,
): void {
  const elements = context.getFocusableElementsInScope();
  const length = elements.length;
  if (elements.length > 0) {
    const lastElement = elements[length - 1];
    lastElement.focus();
    state.currentFocusedNode = lastElement;
  }
}

const FocusScopeResponder = {
  rootEventTypes,
  createInitialState(): FocusScopeState {
    return {
      nodeToRestore: null,
      currentFocusedNode: null,
    };
  },
  onRootEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ) {
    const {type, target, nativeEvent} = event;

    if (type === 'focus') {
      if (context.isTargetWithinEventComponent(target)) {
        state.currentFocusedNode = ((target: any): HTMLElement);
      } else if (props.trap) {
        if (state.currentFocusedNode !== null) {
          state.currentFocusedNode.focus();
        } else {
          focusFirstChildEventTarget(context, state);
        }
      }
    } else if (type === 'keydown' && nativeEvent.key === 'Tab') {
      const currentFocusedNode = state.currentFocusedNode;
      if (currentFocusedNode !== null) {
        const {altkey, ctrlKey, metaKey, shiftKey} = (nativeEvent: any);
        // Skip if any of these keys are being pressed
        if (altkey || ctrlKey || metaKey) {
          return;
        }
        const elements = context.getFocusableElementsInScope();
        const position = elements.indexOf(currentFocusedNode);
        if (shiftKey) {
          if (position === 0) {
            if (props.trap) {
              focusLastChildEventTarget(context, state);
            } else {
              return;
            }
          } else {
            const previousElement = elements[position - 1];
            previousElement.focus();
            state.currentFocusedNode = previousElement;
          }
        } else {
          if (position === elements.length - 1) {
            if (props.trap) {
              focusFirstChildEventTarget(context, state);
            } else {
              return;
            }
          } else {
            const nextElement = elements[position + 1];
            nextElement.focus();
            state.currentFocusedNode = nextElement;
          }
        }
        ((nativeEvent: any): KeyboardEvent).preventDefault();
      }
    }
  },
  onMount(
    context: ReactResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ) {
    if (props.restoreFocus) {
      state.nodeToRestore = document.activeElement;
    }
    if (props.autoFocus) {
      focusFirstChildEventTarget(context, state);
    }
  },
  onUnmount(
    context: ReactResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ) {
    if (props.restoreFocus && state.nodeToRestore !== null) {
      state.nodeToRestore.focus();
    }
  },
  onOwnershipChange(
    context: ReactResponderContext,
    props: FocusScopeProps,
    state: FocusScopeState,
  ) {
    // unmountResponder(context, props, state);
  },
};

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName: 'FocusScope',
  props: null,
  responder: FocusScopeResponder,
};
