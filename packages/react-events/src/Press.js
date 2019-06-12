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
import type {EventPriority} from 'shared/ReactTypes';

import React from 'react';
import {DiscreteEvent, UserBlockingEvent} from 'shared/ReactTypes';

type PressProps = {
  disabled: boolean,
  delayLongPress: number,
  delayPressEnd: number,
  delayPressStart: number,
  onContextMenu: (e: PressEvent) => void,
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
  stopPropagation: boolean,
};

type PointerType = '' | 'mouse' | 'keyboard' | 'pen' | 'touch';

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
  pressTarget: null | Element,
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
  activeTouchID: null | number,
  pointerType: PointerType,
  activeTouchPointerType: PointerType,
  touchPointerCancelled: boolean,
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
  {name: 'touchstart', passive: false},
  {name: 'keydown', passive: false},
  {name: 'contextmenu', passive: false},
  // We need to preventDefault on pointerdown for mouse/pen events
  // that are in hit target area but not the element area.
  {name: 'pointerdown', passive: false},
];
const rootEventTypes = [
  {name: 'click', passive: false},
  'keyup',
  'pointerup',
  'pointermove',
  'scroll',
  'pointercancel',
  // We listen to this here so stopPropagation can
  // block other mouseup events used internally
  {name: 'mouseup', passive: false},
  'touchmove',
  'touchend',
  'touchcancel',
];

// If PointerEvents is not supported (e.g., Safari), also listen to touch and mouse events.
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('mousedown');
  rootEventTypes.push(
    'mousemove',
    // Used as a 'cancel' signal for mouse interactions
    'dragstart',
  );
}

function createPressEvent(
  context: ReactResponderContext,
  type: PressEventType,
  target: Element | Document,
  pointerType: PointerType,
  nativeEvent: null | Event,
  touchEvent: null | Event | Touch,
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

  if (nativeEvent) {
    ({altKey, ctrlKey, metaKey, shiftKey} = (nativeEvent: any));
    let eventObject;
    eventObject = nativeEvent;
    if (touchEvent) {
      eventObject = touchEvent;
    }
    ({clientX, clientY, pageX, pageY, screenX, screenY} = (eventObject: any));
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
  nativeEvent: null | Event,
  touchEvent: null | Touch,
  context: ReactResponderContext,
  state: PressState,
  name: PressEventType,
  listener: (e: Object) => void,
  eventPriority: EventPriority,
): void {
  const target = ((state.pressTarget: any): Element | Document);
  const pointerType = state.pointerType;
  const syntheticEvent = createPressEvent(
    context,
    name,
    target,
    pointerType,
    nativeEvent,
    touchEvent,
  );
  context.dispatchEvent(syntheticEvent, listener, eventPriority);
}

function dispatchPressChangeEvent(
  nativeEvent: null | Event,
  touchEvent: null | Touch,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const bool = state.isActivePressed;
  const listener = () => {
    props.onPressChange(bool);
  };
  dispatchEvent(
    nativeEvent,
    touchEvent,
    context,
    state,
    'presschange',
    listener,
    DiscreteEvent,
  );
}

function dispatchLongPressChangeEvent(
  nativeEvent: null | Event,
  touchEvent: null | Touch,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const bool = state.isLongPressed;
  const listener = () => {
    props.onLongPressChange(bool);
  };
  dispatchEvent(
    nativeEvent,
    touchEvent,
    context,
    state,
    'longpresschange',
    listener,
    DiscreteEvent,
  );
}

function activate(
  nativeEvent: Event,
  touchEvent: null | Touch,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const {clientX: x, clientY: y} = (touchEvent || nativeEvent: any);
  const wasActivePressed = state.isActivePressed;
  state.isActivePressed = true;
  if (x !== null && y !== null) {
    state.activationPosition = {x, y};
  }

  if (props.onPressStart) {
    dispatchEvent(
      nativeEvent,
      touchEvent,
      context,
      state,
      'pressstart',
      props.onPressStart,
      DiscreteEvent,
    );
  }
  if (!wasActivePressed && props.onPressChange) {
    dispatchPressChangeEvent(nativeEvent, touchEvent, context, props, state);
  }
}

function deactivate(
  nativeEvent: null | Event,
  touchEvent: null | Touch,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const wasLongPressed = state.isLongPressed;
  state.isActivePressed = false;
  state.isLongPressed = false;

  if (props.onPressEnd) {
    dispatchEvent(
      nativeEvent,
      touchEvent,
      context,
      state,
      'pressend',
      props.onPressEnd,
      DiscreteEvent,
    );
  }
  if (props.onPressChange) {
    dispatchPressChangeEvent(nativeEvent, touchEvent, context, props, state);
  }
  if (wasLongPressed && props.onLongPressChange) {
    dispatchLongPressChangeEvent(
      nativeEvent,
      touchEvent,
      context,
      props,
      state,
    );
  }
}

function dispatchPressStartEvents(
  nativeEvent: Event,
  touchEvent: null | Touch,
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
    activate(nativeEvent, touchEvent, context, props, state);

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
            nativeEvent,
            touchEvent,
            context,
            state,
            'longpress',
            props.onLongPress,
            DiscreteEvent,
          );
        }
        if (props.onLongPressChange) {
          dispatchLongPressChangeEvent(
            nativeEvent,
            touchEvent,
            context,
            props,
            state,
          );
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
  nativeEvent: null | Event,
  touchEvent: null | Touch,
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
    if (state.isPressWithinResponderRegion && nativeEvent !== null) {
      // if we haven't yet activated (due to delays), activate now
      activate(nativeEvent, touchEvent, context, props, state);
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
        deactivate(nativeEvent, touchEvent, context, props, state);
      }, delayPressEnd);
    } else {
      deactivate(nativeEvent, touchEvent, context, props, state);
    }
  }
}

function dispatchCancel(
  nativeEvent: null | Event,
  touchEvent: null | Touch,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  if (state.isPressed) {
    state.ignoreEmulatedMouseEvents = false;
    dispatchPressEndEvents(nativeEvent, touchEvent, context, props, state);
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
  context: ReactResponderContext,
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

function isPressWithinResponderRegion(
  event: Event | Touch,
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
  const {clientX: x, clientY: y} = (event: any);

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
    dispatchPressEndEvents(null, null, context, props, state);
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
  state.activeTouchID = null;
  if (state.addedRootEvents) {
    state.addedRootEvents = false;
    context.removeRootEventTypes(rootEventTypes);
  }
}

function processPressStart(
  nativeEvent: Event,
  touchEvent: null | Touch,
  context,
  props,
  state,
) {
  // We set these here, before the button check so we have this
  // data around for handling of the context menu
  const pressTarget = (state.pressTarget = context.getCurrentTargetFromTarget(
    touchEvent ? (touchEvent: any).target : (nativeEvent: any).target,
  ));
  state.responderRegionOnActivation = calculateResponderRegion(
    context,
    pressTarget,
    props,
  );
  state.isPressWithinResponderRegion = true;
  dispatchPressStartEvents(nativeEvent, touchEvent, context, props, state);
  addRootEventTypes(context, state);
}

function getTouchPointerType(
  touchEvent: Touch,
  pointerType: PointerType,
): PointerType {
  // touchType is iOS only
  const touchType = (touchEvent: any).touchType;
  if (
    touchType === 'stylus' ||
    pointerType === 'pen' ||
    pointerType === 'stylus'
  ) {
    return 'pen';
  }
  return 'touch';
}

function updatePressResponderRegion(
  nativeEvent: Event,
  touchEvent: null | Touch,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  // Calculate the responder region we use for deactivation if not
  // already done during move event.
  if (
    state.responderRegionOnDeactivation == null &&
    state.pressTarget !== null
  ) {
    state.responderRegionOnDeactivation = calculateResponderRegion(
      context,
      state.pressTarget,
      props,
    );
  }
  state.isPressWithinResponderRegion = isPressWithinResponderRegion(
    touchEvent || nativeEvent,
    state,
  );
}

function processPressResponderRegion(
  nativeEvent: Event,
  touchEvent: null | Touch,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  let target = ((nativeEvent.target: any): Element | Document);
  // Unfortunately, touch events keep the same target as where they were first
  // pressed. So the only way to find the latest target is document.elementFromPoint
  if (touchEvent !== null) {
    const doc = context.getActiveDocument();
    if (doc.elementFromPoint === undefined) {
      return;
    }
    target = doc.elementFromPoint(
      (touchEvent: any).clientX,
      (touchEvent: any).clientY,
    );
    if (target === null || target === state.pressTarget) {
      return;
    }
  }
  // If the event target isn't within the press target, check if we're still
  // within the responder region. The region may have changed if the
  // element's layout was modified after activation.
  if (
    state.pressTarget != null &&
    !context.isTargetWithinElement(target, state.pressTarget)
  ) {
    updatePressResponderRegion(nativeEvent, touchEvent, context, props, state);
  }
}

function processPressEnd(
  nativeEvent: Event,
  touchEvent: null | Touch,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const wasLongPressed = state.isLongPressed;
  dispatchPressEndEvents(nativeEvent, touchEvent, context, props, state);
  if (state.pressTarget !== null && props.onPress) {
    processPressResponderRegion(nativeEvent, touchEvent, context, props, state);
    if (state.isPressWithinResponderRegion) {
      if (
        !(
          wasLongPressed &&
          props.onLongPressShouldCancelPress &&
          props.onLongPressShouldCancelPress()
        )
      ) {
        dispatchEvent(
          nativeEvent,
          touchEvent,
          context,
          state,
          'press',
          props.onPress,
          DiscreteEvent,
        );
      }
    }
  }
}

function dispatchPressMoveEvent(
  nativeEvent: Event,
  touchEvent: null | Touch,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  // Calculate the responder region we use for deactivation, as the
  // element dimensions may have changed since activation.
  updatePressResponderRegion(nativeEvent, touchEvent, context, props, state);

  if (state.isPressWithinResponderRegion) {
    if (state.isPressed) {
      if (props.onPressMove) {
        dispatchEvent(
          nativeEvent,
          touchEvent,
          context,
          state,
          'pressmove',
          props.onPressMove,
          UserBlockingEvent,
        );
      }
      if (state.activationPosition != null && state.longPressTimeout != null) {
        const eventToUse: any = touchEvent || nativeEvent;
        const deltaX = state.activationPosition.x - eventToUse.clientX;
        const deltaY = state.activationPosition.y - eventToUse.clientY;
        if (Math.hypot(deltaX, deltaY) > 10 && state.longPressTimeout != null) {
          context.clearTimeout(state.longPressTimeout);
        }
      }
    } else {
      dispatchPressStartEvents(nativeEvent, touchEvent, context, props, state);
    }
  } else {
    dispatchPressEndEvents(nativeEvent, touchEvent, context, props, state);
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
      pressEndTimeout: null,
      pressStartTimeout: null,
      pressTarget: null,
      responderRegionOnActivation: null,
      responderRegionOnDeactivation: null,
      ignoreEmulatedMouseEvents: false,
      activeTouchID: null,
      pointerType: '',
      activeTouchPointerType: '',
      touchPointerCancelled: false,
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
    const {type} = event;
    const isPressed = state.isPressed;

    if (props.disabled) {
      removeRootEventTypes(context, state);
      dispatchPressEndEvents(null, null, context, props, state);
      state.ignoreEmulatedMouseEvents = false;
      return;
    }
    const nativeEvent: any = event.nativeEvent;

    if (props.stopPropagation === true) {
      nativeEvent.stopPropagation();
    }
    switch (type) {
      // TOUCH START
      case 'touchstart': {
        if (!isPressed) {
          state.ignoreEmulatedMouseEvents = true;
          const changedTouches = nativeEvent.changedTouches;
          // We only care for the first touch.
          if (changedTouches.length > 0) {
            const touchEvent = changedTouches[0];
            const id = touchEvent.identifier;
            // This is only available on iOS
            const pointerType = getTouchPointerType(
              touchEvent,
              state.pointerType,
            );
            if (
              pointerType === 'pen' &&
              context.isEventWithinTouchHitTarget(nativeEvent)
            ) {
              // We need to prevent the native event to block the focus
              nativeEvent.preventDefault();
              return;
            }
            state.activeTouchID = id;
            state.activeTouchPointerType = pointerType;
            state.pointerType = pointerType;
            processPressStart(nativeEvent, touchEvent, context, props, state);
          }
        }
        break;
      }
      // KEYBOARD START
      case 'keydown': {
        if (!isPressed) {
          if (!isValidKeyboardEvent(nativeEvent)) {
            return;
          }
          state.pointerType = 'keyboard';
          processPressStart(nativeEvent, null, context, props, state);
        }
        // Prevent spacebar press from scrolling the window
        if (isValidKeyboardEvent(nativeEvent) && nativeEvent.key === ' ') {
          nativeEvent.preventDefault();
        }
        break;
      }
      // MOUSE + TRACKPAD START
      case 'mousedown':
      case 'pointerdown': {
        if (!isPressed) {
          const pointerType =
            type === 'mousedown' ? 'mouse' : nativeEvent.pointerType || '';
          state.pointerType = pointerType;
          if (
            pointerType === 'mouse' ||
            pointerType === 'trackpad' || // trackpad support is in iOS 13
            pointerType === '' // Handle unknown
          ) {
            // Ignore any device buttons except left-mouse and touch/pen contact.
            // Additionally we ignore left-mouse + ctrl-key with Macs as that
            // acts like right-click and opens the contextmenu.
            if (nativeEvent.button > 0 || (isMac && nativeEvent.ctrlKey)) {
              return;
            }
            if (context.isEventWithinTouchHitTarget(nativeEvent)) {
              // We need to prevent the native event to block the focus
              nativeEvent.preventDefault();
              return;
            }
            processPressStart(nativeEvent, null, context, props, state);
          }
        }
        break;
      }
      // CONTEXT MENU END
      case 'contextmenu': {
        if (isPressed) {
          if (props.preventDefault !== false) {
            // Skip dispatching of onContextMenu below
            nativeEvent.preventDefault();
            return;
          }
          dispatchCancel(nativeEvent, null, context, props, state);
        }
        if (props.onContextMenu) {
          state.pressTarget = nativeEvent.target;
          state.pointerType = 'mouse';
          dispatchEvent(
            nativeEvent,
            null,
            context,
            state,
            'contextmenu',
            props.onContextMenu,
            DiscreteEvent,
          );
        }
        // Click won't occur, so we need to remove root events
        removeRootEventTypes(context, state);
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
    const isPressed = state.isPressed;

    if (props.stopPropagation === true) {
      nativeEvent.stopPropagation();
    }
    switch (type) {
      // TOUCH MOVE
      case 'touchmove': {
        const changedTouches = nativeEvent.changedTouches;
        for (let i = 0; i < changedTouches.length; i++) {
          const touchEvent = changedTouches[i];
          const id = touchEvent.identifier;
          if (state.activeTouchID === id) {
            // Update pointer type to reflect the final state of press up events
            state.pointerType = state.activeTouchPointerType;
            dispatchPressMoveEvent(
              nativeEvent,
              touchEvent,
              context,
              props,
              state,
            );
            break;
          }
        }
        break;
      }
      // MOUSE + TRACKPAD MOVE
      case 'mousemove':
      case 'pointermove': {
        let pointerType = nativeEvent.pointerType || '';
        if (type === 'mousemove') {
          pointerType = 'mouse';
        }
        // If the pointer types do not match, then we're likely
        // simulating the mouse events or we're invoking keyboard
        // events during a move.
        if (state.pointerType !== pointerType) {
          return;
        }
        if (
          pointerType === 'mouse' ||
          pointerType === 'trackpad' ||
          pointerType === ''
        ) {
          // Update pointer type to reflect the final state of press move events
          state.pointerType = ((pointerType: any): PointerType);
          dispatchPressMoveEvent(nativeEvent, null, context, props, state);
        }
        break;
      }
      // TOUCH END
      case 'touchend': {
        if (isPressed) {
          const changedTouches = nativeEvent.changedTouches;
          for (let i = 0; i < changedTouches.length; i++) {
            const touchEvent = changedTouches[i];
            const id = touchEvent.identifier;
            if (state.activeTouchID === id) {
              const pointerType = state.activeTouchPointerType;
              // Update pointer type to reflect the final state of press up events
              state.pointerType = ((pointerType: any): PointerType);
              processPressEnd(nativeEvent, touchEvent, context, props, state);
              break;
            }
          }
        }
        // If the pointer was cancelled, then "click"
        // will never fire so we need to ensure we remove
        // the root event types here.
        if (state.touchPointerCancelled) {
          state.touchPointerCancelled = false;
          removeRootEventTypes(context, state);
        }
        break;
      }
      // MOUSE + TRACKPAD END
      case 'mouseup':
      case 'pointerup': {
        let pointerType = nativeEvent.pointerType || '';
        if (type === 'mouseup') {
          state.ignoreEmulatedMouseEvents = false;
          pointerType = 'mouse';
        }
        if (isPressed) {
          if (
            pointerType === 'mouse' ||
            pointerType === 'trackpad' ||
            pointerType === ''
          ) {
            // Update pointer type to reflect the final state of press up events
            state.pointerType = ((pointerType: any): PointerType);
            processPressEnd(nativeEvent, null, context, props, state);
          }
        }
        break;
      }
      // KEYBOARD END
      case 'keyup': {
        if (isPressed && isValidKeyboardEvent(nativeEvent)) {
          dispatchPressEndEvents(nativeEvent, null, context, props, state);
          if (props.onPress && state.pressTarget !== null) {
            // Update pointer type to reflect the final state of press up events
            state.pointerType = 'keyboard';
            // Fast path for keyboard
            dispatchEvent(
              nativeEvent,
              null,
              context,
              state,
              'press',
              props.onPress,
              DiscreteEvent,
            );
          }
        }
        break;
      }
      // CLICK END
      case 'click': {
        removeRootEventTypes(context, state);
        if (
          context.isTargetWithinEventComponent(target) &&
          context.isTargetWithinHostComponent(target, 'a', true)
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
            nativeEvent.preventDefault();
          }
        }
        break;
      }
      // CANCEL
      case 'scroll':
      case 'dragstart':
      case 'touchcancel': {
        dispatchCancel(nativeEvent, null, context, props, state);
        break;
      }
      case 'pointercancel': {
        const pointerType = nativeEvent.pointerType;
        if (pointerType === 'mouse' || pointerType === 'trackpad') {
          dispatchCancel(nativeEvent, null, context, props, state);
        } else {
          state.touchPointerCancelled = true;
        }
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
