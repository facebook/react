/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ResponderEvent, ResponderContext} from 'events/EventTypes';
import {REACT_EVENT_COMPONENT_TYPE} from 'shared/ReactSymbols';

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
  onPressStart: (e: PressEvent) => void,
  pressRententionOffset: Object,
};

type PressState = {
  defaultPrevented: boolean,
  isAnchorTouched: boolean,
  isLongPressed: boolean,
  isPressed: boolean,
  longPressTimeout: null | TimeoutID,
  pressTarget: null | Element | Document,
  shouldSkipMouseAfterTouch: boolean,
};

type PressEventType =
  | 'press'
  | 'pressstart'
  | 'pressend'
  | 'presschange'
  | 'longpress'
  | 'longpresschange';

type PressEvent = {|
  listener: PressEvent => void,
  target: Element | Document,
  type: PressEventType,
|};

// const DEFAULT_PRESS_DELAY_MS = 0;
// const DEFAULT_PRESS_END_DELAY_MS = 0;
// const DEFAULT_PRESS_START_DELAY_MS = 0;
const DEFAULT_LONG_PRESS_DELAY_MS = 500;

const targetEventTypes = [
  {name: 'click', passive: false},
  {name: 'keydown', passive: false},
  'pointerdown',
  'pointercancel',
  'contextmenu',
];
const rootEventTypes = [
  {name: 'keyup', passive: false},
  {name: 'pointerup', passive: false},
  'scroll',
];

// If PointerEvents is not supported (e.g., Safari), also listen to touch and mouse events.
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('touchstart', 'touchend', 'mousedown', 'touchcancel');
  rootEventTypes.push({name: 'mouseup', passive: false});
}

function createPressEvent(
  type: PressEventType,
  target: Element | Document,
  listener: PressEvent => void,
): PressEvent {
  return {
    listener,
    target,
    type,
  };
}

function dispatchEvent(
  context: ResponderContext,
  state: PressState,
  name: PressEventType,
  listener: (e: Object) => void,
): void {
  const target = ((state.pressTarget: any): Element | Document);
  const syntheticEvent = createPressEvent(name, target, listener);
  context.dispatchEvent(syntheticEvent, {discrete: true});
}

function dispatchPressChangeEvent(
  context: ResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const listener = () => {
    props.onPressChange(state.isPressed);
  };
  dispatchEvent(context, state, 'presschange', listener);
}

function dispatchLongPressChangeEvent(
  context: ResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const listener = () => {
    props.onLongPressChange(state.isLongPressed);
  };
  dispatchEvent(context, state, 'longpresschange', listener);
}

function dispatchPressStartEvents(
  context: ResponderContext,
  props: PressProps,
  state: PressState,
): void {
  state.isPressed = true;

  if (props.onPressStart) {
    dispatchEvent(context, state, 'pressstart', props.onPressStart);
  }
  if (props.onPressChange) {
    dispatchPressChangeEvent(context, props, state);
  }
  if ((props.onLongPress || props.onLongPressChange) && !state.isLongPressed) {
    const delayLongPress = calculateDelayMS(
      props.delayLongPress,
      10,
      DEFAULT_LONG_PRESS_DELAY_MS,
    );

    state.longPressTimeout = context.setTimeout(() => {
      state.isLongPressed = true;
      state.longPressTimeout = null;

      if (props.onLongPress) {
        const listener = e => {
          props.onLongPress(e);
          // TODO address this again at some point
          // if (e.nativeEvent.defaultPrevented) {
          //   state.defaultPrevented = true;
          // }
        };
        dispatchEvent(context, state, 'longpress', listener);
      }

      if (props.onLongPressChange) {
        dispatchLongPressChangeEvent(context, props, state);
      }
    }, delayLongPress);
  }
}

function dispatchPressEndEvents(
  context: ResponderContext,
  props: PressProps,
  state: PressState,
): void {
  if (state.longPressTimeout !== null) {
    clearTimeout(state.longPressTimeout);
    state.longPressTimeout = null;
  }
  if (props.onPressEnd) {
    dispatchEvent(context, state, 'pressend', props.onPressEnd);
  }

  if (state.isPressed) {
    state.isPressed = false;
    if (props.onPressChange) {
      dispatchPressChangeEvent(context, props, state);
    }
  }

  if (state.isLongPressed) {
    state.isLongPressed = false;
    if (props.onLongPressChange) {
      dispatchLongPressChangeEvent(context, props, state);
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

function unmountResponder(
  context: ResponderContext,
  props: PressProps,
  state: PressState,
): void {
  if (state.isPressed) {
    state.isPressed = false;
    dispatchPressEndEvents(context, props, state);
    if (state.longPressTimeout !== null) {
      clearTimeout(state.longPressTimeout);
      state.longPressTimeout = null;
    }
  }
}

const PressResponder = {
  targetEventTypes,
  createInitialState(): PressState {
    return {
      defaultPrevented: false,
      isAnchorTouched: false,
      isLongPressed: false,
      isPressed: false,
      longPressTimeout: null,
      pressTarget: null,
      shouldSkipMouseAfterTouch: false,
    };
  },
  onEvent(
    event: ResponderEvent,
    context: ResponderContext,
    props: PressProps,
    state: PressState,
  ): void {
    const {target, type, nativeEvent} = event;

    switch (type) {
      /**
       * Respond to pointer events and fall back to mouse.
       */
      case 'pointerdown':
      case 'mousedown': {
        if (
          !state.isPressed &&
          !context.hasOwnership() &&
          !state.shouldSkipMouseAfterTouch
        ) {
          if (
            (nativeEvent: any).pointerType === 'mouse' ||
            type === 'mousedown'
          ) {
            if (
              // Ignore right- and middle-clicks
              nativeEvent.button === 1 ||
              nativeEvent.button === 2 ||
              // Ignore pressing on hit slop area with mouse
              context.isPositionWithinTouchHitTarget(
                (nativeEvent: any).x,
                (nativeEvent: any).y,
              )
            ) {
              return;
            }
          }
          state.pressTarget = target;
          dispatchPressStartEvents(context, props, state);
          context.addRootEventTypes(target.ownerDocument, rootEventTypes);
        }
        break;
      }
      case 'pointerup':
      case 'mouseup': {
        if (state.isPressed) {
          if (state.shouldSkipMouseAfterTouch) {
            state.shouldSkipMouseAfterTouch = false;
            return;
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
                const listener = e => {
                  props.onPress(e);
                  // TODO address this again at some point
                  // if (e.nativeEvent.defaultPrevented) {
                  //   state.defaultPrevented = true;
                  // }
                };
                dispatchEvent(context, state, 'press', listener);
              }
            }
          }
          context.removeRootEventTypes(rootEventTypes);
        }
        state.isAnchorTouched = false;
        break;
      }

      /**
       * Touch event implementations are only needed for Safari, which lacks
       * support for pointer events.
       */
      case 'touchstart': {
        if (!state.isPressed && !context.hasOwnership()) {
          // We bail out of polyfilling anchor tags, given the same heuristics
          // explained above in regards to needing to use click events.
          if (isAnchorTagElement(target)) {
            state.isAnchorTouched = true;
            return;
          }
          state.pressTarget = target;
          dispatchPressStartEvents(context, props, state);
          context.addRootEventTypes(target.ownerDocument, rootEventTypes);
        }
        break;
      }
      case 'touchend': {
        if (state.isAnchorTouched) {
          state.isAnchorTouched = false;
          return;
        }
        if (state.isPressed) {
          const wasLongPressed = state.isLongPressed;

          dispatchPressEndEvents(context, props, state);

          if (type !== 'touchcancel' && props.onPress) {
            // Find if the X/Y of the end touch is still that of the original target
            const changedTouch = (nativeEvent: any).changedTouches[0];
            const doc = (target: any).ownerDocument;
            const fromTarget = doc.elementFromPoint(
              changedTouch.screenX,
              changedTouch.screenY,
            );
            if (
              fromTarget !== null &&
              context.isTargetWithinEventComponent(fromTarget)
            ) {
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
          state.shouldSkipMouseAfterTouch = true;
          context.removeRootEventTypes(rootEventTypes);
        }
        break;
      }

      /**
       * Keyboard interaction support
       * TODO: determine UX for metaKey + validKeyPress interactions
       */
      case 'keydown': {
        if (
          !state.isPressed &&
          !state.isLongPressed &&
          !context.hasOwnership() &&
          isValidKeyPress((nativeEvent: any).key)
        ) {
          // Prevent spacebar press from scrolling the window
          if ((nativeEvent: any).key === ' ') {
            (nativeEvent: any).preventDefault();
          }
          state.pressTarget = target;
          dispatchPressStartEvents(context, props, state);
          context.addRootEventTypes(target.ownerDocument, rootEventTypes);
        }
        break;
      }
      case 'keyup': {
        if (state.isPressed && isValidKeyPress((nativeEvent: any).key)) {
          const wasLongPressed = state.isLongPressed;
          dispatchPressEndEvents(context, props, state);
          if (state.pressTarget !== null && props.onPress) {
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
          context.removeRootEventTypes(rootEventTypes);
        }
        break;
      }

      case 'contextmenu':
      case 'pointercancel':
      case 'scroll':
      case 'touchcancel': {
        if (state.isPressed) {
          state.shouldSkipMouseAfterTouch = false;
          dispatchPressEndEvents(context, props, state);
          context.removeRootEventTypes(rootEventTypes);
        }
        break;
      }

      case 'click': {
        if (state.defaultPrevented) {
          (nativeEvent: any).preventDefault();
          state.defaultPrevented = false;
        }
      }
    }
  },
  // TODO This method doesn't work as of yet
  onUnmount(context: ResponderContext, props: PressProps, state: PressState) {
    unmountResponder(context, props, state);
  },
  // TODO This method doesn't work as of yet
  onOwnershipChange(
    context: ResponderContext,
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
