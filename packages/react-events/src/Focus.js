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
  event: ReactResponderEvent,
  context: ReactResponderContext,
  props: FocusProps,
) {
  const {nativeEvent, target} = event;
  if (context.isTargetWithinEventComponent((nativeEvent: any).relatedTarget)) {
    return;
  }
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
  event: ReactResponderEvent,
  context: ReactResponderContext,
  props: FocusProps,
) {
  const {nativeEvent, target} = event;
  if (context.isTargetWithinEventComponent((nativeEvent: any).relatedTarget)) {
    return;
  }
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

const FocusResponder = {
  targetEventTypes,
  createInitialState(): FocusState {
    return {
      isFocused: false,
    };
  },
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: Object,
    state: FocusState,
  ): void {
    const {type} = event;

    switch (type) {
      case 'focus': {
        if (!state.isFocused && !context.hasOwnership()) {
          dispatchFocusInEvents(event, context, props);
          state.isFocused = true;
        }
        break;
      }
      case 'blur': {
        if (state.isFocused) {
          dispatchFocusOutEvents(event, context, props);
          state.isFocused = false;
        }
        break;
      }
    }
  },
};

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName: 'Focus',
  props: null,
  responder: FocusResponder,
};
