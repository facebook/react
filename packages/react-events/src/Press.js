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
  // We need to preventDefault on pointerdown for mouse/pen events
  // that are in hit target area but not the element area.
  {name: 'pointerdown', passive: false},
  'pointercancel',
];
const rootEventTypes = ['keyup', 'pointerup', 'pointermove', 'scroll'];

// If PointerEvents is not supported (e.g., Safari), also listen to touch and mouse events.
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('touchstart', 'touchcancel', 'mousedown');
  rootEventTypes.push(
    {name: 'mouseup', passive: false},
    'touchmove',
    'touchend',
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
function calculateResponderRegion(target: Element, props: PressProps) {
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
  const {responderRegionOnActivation, responderRegionOnDeactivation} = state;
  const event = (nativeEvent: any);
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

  return (
    left != null &&
    right != null &&
    top != null &&
    bottom != null &&
    (event.pageX >= left &&
      event.pageX <= right &&
      event.pageY >= top &&
      event.pageY <= bottom)
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

function dispatchCancel(
  type: string,
  nativeEvent: $PropertyType<ReactResponderEvent, 'nativeEvent'>,
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  if (state.isPressed) {
    if (type === 'contextmenu' && props.preventDefault !== false) {
      (nativeEvent: any).preventDefault();
    } else {
      state.ignoreEmulatedMouseEvents = false;
      dispatchPressEndEvents(context, props, state);
      context.removeRootEventTypes(rootEventTypes);
    }
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
      responderRegionOnActivation: null,
      responderRegionOnDeactivation: null,
      ignoreEmulatedMouseEvents: false,
    };
  },
  stopLocalPropagation: true,
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: PressProps,
    state: PressState,
  ): void {
    const {target, type} = event;

    if (props.disabled) {
      dispatchPressEndEvents(context, props, state);
      context.removeRootEventTypes(rootEventTypes);
      state.ignoreEmulatedMouseEvents = false;
      return;
    }
    const nativeEvent: any = event.nativeEvent;
    const pointerType = getEventPointerType(event);

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

          state.pointerType = pointerType;
          state.pressTarget = getEventCurrentTarget(event, context);
          state.responderRegionOnActivation = calculateResponderRegion(
            state.pressTarget,
            props,
          );
          state.isPressWithinResponderRegion = true;
          dispatchPressStartEvents(context, props, state);
          context.addRootEventTypes(rootEventTypes);
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
        dispatchCancel(type, nativeEvent, context, props, state);
        break;
      }

      case 'click': {
        if (isAnchorTagElement(target)) {
          const {ctrlKey, metaKey, shiftKey} = (nativeEvent: MouseEvent);
          // Check "open in new window/tab" and "open context menu" key modifiers
          const preventDefault = props.preventDefault;
          if (preventDefault !== false && !shiftKey && !metaKey && !ctrlKey) {
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
    const pointerType = getEventPointerType(event);

    switch (type) {
      // MOVE
      case 'pointermove':
      case 'mousemove':
      case 'touchmove': {
        if (state.isPressed) {
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
              state.pressTarget,
              props,
            );
          }
          state.isPressWithinResponderRegion = isPressWithinResponderRegion(
            nativeEvent,
            state,
          );

          if (state.isPressWithinResponderRegion) {
            if (props.onPressMove) {
              dispatchEvent(context, state, 'pressmove', props.onPressMove, {
                discrete: false,
              });
            }
          } else {
            dispatchPressEndEvents(context, props, state);
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
          dispatchPressEndEvents(context, props, state);

          if (state.pressTarget !== null && props.onPress) {
            if (state.isPressWithinResponderRegion) {
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
        } else if (type === 'mouseup' && state.ignoreEmulatedMouseEvents) {
          state.ignoreEmulatedMouseEvents = false;
        }
        break;
      }

      // CANCEL
      case 'pointercancel':
      case 'scroll':
      case 'touchcancel': {
        dispatchCancel(type, nativeEvent, context, props, state);
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

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName: 'Press',
  props: null,
  responder: PressResponder,
};
