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

type InteractOutsideProps = {
  disabled: boolean,
  onInteraction: (e: InteractOutsideEvent) => void,
  onInteractionChange: boolean => void,
  onInteractionEnd: (e: InteractOutsideEvent) => void,
  onInteractionStart: (e: InteractOutsideEvent) => void,
  preventDefault: boolean,
};

type PointerType = '' | 'mouse' | 'keyboard' | 'pen' | 'touch';

type InteractOutsideState = {
  ignoreEmulatedMouseEvents: boolean,
  isActivePressed: boolean,
  pointerType: PointerType,
  pressStatus: 0 | 1 | 2,
  pressTarget: null | Element,
};

type InteractOutsideEventType =
  | 'press'
  | 'pressstart'
  | 'pressend'
  | 'presschange'
  | 'contextmenu';

type InteractOutsideEvent = {|
  target: Element | Document,
  type: InteractOutsideEventType,
  pointerType: PointerType,
  timeStamp: number,
  clientX: null | number,
  clientY: null | number,
  pageX: null | number,
  pageY: null | number,
  screenX: null | number,
  screenY: null | number,
  x: null | number,
  y: null | number,
  altKey: boolean,
  ctrlKey: boolean,
  metaKey: boolean,
  shiftKey: boolean,
|};

const isMac =
  typeof window !== 'undefined' && window.navigator != null
    ? /^Mac/.test(window.navigator.platform)
    : false;

const rootEventTypes = [
  {name: 'contextmenu', passive: false},
  'pointerdown',
  'pointerup',
  'pointercancel',
  {name: 'keydown', passive: false},
  'keyup',
];

// If PointerEvents is not supported (e.g., Safari), also listen to touch and mouse events.
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  rootEventTypes.push(
    'touchstart',
    'touchend',
    'touchcancel',
    'mousedown',
    'mouseup',
    // Used as a 'cancel' signal for mouse interactions
    'dragstart',
  );
}

const NOT_PRESSED = 0;
const PRESSED_INSIDE = 1;
const PRESSED_OUTSIDE = 2;

function isValidKeyPress(key: string): boolean {
  // Accessibility for keyboards. Space and Enter only.
  // "Spacebar" is for IE 11
  return key === 'Enter' || key === ' ' || key === 'Spacebar';
}

function isTouchEvent(nativeEvent: Event): boolean {
  return Array.isArray((nativeEvent: any).changedTouches);
}

function getTouchFromPressEvent(nativeEvent: TouchEvent): Touch {
  const {changedTouches, touches} = nativeEvent;
  return changedTouches.length > 0
    ? changedTouches[0]
    : touches.length > 0
      ? touches[0]
      : (nativeEvent: any);
}

function createInteractOutsideEvent(
  context: ReactResponderContext,
  type: InteractOutsideEventType,
  target: Element | Document,
  pointerType: PointerType,
  event: ?ReactResponderEvent,
): InteractOutsideEvent {
  const timeStamp = context.getTimeStamp();
  let clientX = null;
  let clientY = null;
  let pageX = null;
  let pageY = null;
  let screenX = null;
  let screenY = null;
  let altKey = false;
  let ctrlKey = false;
  let metaKey = false;
  let shiftKey = false;

  if (event) {
    const nativeEvent = (event.nativeEvent: any);
    ({altKey, ctrlKey, metaKey, shiftKey} = nativeEvent);
    // Only check for one property, checking for all of them is costly. We can assume
    // if clientX exists, so do the rest.
    let eventObject;
    if (nativeEvent.clientX !== undefined) {
      eventObject = (nativeEvent: any);
    } else if (isTouchEvent(nativeEvent)) {
      eventObject = getTouchFromPressEvent(nativeEvent);
    }
    if (eventObject) {
      ({clientX, clientY, pageX, pageY, screenX, screenY} = eventObject);
    }
  }
  return {
    target,
    type,
    pointerType,
    timeStamp,
    clientX,
    clientY,
    pageX,
    pageY,
    screenX,
    screenY,
    x: clientX,
    y: clientY,
    altKey,
    ctrlKey,
    metaKey,
    shiftKey,
  };
}

function dispatchEvent(
  event: ?ReactResponderEvent,
  context: ReactResponderContext,
  state: InteractOutsideState,
  name: InteractOutsideEventType,
  listener: (e: Object) => void,
  discrete: boolean,
): void {
  const target = ((state.pressTarget: any): Element | Document);
  const pointerType = state.pointerType;
  const syntheticEvent = createInteractOutsideEvent(
    context,
    name,
    target,
    pointerType,
    event,
  );
  context.dispatchEvent(syntheticEvent, listener, discrete);
}

function dispatchCancel(
  event: ReactResponderEvent,
  context: ReactResponderContext,
  props: InteractOutsideProps,
  state: InteractOutsideState,
): void {
  state.ignoreEmulatedMouseEvents = false;
  if (state.pressStatus === PRESSED_OUTSIDE) {
    dispatchPressEndEvents(event, context, props, state);
  }
}

function unmountResponder(
  context: ReactResponderContext,
  props: InteractOutsideProps,
  state: InteractOutsideState,
): void {
  if (state.pressStatus === PRESSED_OUTSIDE) {
    dispatchPressEndEvents(null, context, props, state);
  }
}

function dispatchPressChangeEvent(
  event: ?ReactResponderEvent,
  context: ReactResponderContext,
  props: InteractOutsideProps,
  state: InteractOutsideState,
): void {
  const bool = state.isActivePressed;
  const listener = () => {
    props.onInteractionChange(bool);
  };
  dispatchEvent(event, context, state, 'presschange', listener, true);
}

function dispatchPressStartEvents(
  event: ReactResponderEvent,
  context,
  props,
  state,
) {
  const wasActivePressed = state.isActivePressed;
  state.isActivePressed = true;
  if (props.onInteractionStart) {
    dispatchEvent(
      event,
      context,
      state,
      'pressstart',
      props.onInteractionStart,
      true,
    );
  }
  if (!wasActivePressed && props.onInteractionChange) {
    dispatchPressChangeEvent(event, context, props, state);
  }
}

function dispatchPressEndEvents(
  event: ?ReactResponderEvent,
  context,
  props,
  state,
) {
  state.isActivePressed = false;

  if (props.onInteractionEnd) {
    dispatchEvent(
      event,
      context,
      state,
      'pressend',
      props.onInteractionEnd,
      true,
    );
  }
  if (props.onInteractionChange) {
    dispatchPressChangeEvent(event, context, props, state);
  }
}

const InteractOutsideResponder = {
  rootEventTypes,
  createInitialState(): InteractOutsideState {
    return {
      ignoreEmulatedMouseEvents: false,
      isActivePressed: false,
      pointerType: '',
      pressStatus: NOT_PRESSED,
      pressTarget: null,
    };
  },
  allowMultipleHostChildren: true,
  onRootEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: InteractOutsideProps,
    state: InteractOutsideState,
  ): void {
    const {target, type} = event;

    if (props.disabled) {
      if (state.pressStatus === PRESSED_OUTSIDE) {
        dispatchPressEndEvents(event, context, props, state);
      }
      state.ignoreEmulatedMouseEvents = false;
      return;
    }
    const nativeEvent: any = event.nativeEvent;
    const pointerType = context.getEventPointerType(event);

    switch (type) {
      // START
      case 'pointerdown':
      case 'keydown':
      case 'mousedown':
      case 'touchstart': {
        if (state.pressStatus === NOT_PRESSED) {
          if (type === 'pointerdown' || type === 'touchstart') {
            state.ignoreEmulatedMouseEvents = true;
          }

          // Ignore unrelated key events
          if (pointerType === 'keyboard') {
            // We don't process key events on the body
            if (target.nodeName === 'BODY') {
              return;
            }
            if (!isValidKeyPress(nativeEvent.key)) {
              return;
            }
          }

          // We set these here, before the button check so we have this
          // data around for handling of the context menu
          state.pointerType = pointerType;
          state.pressTarget = context.getEventCurrentTarget(event);

          // Ignore any device buttons except left-mouse and touch/pen contact.
          // Additionally we ignore left-mouse + ctrl-key with Macs as that
          // acts like right-click and opens the contextmenu.
          if (
            nativeEvent.button > 0 ||
            (isMac && pointerType === 'mouse' && nativeEvent.ctrlKey)
          ) {
            return;
          }

          // Ignore emulated mouse events
          if (type === 'mousedown' && state.ignoreEmulatedMouseEvents) {
            return;
          }
          if (context.isTargetWithinEventComponent(target)) {
            state.pressStatus = PRESSED_INSIDE;
          } else {
            dispatchPressStartEvents(event, context, props, state);
            state.pressStatus = PRESSED_OUTSIDE;
          }
        } else {
          // Prevent spacebar press from scrolling the window if
          // the target is not the body node
          if (
            target.nodeName !== 'BODY' &&
            isValidKeyPress(nativeEvent.key) &&
            nativeEvent.key === ' '
          ) {
            nativeEvent.preventDefault();
          }
          return;
        }
        break;
      }
      // END
      case 'pointerup':
      case 'keyup':
      case 'mouseup':
      case 'touchend': {
        if (state.pressStatus !== NOT_PRESSED) {
          // Ignore unrelated keyboard events and verify press is within
          // responder region for non-keyboard events.
          if (pointerType === 'keyboard') {
            if (!isValidKeyPress(nativeEvent.key)) {
              return;
            }
            // If the event target isn't within the press target, check if we're still
            // within the responder region. The region may have changed if the
            // element's layout was modified after activation.
          }
          if (state.pressStatus === PRESSED_OUTSIDE) {
            dispatchPressEndEvents(event, context, props, state);
            if (state.pressTarget !== null && props.onInteraction) {
              if (!context.isTargetWithinEventComponent(target)) {
                dispatchEvent(
                  event,
                  context,
                  state,
                  'press',
                  props.onInteraction,
                  true,
                );
              }
            }
          }
          state.pressStatus = NOT_PRESSED;
        } else if (type === 'mouseup' && state.ignoreEmulatedMouseEvents) {
          state.ignoreEmulatedMouseEvents = false;
        }
        break;
      }

      case 'contextmenu': {
        if (state.pressStatus === PRESSED_OUTSIDE) {
          dispatchCancel(event, context, props, state);
          if (props.preventDefault !== false) {
            nativeEvent.preventDefault();
          }
        }
        break;
      }

      // CANCEL
      case 'pointercancel':
      case 'scroll':
      case 'touchcancel':
      case 'dragstart': {
        dispatchCancel(event, context, props, state);
      }
    }
  },
  onUnmount(
    context: ReactResponderContext,
    props: InteractOutsideProps,
    state: InteractOutsideState,
  ) {
    unmountResponder(context, props, state);
  },
  onOwnershipChange(
    context: ReactResponderContext,
    props: InteractOutsideProps,
    state: InteractOutsideState,
  ) {
    unmountResponder(context, props, state);
  },
};

export default React.unstable_createEventComponent(
  InteractOutsideResponder,
  'InteractOutside',
);
