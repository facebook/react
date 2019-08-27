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
} from 'shared/ReactDOMTypes';
import type {ReactEventResponderListener} from 'shared/ReactTypes';

import React from 'react';
import {
  buttonsEnum,
  hasPointerEvents,
  isMac,
  dispatchDiscreteEvent,
  dispatchUserBlockingEvent,
} from './shared';

type TapProps = {|
  disabled: boolean,
  preventDefault: boolean,
  onTapCancel: (e: TapEvent) => void,
  onTapChange: boolean => void,
  onTapEnd: (e: TapEvent) => void,
  onTapStart: (e: TapEvent) => void,
  onTapUpdate: (e: TapEvent) => void,
|};

type TapState = {
  isActive: boolean,
  // TODO: remove and rely on gesture state
  buttons: 0 | 1 | 4,
  gestureState: TapGestureState,
  ignoreEmulatedEvents: boolean,
  // TODO: move to gesture state?
  pointerId: null | number,
  pointerType: PointerType,
  rootEvents: null | Array<string>,
  shouldPreventClick: boolean,
};

type TapEventType =
  | 'tap-cancel'
  | 'tap-change'
  | 'tap-end'
  | 'tap-start'
  | 'tap-update';

type TapGestureState = {|
  altKey: boolean,
  buttons: 0 | 1 | 4,
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
  target: Element,
  tiltX: number,
  tiltY: number,
  timeStamp: number,
  twist: number,
  width: number,
  x: number,
  y: number,
|};

type TapEvent = {|
  ...TapGestureState,
  type: TapEventType,
|};

function createGestureState(
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
    buttons: state.buttons,
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
    target: event.responderTarget,
    tiltX,
    tiltY,
    timeStamp,
    twist,
    width,
    x: clientX,
    y: clientY,
  };
}

function dispatchStart(
  context: ReactDOMResponderContext,
  props: TapProps,
  state: TapState,
): void {
  const type = 'tap:start';
  const onTapStart = props.onTapStart;
  if (onTapStart != null) {
    const payload = {...state.gestureState, type};
    dispatchDiscreteEvent(context, payload, onTapStart);
  }
}

function onChange(
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
    const payload = {...state.gestureState, type};
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
  if (onTapEnd != null) {
    const payload = {...state.gestureState, type};
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
  if (onTapCancel != null) {
    const payload = {...state.gestureState, type};
    dispatchDiscreteEvent(context, payload, onTapCancel);
  }
}

function addRootEventTypes(
  rootEventTypes: Array<string>,
  context: ReactDOMResponderContext,
  state: TapState,
): void {
  if (!state.rootEvents) {
    state.rootEvents = rootEventTypes;
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

function shouldActivate(event: ReactDOMResponderEvent): boolean {
  const nativeEvent: any = event.nativeEvent;
  const pointerType = event.pointerType;
  const buttons = nativeEvent.buttons;
  const isContextMenu = pointerType === 'mouse' && nativeEvent.ctrlKey && isMac;
  const isValidButton =
    buttons === buttonsEnum.primary || buttons === buttonsEnum.middle;

  if (pointerType === 'touch' || (isValidButton && !isContextMenu)) {
    return true;
  } else {
    return false;
  }
}

function isActivePointer(event, state) {
  return (
    state.pointerType === event.pointerType &&
    state.pointerId === event.pointerId
  );
}

function isModifiedTap(event) {
  const nativeEvent: any = event.nativeEvent;
  const {altKey, ctrlKey, metaKey, shiftKey} = nativeEvent;
  return (
    altKey === true || ctrlKey === true || metaKey === true || shiftKey === true
  );
}

function createInitialState(): TapState {
  return {
    buttons: 0,
    pointerId: null,
    ignoreEmulatedEvents: false,
    pointerType: '',
    isActive: false,
    rootEvents: null,
    shouldPreventClick: true,
    gestureState: {
      altKey: false,
      buttons: 0,
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
      target: document.createElement('div'),
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

function isCancelEvent(event) {
  const eventType = event.type;
  return eventType === 'contextmenu' || eventType === 'scroll';
}

const targetEventTypes = ['pointerdown'];
const rootEventTypes = [
  'click_active',
  'contextmenu',
  'pointerup',
  'pointermove',
  'pointercancel',
  'scroll',
];

const pointerEventsImpl = {
  targetEventTypes,
  getInitialState(): TapState {
    return createInitialState();
  },
  onMount(context: ReactDOMResponderContext, props: TapProps, state: TapState) {
    // touchAction
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
        dispatchCancel(context, props, state);
        state.isActive = false;
      }
      return;
    }

    const nativeEvent: any = event.nativeEvent;
    const eventTarget: Element = nativeEvent.target;
    const eventType = event.type;

    switch (eventType) {
      // START
      case 'pointerdown': {
        if (!state.isActive && shouldActivate(event)) {
          const eventPointerId = event.pointerId;
          // Make mouse and touch pointers consistent.
          if (eventPointerId != null) {
            // Flow bug: https://github.com/facebook/flow/issues/8055
            // $FlowExpectedError
            eventTarget.releasePointerCapture(eventPointerId);
          }

          state.isActive = true;
          state.buttons = nativeEvent.buttons;
          state.pointerId = eventPointerId;
          state.pointerType = event.pointerType;
          state.shouldPreventClick = props.preventDefault !== false;
          state.gestureState = createGestureState(context, props, state, event);
          dispatchStart(context, props, state);
          onChange(context, props, state);
          addRootEventTypes(rootEventTypes, context, state);
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
    const eventResponderTarget = event.responderTarget;
    const eventTarget = event.target;
    const eventType = event.type;

    const pointerType = state.pointerType;

    switch (eventType) {
      // MOVE
      case 'pointermove': {
        if (state.isActive && isActivePointer(event, state)) {
          state.gestureState = createGestureState(context, props, state, event);
          if (context.isTargetWithinResponder(eventTarget)) {
            dispatchUpdate(context, props, state);
          } else {
            state.isActive = false;
            onChange(context, props, state);
            dispatchCancel(context, props, state);
          }
        }
        break;
      }

      // END
      case 'pointerup': {
        if (state.isActive && isActivePointer(event, state)) {
          if (state.buttons === buttonsEnum.middle) {
            // Remove the root events here as no 'click' event is dispatched
            // when this 'button' is pressed.
            removeRootEventTypes(context, state);
          }

          state.gestureState = createGestureState(context, props, state, event);

          if (context.isTargetWithinResponder(eventTarget)) {
            // Determine whether to call preventDefault on subsequent native events.
            if (isModifiedTap(event)) {
              state.shouldPreventClick = false;
            }
            dispatchEnd(context, props, state);
          } else {
            dispatchCancel(context, props, state);
          }
          state.isActive = false;
          onChange(context, props, state);
        }
        break;
      }

      // CANCEL
      case 'contextmenu':
      case 'pointercancel': {
        if (
          state.isActive &&
          (isActivePointer(event, state) || isCancelEvent(event))
        ) {
          state.gestureState = createGestureState(context, props, state, event);
          dispatchCancel(context, props, state);
          state.isActive = false;
          onChange(context, props, state);
        }
        break;
      }

      // CANCEL
      case 'scroll': {
        if (
          state.isActive &&
          // We ignore incoming scroll events when using mouse events
          pointerType !== 'mouse' &&
          // If the scroll target is the document or if the pointer target
          // is within the 'scroll' target, then cancel the gesture
          context.isTargetWithinNode(eventResponderTarget, nativeEvent.target)
        ) {
          state.gestureState = createGestureState(context, props, state, event);
          dispatchCancel(context, props, state);
          state.isActive = false;
          onChange(context, props, state);
        }
        break;
      }

      case 'click': {
        if (state.shouldPreventClick) {
          nativeEvent.preventDefault();
        }
        removeRootEventTypes(context, state);
        break;
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
      dispatchCancel(context, props, state);
      state.isActive = false;
    }
  },
};

const fallbackTargetEventTypes = ['mousedown', 'touchstart'];
const fallbackRootEventTypes = [
  'click_active',
  'contextmenu',
  'mouseup',
  'mousemove',
  'dragstart',
  'touchend',
  'touchmove',
  'touchcancel',
  'scroll',
];

function createFallbackGestureState(
  context: ReactDOMResponderContext,
  props: TapProps,
  state: TapState,
  event: ReactDOMResponderEvent,
): TapGestureState {
  const timeStamp = context.getTimeStamp();
  const nativeEvent = (event.nativeEvent: any);
  const isUpEvent = event.type === 'mouseup' || event.type === 'touchend';
  const isCancelType =
    event.type === 'dragstart' || event.type === 'touchcancel';
  const isTouchEvent = nativeEvent.changedTouches != null;

  const {altKey, ctrlKey, metaKey, shiftKey} = nativeEvent;

  let pointerEvent = nativeEvent;
  if (isTouchEvent) {
    // TODO: use getTouchById
    pointerEvent = nativeEvent.changedTouches[0];
  }

  const {
    pageX,
    pageY,
    radiusX,
    radiusY,
    rotationAngle,
    screenX,
    screenY,
    clientX,
    clientY,
  } = pointerEvent;

  return {
    altKey,
    buttons: state.buttons != null ? state.buttons : 1,
    ctrlKey,
    height: !isCancelType && radiusY != null ? radiusY * 2 : 1,
    metaKey,
    pageX: isCancelType ? 0 : pageX,
    pageY: isCancelType ? 0 : pageY,
    pointerType: event.pointerType,
    pressure: isUpEvent || isCancelType ? 0 : isTouchEvent ? 1 : 0.5,
    screenX: isCancelType ? 0 : screenX,
    screenY: isCancelType ? 0 : screenY,
    shiftKey,
    tangentialPressure: 0,
    target: event.responderTarget,
    tiltX: 0,
    tiltY: 0,
    timeStamp,
    twist: rotationAngle != null ? rotationAngle : 0,
    width: !isCancelType && radiusX != null ? radiusX * 2 : 1,
    x: isCancelType ? 0 : clientX,
    y: isCancelType ? 0 : clientY,
  };
}

const fallbackImpl = {
  targetEventTypes: fallbackTargetEventTypes,
  getInitialState(): TapState {
    return createInitialState();
  },
  onMount(context: ReactDOMResponderContext, props: TapProps, state: TapState) {
    // touchAction
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
        dispatchCancel(context, props, state);
        state.isActive = false;
      }
      return;
    }

    const nativeEvent: any = event.nativeEvent;
    const eventType = event.type;

    switch (eventType) {
      // START
      case 'mousedown':
      case 'touchstart': {
        if (eventType === 'mousedown' && state.ignoreEmulatedEvents) {
          return;
        }

        if (!state.isActive && shouldActivate(event)) {
          state.isActive = true;
          state.buttons = nativeEvent.buttons;
          state.pointerId = event.pointerId;
          state.pointerType = event.pointerType;
          state.shouldPreventClick = props.preventDefault !== false;
          state.gestureState = createFallbackGestureState(
            context,
            props,
            state,
            event,
          );
          dispatchStart(context, props, state);
          onChange(context, props, state);
          addRootEventTypes(fallbackRootEventTypes, context, state);

          if (eventType === 'touchstart') {
            state.ignoreEmulatedEvents = true;
          }
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
    const eventResponderTarget = event.responderTarget;
    const eventTarget = event.target;
    const eventType = event.type;

    const pointerType = state.pointerType;

    const hitTarget =
      event.pointerType === 'touch'
        ? document.elementFromPoint(
            nativeEvent.changedTouches[0].clientX,
            nativeEvent.changedTouches[0].clientY,
          )
        : eventTarget;

    switch (eventType) {
      // MOVE
      case 'mousemove':
      case 'touchmove': {
        if (eventType === 'mousemove' && state.ignoreEmulatedEvents) {
          return;
        }

        if (state.isActive && isActivePointer(event, state)) {
          state.gestureState = createFallbackGestureState(
            context,
            props,
            state,
            event,
          );
          if (context.isTargetWithinResponder(hitTarget)) {
            dispatchUpdate(context, props, state);
          } else {
            state.isActive = false;
            onChange(context, props, state);
            dispatchCancel(context, props, state);
          }
        }
        break;
      }

      // END
      case 'mouseup':
      case 'touchend': {
        if (state.isActive && isActivePointer(event, state)) {
          if (state.buttons === buttonsEnum.middle) {
            // Remove the root events here as no 'click' event is dispatched
            // when this 'button' is pressed.
            removeRootEventTypes(context, state);
          }

          state.gestureState = createFallbackGestureState(
            context,
            props,
            state,
            event,
          );

          if (context.isTargetWithinResponder(hitTarget)) {
            // Determine whether to call preventDefault on subsequent native events.
            if (isModifiedTap(event)) {
              state.shouldPreventClick = false;
            }
            dispatchEnd(context, props, state);
          } else {
            dispatchCancel(context, props, state);
          }
          state.isActive = false;
          onChange(context, props, state);
        }

        if (eventType === 'mouseup') {
          state.ignoreEmulatedEvents = false;
        }
        break;
      }

      // CANCEL
      case 'contextmenu':
      case 'dragstart':
      case 'touchcancel': {
        if (
          state.isActive &&
          (isActivePointer(event, state) || isCancelEvent(event))
        ) {
          state.gestureState = createFallbackGestureState(
            context,
            props,
            state,
            event,
          );
          dispatchCancel(context, props, state);
          state.isActive = false;
          onChange(context, props, state);
        }
        break;
      }

      // CANCEL
      case 'scroll': {
        if (
          state.isActive &&
          // We ignore incoming scroll events when using mouse events
          pointerType !== 'mouse' &&
          // If the scroll target is the document or if the press target
          // is inside the scroll target, then this a scroll that should
          // trigger a cancel.
          context.isTargetWithinNode(eventResponderTarget, nativeEvent.target)
        ) {
          state.gestureState = createFallbackGestureState(
            context,
            props,
            state,
            event,
          );
          dispatchCancel(context, props, state);
          state.isActive = false;
          onChange(context, props, state);
        }
        break;
      }

      case 'click': {
        if (state.shouldPreventClick) {
          nativeEvent.preventDefault();
        }
        removeRootEventTypes(context, state);
        break;
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
      dispatchCancel(context, props, state);
      state.isActive = false;
    }
  },
};

export const TapResponder = React.unstable_createResponder(
  'Tap',
  hasPointerEvents ? pointerEventsImpl : fallbackImpl,
);

export function useTap(props: TapProps): ReactEventResponderListener<any, any> {
  return React.unstable_useResponder(TapResponder, props);
}
