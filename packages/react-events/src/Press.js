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
import {isEventPositionWithinTouchHitTarget} from './utils';

type PressProps = {
  disabled: boolean,
  delayLongPress: number,
  delayPressEnd: number,
  delayPressStart: number,
  onLongPress: (e: PressEvent) => void,
  onLongPressChange: boolean => void,
  onLongPressShouldCancelPress: () => boolean,
  onPress: (e: PressEvent) => void,
  onPressChange: boolean => void,
  onPressEnd: (e: PressEvent) => void,
  onPressMove: (e: PressEvent) => void,
  onPressStart: (e: PressEvent) => void,
  pressRetentionOffset: {
    top: number,
    right: number,
    bottom: number,
    left: number,
  },
  preventDefault: boolean,
};

type PointerType = '' | 'mouse' | 'keyboard' | 'pen' | 'touch';

type PressState = {
  activationPosition: null | $ReadOnly<{|
    pageX: number,
    pageY: number,
  |}>,
  addedRootEvents: boolean,
  isActivePressed: boolean,
  isActivePressStart: boolean,
  isLongPressed: boolean,
  isPressed: boolean,
  isPressWithinResponderRegion: boolean,
  longPressTimeout: null | Symbol,
  pointerType: PointerType,
  pressTarget: null | Element,
  pressEndTimeout: null | Symbol,
  pressStartTimeout: null | Symbol,
  responderRegionOnActivation: null | $ReadOnly<{|
    bottom: number,
    left: number,
    right: number,
    top: number,
  |}>,
  responderRegionOnDeactivation: null | $ReadOnly<{|
    bottom: number,
    left: number,
    right: number,
    top: number,
  |}>,
  ignoreEmulatedMouseEvents: boolean,
  allowPressReentry: boolean,
};

type PressEventType =
  | 'press'
  | 'pressmove'
  | 'pressstart'
  | 'pressend'
  | 'presschange'
  | 'longpress'
  | 'longpresschange';

type PressEvent = {|
  target: Element | Document,
  type: PressEventType,
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

const DEFAULT_PRESS_END_DELAY_MS = 0;
const DEFAULT_PRESS_START_DELAY_MS = 0;
const DEFAULT_LONG_PRESS_DELAY_MS = 500;
const DEFAULT_PRESS_RETENTION_OFFSET = {
  bottom: 20,
  top: 20,
  left: 20,
  right: 20,
};

const targetEventTypes = [
  {name: 'click', passive: false},
  {name: 'keydown', passive: false},
  {name: 'keypress', passive: false},
  {name: 'contextmenu', passive: false},
  // We need to preventDefault on pointerdown for mouse/pen events
  // that are in hit target area but not the element area.
  {name: 'pointerdown', passive: false},
];
const rootEventTypes = [
  'keyup',
  'pointerup',
  'pointermove',
  'scroll',
  'pointercancel',
];

// If PointerEvents is not supported (e.g., Safari), also listen to touch and mouse events.
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('touchstart', 'mousedown');
  rootEventTypes.push(
    {name: 'mouseup', passive: false},
    'mousemove',
    'touchmove',
    'touchend',
    'touchcancel',
    // Used as a 'cancel' signal for mouse interactions
    'dragstart',
  );
}

function createPressEvent(
  context: ReactResponderContext,
  type: PressEventType,
  target: Element | Document,
  pointerType: PointerType,
  event: ?ReactResponderEvent,
): PressEvent {
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
  state: PressState,
  name: PressEventType,
  listener: (e: Object) => void,
  discrete: boolean,
): void {
  const target = ((state.pressTarget: any): Element | Document);
  const pointerType = state.pointerType;
  const syntheticEvent = createPressEvent(
    context,
    name,
    target,
    pointerType,
    event,
  );
  context.dispatchEvent(syntheticEvent, listener, {
    discrete,
  });
}

function dispatchPressChangeEvent(
  event: ?ReactResponderEvent,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const bool = state.isActivePressed;
  const listener = () => {
    props.onPressChange(bool);
  };
  dispatchEvent(event, context, state, 'presschange', listener, true);
}

function dispatchLongPressChangeEvent(
  event: ?ReactResponderEvent,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const bool = state.isLongPressed;
  const listener = () => {
    props.onLongPressChange(bool);
  };
  dispatchEvent(event, context, state, 'longpresschange', listener, true);
}

function activate(event: ReactResponderEvent, context, props, state) {
  const nativeEvent: any = event.nativeEvent;
  const {x, y} = getEventPageCoords(nativeEvent);
  const wasActivePressed = state.isActivePressed;
  state.isActivePressed = true;
  if (x !== null && y !== null) {
    state.activationPosition = {
      pageX: x,
      pageY: y,
    };
  }

  if (props.onPressStart) {
    dispatchEvent(
      event,
      context,
      state,
      'pressstart',
      props.onPressStart,
      true,
    );
  }
  if (!wasActivePressed && props.onPressChange) {
    dispatchPressChangeEvent(event, context, props, state);
  }
}

function deactivate(event: ?ReactResponderEvent, context, props, state) {
  const wasLongPressed = state.isLongPressed;
  state.isActivePressed = false;
  state.isLongPressed = false;

  if (props.onPressEnd) {
    dispatchEvent(event, context, state, 'pressend', props.onPressEnd, true);
  }
  if (props.onPressChange) {
    dispatchPressChangeEvent(event, context, props, state);
  }
  if (wasLongPressed && props.onLongPressChange) {
    dispatchLongPressChangeEvent(event, context, props, state);
  }
}

function dispatchPressStartEvents(
  event: ReactResponderEvent,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  state.isPressed = true;

  if (state.pressEndTimeout !== null) {
    context.clearTimeout(state.pressEndTimeout);
    state.pressEndTimeout = null;
  }

  const dispatch = () => {
    state.isActivePressStart = true;
    activate(event, context, props, state);

    if (
      (props.onLongPress || props.onLongPressChange) &&
      !state.isLongPressed
    ) {
      const delayLongPress = calculateDelayMS(
        props.delayLongPress,
        10,
        DEFAULT_LONG_PRESS_DELAY_MS,
      );
      state.longPressTimeout = context.setTimeout(() => {
        state.isLongPressed = true;
        state.longPressTimeout = null;
        if (props.onLongPress) {
          dispatchEvent(
            event,
            context,
            state,
            'longpress',
            props.onLongPress,
            true,
          );
        }
        if (props.onLongPressChange) {
          dispatchLongPressChangeEvent(event, context, props, state);
        }
      }, delayLongPress);
    }
  };

  if (!state.isActivePressStart) {
    const delayPressStart = calculateDelayMS(
      props.delayPressStart,
      0,
      DEFAULT_PRESS_START_DELAY_MS,
    );
    if (delayPressStart > 0) {
      state.pressStartTimeout = context.setTimeout(() => {
        state.pressStartTimeout = null;
        dispatch();
      }, delayPressStart);
    } else {
      dispatch();
    }
  }
}

function dispatchPressEndEvents(
  event: ?ReactResponderEvent,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const wasActivePressStart = state.isActivePressStart;
  let activationWasForced = false;

  state.isActivePressStart = false;
  state.isPressed = false;

  if (state.longPressTimeout !== null) {
    context.clearTimeout(state.longPressTimeout);
    state.longPressTimeout = null;
  }

  if (!wasActivePressStart && state.pressStartTimeout !== null) {
    context.clearTimeout(state.pressStartTimeout);
    state.pressStartTimeout = null;
    // don't activate if a press has moved beyond the responder region
    if (state.isPressWithinResponderRegion && event != null) {
      // if we haven't yet activated (due to delays), activate now
      activate(event, context, props, state);
      activationWasForced = true;
    }
  }

  if (state.isActivePressed) {
    const delayPressEnd = calculateDelayMS(
      props.delayPressEnd,
      // if activation and deactivation occur during the same event there's no
      // time for visual user feedback therefore a small delay is added before
      // deactivating.
      activationWasForced ? 10 : 0,
      DEFAULT_PRESS_END_DELAY_MS,
    );
    if (delayPressEnd > 0) {
      state.pressEndTimeout = context.setTimeout(() => {
        state.pressEndTimeout = null;
        deactivate(event, context, props, state);
      }, delayPressEnd);
    } else {
      deactivate(event, context, props, state);
    }
  }
}

function dispatchCancel(
  event: ReactResponderEvent,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const nativeEvent: any = event.nativeEvent;
  const type = event.type;

  if (state.isPressed) {
    if (type === 'contextmenu' && props.preventDefault !== false) {
      nativeEvent.preventDefault();
    } else {
      state.ignoreEmulatedMouseEvents = false;
      removeRootEventTypes(context, state);
      dispatchPressEndEvents(event, context, props, state);
    }
  } else if (state.allowPressReentry) {
    removeRootEventTypes(context, state);
  }
}

function isValidKeyPress(key: string): boolean {
  // Accessibility for keyboards. Space and Enter only.
  return key === ' ' || key === 'Enter';
}

function calculateDelayMS(delay: ?number, min = 0, fallback = 0) {
  const maybeNumber = delay == null ? null : delay;
  return Math.max(min, maybeNumber != null ? maybeNumber : fallback);
}

function getAbsoluteBoundingClientRect(
  target: Element,
): {left: number, right: number, bottom: number, top: number} {
  const clientRect = target.getBoundingClientRect();
  let {left, right, bottom, top} = clientRect;
  let node = target.parentNode;
  let offsetX = 0;
  let offsetY = 0;

  // Traverse through all offset nodes
  while (node != null && node.nodeType !== Node.DOCUMENT_NODE) {
    offsetX += (node: any).scrollLeft;
    offsetY += (node: any).scrollTop;
    node = node.parentNode;
  }
  return {
    left: left + offsetX,
    right: right + offsetX,
    bottom: bottom + offsetY,
    top: top + offsetY,
  };
}

// TODO: account for touch hit slop
function calculateResponderRegion(
  context: ReactResponderContext,
  target: Element,
  props: PressProps,
) {
  const pressRetentionOffset = context.objectAssign(
    {},
    DEFAULT_PRESS_RETENTION_OFFSET,
    props.pressRetentionOffset,
  );

  const clientRect = getAbsoluteBoundingClientRect(target);
  let {left, right, bottom, top} = clientRect;

  if (pressRetentionOffset) {
    if (pressRetentionOffset.bottom != null) {
      bottom += pressRetentionOffset.bottom;
    }
    if (pressRetentionOffset.left != null) {
      left -= pressRetentionOffset.left;
    }
    if (pressRetentionOffset.right != null) {
      right += pressRetentionOffset.right;
    }
    if (pressRetentionOffset.top != null) {
      top -= pressRetentionOffset.top;
    }
  }

  return {
    bottom,
    top,
    left,
    right,
  };
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

function getEventPageCoords(
  nativeEvent: Event,
): {x: null | number, y: null | number} {
  let eventObject = (nativeEvent: any);
  if (isTouchEvent(eventObject)) {
    eventObject = getTouchFromPressEvent(eventObject);
  }
  const pageX = eventObject.pageX;
  const pageY = eventObject.pageY;
  return {
    x: pageX != null ? pageX : null,
    y: pageY != null ? pageY : null,
  };
}

function isPressWithinResponderRegion(
  nativeEvent: $PropertyType<ReactResponderEvent, 'nativeEvent'>,
  state: PressState,
): boolean {
  const {responderRegionOnActivation, responderRegionOnDeactivation} = state;
  let left, top, right, bottom;

  if (responderRegionOnActivation != null) {
    left = responderRegionOnActivation.left;
    top = responderRegionOnActivation.top;
    right = responderRegionOnActivation.right;
    bottom = responderRegionOnActivation.bottom;

    if (responderRegionOnDeactivation != null) {
      left = Math.min(left, responderRegionOnDeactivation.left);
      top = Math.min(top, responderRegionOnDeactivation.top);
      right = Math.max(right, responderRegionOnDeactivation.right);
      bottom = Math.max(bottom, responderRegionOnDeactivation.bottom);
    }
  }
  const {x, y} = getEventPageCoords(((nativeEvent: any): Event));

  return (
    left != null &&
    right != null &&
    top != null &&
    bottom != null &&
    x !== null &&
    y !== null &&
    (x >= left && x <= right && y >= top && y <= bottom)
  );
}

function unmountResponder(
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  if (state.isPressed) {
    removeRootEventTypes(context, state);
    dispatchPressEndEvents(null, context, props, state);
  }
}

function addRootEventTypes(
  context: ReactResponderContext,
  state: PressState,
): void {
  if (!state.addedRootEvents) {
    state.addedRootEvents = true;
    context.addRootEventTypes(rootEventTypes);
  }
}

function removeRootEventTypes(
  context: ReactResponderContext,
  state: PressState,
): void {
  if (state.addedRootEvents) {
    state.addedRootEvents = false;
    state.allowPressReentry = false;
    context.removeRootEventTypes(rootEventTypes);
  }
}

const PressResponder = {
  targetEventTypes,
  createInitialState(): PressState {
    return {
      activationPosition: null,
      addedRootEvents: false,
      didDispatchEvent: false,
      isActivePressed: false,
      isActivePressStart: false,
      isLongPressed: false,
      isPressed: false,
      isPressWithinResponderRegion: true,
      longPressTimeout: null,
      pointerType: '',
      pressEndTimeout: null,
      pressStartTimeout: null,
      pressTarget: null,
      responderRegionOnActivation: null,
      responderRegionOnDeactivation: null,
      ignoreEmulatedMouseEvents: false,
      allowPressReentry: false,
    };
  },
  allowMultipleHostChildren: false,
  stopLocalPropagation: true,
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: PressProps,
    state: PressState,
  ): void {
    const {target, type} = event;

    if (props.disabled) {
      removeRootEventTypes(context, state);
      dispatchPressEndEvents(event, context, props, state);
      state.ignoreEmulatedMouseEvents = false;
      return;
    }
    const nativeEvent: any = event.nativeEvent;
    const pointerType = context.getEventPointerType(event);

    switch (type) {
      // START
      case 'pointerdown':
      case 'keydown':
      case 'keypress':
      case 'mousedown':
      case 'touchstart': {
        if (!state.isPressed) {
          if (type === 'pointerdown' || type === 'touchstart') {
            state.ignoreEmulatedMouseEvents = true;
          }

          // Ignore unrelated key events
          if (pointerType === 'keyboard') {
            if (!isValidKeyPress(nativeEvent.key)) {
              return;
            }
          }

          // Ignore emulated mouse events
          if (type === 'mousedown' && state.ignoreEmulatedMouseEvents) {
            return;
          }
          // Ignore mouse/pen pressing on touch hit target area
          if (
            (pointerType === 'mouse' || pointerType === 'pen') &&
            isEventPositionWithinTouchHitTarget(event, context)
          ) {
            // We need to prevent the native event to block the focus
            nativeEvent.preventDefault();
            return;
          }

          // Ignore any device buttons except left-mouse and touch/pen contact
          if (nativeEvent.button > 0) {
            return;
          }

          state.allowPressReentry = true;
          state.pointerType = pointerType;
          state.pressTarget = context.getEventCurrentTarget(event);
          state.responderRegionOnActivation = calculateResponderRegion(
            context,
            state.pressTarget,
            props,
          );
          state.isPressWithinResponderRegion = true;
          dispatchPressStartEvents(event, context, props, state);
          addRootEventTypes(context, state);
        } else {
          // Prevent spacebar press from scrolling the window
          if (isValidKeyPress(nativeEvent.key) && nativeEvent.key === ' ') {
            nativeEvent.preventDefault();
          }
        }
        break;
      }

      // CANCEL
      case 'contextmenu': {
        dispatchCancel(event, context, props, state);
        break;
      }

      case 'click': {
        if (context.isTargetWithinHostComponent(target, 'a')) {
          const {
            altKey,
            ctrlKey,
            metaKey,
            shiftKey,
          } = (nativeEvent: MouseEvent);
          // Check "open in new window/tab" and "open context menu" key modifiers
          const preventDefault = props.preventDefault;
          if (
            preventDefault !== false &&
            !shiftKey &&
            !metaKey &&
            !ctrlKey &&
            !altKey
          ) {
            nativeEvent.preventDefault();
          }
        }
        break;
      }
    }
  },
  onRootEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: PressProps,
    state: PressState,
  ): void {
    const {target, type} = event;

    const nativeEvent: any = event.nativeEvent;
    const pointerType = context.getEventPointerType(event);

    switch (type) {
      // MOVE
      case 'pointermove':
      case 'mousemove':
      case 'touchmove': {
        if (state.isPressed || state.allowPressReentry) {
          // Ignore emulated events (pointermove will dispatch touch and mouse events)
          // Ignore pointermove events during a keyboard press.
          if (state.pointerType !== pointerType) {
            return;
          }

          // Calculate the responder region we use for deactivation, as the
          // element dimensions may have changed since activation.
          if (
            state.pressTarget !== null &&
            state.responderRegionOnDeactivation == null
          ) {
            state.responderRegionOnDeactivation = calculateResponderRegion(
              context,
              state.pressTarget,
              props,
            );
          }
          state.isPressWithinResponderRegion = isPressWithinResponderRegion(
            nativeEvent,
            state,
          );

          if (state.isPressWithinResponderRegion) {
            if (state.isPressed) {
              if (props.onPressMove) {
                dispatchEvent(
                  event,
                  context,
                  state,
                  'pressmove',
                  props.onPressMove,
                  false,
                );
              }
              if (
                state.activationPosition != null &&
                state.longPressTimeout != null
              ) {
                const deltaX =
                  state.activationPosition.pageX - nativeEvent.pageX;
                const deltaY =
                  state.activationPosition.pageY - nativeEvent.pageY;
                if (
                  Math.hypot(deltaX, deltaY) > 10 &&
                  state.longPressTimeout != null
                ) {
                  context.clearTimeout(state.longPressTimeout);
                }
              }
            } else {
              dispatchPressStartEvents(event, context, props, state);
            }
          } else {
            if (!state.allowPressReentry) {
              removeRootEventTypes(context, state);
            }
            dispatchPressEndEvents(event, context, props, state);
          }
        }
        break;
      }

      // END
      case 'pointerup':
      case 'keyup':
      case 'mouseup':
      case 'touchend': {
        if (state.isPressed) {
          // Ignore unrelated keyboard events and verify press is within
          // responder region for non-keyboard events.
          if (pointerType === 'keyboard') {
            if (!isValidKeyPress(nativeEvent.key)) {
              return;
            }
            // If the event target isn't within the press target, check if we're still
            // within the responder region. The region may have changed if the
            // element's layout was modified after activation.
          } else if (
            state.pressTarget != null &&
            !context.isTargetWithinElement(target, state.pressTarget)
          ) {
            // Calculate the responder region we use for deactivation if not
            // already done during move event.
            if (state.responderRegionOnDeactivation == null) {
              state.responderRegionOnDeactivation = calculateResponderRegion(
                context,
                state.pressTarget,
                props,
              );
            }
            state.isPressWithinResponderRegion = isPressWithinResponderRegion(
              nativeEvent,
              state,
            );
          }

          const wasLongPressed = state.isLongPressed;
          removeRootEventTypes(context, state);
          dispatchPressEndEvents(event, context, props, state);

          if (state.pressTarget !== null && props.onPress) {
            if (state.isPressWithinResponderRegion) {
              if (
                !(
                  wasLongPressed &&
                  props.onLongPressShouldCancelPress &&
                  props.onLongPressShouldCancelPress()
                )
              ) {
                dispatchEvent(
                  event,
                  context,
                  state,
                  'press',
                  props.onPress,
                  true,
                );
              }
            }
          }
        } else if (type === 'mouseup' && state.ignoreEmulatedMouseEvents) {
          state.ignoreEmulatedMouseEvents = false;
        } else if (state.allowPressReentry) {
          removeRootEventTypes(context, state);
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
    props: PressProps,
    state: PressState,
  ) {
    unmountResponder(context, props, state);
  },
  onOwnershipChange(
    context: ReactResponderContext,
    props: PressProps,
    state: PressState,
  ) {
    unmountResponder(context, props, state);
  },
};

export default React.unstable_createEventComponent(PressResponder, 'Press');
