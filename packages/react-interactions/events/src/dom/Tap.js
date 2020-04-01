/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactDOMResponderContext,
  ReactDOMResponderEvent,
  PointerType,
} from 'react-dom/src/shared/ReactDOMTypes';
import type {ReactEventResponderListener} from 'shared/ReactTypes';

import * as React from 'react';
import {
  buttonsEnum,
  dispatchDiscreteEvent,
  dispatchUserBlockingEvent,
  getTouchById,
  hasModifierKey,
  hasPointerEvents,
} from './shared';

type TapProps = $ReadOnly<{|
  disabled?: boolean,
  maximumDistance?: number,
  preventDefault?: boolean,
  onAuxiliaryTap?: (e: TapEvent) => void,
  onTapCancel?: (e: TapEvent) => void,
  onTapChange?: boolean => void,
  onTapEnd?: (e: TapEvent) => void,
  onTapStart?: (e: TapEvent) => void,
  onTapUpdate?: (e: TapEvent) => void,
|}>;

type TapGestureState = {|
  altKey: boolean,
  ctrlKey: boolean,
  height: number,
  metaKey: boolean,
  pageX: number,
  pageY: number,
  pointerType: PointerType,
  pressure: number,
  screenX: number,
  screenY: number,
  shiftKey: boolean,
  tangentialPressure: number,
  target: null | Element,
  tiltX: number,
  tiltY: number,
  timeStamp: number,
  twist: number,
  width: number,
  x: number,
  y: number,
|};

type TapState = {|
  activePointerId: null | number,
  buttons: 0 | 1 | 4,
  gestureState: TapGestureState,
  ignoreEmulatedEvents: boolean,
  initialPosition: {|x: number, y: number|},
  isActive: boolean,
  isAuxiliaryActive: boolean,
  pointerType: PointerType,
  responderTarget: null | Element,
  rootEvents: null | Array<string>,
  shouldPreventDefault: boolean,
|};

type TapEventType =
  | 'tap:auxiliary'
  | 'tap:cancel'
  | 'tap:change'
  | 'tap:end'
  | 'tap:start'
  | 'tap:update';

type TapEvent = {|
  ...TapGestureState,
  defaultPrevented: boolean,
  type: TapEventType,
|};

/**
 * Native event dependencies
 */

const targetEventTypes = hasPointerEvents
  ? ['pointerdown']
  : ['mousedown', 'touchstart'];

const rootEventTypes = hasPointerEvents
  ? [
      'click_active',
      'contextmenu',
      'pointerup',
      'pointermove',
      'pointercancel',
      'scroll',
      'blur',
    ]
  : [
      'click_active',
      'contextmenu',
      'mouseup',
      'mousemove',
      'dragstart',
      'touchend',
      'touchmove',
      'touchcancel',
      'scroll',
      'blur',
    ];

/**
 * Responder and gesture state
 */

function createInitialState(): TapState {
  return {
    activePointerId: null,
    buttons: 0,
    ignoreEmulatedEvents: false,
    isActive: false,
    isAuxiliaryActive: false,
    initialPosition: {x: 0, y: 0},
    pointerType: '',
    responderTarget: null,
    rootEvents: null,
    shouldPreventDefault: true,
    gestureState: {
      altKey: false,
      ctrlKey: false,
      height: 1,
      metaKey: false,
      pageX: 0,
      pageY: 0,
      pointerType: '',
      pressure: 0,
      screenX: 0,
      screenY: 0,
      shiftKey: false,
      tangentialPressure: 0,
      target: null,
      tiltX: 0,
      tiltY: 0,
      timeStamp: 0,
      twist: 0,
      width: 1,
      x: 0,
      y: 0,
    },
  };
}

function createPointerEventGestureState(
  context: ReactDOMResponderContext,
  props: TapProps,
  state: TapState,
  event: ReactDOMResponderEvent,
): TapGestureState {
  const timeStamp = context.getTimeStamp();
  const nativeEvent = (event.nativeEvent: any);
  const {
    altKey,
    ctrlKey,
    height,
    metaKey,
    pageX,
    pageY,
    pointerType,
    pressure,
    screenX,
    screenY,
    shiftKey,
    tangentialPressure,
    tiltX,
    tiltY,
    twist,
    width,
    clientX,
    clientY,
  } = nativeEvent;

  return {
    altKey,
    ctrlKey,
    height,
    metaKey,
    pageX,
    pageY,
    pointerType,
    pressure,
    screenX,
    screenY,
    shiftKey,
    tangentialPressure,
    target: state.responderTarget,
    tiltX,
    tiltY,
    timeStamp,
    twist,
    width,
    x: clientX,
    y: clientY,
  };
}

function createFallbackGestureState(
  context: ReactDOMResponderContext,
  props: TapProps,
  state: TapState,
  event: ReactDOMResponderEvent,
): TapGestureState {
  const timeStamp = context.getTimeStamp();
  const nativeEvent = (event.nativeEvent: any);
  const eType = event.type;
  const {altKey, ctrlKey, metaKey, shiftKey} = nativeEvent;
  const isCancelType = eType === 'dragstart' || eType === 'touchcancel';
  const isEndType = eType === 'mouseup' || eType === 'touchend';
  const isTouchEvent = event.pointerType === 'touch';

  let pointerEvent = nativeEvent;
  if (!hasPointerEvents && isTouchEvent) {
    const touch = getTouchById(nativeEvent, state.activePointerId);
    if (touch != null) {
      pointerEvent = touch;
    }
  }

  const {
    pageX,
    pageY,
    // $FlowExpectedError: missing from 'Touch' typedef
    radiusX,
    // $FlowExpectedError: missing from 'Touch' typedef
    radiusY,
    // $FlowExpectedError: missing from 'Touch' typedef
    rotationAngle,
    screenX,
    screenY,
    clientX,
    clientY,
  } = pointerEvent;

  return {
    altKey,
    ctrlKey,
    height: !isCancelType && radiusY != null ? radiusY * 2 : 1,
    metaKey,
    pageX: isCancelType ? 0 : pageX,
    pageY: isCancelType ? 0 : pageY,
    pointerType: event.pointerType,
    pressure: isEndType || isCancelType ? 0 : isTouchEvent ? 1 : 0.5,
    screenX: isCancelType ? 0 : screenX,
    screenY: isCancelType ? 0 : screenY,
    shiftKey,
    tangentialPressure: 0,
    target: state.responderTarget,
    tiltX: 0,
    tiltY: 0,
    timeStamp,
    twist: rotationAngle != null ? rotationAngle : 0,
    width: !isCancelType && radiusX != null ? radiusX * 2 : 1,
    x: isCancelType ? 0 : clientX,
    y: isCancelType ? 0 : clientY,
  };
}

const createGestureState = hasPointerEvents
  ? createPointerEventGestureState
  : createFallbackGestureState;

/**
 * Managing root events
 */

function addRootEventTypes(
  rootEvents: Array<string>,
  context: ReactDOMResponderContext,
  state: TapState,
): void {
  if (!state.rootEvents) {
    state.rootEvents = rootEvents;
    context.addRootEventTypes(state.rootEvents);
  }
}

function removeRootEventTypes(
  context: ReactDOMResponderContext,
  state: TapState,
): void {
  if (state.rootEvents != null) {
    context.removeRootEventTypes(state.rootEvents);
    state.rootEvents = null;
  }
}

/**
 * Managing pointers
 */

function getHitTarget(
  event: ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  state: TapState,
): null | Element | Document {
  if (!hasPointerEvents && event.pointerType === 'touch') {
    const doc = context.getActiveDocument();
    const nativeEvent: any = event.nativeEvent;
    const touch = getTouchById(nativeEvent, state.activePointerId);
    if (touch != null) {
      return doc.elementFromPoint(touch.clientX, touch.clientY);
    } else {
      return null;
    }
  }
  return event.target;
}

function isActivePointer(
  event: ReactDOMResponderEvent,
  state: TapState,
): boolean {
  const nativeEvent: any = event.nativeEvent;
  const activePointerId = state.activePointerId;

  if (hasPointerEvents) {
    const eventPointerId = nativeEvent.pointerId;
    if (activePointerId != null && eventPointerId != null) {
      return (
        state.pointerType === event.pointerType &&
        activePointerId === eventPointerId
      );
    } else {
      return true;
    }
  } else {
    if (event.pointerType === 'touch') {
      const touch = getTouchById(nativeEvent, activePointerId);
      return touch != null;
    } else {
      // accept all events that don't have pointer ids
      return true;
    }
  }
}

function isAuxiliary(buttons: number, event: ReactDOMResponderEvent): boolean {
  const nativeEvent: any = event.nativeEvent;
  const isPrimaryPointer =
    buttons === buttonsEnum.primary || event.pointerType === 'touch';
  return (
    // middle-click
    buttons === buttonsEnum.auxiliary ||
    // open-in-new-tab
    (isPrimaryPointer && nativeEvent.metaKey) ||
    // open-in-new-window
    (isPrimaryPointer && nativeEvent.shiftKey)
  );
}

function shouldActivate(event: ReactDOMResponderEvent): boolean {
  const nativeEvent: any = event.nativeEvent;
  const isPrimaryPointer =
    nativeEvent.buttons === buttonsEnum.primary ||
    event.pointerType === 'touch';
  return isPrimaryPointer && !hasModifierKey(event);
}

/**
 * Communicating gesture state back to components
 */

function dispatchStart(
  context: ReactDOMResponderContext,
  props: TapProps,
  state: TapState,
): void {
  const type = 'tap:start';
  const onTapStart = props.onTapStart;
  if (onTapStart != null) {
    const payload = context.objectAssign({}, state.gestureState, {type});
    dispatchDiscreteEvent(context, payload, onTapStart);
  }
  dispatchChange(context, props, state);
}

function dispatchChange(
  context: ReactDOMResponderContext,
  props: TapProps,
  state: TapState,
): void {
  const onTapChange = props.onTapChange;
  if (onTapChange != null) {
    const payload = state.isActive;
    dispatchDiscreteEvent(context, payload, onTapChange);
  }
}

function dispatchUpdate(
  context: ReactDOMResponderContext,
  props: TapProps,
  state: TapState,
) {
  const type = 'tap:update';
  const onTapUpdate = props.onTapUpdate;
  if (onTapUpdate != null) {
    const payload = context.objectAssign({}, state.gestureState, {type});
    dispatchUserBlockingEvent(context, payload, onTapUpdate);
  }
}

function dispatchEnd(
  context: ReactDOMResponderContext,
  props: TapProps,
  state: TapState,
): void {
  const type = 'tap:end';
  const onTapEnd = props.onTapEnd;
  dispatchChange(context, props, state);
  if (onTapEnd != null) {
    const defaultPrevented = state.shouldPreventDefault === true;
    const payload = context.objectAssign({}, state.gestureState, {
      defaultPrevented,
      type,
    });
    dispatchDiscreteEvent(context, payload, onTapEnd);
  }
}

function dispatchCancel(
  context: ReactDOMResponderContext,
  props: TapProps,
  state: TapState,
): void {
  const type = 'tap:cancel';
  const onTapCancel = props.onTapCancel;
  dispatchChange(context, props, state);
  if (onTapCancel != null) {
    const payload = context.objectAssign({}, state.gestureState, {type});
    dispatchDiscreteEvent(context, payload, onTapCancel);
  }
}

function dispatchAuxiliaryTap(
  context: ReactDOMResponderContext,
  props: TapProps,
  state: TapState,
): void {
  const type = 'tap:auxiliary';
  const onAuxiliaryTap = props.onAuxiliaryTap;
  if (onAuxiliaryTap != null) {
    const payload = context.objectAssign({}, state.gestureState, {
      defaultPrevented: false,
      type,
    });
    dispatchDiscreteEvent(context, payload, onAuxiliaryTap);
  }
}

/**
 * Responder implementation
 */

const responderImpl = {
  targetEventTypes,
  getInitialState(): TapState {
    return createInitialState();
  },
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: TapProps,
    state: TapState,
  ): void {
    if (props.disabled) {
      removeRootEventTypes(context, state);
      if (state.isActive) {
        state.isActive = false;
        dispatchCancel(context, props, state);
      }
      return;
    }

    const nativeEvent: any = event.nativeEvent;
    const eventTarget: Element = nativeEvent.target;
    const eventType = event.type;

    switch (eventType) {
      // START
      case 'pointerdown':
      case 'mousedown':
      case 'touchstart': {
        if (eventType === 'mousedown' && state.ignoreEmulatedEvents) {
          return;
        }

        if (!state.isActive) {
          if (hasPointerEvents) {
            const pointerId = nativeEvent.pointerId;
            state.activePointerId = pointerId;
            // Make mouse and touch pointers consistent.
            // Flow bug: https://github.com/facebook/flow/issues/8055
            // $FlowExpectedError
            eventTarget.releasePointerCapture(pointerId);
          } else {
            if (eventType === 'touchstart') {
              const targetTouches = nativeEvent.targetTouches;
              if (targetTouches.length === 1) {
                state.activePointerId = targetTouches[0].identifier;
              } else {
                return;
              }
            }
          }

          const activate = shouldActivate(event);
          const buttons =
            nativeEvent.button === 1
              ? buttonsEnum.auxiliary
              : nativeEvent.buttons;
          const activateAuxiliary = isAuxiliary(buttons, event);

          if (activate || activateAuxiliary) {
            state.buttons = buttons;
            state.pointerType = event.pointerType;
            state.responderTarget = context.getResponderNode();
            addRootEventTypes(rootEventTypes, context, state);
            if (!hasPointerEvents) {
              if (eventType === 'touchstart') {
                state.ignoreEmulatedEvents = true;
              }
            }
          }

          if (activateAuxiliary) {
            state.isAuxiliaryActive = true;
          } else if (activate) {
            const gestureState = createGestureState(
              context,
              props,
              state,
              event,
            );
            state.isActive = true;
            state.shouldPreventDefault = props.preventDefault !== false;
            state.gestureState = gestureState;
            state.initialPosition.x = gestureState.x;
            state.initialPosition.y = gestureState.y;
            dispatchStart(context, props, state);
          }
        } else if (
          !isActivePointer(event, state) ||
          (eventType === 'touchstart' && nativeEvent.targetTouches.length > 1)
        ) {
          // Cancel the gesture if a second pointer becomes active on the target.
          state.isActive = false;
          dispatchCancel(context, props, state);
        }
        break;
      }
    }
  },
  onRootEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: TapProps,
    state: TapState,
  ): void {
    const nativeEvent: any = event.nativeEvent;
    const eventType = event.type;
    const hitTarget = getHitTarget(event, context, state);

    switch (eventType) {
      // UPDATE
      case 'pointermove':
      case 'mousemove':
      case 'touchmove': {
        if (!hasPointerEvents) {
          if (eventType === 'mousemove' && state.ignoreEmulatedEvents) {
            return;
          }
        }

        if (state.isActive && isActivePointer(event, state)) {
          state.gestureState = createGestureState(context, props, state, event);
          let shouldUpdate = true;

          if (!context.isTargetWithinResponder(hitTarget)) {
            shouldUpdate = false;
          } else if (
            props.maximumDistance != null &&
            props.maximumDistance >= 10
          ) {
            const maxDistance = props.maximumDistance;
            const initialPosition = state.initialPosition;
            const currentPosition = state.gestureState;
            const moveX = initialPosition.x - currentPosition.x;
            const moveY = initialPosition.y - currentPosition.y;
            const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);
            if (moveDistance > maxDistance) {
              shouldUpdate = false;
            }
          }

          if (shouldUpdate) {
            dispatchUpdate(context, props, state);
          } else {
            state.isActive = false;
            dispatchCancel(context, props, state);
          }
        }
        break;
      }

      // END
      case 'pointerup':
      case 'mouseup':
      case 'touchend': {
        if (state.isActive && isActivePointer(event, state)) {
          state.gestureState = createGestureState(context, props, state, event);
          state.isActive = false;
          if (isAuxiliary(state.buttons, event)) {
            dispatchCancel(context, props, state);
            dispatchAuxiliaryTap(context, props, state);
            // Remove the root events here as no 'click' event is dispatched
            removeRootEventTypes(context, state);
          } else if (
            !context.isTargetWithinResponder(hitTarget) ||
            hasModifierKey(event)
          ) {
            dispatchCancel(context, props, state);
          } else {
            dispatchEnd(context, props, state);
          }
        } else if (
          state.isAuxiliaryActive &&
          isAuxiliary(state.buttons, event)
        ) {
          state.isAuxiliaryActive = false;
          state.gestureState = createGestureState(context, props, state, event);
          dispatchAuxiliaryTap(context, props, state);
          // Remove the root events here as no 'click' event is dispatched
          removeRootEventTypes(context, state);
        }

        if (!hasPointerEvents) {
          if (eventType === 'mouseup') {
            state.ignoreEmulatedEvents = false;
          }
        }
        break;
      }

      // CANCEL
      case 'contextmenu':
      case 'pointercancel':
      case 'touchcancel':
      case 'dragstart': {
        if (state.isActive && isActivePointer(event, state)) {
          state.gestureState = createGestureState(context, props, state, event);
          state.isActive = false;
          dispatchCancel(context, props, state);
          removeRootEventTypes(context, state);
        }
        break;
      }

      // CANCEL
      case 'scroll': {
        if (
          state.isActive &&
          state.responderTarget != null &&
          // We ignore incoming scroll events when using mouse events
          state.pointerType !== 'mouse' &&
          // If the scroll target is the document or if the pointer target
          // is within the 'scroll' target, then cancel the gesture
          context.isTargetWithinNode(state.responderTarget, nativeEvent.target)
        ) {
          state.gestureState = createGestureState(context, props, state, event);
          state.isActive = false;
          dispatchCancel(context, props, state);
          removeRootEventTypes(context, state);
        }
        break;
      }

      case 'click': {
        if (state.shouldPreventDefault) {
          nativeEvent.preventDefault();
        }
        removeRootEventTypes(context, state);
        break;
      }
      case 'blur': {
        // If we encounter a blur that happens on the pressed target
        // then disengage the blur.
        if (state.isActive && nativeEvent.target === state.responderTarget) {
          dispatchCancel(context, props, state);
        }
      }
    }
  },
  onUnmount(
    context: ReactDOMResponderContext,
    props: TapProps,
    state: TapState,
  ): void {
    removeRootEventTypes(context, state);
    if (state.isActive) {
      state.isActive = false;
      dispatchCancel(context, props, state);
    }
  },
};

// $FlowFixMe Can't add generic types without causing a parsing/syntax errors
export const TapResponder = React.DEPRECATED_createResponder(
  'Tap',
  responderImpl,
);

export function useTap(
  props: TapProps,
): ?ReactEventResponderListener<any, any> {
  return React.DEPRECATED_useResponder(TapResponder, props);
}
