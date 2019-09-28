/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactDOMResponderEvent,
  ReactDOMResponderContext,
  PointerType,
} from 'shared/ReactDOMTypes';
import type {ReactEventResponderListener} from 'shared/ReactTypes';

import React from 'react';
import {DiscreteEvent} from 'shared/ReactTypes';

/**
 * Types
 */

type FocusEvent = {|
  target: Element | Document,
  type: FocusEventType | FocusWithinEventType,
  pointerType: PointerType,
  timeStamp: number,
  continuePropagation: () => void,
|};

type FocusState = {
  focusTarget: null | Element | Document,
  isFocused: boolean,
  isFocusVisible: boolean,
  pointerType: PointerType,
  isEmulatingMouseEvents: boolean,
};

type FocusProps = {
  disabled: boolean,
  onBlur: (e: FocusEvent) => void,
  onFocus: (e: FocusEvent) => void,
  onFocusChange: boolean => void,
  onFocusVisibleChange: boolean => void,
};

type FocusEventType = 'focus' | 'blur' | 'focuschange' | 'focusvisiblechange';

type FocusWithinProps = {
  disabled?: boolean,
  onBlurWithin?: (e: FocusEvent) => void,
  onFocusWithinChange?: boolean => void,
  onFocusWithinVisibleChange?: boolean => void,
};

type FocusWithinEventType =
  | 'focuswithinvisiblechange'
  | 'focuswithinchange'
  | 'blurwithin';

/**
 * Shared between Focus and FocusWithin
 */

let isGlobalFocusVisible = true;

const isMac =
  typeof window !== 'undefined' && window.navigator != null
    ? /^Mac/.test(window.navigator.platform)
    : false;

const targetEventTypes = ['focus', 'blur'];

const hasPointerEvents =
  typeof window !== 'undefined' && window.PointerEvent != null;

const rootEventTypes = hasPointerEvents
  ? ['keydown', 'keyup', 'pointermove', 'pointerdown', 'pointerup']
  : ['keydown', 'keyup', 'mousedown', 'touchmove', 'touchstart', 'touchend'];

function isFunction(obj): boolean {
  return typeof obj === 'function';
}

function createFocusEvent(
  context: ReactDOMResponderContext,
  type: FocusEventType | FocusWithinEventType,
  target: Element | Document,
  pointerType: PointerType,
): FocusEvent {
  return {
    target,
    type,
    pointerType,
    timeStamp: context.getTimeStamp(),
    // We don't use stopPropagation, as the default behavior
    // is to not propagate. Plus, there might be confusion
    // using stopPropagation as we don't actually stop
    // native propagation from working, but instead only
    // allow propagation to the others keyboard responders.
    continuePropagation() {
      context.continuePropagation();
    },
  };
}

function handleRootPointerEvent(
  event: ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  state: FocusState,
  callback: boolean => void,
): void {
  const {type} = event;
  isGlobalFocusVisible = false;

  // Focus should stop being visible if a pointer is used on the element
  // after it was focused using a keyboard.
  const focusTarget = state.focusTarget;
  if (
    focusTarget !== null &&
    context.isTargetWithinResponderScope(focusTarget) &&
    (type === 'mousedown' || type === 'touchstart' || type === 'pointerdown')
  ) {
    callback(false);
  }
}

function handleRootEvent(
  event: ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  state: FocusState,
  callback: boolean => void,
): void {
  const {type} = event;

  switch (type) {
    case 'pointermove':
    case 'pointerdown':
    case 'pointerup': {
      // $FlowFixMe: Flow doesn't know about PointerEvents
      const nativeEvent = ((event.nativeEvent: any): PointerEvent);
      state.pointerType = nativeEvent.pointerType;
      handleRootPointerEvent(event, context, state, callback);
      break;
    }

    case 'keydown':
    case 'keyup': {
      const nativeEvent = event.nativeEvent;
      const focusTarget = state.focusTarget;
      const {key, metaKey, altKey, ctrlKey} = (nativeEvent: any);
      const validKey =
        key === 'Enter' ||
        key === ' ' ||
        (key === 'Tab' && !(metaKey || (!isMac && altKey) || ctrlKey));

      if (validKey) {
        state.pointerType = 'keyboard';
        isGlobalFocusVisible = true;
        if (
          focusTarget !== null &&
          context.isTargetWithinResponderScope(focusTarget)
        ) {
          callback(true);
        }
      }
      break;
    }

    // fallbacks for no PointerEvent support
    case 'touchmove':
    case 'touchstart':
    case 'touchend': {
      state.pointerType = 'touch';
      state.isEmulatingMouseEvents = true;
      handleRootPointerEvent(event, context, state, callback);
      break;
    }
    case 'mousedown': {
      if (!state.isEmulatingMouseEvents) {
        state.pointerType = 'mouse';
        handleRootPointerEvent(event, context, state, callback);
      } else {
        state.isEmulatingMouseEvents = false;
      }
      break;
    }
  }
}

/**
 * Focus Responder
 */

function dispatchFocusEvents(
  context: ReactDOMResponderContext,
  props: FocusProps,
  state: FocusState,
) {
  const pointerType = state.pointerType;
  const target = ((state.focusTarget: any): Element | Document);
  const onFocus = props.onFocus;
  if (isFunction(onFocus)) {
    const syntheticEvent = createFocusEvent(
      context,
      'focus',
      target,
      pointerType,
    );
    context.dispatchEvent(syntheticEvent, onFocus, DiscreteEvent);
  }
  dispatchFocusChange(context, props, true);
  if (state.isFocusVisible) {
    dispatchFocusVisibleChangeEvent(context, props, true);
  }
}

function dispatchBlurEvents(
  context: ReactDOMResponderContext,
  props: FocusProps,
  state: FocusState,
) {
  const pointerType = state.pointerType;
  const target = ((state.focusTarget: any): Element | Document);
  const onBlur = props.onBlur;
  if (isFunction(onBlur)) {
    const syntheticEvent = createFocusEvent(
      context,
      'blur',
      target,
      pointerType,
    );
    context.dispatchEvent(syntheticEvent, onBlur, DiscreteEvent);
  }
  dispatchFocusChange(context, props, false);
  if (state.isFocusVisible) {
    dispatchFocusVisibleChangeEvent(context, props, false);
  }
}

function dispatchBlurWithinEvents(
  context: ReactDOMResponderContext,
  event: ReactDOMResponderEvent,
  props: FocusWithinProps,
  state: FocusState,
) {
  const pointerType = state.pointerType;
  const target = ((state.focusTarget: any): Element | Document) || event.target;
  const onBlurWithin = (props.onBlurWithin: any);
  if (isFunction(onBlurWithin)) {
    const syntheticEvent = createFocusEvent(
      context,
      'blurwithin',
      target,
      pointerType,
    );
    context.dispatchEvent(syntheticEvent, onBlurWithin, DiscreteEvent);
  }
}

function dispatchFocusChange(
  context: ReactDOMResponderContext,
  props: FocusProps,
  value: boolean,
): void {
  const onFocusChange = props.onFocusChange;
  if (isFunction(onFocusChange)) {
    context.dispatchEvent(value, onFocusChange, DiscreteEvent);
  }
}

function dispatchFocusVisibleChangeEvent(
  context: ReactDOMResponderContext,
  props: FocusProps,
  value: boolean,
) {
  const onFocusVisibleChange = props.onFocusVisibleChange;
  if (isFunction(onFocusVisibleChange)) {
    context.dispatchEvent(value, onFocusVisibleChange, DiscreteEvent);
  }
}

function unmountFocusResponder(
  context: ReactDOMResponderContext,
  props: FocusProps,
  state: FocusState,
) {
  if (state.isFocused) {
    dispatchBlurEvents(context, props, state);
  }
}

const focusResponderImpl = {
  targetEventTypes,
  targetPortalPropagation: true,
  rootEventTypes,
  getInitialState(): FocusState {
    return {
      focusTarget: null,
      isEmulatingMouseEvents: false,
      isFocused: false,
      isFocusVisible: false,
      pointerType: '',
    };
  },
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: FocusProps,
    state: FocusState,
  ): void {
    const {type, target} = event;

    if (props.disabled) {
      if (state.isFocused) {
        dispatchBlurEvents(context, props, state);
        state.isFocused = false;
        state.focusTarget = null;
      }
      return;
    }

    switch (type) {
      case 'focus': {
        state.focusTarget = context.getResponderNode();
        // Limit focus events to the direct child of the event component.
        // Browser focus is not expected to bubble.
        if (!state.isFocused && state.focusTarget === target) {
          state.isFocused = true;
          state.isFocusVisible = isGlobalFocusVisible;
          dispatchFocusEvents(context, props, state);
        }
        state.isEmulatingMouseEvents = false;
        break;
      }
      case 'blur': {
        if (state.isFocused) {
          dispatchBlurEvents(context, props, state);
          state.isFocusVisible = isGlobalFocusVisible;
          state.isFocused = false;
        }
        // This covers situations where focus is lost to another document in
        // the same window (e.g., iframes). Any action that restores focus to
        // the document (e.g., touch or click) first causes 'focus' to be
        // dispatched, which means the 'pointerType' we provide is stale
        // (it reflects the *previous* pointer). We cannot determine the
        // 'pointerType' in this case, so a blur with no
        // relatedTarget is used as a signal to reset the 'pointerType'.
        if (event.nativeEvent.relatedTarget == null) {
          state.pointerType = '';
        }
        state.isEmulatingMouseEvents = false;
        break;
      }
    }
  },
  onRootEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: FocusProps,
    state: FocusState,
  ): void {
    handleRootEvent(event, context, state, isFocusVisible => {
      if (state.isFocused && state.isFocusVisible !== isFocusVisible) {
        state.isFocusVisible = isFocusVisible;
        dispatchFocusVisibleChangeEvent(context, props, isFocusVisible);
      }
    });
  },
  onUnmount(
    context: ReactDOMResponderContext,
    props: FocusProps,
    state: FocusState,
  ) {
    unmountFocusResponder(context, props, state);
  },
};

export const FocusResponder = React.unstable_createResponder(
  'Focus',
  focusResponderImpl,
);

export function useFocus(
  props: FocusProps,
): ReactEventResponderListener<any, any> {
  return React.unstable_useResponder(FocusResponder, props);
}

/**
 * FocusWithin Responder
 */

function dispatchFocusWithinChangeEvent(
  context: ReactDOMResponderContext,
  props: FocusWithinProps,
  state: FocusState,
  value: boolean,
) {
  const onFocusWithinChange = (props.onFocusWithinChange: any);
  if (isFunction(onFocusWithinChange)) {
    context.dispatchEvent(value, onFocusWithinChange, DiscreteEvent);
  }
  if (state.isFocusVisible) {
    dispatchFocusWithinVisibleChangeEvent(context, props, state, value);
  }
}

function dispatchFocusWithinVisibleChangeEvent(
  context: ReactDOMResponderContext,
  props: FocusWithinProps,
  state: FocusState,
  value: boolean,
) {
  const onFocusWithinVisibleChange = (props.onFocusWithinVisibleChange: any);
  if (isFunction(onFocusWithinVisibleChange)) {
    context.dispatchEvent(value, onFocusWithinVisibleChange, DiscreteEvent);
  }
}

function unmountFocusWithinResponder(
  context: ReactDOMResponderContext,
  props: FocusWithinProps,
  state: FocusState,
) {
  if (state.isFocused) {
    dispatchFocusWithinChangeEvent(context, props, state, false);
  }
}

const focusWithinResponderImpl = {
  targetEventTypes,
  targetPortalPropagation: true,
  rootEventTypes,
  getInitialState(): FocusState {
    return {
      focusTarget: null,
      isEmulatingMouseEvents: false,
      isFocused: false,
      isFocusVisible: false,
      pointerType: '',
    };
  },
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: FocusWithinProps,
    state: FocusState,
  ): void {
    const {nativeEvent, type} = event;
    const relatedTarget = (nativeEvent: any).relatedTarget;

    if (props.disabled) {
      if (state.isFocused) {
        dispatchFocusWithinChangeEvent(context, props, state, false);
        state.isFocused = false;
        state.focusTarget = null;
      }
      return;
    }

    switch (type) {
      case 'focus': {
        state.focusTarget = context.getResponderNode();
        // Limit focus events to the direct child of the event component.
        // Browser focus is not expected to bubble.
        if (!state.isFocused) {
          state.isFocused = true;
          state.isFocusVisible = isGlobalFocusVisible;
          dispatchFocusWithinChangeEvent(context, props, state, true);
        }
        if (!state.isFocusVisible && isGlobalFocusVisible) {
          state.isFocusVisible = isGlobalFocusVisible;
          dispatchFocusWithinVisibleChangeEvent(context, props, state, true);
        }
        break;
      }
      case 'blur': {
        if (
          state.isFocused &&
          !context.isTargetWithinResponder(relatedTarget)
        ) {
          dispatchFocusWithinChangeEvent(context, props, state, false);
          dispatchBlurWithinEvents(context, event, props, state);
          state.isFocused = false;
        }
        break;
      }
    }
  },
  onRootEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: FocusWithinProps,
    state: FocusState,
  ): void {
    handleRootEvent(event, context, state, isFocusVisible => {
      if (state.isFocused && state.isFocusVisible !== isFocusVisible) {
        state.isFocusVisible = isFocusVisible;
        dispatchFocusWithinVisibleChangeEvent(
          context,
          props,
          state,
          isFocusVisible,
        );
      }
    });
  },
  onUnmount(
    context: ReactDOMResponderContext,
    props: FocusWithinProps,
    state: FocusState,
  ) {
    unmountFocusWithinResponder(context, props, state);
  },
};

export const FocusWithinResponder = React.unstable_createResponder(
  'FocusWithin',
  focusWithinResponderImpl,
);

export function useFocusWithin(
  props: FocusWithinProps,
): ReactEventResponderListener<any, any> {
  return React.unstable_useResponder(FocusWithinResponder, props);
}
