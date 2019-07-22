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

type PressListenerProps = {|
  onLongPress: (e: PressEvent) => void,
  onLongPressChange: boolean => void,
  onPress: (e: PressEvent) => void,
  onPressChange: boolean => void,
  onPressEnd: (e: PressEvent) => void,
  onPressMove: (e: PressEvent) => void,
  onPressStart: (e: PressEvent) => void,
|};

type PressProps = {
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
  enableLongPress: boolean,
  longPressShouldCancelPress: () => boolean,
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
  isLongPressed: boolean,
  isPressed: boolean,
  isPressWithinResponderRegion: boolean,
  longPressTimeout: null | number,
  pointerType: PointerType,
  pressTarget: null | ReactNativeEventTarget,
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
  activePointerId: null | number,
  touchEvent: null | ReactFaricEventTouch,
};

type PressEventType =
  | 'press'
  | 'pressmove'
  | 'pressstart'
  | 'pressend'
  | 'presschange'
  | 'longpress'
  | 'longpresschange';

const DEFAULT_PRESS_END_DELAY_MS = 0;
const DEFAULT_PRESS_START_DELAY_MS = 0;
const DEFAULT_LONG_PRESS_DELAY_MS = 500;
const DEFAULT_PRESS_RETENTION_OFFSET = {
  bottom: 20,
  top: 20,
  left: 20,
  right: 20,
};

const targetEventTypes = ['topTouchStart'];
const rootEventTypes = ['topTouchMove', 'topTouchEnd', 'topTouchCancel'];

function calculateDelayMS(delay: ?number, min = 0, fallback = 0) {
  const maybeNumber = delay == null ? null : delay;
  return Math.max(min, maybeNumber != null ? maybeNumber : fallback);
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
  eventPropName: string,
  event: ?ReactNativeResponderEvent,
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
  context.dispatchEvent(eventPropName, syntheticEvent, eventPriority);
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

function dispatchPressChangeEvent(context, state): void {
  const bool = state.isActivePressed;
  context.dispatchEvent('onPressChange', bool, DiscreteEvent);
}

function dispatchLongPressChangeEvent(context, state): void {
  const bool = state.isLongPressed;
  context.dispatchEvent('onLongPressChange', bool, DiscreteEvent);
}

function activate(event: ReactNativeResponderEvent, context, props, state) {
  const {pageX: x, pageY: y} = ((state.touchEvent: any): ReactFaricEventTouch);
  const wasActivePressed = state.isActivePressed;
  state.isActivePressed = true;
  if (x !== null && y !== null) {
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

function deactivate(event, context, props, state) {
  const wasLongPressed = state.isLongPressed;
  state.isActivePressed = false;
  state.isLongPressed = false;

  dispatchEvent('onPressEnd', event, context, state, 'pressend', DiscreteEvent);
  dispatchPressChangeEvent(context, state);
  if (wasLongPressed && props.enableLongPress) {
    dispatchLongPressChangeEvent(context, state);
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

function dispatchPressStartEvents(event, context, props, state) {
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

function dispatchPressEndEvents(event, context, props, state): void {
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

const pressResponderImpl = {
  targetEventTypes,
  getInitialState(): PressState {
    return {
      activationPosition: null,
      activePointerId: null,
      addedRootEvents: false,
      isActivePressed: false,
      isActivePressStart: false,
      isLongPressed: false,
      isPressed: false,
      isPressWithinResponderRegion: false,
      longPressTimeout: null,
      pointerType: '',
      pressEndTimeout: null,
      pressStartTimeout: null,
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
        const pressTarget = (state.pressTarget = event.responderTarget);
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
                  const deltaX = state.activationPosition.x - touchEvent.pageX;
                  const deltaY = state.activationPosition.y - touchEvent.pageY;
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
          const wasLongPressed = state.isLongPressed;
          dispatchPressEndEvents(event, context, props, state);

          if (state.pressTarget !== null) {
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

export function usePressListener(props: PressListenerProps): void {
  React.unstable_useListener(PressResponder, props);
}
