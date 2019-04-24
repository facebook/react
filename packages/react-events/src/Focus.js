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
import {getEventCurrentTarget} from './utils.js';

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
    props: FocusProps,
    state: FocusState,
  ): void {
    const {type, target} = event;

    if (props.disabled) {
      if (state.isFocused) {
        dispatchFocusOutEvents(context, props, state);
        state.isFocused = false;
        state.focusTarget = null;
      }
      return;
    }

    switch (type) {
      case 'focus': {
        if (!state.isFocused) {
          // Limit focus events to the direct child of the event component.
          // Browser focus is not expected to bubble.
          state.focusTarget = getEventCurrentTarget(event, context);
          if (state.focusTarget === target) {
            dispatchFocusInEvents(context, props, state);
            state.isFocused = true;
          }
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
