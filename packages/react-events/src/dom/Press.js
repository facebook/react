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
import type {EventPriority} from 'shared/ReactTypes';

import React from 'react';
import {DiscreteEvent, UserBlockingEvent} from 'shared/ReactTypes';

type PressListenerProps = {|
  onContextMenu: (e: PressEvent) => void,
  onLongPress: (e: PressEvent) => void,
  onLongPressChange: boolean => void,
  onPress: (e: PressEvent) => void,
  onPressChange: boolean => void,
  onPressEnd: (e: PressEvent) => void,
  onPressMove: (e: PressEvent) => void,
  onPressStart: (e: PressEvent) => void,
|};

type PressProps = {|
  disabled: boolean,
  delayLongPress: number,
  delayPressEnd: number,
  delayPressStart: number,
  pressRetentionOffset: {
    top: number,
    right: number,
    bottom: number,
    left: number,
  },
  preventContextMenu: boolean,
  preventDefault: boolean,
  stopPropagation: boolean,
  enableLongPress: boolean,
  longPressShouldCancelPress: () => boolean,
|};

type PressState = {
  activationPosition: null | $ReadOnly<{|
    x: number,
    y: number,
  |}>,
  addedRootEvents: boolean,
  isActivePressed: boolean,
  isActivePressStart: boolean,
  isLongPressed: boolean,
  isPressed: boolean,
  isPressWithinResponderRegion: boolean,
  longPressTimeout: null | number,
  pointerType: PointerType,
  pressTarget: null | Element | Document,
  pressEndTimeout: null | number,
  pressStartTimeout: null | number,
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
  activePointerId: null | number,
  shouldPreventClick: boolean,
  touchEvent: null | Touch,
};

type PressEventType =
  | 'press'
  | 'pressmove'
  | 'pressstart'
  | 'pressend'
  | 'presschange'
  | 'longpress'
  | 'longpresschange'
  | 'contextmenu';

type PressEvent = {|
  button: 'primary' | 'auxillary',
  defaultPrevented: boolean,
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

const isMac =
  typeof window !== 'undefined' && window.navigator != null
    ? /^Mac/.test(window.navigator.platform)
    : false;
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
  'keydown_active',
  'contextmenu_active',
  // We need to preventDefault on pointerdown for mouse/pen events
  // that are in hit target area but not the element area.
  'pointerdown_active',
  'click_active',
];
const rootEventTypes = [
  'click',
  'keyup',
  'pointerup',
  'pointermove',
  'scroll',
  'pointercancel',
  // We listen to this here so stopPropagation can
  // block other mouseup events used internally
  'mouseup_active',
  'touchend',
];

// If PointerEvents is not supported (e.g., Safari), also listen to touch and mouse events.
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('touchstart', 'mousedown');
  rootEventTypes.push(
    'mousemove',
    'touchmove',
    'touchcancel',
    // Used as a 'cancel' signal for mouse interactions
    'dragstart',
  );
}

function createPressEvent(
  context: ReactDOMResponderContext,
  type: PressEventType,
  target: Element | Document,
  pointerType: PointerType,
  event: ?ReactDOMResponderEvent,
  touchEvent: null | Touch,
  defaultPrevented: boolean,
): PressEvent {
  const timeStamp = context.getTimeStamp();
  let button = 'primary';
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
    eventObject = (touchEvent: any) || (nativeEvent: any);
    if (eventObject) {
      ({clientX, clientY, pageX, pageY, screenX, screenY} = eventObject);
    }
    if (nativeEvent.button === 1) {
      button = 'auxillary';
    }
  }
  return {
    button,
    defaultPrevented,
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
  eventPropName: string,
  event: ?ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  state: PressState,
  name: PressEventType,
  eventPriority: EventPriority,
): void {
  const target = ((state.pressTarget: any): Element | Document);
  const pointerType = state.pointerType;
  const defaultPrevented =
    (event != null && event.nativeEvent.defaultPrevented === true) ||
    (name === 'press' && state.shouldPreventClick);
  const touchEvent = state.touchEvent;
  const syntheticEvent = createPressEvent(
    context,
    name,
    target,
    pointerType,
    event,
    touchEvent,
    defaultPrevented,
  );
  context.dispatchEvent(eventPropName, syntheticEvent, eventPriority);
}

function dispatchPressChangeEvent(
  context: ReactDOMResponderContext,
  state: PressState,
): void {
  const bool = state.isActivePressed;
  context.dispatchEvent('onPressChange', bool, DiscreteEvent);
}

function dispatchLongPressChangeEvent(
  context: ReactDOMResponderContext,
  state: PressState,
): void {
  const bool = state.isLongPressed;
  context.dispatchEvent('onLongPressChange', bool, DiscreteEvent);
}

function activate(event: ReactDOMResponderEvent, context, props, state) {
  const nativeEvent: any = event.nativeEvent;
  const {clientX: x, clientY: y} = state.touchEvent || nativeEvent;
  const wasActivePressed = state.isActivePressed;
  state.isActivePressed = true;
  if (x !== undefined && y !== undefined) {
    state.activationPosition = {x, y};
  }

  dispatchEvent(
    'onPressStart',
    event,
    context,
    state,
    'pressstart',
    DiscreteEvent,
  );
  if (!wasActivePressed) {
    dispatchPressChangeEvent(context, state);
  }
}

function deactivate(event: ?ReactDOMResponderEvent, context, props, state) {
  const wasLongPressed = state.isLongPressed;
  state.isActivePressed = false;
  state.isLongPressed = false;

  dispatchEvent('onPressEnd', event, context, state, 'pressend', DiscreteEvent);
  dispatchPressChangeEvent(context, state);
  if (wasLongPressed && props.enableLongPress) {
    dispatchLongPressChangeEvent(context, state);
  }
}

function dispatchPressStartEvents(
  event: ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
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

    if (!state.isLongPressed && props.enableLongPress) {
      const delayLongPress = calculateDelayMS(
        props.delayLongPress,
        10,
        DEFAULT_LONG_PRESS_DELAY_MS,
      );
      state.longPressTimeout = context.setTimeout(() => {
        state.isLongPressed = true;
        state.longPressTimeout = null;
        dispatchEvent(
          'onLongPress',
          event,
          context,
          state,
          'longpress',
          DiscreteEvent,
        );
        dispatchLongPressChangeEvent(context, state);
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
  event: ?ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
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

  state.responderRegionOnDeactivation = null;
}

function dispatchCancel(
  event: ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  props: PressProps,
  state: PressState,
): void {
  state.touchEvent = null;
  if (state.pressStartTimeout !== null) {
    context.clearTimeout(state.pressStartTimeout);
    state.pressStartTimeout = null;
  }
  if (state.isPressed) {
    state.ignoreEmulatedMouseEvents = false;
    dispatchPressEndEvents(event, context, props, state);
  }
  removeRootEventTypes(context, state);
}

function isValidKeyboardEvent(nativeEvent: Object): boolean {
  const {key, target} = nativeEvent;
  const {tagName, isContentEditable} = target;
  // Accessibility for keyboards. Space and Enter only.
  // "Spacebar" is for IE 11
  return (
    (key === 'Enter' || key === ' ' || key === 'Spacebar') &&
    (tagName !== 'INPUT' &&
      tagName !== 'TEXTAREA' &&
      isContentEditable !== true)
  );
}

function calculateDelayMS(delay: ?number, min = 0, fallback = 0) {
  const maybeNumber = delay == null ? null : delay;
  return Math.max(min, maybeNumber != null ? maybeNumber : fallback);
}

// TODO: account for touch hit slop
function calculateResponderRegion(
  context: ReactDOMResponderContext,
  target: Element,
  props: PressProps,
) {
  const pressRetentionOffset = context.objectAssign(
    {},
    DEFAULT_PRESS_RETENTION_OFFSET,
    props.pressRetentionOffset,
  );

  let {left, right, bottom, top} = target.getBoundingClientRect();

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

function getTouchFromPressEvent(nativeEvent: TouchEvent): null | Touch {
  const targetTouches = nativeEvent.targetTouches;
  if (targetTouches.length > 0) {
    return targetTouches[0];
  }
  return null;
}

function unmountResponder(
  context: ReactDOMResponderContext,
  props: PressProps,
  state: PressState,
): void {
  if (state.isPressed) {
    removeRootEventTypes(context, state);
    dispatchPressEndEvents(null, context, props, state);
  }
}

function addRootEventTypes(
  context: ReactDOMResponderContext,
  state: PressState,
): void {
  if (!state.addedRootEvents) {
    state.addedRootEvents = true;
    context.addRootEventTypes(rootEventTypes);
  }
}

function removeRootEventTypes(
  context: ReactDOMResponderContext,
  state: PressState,
): void {
  if (state.addedRootEvents) {
    state.addedRootEvents = false;
    context.removeRootEventTypes(rootEventTypes);
  }
}

function getTouchById(
  nativeEvent: TouchEvent,
  pointerId: null | number,
): null | Touch {
  const changedTouches = nativeEvent.changedTouches;
  for (let i = 0; i < changedTouches.length; i++) {
    const touch = changedTouches[i];
    if (touch.identifier === pointerId) {
      return touch;
    }
  }
  return null;
}

function getTouchTarget(context: ReactDOMResponderContext, touchEvent: Touch) {
  const doc = context.getActiveDocument();
  return doc.elementFromPoint(touchEvent.clientX, touchEvent.clientY);
}

function updateIsPressWithinResponderRegion(
  nativeEventOrTouchEvent: Event | Touch,
  context: ReactDOMResponderContext,
  props: PressProps,
  state: PressState,
): void {
  // Calculate the responder region we use for deactivation if not
  // already done during move event.
  if (state.responderRegionOnDeactivation == null) {
    state.responderRegionOnDeactivation = calculateResponderRegion(
      context,
      ((state.pressTarget: any): Element),
      props,
    );
  }
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
  const {clientX: x, clientY: y} = (nativeEventOrTouchEvent: any);

  state.isPressWithinResponderRegion =
    left != null &&
    right != null &&
    top != null &&
    bottom != null &&
    x !== null &&
    y !== null &&
    (x >= left && x <= right && y >= top && y <= bottom);
}

function handleStopPropagation(
  props: PressProps,
  context: ReactDOMResponderContext,
  nativeEvent,
): void {
  const stopPropagation = props.stopPropagation;
  if (stopPropagation === true) {
    nativeEvent.stopPropagation();
  }
}

function targetIsDocument(target: null | Node): boolean {
  // When target is null, it is the root
  return target === null || target.nodeType === 9;
}

const pressResponderImpl = {
  targetEventTypes,
  getInitialState(): PressState {
    return {
      activationPosition: null,
      addedRootEvents: false,
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
      activePointerId: null,
      shouldPreventClick: false,
      touchEvent: null,
    };
  },
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: PressProps,
    state: PressState,
  ): void {
    const {pointerId, pointerType, type} = event;

    if (props.disabled) {
      removeRootEventTypes(context, state);
      dispatchPressEndEvents(event, context, props, state);
      state.ignoreEmulatedMouseEvents = false;
      return;
    }
    const nativeEvent: any = event.nativeEvent;
    const isPressed = state.isPressed;

    handleStopPropagation(props, context, nativeEvent);
    switch (type) {
      // START
      case 'pointerdown':
      case 'keydown':
      case 'mousedown':
      case 'touchstart': {
        if (!isPressed) {
          const isTouchEvent = type === 'touchstart';
          const isPointerEvent = type === 'pointerdown';
          const isKeyboardEvent = pointerType === 'keyboard';
          const isMouseEvent = pointerType === 'mouse';

          // Ignore emulated mouse events
          if (type === 'mousedown' && state.ignoreEmulatedMouseEvents) {
            return;
          }

          state.shouldPreventClick = false;
          if (isPointerEvent || isTouchEvent) {
            state.ignoreEmulatedMouseEvents = true;
          } else if (isKeyboardEvent) {
            // Ignore unrelated key events
            if (isValidKeyboardEvent(nativeEvent)) {
              const {
                altKey,
                ctrlKey,
                metaKey,
                shiftKey,
              } = (nativeEvent: MouseEvent);
              if (nativeEvent.key === ' ') {
                nativeEvent.preventDefault();
              } else if (
                props.preventDefault !== false &&
                !shiftKey &&
                !metaKey &&
                !ctrlKey &&
                !altKey
              ) {
                state.shouldPreventClick = true;
              }
            } else {
              return;
            }
          }

          // We set these here, before the button check so we have this
          // data around for handling of the context menu
          state.pointerType = pointerType;
          const pressTarget = (state.pressTarget = event.responderTarget);
          if (isPointerEvent) {
            state.activePointerId = pointerId;
          } else if (isTouchEvent) {
            const touchEvent = getTouchFromPressEvent(nativeEvent);
            if (touchEvent === null) {
              return;
            }
            state.touchEvent = touchEvent;
            state.activePointerId = touchEvent.identifier;
          }

          // Ignore any device buttons except primary/auxillary and touch/pen contact.
          // Additionally we ignore primary-button + ctrl-key with Macs as that
          // acts like right-click and opens the contextmenu.
          if (
            nativeEvent.button > 1 ||
            (isMac && isMouseEvent && nativeEvent.ctrlKey)
          ) {
            return;
          }
          // Exclude document targets
          if (!targetIsDocument(pressTarget)) {
            state.responderRegionOnActivation = calculateResponderRegion(
              context,
              ((pressTarget: any): Element),
              props,
            );
          }
          state.responderRegionOnDeactivation = null;
          state.isPressWithinResponderRegion = true;
          dispatchPressStartEvents(event, context, props, state);
          addRootEventTypes(context, state);
        } else {
          // Prevent spacebar press from scrolling the window
          if (isValidKeyboardEvent(nativeEvent) && nativeEvent.key === ' ') {
            nativeEvent.preventDefault();
          }
        }
        break;
      }

      case 'contextmenu': {
        const preventContextMenu = props.preventContextMenu;

        if (preventContextMenu === true) {
          // Skip dispatching of onContextMenu below
          nativeEvent.preventDefault();
        }

        if (isPressed) {
          const preventDefault = props.preventDefault;

          if (preventDefault !== false && !nativeEvent.defaultPrevented) {
            // Skip dispatching of onContextMenu below
            nativeEvent.preventDefault();
            return;
          }
          dispatchCancel(event, context, props, state);
        }
        dispatchEvent(
          'onContextMenu',
          event,
          context,
          state,
          'contextmenu',
          DiscreteEvent,
        );
        // Click won't occur, so we need to remove root events
        removeRootEventTypes(context, state);
        break;
      }

      case 'click': {
        if (state.shouldPreventClick) {
          nativeEvent.preventDefault();
        }
        break;
      }
    }
  },
  onRootEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: PressProps,
    state: PressState,
  ): void {
    let {pointerId, pointerType, target, type} = event;

    const nativeEvent: any = event.nativeEvent;
    const isPressed = state.isPressed;
    const activePointerId = state.activePointerId;
    const previousPointerType = state.pointerType;

    handleStopPropagation(props, context, nativeEvent);
    switch (type) {
      // MOVE
      case 'pointermove':
      case 'mousemove':
      case 'touchmove': {
        let touchEvent;
        // Ignore emulated events (pointermove will dispatch touch and mouse events)
        // Ignore pointermove events during a keyboard press.
        if (previousPointerType !== pointerType) {
          return;
        }
        if (type === 'pointermove' && activePointerId !== pointerId) {
          return;
        } else if (type === 'touchmove') {
          touchEvent = getTouchById(nativeEvent, activePointerId);
          if (touchEvent === null) {
            return;
          }
          state.touchEvent = touchEvent;
        }
        const pressTarget = state.pressTarget;

        if (pressTarget !== null && !targetIsDocument(pressTarget)) {
          if (
            pointerType === 'mouse' &&
            context.isTargetWithinNode(target, pressTarget)
          ) {
            state.isPressWithinResponderRegion = true;
          } else {
            // Calculate the responder region we use for deactivation, as the
            // element dimensions may have changed since activation.
            updateIsPressWithinResponderRegion(
              touchEvent || nativeEvent,
              context,
              props,
              state,
            );
          }
        }

        if (state.isPressWithinResponderRegion) {
          if (isPressed) {
            dispatchEvent(
              'onPressMove',
              event,
              context,
              state,
              'pressmove',
              UserBlockingEvent,
            );
            if (
              state.activationPosition != null &&
              state.longPressTimeout != null
            ) {
              const deltaX = state.activationPosition.x - nativeEvent.clientX;
              const deltaY = state.activationPosition.y - nativeEvent.clientY;
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
          dispatchPressEndEvents(event, context, props, state);
        }
        break;
      }

      // END
      case 'pointerup':
      case 'keyup':
      case 'mouseup':
      case 'touchend': {
        if (isPressed) {
          const button = nativeEvent.button;
          let isKeyboardEvent = false;
          let touchEvent;
          if (type === 'pointerup' && activePointerId !== pointerId) {
            return;
          } else if (type === 'touchend') {
            touchEvent = getTouchById(nativeEvent, activePointerId);
            if (touchEvent === null) {
              return;
            }
            state.touchEvent = touchEvent;
            target = getTouchTarget(context, touchEvent);
          } else if (type === 'keyup') {
            // Ignore unrelated keyboard events
            if (!isValidKeyboardEvent(nativeEvent)) {
              return;
            }
            isKeyboardEvent = true;
            removeRootEventTypes(context, state);
          } else if (button === 1) {
            // Remove the root events here as no 'click' event is dispatched when this 'button' is pressed.
            removeRootEventTypes(context, state);
          }

          // Determine whether to call preventDefault on subsequent native events.
          if (
            context.isTargetWithinResponder(target) &&
            context.isTargetWithinHostComponent(target, 'a')
          ) {
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
              state.shouldPreventClick = true;
            }
          }

          const wasLongPressed = state.isLongPressed;
          const pressTarget = state.pressTarget;
          dispatchPressEndEvents(event, context, props, state);

          if (pressTarget !== null) {
            if (
              !isKeyboardEvent &&
              pressTarget !== null &&
              !targetIsDocument(pressTarget)
            ) {
              if (
                pointerType === 'mouse' &&
                context.isTargetWithinNode(target, pressTarget)
              ) {
                state.isPressWithinResponderRegion = true;
              } else {
                // If the event target isn't within the press target, check if we're still
                // within the responder region. The region may have changed if the
                // element's layout was modified after activation.
                updateIsPressWithinResponderRegion(
                  touchEvent || nativeEvent,
                  context,
                  props,
                  state,
                );
              }
            }
            if (state.isPressWithinResponderRegion && button !== 1) {
              if (
                !(
                  wasLongPressed &&
                  props.enableLongPress &&
                  props.longPressShouldCancelPress &&
                  props.longPressShouldCancelPress()
                )
              ) {
                dispatchEvent(
                  'onPress',
                  event,
                  context,
                  state,
                  'press',
                  DiscreteEvent,
                );
              }
            }
          }
          state.touchEvent = null;
        } else if (type === 'mouseup') {
          state.ignoreEmulatedMouseEvents = false;
        }
        break;
      }

      case 'click': {
        // "keyup" occurs after "click"
        if (previousPointerType !== 'keyboard') {
          removeRootEventTypes(context, state);
        }
        break;
      }

      // CANCEL
      case 'scroll': {
        // We ignore incoming scroll events when using mouse events
        if (previousPointerType === 'mouse') {
          return;
        }
        const pressTarget = state.pressTarget;
        const scrollTarget = nativeEvent.target;
        const doc = context.getActiveDocument();
        // If the scroll target is the document or if the press target
        // is inside the scroll target, then this a scroll that should
        // trigger a cancel.
        if (
          pressTarget !== null &&
          (scrollTarget === doc ||
            context.isTargetWithinNode(pressTarget, scrollTarget))
        ) {
          dispatchCancel(event, context, props, state);
        }
        break;
      }
      case 'pointercancel':
      case 'touchcancel':
      case 'dragstart': {
        dispatchCancel(event, context, props, state);
      }
    }
  },
  onUnmount(
    context: ReactDOMResponderContext,
    props: PressProps,
    state: PressState,
  ) {
    unmountResponder(context, props, state);
  },
  onOwnershipChange(
    context: ReactDOMResponderContext,
    props: PressProps,
    state: PressState,
  ) {
    unmountResponder(context, props, state);
  },
};

export const PressResponder = React.unstable_createResponder(
  'Press',
  pressResponderImpl,
);

export function usePressListener(props: PressListenerProps): void {
  React.unstable_useListener(PressResponder, props);
}
