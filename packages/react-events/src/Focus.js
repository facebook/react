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

const CAPTURE_PHASE = 2;

type FocusProps = {
  disabled: boolean,
  onBlur: (e: FocusEvent) => void,
  onFocus: (e: FocusEvent) => void,
  onFocusChange: boolean => void,
  stopPropagation: boolean,
};

type FocusState = {
  isFocused: boolean,
  focusTarget: null | Element | Document,
};

type FocusEventType = 'focus' | 'blur' | 'focuschange';

type FocusEvent = {|
  target: Element | Document,
  type: FocusEventType,
|};

const targetEventTypes = [
  {name: 'focus', passive: true, capture: true},
  {name: 'blur', passive: true, capture: true},
];

function createFocusEvent(
  type: FocusEventType,
  target: Element | Document,
): FocusEvent {
  return {
    target,
    type,
  };
}

function dispatchFocusInEvents(
  context: ReactResponderContext,
  props: FocusProps,
  state: FocusState,
) {
  const target = ((state.focusTarget: any): Element | Document);
  if (props.onFocus) {
    const syntheticEvent = createFocusEvent('focus', target);
    context.dispatchEvent(syntheticEvent, props.onFocus, {discrete: true});
  }
  if (props.onFocusChange) {
    const listener = () => {
      props.onFocusChange(true);
    };
    const syntheticEvent = createFocusEvent('focuschange', target);
    context.dispatchEvent(syntheticEvent, listener, {discrete: true});
  }
}

function dispatchFocusOutEvents(
  context: ReactResponderContext,
  props: FocusProps,
  state: FocusState,
) {
  const target = ((state.focusTarget: any): Element | Document);
  if (props.onBlur) {
    const syntheticEvent = createFocusEvent('blur', target);
    context.dispatchEvent(syntheticEvent, props.onBlur, {discrete: true});
  }
  if (props.onFocusChange) {
    const listener = () => {
      props.onFocusChange(false);
    };
    const syntheticEvent = createFocusEvent('focuschange', target);
    context.dispatchEvent(syntheticEvent, listener, {discrete: true});
  }
}

function unmountResponder(
  context: ReactResponderContext,
  props: FocusProps,
  state: FocusState,
): void {
  if (state.isFocused) {
    dispatchFocusOutEvents(context, props, state);
  }
}

const FocusResponder = {
  targetEventTypes,
  createInitialState(): FocusState {
    return {
      isFocused: false,
      focusTarget: null,
    };
  },
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: Object,
    state: FocusState,
  ): boolean {
    const {type, phase, target} = event;
    const shouldStopPropagation =
      props.stopPropagation === undefined ? true : props.stopPropagation;

    // Focus doesn't handle capture target events at this point
    if (phase === CAPTURE_PHASE) {
      return false;
    }
    switch (type) {
      case 'focus': {
        if (!state.isFocused) {
          // Limit focus events to the direct child of the event component.
          // Browser focus is not expected to bubble.
          let currentTarget = (target: any);
          if (
            currentTarget.parentNode &&
            context.isTargetWithinEventComponent(currentTarget.parentNode)
          ) {
            break;
          }
          state.focusTarget = currentTarget;
          dispatchFocusInEvents(context, props, state);
          state.isFocused = true;
        }
        break;
      }
      case 'blur': {
        if (state.isFocused) {
          dispatchFocusOutEvents(context, props, state);
          state.isFocused = false;
          state.focusTarget = null;
        }
        break;
      }
    }
    return shouldStopPropagation;
  },
  onUnmount(
    context: ReactResponderContext,
    props: FocusProps,
    state: FocusState,
  ) {
    unmountResponder(context, props, state);
  },
  onOwnershipChange(
    context: ReactResponderContext,
    props: FocusProps,
    state: FocusState,
  ) {
    unmountResponder(context, props, state);
  },
};

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName: 'Focus',
  props: null,
  responder: FocusResponder,
};
