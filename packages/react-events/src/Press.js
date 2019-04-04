/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventResponderContext} from 'events/EventTypes';
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
  context: EventResponderContext,
  state: PressState,
  name: PressEventType,
  listener: (e: Object) => void,
): void {
  const target = ((state.pressTarget: any): Element | Document);
  const syntheticEvent = createPressEvent(name, target, listener);
  context.dispatchEvent(syntheticEvent, {discrete: true});
}

function dispatchPressChangeEvent(
  context: EventResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const listener = () => {
    props.onPressChange(state.isPressed);
  };
  dispatchEvent(context, state, 'presschange', listener);
}

function dispatchLongPressChangeEvent(
  context: EventResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const listener = () => {
    props.onLongPressChange(state.isLongPressed);
  };
  dispatchEvent(context, state, 'longpresschange', listener);
}

function dispatchPressStartEvents(
  context: EventResponderContext,
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

    state.longPressTimeout = setTimeout(
      () =>
        context.withAsyncDispatching(() => {
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
        }),
      delayLongPress,
    );
  }
}

function dispatchPressEndEvents(
  context: EventResponderContext,
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
  handleEvent(
    context: EventResponderContext,
    props: PressProps,
    state: PressState,
  ): void {
    const {eventTarget, eventType, event} = context;

    switch (eventType) {
      /**
       * Respond to pointer events and fall back to mouse.
       */
      case 'pointerdown':
      case 'mousedown': {
        if (
          !state.isPressed &&
          !context.isTargetOwned(eventTarget) &&
          !state.shouldSkipMouseAfterTouch
        ) {
          if (
            (event: any).pointerType === 'mouse' ||
            eventType === 'mousedown'
          ) {
            if (
              // Ignore right- and middle-clicks
              event.button === 1 ||
              event.button === 2 ||
              // Ignore pressing on hit slop area with mouse
              context.isPositionWithinTouchHitTarget(
                (event: any).x,
                (event: any).y,
              )
            ) {
              return;
            }
          }
          state.pressTarget = eventTarget;
          dispatchPressStartEvents(context, props, state);
          context.addRootEventTypes(rootEventTypes);
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
            if (context.isTargetWithinElement(eventTarget, state.pressTarget)) {
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
        if (!state.isPressed && !context.isTargetOwned(eventTarget)) {
          // We bail out of polyfilling anchor tags, given the same heuristics
          // explained above in regards to needing to use click events.
          if (isAnchorTagElement(eventTarget)) {
            state.isAnchorTouched = true;
            return;
          }
          state.pressTarget = eventTarget;
          dispatchPressStartEvents(context, props, state);
          context.addRootEventTypes(rootEventTypes);
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

          if (eventType !== 'touchcancel' && props.onPress) {
            // Find if the X/Y of the end touch is still that of the original target
            const changedTouch = (event: any).changedTouches[0];
            const doc = (eventTarget: any).ownerDocument;
            const target = doc.elementFromPoint(
              changedTouch.screenX,
              changedTouch.screenY,
            );
            if (
              target !== null &&
              context.isTargetWithinEventComponent(target)
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
          !context.isTargetOwned(eventTarget) &&
          isValidKeyPress((event: any).key)
        ) {
          // Prevent spacebar press from scrolling the window
          if ((event: any).key === ' ') {
            (event: any).preventDefault();
          }
          state.pressTarget = eventTarget;
          dispatchPressStartEvents(context, props, state);
          context.addRootEventTypes(rootEventTypes);
        }
        break;
      }
      case 'keyup': {
        if (state.isPressed && isValidKeyPress((event: any).key)) {
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
          (event: any).preventDefault();
          state.defaultPrevented = false;
        }
      }
    }
  },
};

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName: 'Press',
  props: null,
  responder: PressResponder,
};
