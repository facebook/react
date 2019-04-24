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
import {
  REACT_EVENT_COMPONENT_TYPE,
  REACT_EVENT_FOCUS_SCOPE_TARGET,
} from 'shared/ReactSymbols';

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
  const eventTargets = context.getEventTargetsWithinEventComponent();
  if (eventTargets.length > 0) {
    const firstEventTarget = eventTargets[0];
    const elem = ((firstEventTarget.node: any): HTMLElement);
    elem.focus();
    state.currentFocusedNode = elem;
  }
}

function focusLastChildEventTarget(
  context: ReactResponderContext,
  state: FocusScopeState,
): void {
  const eventTargets = context.getEventTargetsWithinEventComponent();
  const length = eventTargets.length;
  if (length > 0) {
    const lastEventTarget = eventTargets[length - 1];
    const elem = ((lastEventTarget.node: any): HTMLElement);
    elem.focus();
    state.currentFocusedNode = elem;
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

    if (props.trap) {
      if (type === 'focus') {
        if (context.isTargetWithinEventComponent(target)) {
          if (context.isTargetDirectlyWithinEventTarget(target)) {
            state.currentFocusedNode = ((target: any): HTMLElement);
          } else {
            if (state.currentFocusedNode !== null) {
              state.currentFocusedNode.focus();
            } else {
              focusFirstChildEventTarget(context, state);
            }
          }
        }
      } else if (type === 'keydown' && nativeEvent.key === 'Tab') {
        const currentFocusedNode = state.currentFocusedNode;
        if (currentFocusedNode !== null) {
          if (nativeEvent.shiftKey) {
            if (context.isTargetFirstEventTargetOfScope(currentFocusedNode)) {
              focusLastChildEventTarget(context, state);
            } else {
              const previousTarget = context.getPreviousEventTargetFromTarget(
                currentFocusedNode,
                REACT_EVENT_FOCUS_SCOPE_TARGET,
              );

              if (previousTarget !== null) {
                const elem = ((previousTarget.node: any): HTMLElement);
                elem.focus();
                state.currentFocusedNode = elem;
              }
            }
          } else if (
            context.isTargetLastEventTargetOfScope(currentFocusedNode)
          ) {
            focusFirstChildEventTarget(context, state);
          } else {
            const nextTarget = context.getNextEventTargetFromTarget(
              currentFocusedNode,
              REACT_EVENT_FOCUS_SCOPE_TARGET,
            );

            if (nextTarget !== null) {
              const elem = ((nextTarget.node: any): HTMLElement);
              elem.focus();
              state.currentFocusedNode = elem;
            }
          }
          ((nativeEvent: any): KeyboardEvent).preventDefault();
        }
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
