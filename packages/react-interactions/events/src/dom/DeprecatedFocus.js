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
} from 'react-dom/src/shared/ReactDOMTypes';
import type {ReactEventResponderListener} from 'shared/ReactTypes';

import * as React from 'react';
import {DiscreteEvent} from 'shared/ReactTypes';

/**
 * Types
 */

type FocusEvent = {|
  relatedTarget: null | Element | Document,
  target: Element | Document,
  type: FocusEventType | FocusWithinEventType,
  pointerType: PointerType,
  timeStamp: number,
  continuePropagation: () => void,
|};

type FocusState = {
  detachedTarget: null | Element | Document,
  focusTarget: null | Element | Document,
  isFocused: boolean,
  isFocusVisible: boolean,
  pointerType: PointerType,
  addedRootEvents?: boolean,
};

type FocusProps = {
  disabled: boolean,
  onBlur: (e: FocusEvent) => void,
  onFocus: (e: FocusEvent) => void,
  onFocusChange: boolean => void,
  onFocusVisibleChange: boolean => void,
  ...
};

type FocusEventType = 'focus' | 'blur' | 'focuschange' | 'focusvisiblechange';

type FocusWithinProps = {
  disabled?: boolean,
  onFocusWithin?: (e: FocusEvent) => void,
  onAfterBlurWithin?: (e: FocusEvent) => void,
  onBeforeBlurWithin?: (e: FocusEvent) => void,
  onBlurWithin?: (e: FocusEvent) => void,
  onFocusWithinChange?: boolean => void,
  onFocusWithinVisibleChange?: boolean => void,
  ...
};

type FocusWithinEventType =
  | 'focuswithinvisiblechange'
  | 'focuswithinchange'
  | 'blurwithin'
  | 'focuswithin'
  | 'beforeblurwithin'
  | 'afterblurwithin';

/**
 * Shared between Focus and FocusWithin
 */

let isGlobalFocusVisible = true;
let hasTrackedGlobalFocusVisible = false;
let globalFocusVisiblePointerType = '';
let isEmulatingMouseEvents = false;

const isMac =
  typeof window !== 'undefined' && window.navigator != null
    ? /^Mac/.test(window.navigator.platform)
    : false;

let passiveBrowserEventsSupported = false;

const canUseDOM: boolean = !!(
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
);

// Check if browser support events with passive listeners
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
if (canUseDOM) {
  try {
    const options = {};
    // $FlowFixMe: Ignore Flow complaining about needing a value
    Object.defineProperty(options, 'passive', {
      get: function() {
        passiveBrowserEventsSupported = true;
      },
    });
    window.addEventListener('test', options, options);
    window.removeEventListener('test', options, options);
  } catch (e) {
    passiveBrowserEventsSupported = false;
  }
}

const hasPointerEvents =
  typeof window !== 'undefined' && window.PointerEvent != null;

const focusVisibleEvents = hasPointerEvents
  ? ['keydown', 'keyup', 'pointermove', 'pointerdown', 'pointerup']
  : ['keydown', 'keyup', 'mousedown', 'touchmove', 'touchstart', 'touchend'];

const targetEventTypes = ['focus', 'blur', 'beforeblur', ...focusVisibleEvents];

const rootEventTypes = ['afterblur'];

function addWindowEventListener(types, callback, options) {
  types.forEach(type => {
    window.addEventListener(type, callback, options);
  });
}

function trackGlobalFocusVisible() {
  if (!hasTrackedGlobalFocusVisible) {
    hasTrackedGlobalFocusVisible = true;
    addWindowEventListener(
      focusVisibleEvents,
      handleGlobalFocusVisibleEvent,
      passiveBrowserEventsSupported ? {capture: true, passive: true} : true,
    );
  }
}

function handleGlobalFocusVisibleEvent(
  nativeEvent: MouseEvent | TouchEvent | KeyboardEvent,
): void {
  const {type} = nativeEvent;

  switch (type) {
    case 'pointermove':
    case 'pointerdown':
    case 'pointerup': {
      isGlobalFocusVisible = false;
      globalFocusVisiblePointerType = (nativeEvent: any).pointerType;
      break;
    }

    case 'keydown':
    case 'keyup': {
      const {metaKey, altKey, ctrlKey} = nativeEvent;
      const validKey = !(metaKey || (!isMac && altKey) || ctrlKey);

      if (validKey) {
        globalFocusVisiblePointerType = 'keyboard';
        isGlobalFocusVisible = true;
      }
      break;
    }

    // fallbacks for no PointerEvent support
    case 'touchmove':
    case 'touchstart':
    case 'touchend': {
      isEmulatingMouseEvents = true;
      isGlobalFocusVisible = false;
      globalFocusVisiblePointerType = 'touch';
      break;
    }
    case 'mousedown': {
      if (!isEmulatingMouseEvents) {
        isGlobalFocusVisible = false;
        globalFocusVisiblePointerType = 'mouse';
      } else {
        isEmulatingMouseEvents = false;
      }
      break;
    }
  }
}

function isFunction(obj): boolean {
  return typeof obj === 'function';
}

function createFocusEvent(
  context: ReactDOMResponderContext,
  type: FocusEventType | FocusWithinEventType,
  target: Element | Document,
  pointerType: PointerType,
  relatedTarget: null | Element | Document,
): FocusEvent {
  return {
    relatedTarget,
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

function handleFocusVisibleTargetEvent(
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
    (type === 'mousedown' || type === 'touchstart' || type === 'pointerdown')
  ) {
    callback(false);
  }
}

function handleFocusVisibleTargetEvents(
  event: ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  state: FocusState,
  callback: boolean => void,
): void {
  const {type} = event;
  state.pointerType = globalFocusVisiblePointerType;

  switch (type) {
    case 'pointermove':
    case 'pointerdown':
    case 'pointerup': {
      handleFocusVisibleTargetEvent(event, context, state, callback);
      break;
    }

    case 'keydown':
    case 'keyup': {
      const nativeEvent = event.nativeEvent;
      const focusTarget = state.focusTarget;
      const {metaKey, altKey, ctrlKey} = (nativeEvent: any);
      const validKey = !(metaKey || (!isMac && altKey) || ctrlKey);

      if (validKey) {
        if (focusTarget !== null) {
          callback(true);
        }
      }
      break;
    }

    // fallbacks for no PointerEvent support
    case 'touchmove':
    case 'touchstart':
    case 'touchend': {
      handleFocusVisibleTargetEvent(event, context, state, callback);
      break;
    }
    case 'mousedown': {
      if (!isEmulatingMouseEvents) {
        handleFocusVisibleTargetEvent(event, context, state, callback);
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
      null,
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
      null,
    );
    context.dispatchEvent(syntheticEvent, onBlur, DiscreteEvent);
  }
  dispatchFocusChange(context, props, false);
  if (state.isFocusVisible) {
    dispatchFocusVisibleChangeEvent(context, props, false);
  }
}

function dispatchFocusWithinEvents(
  context: ReactDOMResponderContext,
  event: ReactDOMResponderEvent,
  props: FocusWithinProps,
  state: FocusState,
) {
  const pointerType = state.pointerType;
  const target = ((state.focusTarget: any): Element | Document) || event.target;
  const onFocusWithin = (props.onFocusWithin: any);
  if (isFunction(onFocusWithin)) {
    const syntheticEvent = createFocusEvent(
      context,
      'focuswithin',
      target,
      pointerType,
      null,
    );
    context.dispatchEvent(syntheticEvent, onFocusWithin, DiscreteEvent);
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
      null,
    );
    context.dispatchEvent(syntheticEvent, onBlurWithin, DiscreteEvent);
  }
}

function dispatchAfterBlurWithinEvents(
  context: ReactDOMResponderContext,
  event: ReactDOMResponderEvent,
  props: FocusWithinProps,
  state: FocusState,
) {
  const pointerType = state.pointerType;
  const onAfterBlurWithin = (props.onAfterBlurWithin: any);
  const relatedTarget = state.detachedTarget;
  if (isFunction(onAfterBlurWithin) && relatedTarget !== null) {
    const syntheticEvent = createFocusEvent(
      context,
      'afterblurwithin',
      relatedTarget,
      pointerType,
      relatedTarget,
    );
    context.dispatchEvent(syntheticEvent, onAfterBlurWithin, DiscreteEvent);
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
  getInitialState(): FocusState {
    return {
      detachedTarget: null,
      focusTarget: null,
      isFocused: false,
      isFocusVisible: false,
      pointerType: '',
      addedRootEvents: false,
    };
  },
  onMount() {
    trackGlobalFocusVisible();
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
        isEmulatingMouseEvents = false;
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
        isEmulatingMouseEvents = false;
        break;
      }
      default:
        handleFocusVisibleTargetEvents(
          event,
          context,
          state,
          isFocusVisible => {
            if (state.isFocused && state.isFocusVisible !== isFocusVisible) {
              state.isFocusVisible = isFocusVisible;
              dispatchFocusVisibleChangeEvent(context, props, isFocusVisible);
            }
          },
        );
    }
  },
  onUnmount(
    context: ReactDOMResponderContext,
    props: FocusProps,
    state: FocusState,
  ) {
    unmountFocusResponder(context, props, state);
  },
};

// $FlowFixMe Can't add generic types without causing a parsing/syntax errors
export const FocusResponder = React.DEPRECATED_createResponder(
  'Focus',
  focusResponderImpl,
);

export function useFocus(
  props: FocusProps,
): ?ReactEventResponderListener<any, any> {
  return React.DEPRECATED_useResponder(FocusResponder, props);
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
  getInitialState(): FocusState {
    return {
      detachedTarget: null,
      focusTarget: null,
      isFocused: false,
      isFocusVisible: false,
      pointerType: '',
    };
  },
  onMount() {
    trackGlobalFocusVisible();
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
        dispatchFocusWithinEvents(context, event, props, state);
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
      case 'beforeblur': {
        const onBeforeBlurWithin = (props.onBeforeBlurWithin: any);
        if (isFunction(onBeforeBlurWithin)) {
          const syntheticEvent = createFocusEvent(
            context,
            'beforeblurwithin',
            event.target,
            state.pointerType,
            null,
          );
          state.detachedTarget = event.target;
          context.dispatchEvent(
            syntheticEvent,
            onBeforeBlurWithin,
            DiscreteEvent,
          );
          if (!state.addedRootEvents) {
            state.addedRootEvents = true;
            context.addRootEventTypes(rootEventTypes);
          }
        } else {
          // We want to propagate to next focusWithin responder
          // if this responder doesn't handle beforeblur
          context.continuePropagation();
        }
        break;
      }
      default:
        handleFocusVisibleTargetEvents(
          event,
          context,
          state,
          isFocusVisible => {
            if (state.isFocused && state.isFocusVisible !== isFocusVisible) {
              state.isFocusVisible = isFocusVisible;
              dispatchFocusWithinVisibleChangeEvent(
                context,
                props,
                state,
                isFocusVisible,
              );
            }
          },
        );
    }
  },
  onRootEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: FocusWithinProps,
    state: FocusState,
  ): void {
    if (event.type === 'afterblur') {
      const detachedTarget = state.detachedTarget;
      if (
        detachedTarget !== null &&
        detachedTarget === event.nativeEvent.relatedTarget
      ) {
        dispatchAfterBlurWithinEvents(context, event, props, state);
        state.detachedTarget = null;
        if (state.addedRootEvents) {
          state.addedRootEvents = false;
          context.removeRootEventTypes(rootEventTypes);
        }
      }
    }
  },
  onUnmount(
    context: ReactDOMResponderContext,
    props: FocusWithinProps,
    state: FocusState,
  ) {
    unmountFocusWithinResponder(context, props, state);
  },
};

// $FlowFixMe Can't add generic types without causing a parsing/syntax errors
export const FocusWithinResponder = React.DEPRECATED_createResponder(
  'FocusWithin',
  focusWithinResponderImpl,
);

export function useFocusWithin(
  props: FocusWithinProps,
): ?ReactEventResponderListener<any, any> {
  return React.DEPRECATED_useResponder(FocusWithinResponder, props);
}
