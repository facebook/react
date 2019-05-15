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

import React from 'react';

type FocusProps = {
  disabled: boolean,
  onBlur: (e: FocusEvent) => void,
  onFocus: (e: FocusEvent) => void,
  onFocusChange: boolean => void,
  onFocusVisibleChange: boolean => void,
};

type FocusState = {
  focusTarget: null | Element | Document,
  isFocused: boolean,
  isLocalFocusVisible: boolean,
  pointerType: PointerType,
};

type PointerType = '' | 'mouse' | 'keyboard' | 'pen' | 'touch';
type FocusEventType = 'focus' | 'blur' | 'focuschange' | 'focusvisiblechange';

type FocusEvent = {|
  target: Element | Document,
  type: FocusEventType,
  pointerType: PointerType,
  timeStamp: number,
|};

const targetEventTypes = [
  {name: 'focus', passive: true},
  {name: 'blur', passive: true},
];

const rootEventTypes = [
  'keydown',
  'keypress',
  'keyup',
  'pointermove',
  'pointerdown',
  'pointerup',
];

// If PointerEvents is not supported (e.g., Safari), also listen to touch and mouse events.
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  rootEventTypes.push(
    'mousemove',
    'mousedown',
    'mouseup',
    'touchmove',
    'touchstart',
    'touchend',
  );
}

function createFocusEvent(
  context: ReactResponderContext,
  type: FocusEventType,
  target: Element | Document,
  pointerType: PointerType,
): FocusEvent {
  return {
    target,
    type,
    pointerType,
    timeStamp: context.getTimeStamp(),
  };
}

function dispatchFocusInEvents(
  context: ReactResponderContext,
  props: FocusProps,
  state: FocusState,
) {
  const pointerType = state.pointerType;
  const target = ((state.focusTarget: any): Element | Document);
  if (props.onFocus) {
    const syntheticEvent = createFocusEvent(
      context,
      'focus',
      target,
      pointerType,
    );
    context.dispatchEvent(syntheticEvent, props.onFocus, {discrete: true});
  }
  if (props.onFocusChange) {
    const listener = () => {
      props.onFocusChange(true);
    };
    const syntheticEvent = createFocusEvent(
      context,
      'focuschange',
      target,
      pointerType,
    );
    context.dispatchEvent(syntheticEvent, listener, {discrete: true});
  }
  if (props.onFocusVisibleChange && state.isLocalFocusVisible) {
    const listener = () => {
      props.onFocusVisibleChange(true);
    };
    const syntheticEvent = createFocusEvent(
      context,
      'focusvisiblechange',
      target,
      pointerType,
    );
    context.dispatchEvent(syntheticEvent, listener, {discrete: true});
  }
}

function dispatchFocusOutEvents(
  context: ReactResponderContext,
  props: FocusProps,
  state: FocusState,
) {
  const pointerType = state.pointerType;
  const target = ((state.focusTarget: any): Element | Document);
  if (props.onBlur) {
    const syntheticEvent = createFocusEvent(
      context,
      'blur',
      target,
      pointerType,
    );
    context.dispatchEvent(syntheticEvent, props.onBlur, {discrete: true});
  }
  if (props.onFocusChange) {
    const listener = () => {
      props.onFocusChange(false);
    };
    const syntheticEvent = createFocusEvent(
      context,
      'focuschange',
      target,
      pointerType,
    );
    context.dispatchEvent(syntheticEvent, listener, {discrete: true});
  }
  dispatchFocusVisibleOutEvent(context, props, state);
}

function dispatchFocusVisibleOutEvent(
  context: ReactResponderContext,
  props: FocusProps,
  state: FocusState,
) {
  const pointerType = state.pointerType;
  const target = ((state.focusTarget: any): Element | Document);
  if (props.onFocusVisibleChange && state.isLocalFocusVisible) {
    const listener = () => {
      props.onFocusVisibleChange(false);
    };
    const syntheticEvent = createFocusEvent(
      context,
      'focusvisiblechange',
      target,
      pointerType,
    );
    context.dispatchEvent(syntheticEvent, listener, {discrete: true});
    state.isLocalFocusVisible = false;
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

function handleRootPointerEvent(
  event: ReactResponderEvent,
  context: ReactResponderContext,
  props: FocusProps,
  state: FocusState,
): void {
  const {type, target} = event;
  // Ignore a Safari quirks where 'mousemove' is dispatched on the 'html'
  // element when the window blurs.
  if (type === 'mousemove' && target.nodeName === 'HTML') {
    return;
  }

  isGlobalFocusVisible = false;

  // Focus should stop being visible if a pointer is used on the element
  // after it was focused using a keyboard.
  if (
    state.focusTarget === context.getEventCurrentTarget(event) &&
    (type === 'mousedown' || type === 'touchstart' || type === 'pointerdown')
  ) {
    dispatchFocusVisibleOutEvent(context, props, state);
  }
}

let isGlobalFocusVisible = true;

const FocusResponder = {
  targetEventTypes,
  rootEventTypes,
  createInitialState(): FocusState {
    return {
      focusTarget: null,
      isFocused: false,
      isLocalFocusVisible: false,
      pointerType: '',
    };
  },
  stopLocalPropagation: true,
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
          state.focusTarget = context.getEventCurrentTarget(event);
          if (state.focusTarget === target) {
            state.isFocused = true;
            state.isLocalFocusVisible = isGlobalFocusVisible;
            dispatchFocusInEvents(context, props, state);
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
  onRootEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: FocusProps,
    state: FocusState,
  ): void {
    const {type} = event;

    switch (type) {
      case 'mousemove':
      case 'mousedown':
      case 'mouseup': {
        state.pointerType = 'mouse';
        handleRootPointerEvent(event, context, props, state);
        break;
      }
      case 'pointermove':
      case 'pointerdown':
      case 'pointerup': {
        // $FlowFixMe: Flow doesn't know about PointerEvents
        const nativeEvent = ((event.nativeEvent: any): PointerEvent);
        state.pointerType = nativeEvent.pointerType;
        handleRootPointerEvent(event, context, props, state);
        break;
      }
      case 'touchmove':
      case 'touchstart':
      case 'touchend': {
        state.pointerType = 'touch';
        handleRootPointerEvent(event, context, props, state);
        break;
      }

      case 'keydown':
      case 'keypress':
      case 'keyup': {
        const nativeEvent = event.nativeEvent;
        if (
          nativeEvent.key === 'Tab' &&
          !(nativeEvent.metaKey || nativeEvent.altKey || nativeEvent.ctrlKey)
        ) {
          state.pointerType = 'keyboard';
          isGlobalFocusVisible = true;
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

export default React.unstable_createEventComponent(FocusResponder, 'Focus');
