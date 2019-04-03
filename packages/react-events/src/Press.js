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

// const DEFAULT_PRESS_DELAY_MS = 0;
// const DEFAULT_PRESS_END_DELAY_MS = 0;
// const DEFAULT_PRESS_START_DELAY_MS = 0;
const DEFAULT_LONG_PRESS_DELAY_MS = 1000;

const targetEventTypes = [
  {name: 'click', passive: false},
  {name: 'keydown', passive: false},
  'pointerdown',
  'pointercancel',
  'contextmenu',
];
const rootEventTypes = [{name: 'pointerup', passive: false}, 'scroll'];

// In the case we don't have PointerEvents (Safari), we listen to touch events
// too
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('touchstart', 'touchend', 'mousedown', 'touchcancel');
  rootEventTypes.push({name: 'mouseup', passive: false});
}

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

function dispatchPressEvent(
  context: EventResponderContext,
  state: PressState,
  name: PressEventType,
  listener: (e: Object) => void,
): void {
  const target = ((state.pressTarget: any): Element | Document);
  const syntheticEvent = createPressEvent(name, target, listener);
  context.dispatchEvent(syntheticEvent, {discrete: true});
}

function dispatchPressStartEvents(
  context: EventResponderContext,
  props: PressProps,
  state: PressState,
): void {
  function dispatchPressChangeEvent(bool) {
    const pressChangeEventListener = () => {
      props.onPressChange(bool);
    };
    dispatchPressEvent(context, state, 'presschange', pressChangeEventListener);
  }

  if (props.onPressStart) {
    dispatchPressEvent(context, state, 'pressstart', props.onPressStart);
  }
  if (props.onPressChange) {
    dispatchPressChangeEvent(true);
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
            const longPressEventListener = e => {
              props.onLongPress(e);
              // TODO address this again at some point
              // if (e.nativeEvent.defaultPrevented) {
              //   state.defaultPrevented = true;
              // }
            };
            dispatchPressEvent(
              context,
              state,
              'longpress',
              longPressEventListener,
            );
          }

          if (props.onLongPressChange) {
            const longPressChangeEventListener = () => {
              props.onLongPressChange(true);
            };
            dispatchPressEvent(
              context,
              state,
              'longpresschange',
              longPressChangeEventListener,
            );
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
    dispatchPressEvent(context, state, 'pressend', props.onPressEnd);
  }
  if (props.onPressChange) {
    const pressChangeEventListener = () => {
      props.onPressChange(false);
    };
    dispatchPressEvent(context, state, 'presschange', pressChangeEventListener);
  }
  if (props.onLongPressChange && state.isLongPressed) {
    const longPressChangeEventListener = () => {
      props.onLongPressChange(false);
    };
    dispatchPressEvent(
      context,
      state,
      'longpresschange',
      longPressChangeEventListener,
    );
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
      case 'keydown': {
        if (
          !props.onPress ||
          context.isTargetOwned(eventTarget) ||
          !isValidKeyPress((event: any).key)
        ) {
          return;
        }
        dispatchPressEvent(context, state, 'press', props.onPress);
        break;
      }

      /**
       * Touch event implementations are only needed for Safari, which lacks
       * support for pointer events.
       */
      case 'touchstart':
        if (!state.isPressed && !context.isTargetOwned(eventTarget)) {
          // We bail out of polyfilling anchor tags, given the same heuristics
          // explained above in regards to needing to use click events.
          if (isAnchorTagElement(eventTarget)) {
            state.isAnchorTouched = true;
            return;
          }
          state.pressTarget = eventTarget;
          dispatchPressStartEvents(context, props, state);
          state.isPressed = true;
          context.addRootEventTypes(rootEventTypes);
        }

        break;
      case 'touchend': {
        if (state.isAnchorTouched) {
          return;
        }
        if (state.isPressed) {
          dispatchPressEndEvents(context, props, state);
          if (
            eventType !== 'touchcancel' &&
            (props.onPress || props.onLongPress)
          ) {
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
                props.onPress &&
                !(
                  state.isLongPressed &&
                  props.onLongPressShouldCancelPress &&
                  props.onLongPressShouldCancelPress()
                )
              ) {
                dispatchPressEvent(context, state, 'press', props.onPress);
              }
            }
          }
          state.isPressed = false;
          state.isLongPressed = false;
          state.shouldSkipMouseAfterTouch = true;
          context.removeRootEventTypes(rootEventTypes);
        }
        break;
      }

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
            // Ignore if we are pressing on hit slop area with mouse
            if (
              context.isPositionWithinTouchHitTarget(
                (event: any).x,
                (event: any).y,
              )
            ) {
              return;
            }
            // Ignore middle- and right-clicks
            if (event.button === 2 || event.button === 1) {
              return;
            }
          }
          state.pressTarget = eventTarget;
          dispatchPressStartEvents(context, props, state);
          state.isPressed = true;
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
          dispatchPressEndEvents(context, props, state);
          if (
            state.pressTarget !== null &&
            (props.onPress || props.onLongPress)
          ) {
            if (context.isTargetWithinElement(eventTarget, state.pressTarget)) {
              if (
                props.onPress &&
                !(
                  state.isLongPressed &&
                  props.onLongPressShouldCancelPress &&
                  props.onLongPressShouldCancelPress()
                )
              ) {
                const pressEventListener = e => {
                  props.onPress(e);
                  // TODO address this again at some point
                  // if (e.nativeEvent.defaultPrevented) {
                  //   state.defaultPrevented = true;
                  // }
                };
                dispatchPressEvent(context, state, 'press', pressEventListener);
              }
            }
          }
          state.isPressed = false;
          state.isLongPressed = false;
          context.removeRootEventTypes(rootEventTypes);
        }
        state.isAnchorTouched = false;
        break;
      }

      case 'scroll':
      case 'touchcancel':
      case 'contextmenu':
      case 'pointercancel': {
        if (state.isPressed) {
          state.shouldSkipMouseAfterTouch = false;
          dispatchPressEndEvents(context, props, state);
          state.isPressed = false;
          state.isLongPressed = false;
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
