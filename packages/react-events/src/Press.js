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
  ReactResponderDispatchEventOptions,
} from 'shared/ReactTypes';
import {REACT_EVENT_COMPONENT_TYPE} from 'shared/ReactSymbols';
import {
  getEventPointerType,
  getEventCurrentTarget,
  isEventPositionWithinTouchHitTarget,
} from './utils';

const CAPTURE_PHASE = 2;

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
  stopPropagation: boolean,
};

type PointerType = '' | 'mouse' | 'keyboard' | 'pen' | 'touch';

type PressState = {
  isActivePressed: boolean,
  isActivePressStart: boolean,
  isLongPressed: boolean,
  isPressed: boolean,
  isPressWithinResponderRegion: boolean,
  longPressTimeout: null | Symbol,
  pointerType: PointerType,
  pressTarget: null | Element | Document,
  pressEndTimeout: null | Symbol,
  pressStartTimeout: null | Symbol,
  responderRegion: null | $ReadOnly<{|
    bottom: number,
    left: number,
    right: number,
    top: number,
  |}>,
  ignoreEmulatedMouseEvents: boolean,
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
  'pointerdown',
  'pointercancel',
];
const rootEventTypes = [
  {name: 'keyup', passive: false},
  {name: 'pointerup', passive: false},
  'pointermove',
  'scroll',
];

// If PointerEvents is not supported (e.g., Safari), also listen to touch and mouse events.
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('touchstart', 'touchend', 'touchcancel', 'mousedown');
  rootEventTypes.push(
    {name: 'mouseup', passive: false},
    'touchmove',
    'mousemove',
  );
}

function createPressEvent(
  type: PressEventType,
  target: Element | Document,
  pointerType: PointerType,
): PressEvent {
  return {
    target,
    type,
    pointerType,
  };
}

function dispatchEvent(
  context: ReactResponderContext,
  state: PressState,
  name: PressEventType,
  listener: (e: Object) => void,
  options?: ReactResponderDispatchEventOptions,
): void {
  const target = ((state.pressTarget: any): Element | Document);
  const pointerType = state.pointerType;
  const syntheticEvent = createPressEvent(name, target, pointerType);
  context.dispatchEvent(
    syntheticEvent,
    listener,
    options || {
      discrete: true,
    },
  );
}

function dispatchPressChangeEvent(
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const bool = state.isActivePressed;
  const listener = () => {
    props.onPressChange(bool);
  };
  dispatchEvent(context, state, 'presschange', listener);
}

function dispatchLongPressChangeEvent(
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const bool = state.isLongPressed;
  const listener = () => {
    props.onLongPressChange(bool);
  };
  dispatchEvent(context, state, 'longpresschange', listener);
}

function activate(context, props, state) {
  const wasActivePressed = state.isActivePressed;
  state.isActivePressed = true;

  if (props.onPressStart) {
    dispatchEvent(context, state, 'pressstart', props.onPressStart);
  }
  if (!wasActivePressed && props.onPressChange) {
    dispatchPressChangeEvent(context, props, state);
  }
}

function deactivate(context, props, state) {
  const wasLongPressed = state.isLongPressed;
  state.isActivePressed = false;
  state.isLongPressed = false;

  if (props.onPressEnd) {
    dispatchEvent(context, state, 'pressend', props.onPressEnd);
  }
  if (props.onPressChange) {
    dispatchPressChangeEvent(context, props, state);
  }
  if (wasLongPressed && props.onLongPressChange) {
    dispatchLongPressChangeEvent(context, props, state);
  }
}

function dispatchPressStartEvents(
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const shouldStopPropagation =
    props.stopPropagation === undefined ? true : props.stopPropagation;
  state.isPressed = true;

  if (state.pressEndTimeout !== null) {
    context.clearTimeout(state.pressEndTimeout);
    state.pressEndTimeout = null;
  }

  const dispatch = () => {
    state.isActivePressStart = true;
    activate(context, props, state);

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
          dispatchEvent(context, state, 'longpress', props.onLongPress);
        }
        if (props.onLongPressChange) {
          dispatchLongPressChangeEvent(context, props, state);
        }
        return shouldStopPropagation;
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
        return shouldStopPropagation;
      }, delayPressStart);
    } else {
      dispatch();
    }
  }
}

function dispatchPressEndEvents(
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const shouldStopPropagation =
    props.stopPropagation === undefined ? true : props.stopPropagation;
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
    if (state.isPressWithinResponderRegion) {
      // if we haven't yet activated (due to delays), activate now
      activate(context, props, state);
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
        deactivate(context, props, state);
        return shouldStopPropagation;
      }, delayPressEnd);
    } else {
      deactivate(context, props, state);
    }
  }
}

function isAnchorTagElement(eventTarget: EventTarget): boolean {
  return (eventTarget: any).nodeName === 'A';
}

function isValidKeyPress(key: string): boolean {
  // Accessibility for keyboards. Space and Enter only.
  return key === ' ' || key === 'Enter';
}

function calculateDelayMS(delay: ?number, min = 0, fallback = 0) {
  const maybeNumber = delay == null ? null : delay;
  return Math.max(min, maybeNumber != null ? maybeNumber : fallback);
}

// TODO: account for touch hit slop
function calculateResponderRegion(target, props) {
  const pressRetentionOffset = {
    ...DEFAULT_PRESS_RETENTION_OFFSET,
    ...props.pressRetentionOffset,
  };

  const clientRect = target.getBoundingClientRect();

  let bottom = clientRect.bottom;
  let left = clientRect.left;
  let right = clientRect.right;
  let top = clientRect.top;

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
  nativeEvent: $PropertyType<ReactResponderEvent, 'nativeEvent'>,
  state: PressState,
): boolean {
  const {responderRegion} = state;
  const event = (nativeEvent: any);

  return (
    responderRegion != null &&
    (event.pageX >= responderRegion.left &&
      event.pageX <= responderRegion.right &&
      event.pageY >= responderRegion.top &&
      event.pageY <= responderRegion.bottom)
  );
}

function unmountResponder(
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  if (state.isPressed) {
    dispatchPressEndEvents(context, props, state);
    context.removeRootEventTypes(rootEventTypes);
  }
}

const PressResponder = {
  targetEventTypes,
  createInitialState(): PressState {
    return {
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
      responderRegion: null,
      ignoreEmulatedMouseEvents: false,
    };
  },
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: PressProps,
    state: PressState,
  ): boolean {
    const {phase, target, type} = event;

    // Press doesn't handle capture target events at this point
    if (phase === CAPTURE_PHASE) {
      return false;
    }

    const nativeEvent: any = event.nativeEvent;
    const pointerType = getEventPointerType(event);
    const shouldStopPropagation =
      props.stopPropagation === undefined ? true : props.stopPropagation;

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
              return shouldStopPropagation;
            }
          }

          // Ignore emulated mouse events and mouse pressing on touch hit target
          // area
          if (type === 'mousedown') {
            if (
              state.ignoreEmulatedMouseEvents ||
              isEventPositionWithinTouchHitTarget(event, context)
            ) {
              return shouldStopPropagation;
            }
          }

          // Ignore any device buttons except left-mouse and touch/pen contact
          if (nativeEvent.button > 0) {
            return shouldStopPropagation;
          }

          state.pointerType = pointerType;
          state.pressTarget = target;
          state.isPressWithinResponderRegion = true;
          dispatchPressStartEvents(context, props, state);
          context.addRootEventTypes(target.ownerDocument, rootEventTypes);
          return shouldStopPropagation;
        } else {
          // Prevent spacebar press from scrolling the window
          if (isValidKeyPress(nativeEvent.key) && nativeEvent.key === ' ') {
            nativeEvent.preventDefault();
            return shouldStopPropagation;
          }
        }
        return shouldStopPropagation;
      }

      // MOVE
      case 'pointermove':
      case 'mousemove':
      case 'touchmove': {
        if (state.isPressed) {
          // Ignore emulated events (pointermove will dispatch touch and mouse events)
          // Ignore pointermove events during a keyboard press
          if (state.pointerType !== pointerType) {
            return shouldStopPropagation;
          }

          if (state.responderRegion == null) {
            state.responderRegion = calculateResponderRegion(
              getEventCurrentTarget(event, context),
              props,
            );
          }
          if (isPressWithinResponderRegion(nativeEvent, state)) {
            state.isPressWithinResponderRegion = true;
            if (props.onPressMove) {
              dispatchEvent(context, state, 'pressmove', props.onPressMove, {
                discrete: false,
              });
            }
          } else {
            state.isPressWithinResponderRegion = false;
            dispatchPressEndEvents(context, props, state);
          }
          return shouldStopPropagation;
        }
        return false;
      }

      // END
      case 'pointerup':
      case 'keyup':
      case 'mouseup':
      case 'touchend': {
        if (state.isPressed) {
          // Ignore unrelated keyboard events
          if (pointerType === 'keyboard') {
            if (!isValidKeyPress(nativeEvent.key)) {
              return false;
            }
          }

          const wasLongPressed = state.isLongPressed;
          dispatchPressEndEvents(context, props, state);

          if (state.pressTarget !== null && props.onPress) {
            if (context.isTargetWithinElement(target, state.pressTarget)) {
              if (
                !(
                  wasLongPressed &&
                  props.onLongPressShouldCancelPress &&
                  props.onLongPressShouldCancelPress()
                )
              ) {
                dispatchEvent(context, state, 'press', props.onPress);
              }
            }
          }
          context.removeRootEventTypes(rootEventTypes);
          return shouldStopPropagation;
        } else if (type === 'mouseup' && state.ignoreEmulatedMouseEvents) {
          state.ignoreEmulatedMouseEvents = false;
        }
        return false;
      }

      // CANCEL
      case 'contextmenu':
      case 'pointercancel':
      case 'scroll':
      case 'touchcancel': {
        if (state.isPressed) {
          if (type === 'contextmenu' && props.preventDefault !== false) {
            nativeEvent.preventDefault();
          } else {
            state.ignoreEmulatedMouseEvents = false;
            dispatchPressEndEvents(context, props, state);
            context.removeRootEventTypes(rootEventTypes);
          }
          return shouldStopPropagation;
        }
        return false;
      }

      case 'click': {
        if (isAnchorTagElement(target)) {
          const {ctrlKey, metaKey, shiftKey} = (nativeEvent: MouseEvent);
          // Check "open in new window/tab" and "open context menu" key modifiers
          const preventDefault = props.preventDefault;
          if (preventDefault !== false && !shiftKey && !metaKey && !ctrlKey) {
            nativeEvent.preventDefault();
          }
          return shouldStopPropagation;
        }
        return false;
      }
    }
    return false;
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

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName: 'Press',
  props: null,
  responder: PressResponder,
};
