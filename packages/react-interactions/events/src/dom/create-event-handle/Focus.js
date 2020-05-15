/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import useEvent from './useEvent';

const {useEffect, useRef} = React;

type UseFocusOptions = {|
  disabled?: boolean,
  onBlur?: (SyntheticEvent<EventTarget>) => void,
  onFocus?: (SyntheticEvent<EventTarget>) => void,
  onFocusChange?: boolean => void,
  onFocusVisibleChange?: boolean => void,
|};

type UseFocusWithinOptions = {|
  disabled?: boolean,
  onAfterBlurWithin?: (SyntheticEvent<EventTarget>) => void,
  onBeforeBlurWithin?: (SyntheticEvent<EventTarget>) => void,
  onBlurWithin?: (SyntheticEvent<EventTarget>) => void,
  onFocusWithin?: (SyntheticEvent<EventTarget>) => void,
  onFocusWithinChange?: boolean => void,
  onFocusWithinVisibleChange?: boolean => void,
|};

const isMac =
  typeof window !== 'undefined' && window.navigator != null
    ? /^Mac/.test(window.navigator.platform)
    : false;

const canUseDOM: boolean = !!(
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
);

let passiveBrowserEventsSupported = false;

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

const globalFocusVisibleEvents = hasPointerEvents
  ? ['keydown', 'pointermove', 'pointerdown', 'pointerup']
  : ['keydown', 'mousedown', 'touchmove', 'touchstart', 'touchend'];

// Global state for tracking focus visible and emulation of mouse
let isGlobalFocusVisible = true;
let hasTrackedGlobalFocusVisible = false;
let isEmulatingMouseEvents = false;

function trackGlobalFocusVisible() {
  globalFocusVisibleEvents.forEach(type => {
    window.addEventListener(
      type,
      handleGlobalFocusVisibleEvent,
      passiveBrowserEventsSupported ? {capture: true, passive: true} : true,
    );
  });
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
      break;
    }

    case 'keydown': {
      const {metaKey, altKey, ctrlKey} = nativeEvent;
      const validKey = !(metaKey || (!isMac && altKey) || ctrlKey);

      if (validKey) {
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
      break;
    }
    case 'mousedown': {
      if (!isEmulatingMouseEvents) {
        isGlobalFocusVisible = false;
      } else {
        isEmulatingMouseEvents = false;
      }
      break;
    }
  }
}

const passiveObject = {passive: true};

function handleFocusVisibleTargetEvent(
  type: string,
  focusTarget: EventTarget,
  callback: boolean => void,
): void {
  isGlobalFocusVisible = false;

  // Focus should stop being visible if a pointer is used on the element
  // after it was focused using a keyboard.
  if (
    focusTarget !== null &&
    (type === 'mousedown' || type === 'touchstart' || type === 'pointerdown')
  ) {
    callback(false);
  }
}

function handleFocusVisibleTargetEvents(
  event: SyntheticEvent<EventTarget>,
  focusTarget,
  callback,
): void {
  const {type} = event;

  switch (type) {
    case 'pointermove':
    case 'pointerdown':
    case 'pointerup': {
      handleFocusVisibleTargetEvent(type, focusTarget, callback);
      break;
    }

    case 'keydown':
    case 'keyup': {
      const {metaKey, altKey, ctrlKey} = (event: any);
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
      handleFocusVisibleTargetEvent(type, focusTarget, callback);
      break;
    }
    case 'mousedown': {
      if (!isEmulatingMouseEvents) {
        handleFocusVisibleTargetEvent(type, focusTarget, callback);
      }
      break;
    }
  }
}

function isRelatedTargetWithin(
  focusWithinTarget: Node,
  relatedTarget: null | Node,
): boolean {
  if (relatedTarget == null) {
    return false;
  }
  // To support experimental scopes, which can be the target:
  const containsNode = (focusWithinTarget: any).containsNode;
  if (typeof containsNode === 'function') {
    return containsNode(relatedTarget);
  }
  return focusWithinTarget.contains(relatedTarget);
}

function setFocusVisibleListeners(focusVisibleHandles, focusTarget, callback) {
  focusVisibleHandles.forEach(focusVisibleHandle => {
    focusVisibleHandle.setListener(focusTarget, event =>
      handleFocusVisibleTargetEvents(event, focusTarget, callback),
    );
  });
}

function useFocusVisibleInputHandles() {
  return [
    useEvent('mousedown', passiveObject),
    useEvent(hasPointerEvents ? 'pointerdown' : 'touchstart', passiveObject),
    useEvent(hasPointerEvents ? 'pointermove' : 'touchmove', passiveObject),
    useEvent(hasPointerEvents ? 'pointerup' : 'touchend', passiveObject),
    useEvent('keydown', passiveObject),
  ];
}

function useFocusLifecycles(stateRef) {
  useEffect(() => {
    if (!hasTrackedGlobalFocusVisible) {
      hasTrackedGlobalFocusVisible = true;
      trackGlobalFocusVisible();
    }
  }, []);
}

export function useFocus(
  focusTargetRef: {current: null | Node},
  {
    disabled,
    onBlur,
    onFocus,
    onFocusChange,
    onFocusVisibleChange,
  }: UseFocusOptions,
): void {
  // Setup controlled state for this useFocus hook
  const stateRef = useRef({isFocused: false, isFocusVisible: false});
  const focusHandle = useEvent('focus', passiveObject);
  const blurHandle = useEvent('blur', passiveObject);
  const focusVisibleHandles = useFocusVisibleInputHandles();

  useEffect(() => {
    const focusTarget = focusTargetRef.current;
    const state = stateRef.current;

    if (focusTarget !== null && state !== null) {
      // Handle focus visible
      setFocusVisibleListeners(
        focusVisibleHandles,
        focusTarget,
        isFocusVisible => {
          if (state.isFocused && state.isFocusVisible !== isFocusVisible) {
            state.isFocusVisible = isFocusVisible;
            if (onFocusVisibleChange) {
              onFocusVisibleChange(isFocusVisible);
            }
          }
        },
      );

      // Handle focus
      focusHandle.setListener(focusTarget, event => {
        if (disabled) {
          return;
        }
        // Limit focus events to the direct child of the event component.
        // Browser focus is not expected to bubble.
        if (!state.isFocused && focusTarget === event.target) {
          state.isFocused = true;
          state.isFocusVisible = isGlobalFocusVisible;
          if (onFocus) {
            onFocus(event);
          }
          if (onFocusChange) {
            onFocusChange(true);
          }
          if (state.isFocusVisible && onFocusVisibleChange) {
            onFocusVisibleChange(true);
          }
          isEmulatingMouseEvents = false;
        }
      });

      // Handle blur
      blurHandle.setListener(focusTarget, event => {
        if (disabled) {
          return;
        }
        if (state.isFocused) {
          state.isFocused = false;
          state.isFocusVisible = isGlobalFocusVisible;
          if (onBlur) {
            onBlur(event);
          }
          if (onFocusChange) {
            onFocusChange(false);
          }
          if (state.isFocusVisible && onFocusVisibleChange) {
            onFocusVisibleChange(false);
          }
        }
        isEmulatingMouseEvents = false;
      });
    }
  }, [disabled, onBlur, onFocus, onFocusChange, onFocusVisibleChange]);

  // Mount/Unmount logic
  useFocusLifecycles(stateRef);
}

export function useFocusWithin(
  focusWithinTargetRef: {current: null | Node},
  {
    disabled,
    onAfterBlurWithin,
    onBeforeBlurWithin,
    onBlurWithin,
    onFocusWithin,
    onFocusWithinChange,
    onFocusWithinVisibleChange,
  }: UseFocusWithinOptions,
) {
  // Setup controlled state for this useFocus hook
  const stateRef = useRef({isFocused: false, isFocusVisible: false});
  const focusHandle = useEvent('focus', passiveObject);
  const blurHandle = useEvent('blur', passiveObject);
  const afterBlurHandle = useEvent('afterblur', passiveObject);
  const beforeBlurHandle = useEvent('beforeblur', passiveObject);
  const focusVisibleHandles = useFocusVisibleInputHandles();

  useEffect(() => {
    const focusWithinTarget = focusWithinTargetRef.current;
    const state = stateRef.current;

    if (focusWithinTarget !== null && state !== null) {
      // Handle focus visible
      setFocusVisibleListeners(
        focusVisibleHandles,
        focusWithinTarget,
        isFocusVisible => {
          if (state.isFocused && state.isFocusVisible !== isFocusVisible) {
            state.isFocusVisible = isFocusVisible;
            if (onFocusWithinVisibleChange) {
              onFocusWithinVisibleChange(isFocusVisible);
            }
          }
        },
      );

      // Handle focus
      focusHandle.setListener(focusWithinTarget, event => {
        if (disabled) {
          return;
        }
        if (!state.isFocused) {
          state.isFocused = true;
          state.isFocusVisible = isGlobalFocusVisible;
          if (onFocusWithinChange) {
            onFocusWithinChange(true);
          }
          if (state.isFocusVisible && onFocusWithinVisibleChange) {
            onFocusWithinVisibleChange(true);
          }
        }
        if (!state.isFocusVisible && isGlobalFocusVisible) {
          state.isFocusVisible = isGlobalFocusVisible;
          if (onFocusWithinVisibleChange) {
            onFocusWithinVisibleChange(true);
          }
        }
        if (onFocusWithin) {
          onFocusWithin(event);
        }
        isEmulatingMouseEvents = false;
      });

      // Handle blur
      blurHandle.setListener(focusWithinTarget, event => {
        if (disabled) {
          return;
        }
        const {relatedTarget} = (event: any);

        if (
          state.isFocused &&
          !isRelatedTargetWithin(focusWithinTarget, relatedTarget)
        ) {
          state.isFocused = false;
          if (onFocusWithinChange) {
            onFocusWithinChange(false);
          }
          if (state.isFocusVisible && onFocusWithinVisibleChange) {
            onFocusWithinVisibleChange(false);
          }
          if (onBlurWithin) {
            onBlurWithin(event);
          }
        }
        isEmulatingMouseEvents = false;
      });

      // Handle before blur. This is a special
      // React provided event.
      beforeBlurHandle.setListener(focusWithinTarget, event => {
        if (disabled) {
          return;
        }
        if (onBeforeBlurWithin) {
          onBeforeBlurWithin(event);
          // Add an "afterblur" listener on document. This is a special
          // React provided event.
          afterBlurHandle.setListener(document, afterBlurEvent => {
            if (onAfterBlurWithin) {
              onAfterBlurWithin(afterBlurEvent);
            }
            // Clear listener on document
            afterBlurHandle.setListener(document, null);
          });
        }
      });
    }
  }, [
    disabled,
    onBlurWithin,
    onFocusWithin,
    onFocusWithinChange,
    onFocusWithinVisibleChange,
  ]);

  // Mount/Unmount logic
  useFocusLifecycles(stateRef);
}
