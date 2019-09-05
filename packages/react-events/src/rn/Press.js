/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactNativeResponderEvent,
  ReactNativeResponderContext,
  ReactNativeEventTarget,
  PointerType,
  ReactFaricEventTouch,
  EventPriority,
} from 'react-native-renderer/src/ReactNativeTypes';
import React from 'react';
import {
  DiscreteEvent,
  UserBlockingEvent,
} from 'react-native-renderer/src/ReactNativeTypes';
import type {ReactEventResponderListener} from 'shared/ReactTypes';

type PressProps = {
  disabled: boolean,
  pressRetentionOffset: {
    top: number,
    right: number,
    bottom: number,
    left: number,
  },
  onPress: (e: PressEvent) => void,
  onPressChange: boolean => void,
  onPressEnd: (e: PressEvent) => void,
  onPressMove: (e: PressEvent) => void,
  onPressStart: (e: PressEvent) => void,
};

type PressEvent = {|
  target: ReactNativeEventTarget,
  type: PressEventType,
  pointerType: PointerType,
  timeStamp: number,
  locationX: null | number,
  locationY: null | number,
  pageX: null | number,
  pageY: null | number,
  screenX: null | number,
  screenY: null | number,
  force: null | number,
|};

type PressState = {
  activationPosition: null | $ReadOnly<{|
    x: number,
    y: number,
  |}>,
  addedRootEvents: boolean,
  isActivePressed: boolean,
  isActivePressStart: boolean,
  isPressed: boolean,
  isPressWithinResponderRegion: boolean,
  pointerType: PointerType,
  pressTarget: null | ReactNativeEventTarget,
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
  activePointerId: null | number,
  touchEvent: null | ReactFaricEventTouch,
};

type PressEventType =
  | 'press'
  | 'pressmove'
  | 'pressstart'
  | 'pressend'
  | 'presschange';

const DEFAULT_PRESS_RETENTION_OFFSET = {
  bottom: 20,
  top: 20,
  left: 20,
  right: 20,
};

const targetEventTypes = ['topTouchStart'];
const rootEventTypes = ['topTouchMove', 'topTouchEnd', 'topTouchCancel'];

function isFunction(obj): boolean {
  return typeof obj === 'function';
}

function createPressEvent(
  context: ReactNativeResponderContext,
  type: PressEventType,
  target: ReactNativeEventTarget,
  pointerType: PointerType,
  touchEvent: null | ReactFaricEventTouch,
): PressEvent {
  let timestamp = context.getTimeStamp();
  let locationX = null;
  let locationY = null;
  let pageX = null;
  let pageY = null;
  let screenX = null;
  let screenY = null;
  let force = null;

  if (touchEvent) {
    ({
      force,
      pageX,
      pageY,
      screenX,
      screenY,
      timestamp,
      locationX,
      locationY,
    } = touchEvent);
  }
  return {
    target,
    type,
    pointerType,
    timeStamp: timestamp,
    pageX,
    pageY,
    screenX,
    screenY,
    locationX,
    locationY,
    force,
  };
}

function dispatchEvent(
  event: ?ReactNativeResponderEvent,
  listener: any => void,
  context: ReactNativeResponderContext,
  state: PressState,
  name: PressEventType,
  eventPriority: EventPriority,
): void {
  const target = ((state.pressTarget: any): ReactNativeEventTarget);
  const pointerType = state.pointerType;
  const syntheticEvent = createPressEvent(
    context,
    name,
    target,
    pointerType,
    state.touchEvent,
  );
  context.dispatchEvent(syntheticEvent, listener, eventPriority);
}

function dispatchCancel(event, context, props, state): void {
  state.touchEvent = null;
  if (state.isPressed) {
    dispatchPressEndEvents(event, context, props, state);
  }
  removeRootEventTypes(context, state);
}

function addRootEventTypes(context, state): void {
  if (!state.addedRootEvents) {
    state.addedRootEvents = true;
    context.addRootEventTypes(rootEventTypes);
  }
}

function removeRootEventTypes(context, state): void {
  if (state.addedRootEvents) {
    state.addedRootEvents = false;
    context.removeRootEventTypes(rootEventTypes);
  }
}

function getTouchFromPressEvent(nativeEvent): ReactFaricEventTouch | null {
  const targetTouches = nativeEvent.targetTouches;
  if (targetTouches.length > 0) {
    return targetTouches[0];
  }
  return null;
}

function getTouchById(nativeEvent, pointerId): null | ReactFaricEventTouch {
  const changedTouches = nativeEvent.changedTouches;
  for (let i = 0; i < changedTouches.length; i++) {
    const touch = changedTouches[i];
    if (touch.identifier === pointerId) {
      return touch;
    }
  }
  return null;
}

function calculateResponderRegion(
  context: ReactNativeResponderContext,
  target: ReactNativeEventTarget,
  props: PressProps,
  cb: ({|
    bottom: number,
    top: number,
    left: number,
    right: number,
  |}) => void,
) {
  const pressRetentionOffset = Object.assign(
    {},
    DEFAULT_PRESS_RETENTION_OFFSET,
    props.pressRetentionOffset,
  );

  context.getTargetBoundingRect(target, rect => {
    let {left, right, bottom, top} = rect;

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

    cb({
      bottom,
      top,
      left,
      right,
    });
  });
}

function dispatchPressChangeEvent(
  context: ReactNativeResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const onPressChange = props.onPressChange;
  if (isFunction(onPressChange)) {
    const bool = state.isActivePressed;
    context.dispatchEvent(bool, onPressChange, DiscreteEvent);
  }
}

function validateRegion(touchEvent, state) {
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
  const {pageX: x, pageY: y} = touchEvent;

  state.isPressWithinResponderRegion =
    left != null &&
    right != null &&
    top != null &&
    bottom != null &&
    x !== null &&
    y !== null &&
    (x >= left && x <= right && y >= top && y <= bottom);
}

function updateIsPressWithinResponderRegion(
  target,
  touchEvent,
  context,
  props,
  state,
  cb,
): void {
  const pressTarget = state.pressTarget;
  if (pressTarget != null) {
    // Calculate the responder region we use for deactivation if not
    // already done during move event.
    if (state.responderRegionOnDeactivation == null) {
      calculateResponderRegion(context, pressTarget, props, obj => {
        state.responderRegionOnDeactivation = obj;
        validateRegion(touchEvent, state);
        cb();
      });
      return;
    } else {
      validateRegion(touchEvent, state);
    }
  } else {
    state.isPressWithinResponderRegion = true;
  }
  cb();
}

function dispatchPressStartEvents(
  event: ReactNativeResponderEvent,
  context: ReactNativeResponderContext,
  props: PressProps,
  state: PressState,
): void {
  state.isPressed = true;

  if (!state.isActivePressStart) {
    state.isActivePressStart = true;
    const {
      pageX: x,
      pageY: y,
    } = ((state.touchEvent: any): ReactFaricEventTouch);
    const wasActivePressed = state.isActivePressed;
    state.isActivePressed = true;
    if (x !== undefined && y !== undefined) {
      state.activationPosition = {x, y};
    }
    const onPressStart = props.onPressStart;

    if (isFunction(onPressStart)) {
      dispatchEvent(
        event,
        onPressStart,
        context,
        state,
        'pressstart',
        DiscreteEvent,
      );
    }
    if (!wasActivePressed) {
      dispatchPressChangeEvent(context, props, state);
    }
  }
}

function dispatchPressEndEvents(
  event: ?ReactNativeResponderEvent,
  context: ReactNativeResponderContext,
  props: PressProps,
  state: PressState,
): void {
  state.isActivePressStart = false;
  state.isPressed = false;

  if (state.isActivePressed) {
    state.isActivePressed = false;
    const onPressEnd = props.onPressEnd;

    if (isFunction(onPressEnd)) {
      dispatchEvent(
        event,
        onPressEnd,
        context,
        state,
        'pressend',
        DiscreteEvent,
      );
    }
    dispatchPressChangeEvent(context, props, state);
  }

  state.responderRegionOnDeactivation = null;
}

const pressResponderImpl = {
  targetEventTypes,
  getInitialState(): PressState {
    return {
      activationPosition: null,
      activePointerId: null,
      addedRootEvents: false,
      isActivePressed: false,
      isActivePressStart: false,
      isPressed: false,
      isPressWithinResponderRegion: false,
      pointerType: '',
      pressTarget: null,
      responderRegionOnActivation: null,
      responderRegionOnDeactivation: null,
      touchEvent: null,
    };
  },
  onEvent(
    event: ReactNativeResponderEvent,
    context: ReactNativeResponderContext,
    props: PressProps,
    state: PressState,
  ): void {
    const {nativeEvent, type} = event;

    if (type === 'topTouchStart') {
      if (!state.isPressed) {
        state.pointerType = 'touch';
        const pressTarget = (state.pressTarget = context.getResponderNode());
        const touchEvent = getTouchFromPressEvent(nativeEvent);
        if (touchEvent === null) {
          return;
        }
        state.touchEvent = touchEvent;
        state.activePointerId = touchEvent.identifier;
        calculateResponderRegion(
          context,
          ((pressTarget: any): ReactNativeEventTarget),
          props,
          obj => {
            state.responderRegionOnActivation = obj;
          },
        );
        state.responderRegionOnDeactivation = null;
        state.isPressWithinResponderRegion = true;

        dispatchPressStartEvents(event, context, props, state);
        addRootEventTypes(context, state);
      }
    }
  },
  onRootEvent(
    event: ReactNativeResponderEvent,
    context: ReactNativeResponderContext,
    props: PressProps,
    state: PressState,
  ): void {
    const {nativeEvent, target, type} = event;
    const activePointerId = state.activePointerId;

    switch (type) {
      case 'topTouchMove': {
        const touchEvent = getTouchById(nativeEvent, activePointerId);
        if (touchEvent === null) {
          return;
        }
        state.touchEvent = touchEvent;

        updateIsPressWithinResponderRegion(
          target,
          touchEvent,
          context,
          props,
          state,
          () => {
            if (state.isPressWithinResponderRegion) {
              if (state.isPressed) {
                const onPressMove = props.onPressMove;
                if (isFunction(onPressMove)) {
                  dispatchEvent(
                    event,
                    onPressMove,
                    context,
                    state,
                    'pressmove',
                    UserBlockingEvent,
                  );
                }
              } else {
                dispatchPressStartEvents(event, context, props, state);
              }
            } else {
              dispatchPressEndEvents(event, context, props, state);
            }
          },
        );
        break;
      }
      case 'topTouchEnd': {
        if (state.isPressed) {
          const touchEvent = getTouchById(nativeEvent, activePointerId);
          if (touchEvent === null) {
            return;
          }
          state.touchEvent = touchEvent;
          dispatchPressEndEvents(event, context, props, state);
          const onPress = props.onPress;

          if (state.pressTarget !== null && isFunction(onPress)) {
            // If the event target isn't within the press target, check if we're still
            // within the responder region. The region may have changed if the
            // element's layout was modified after activation.
            updateIsPressWithinResponderRegion(
              target,
              touchEvent,
              context,
              props,
              state,
              () => {
                if (state.isPressWithinResponderRegion) {
                  dispatchEvent(
                    event,
                    onPress,
                    context,
                    state,
                    'press',
                    DiscreteEvent,
                  );
                }
              },
            );
          }
        }
        state.touchEvent = null;
        removeRootEventTypes(context, state);
        break;
      }
      case 'topTouchCancel': {
        dispatchCancel(event, context, props, state);
      }
    }
  },
};

export const PressResponder = React.unstable_createResponder(
  'Press',
  pressResponderImpl,
);

export function usePress(
  props: PressProps,
): ReactEventResponderListener<any, any> {
  return React.unstable_useResponder(PressResponder, props);
}
