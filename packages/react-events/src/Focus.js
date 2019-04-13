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

type FocusProps = {
  disabled: boolean,
  onBlur: (e: FocusEvent) => void,
  onFocus: (e: FocusEvent) => void,
  onFocusChange: boolean => void,
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
  event: null | ReactResponderEvent,
  context: ReactResponderContext,
  props: FocusProps,
  state: FocusState,
) {
  if (event != null) {
    const {nativeEvent} = event;
    if (
      context.isTargetWithinEventComponent((nativeEvent: any).relatedTarget)
    ) {
      return;
    }
  }
  if (props.onFocus) {
    const syntheticEvent = createFocusEvent(
      'focus',
      ((state.focusTarget: any): Element | Document),
    );
    context.dispatchEvent(syntheticEvent, props.onFocus, {discrete: true});
  }
  if (props.onFocusChange) {
    const listener = () => {
      props.onFocusChange(true);
    };
    const syntheticEvent = createFocusEvent(
      'focuschange',
      ((state.focusTarget: any): Element | Document),
    );
    context.dispatchEvent(syntheticEvent, listener, {discrete: true});
  }
}

function dispatchFocusOutEvents(
  event: null | ReactResponderEvent,
  context: ReactResponderContext,
  props: FocusProps,
  state: FocusState,
) {
  if (event != null) {
    const {nativeEvent} = event;
    if (
      context.isTargetWithinEventComponent((nativeEvent: any).relatedTarget)
    ) {
      return;
    }
  }
  if (props.onBlur) {
    const syntheticEvent = createFocusEvent(
      'blur',
      ((state.focusTarget: any): Element | Document),
    );
    context.dispatchEvent(syntheticEvent, props.onBlur, {discrete: true});
  }
  if (props.onFocusChange) {
    const listener = () => {
      props.onFocusChange(false);
    };
    const syntheticEvent = createFocusEvent(
      'focuschange',
      ((state.focusTarget: any): Element | Document),
    );
    context.dispatchEvent(syntheticEvent, listener, {discrete: true});
  }
}

function unmountResponder(
  context: ReactResponderContext,
  props: FocusProps,
  state: FocusState,
): void {
  if (state.isFocused) {
    dispatchFocusOutEvents(null, context, props, state);
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
  ): void {
    const {type, target} = event;

    switch (type) {
      case 'focus': {
        if (!state.isFocused && !context.hasOwnership()) {
          state.focusTarget = target;
          dispatchFocusInEvents(event, context, props, state);
          state.isFocused = true;
        }
        break;
      }
      case 'blur': {
        if (state.isFocused) {
          dispatchFocusOutEvents(event, context, props, state);
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
