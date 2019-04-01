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

type PressState = {
  defaultPrevented: boolean,
  isAnchorTouched: boolean,
  isLongPressed: boolean,
  isPressed: boolean,
  longPressTimeout: null | TimeoutID,
  pressTarget: null | EventTarget,
  shouldSkipMouseAfterTouch: boolean,
};

function dispatchPressEvent(
  context: EventResponderContext,
  state: PressState,
  name: string,
  listener: (e: Object) => void,
): void {
  context.dispatchEvent(name, listener, state.pressTarget, true);
}

function dispatchPressStartEvents(
  context: EventResponderContext,
  props: Object,
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
    const delayLongPress = calculateDelayMS(props.delayLongPress, 0, 1000);

    state.longPressTimeout = setTimeout(() => {
      state.isLongPressed = true;
      state.longPressTimeout = null;

      if (
        props.onPressChange &&
        props.onLongPressShouldCancelPress &&
        props.onLongPressShouldCancelPress()
      ) {
        dispatchPressChangeEvent(false);
      }

      if (props.onLongPress) {
        const longPressEventListener = e => {
          props.onLongPress(e);
          if (e.nativeEvent.defaultPrevented) {
            state.defaultPrevented = true;
          }
        };
        dispatchPressEvent(context, state, 'longpress', longPressEventListener);
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
    }, delayLongPress);
  }
}

function dispatchPressEndEvents(
  context: EventResponderContext,
  props: Object,
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
    props: Object,
    state: PressState,
  ): void {
    const {eventTarget, eventType, event} = context;

    switch (eventType) {
      case 'keydown': {
        if (!props.onPress || context.isTargetOwned(eventTarget)) {
          return;
        }
        const isValidKeyPress =
          (event: any).which === 13 ||
          (event: any).which === 32 ||
          (event: any).keyCode === 13;

        if (!isValidKeyPress) {
          return;
        }
        let keyPressEventListener = props.onPress;

        // Wrap listener with prevent default behaviour, unless
        // we are dealing with an anchor. Anchor tags are special beacuse
        // we need to use the "click" event, to properly allow browser
        // heuristics for cancelling link clicks. Furthermore, iOS and
        // Android can show previous of anchor tags that requires working
        // with click rather than touch events (and mouse down/up).
        if (!isAnchorTagElement(eventTarget)) {
          keyPressEventListener = e => {
            if (!e.isDefaultPrevented() && !e.nativeEvent.defaultPrevented) {
              e.preventDefault();
              state.defaultPrevented = true;
              props.onPress(e);
            }
          };
        }
        dispatchPressEvent(context, state, 'press', keyPressEventListener);
        break;
      }
      case 'touchstart':
        // Touch events are for Safari, which lack pointer event support.
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
        // Touch events are for Safari, which lack pointer event support
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
      case 'pointerdown':
      case 'mousedown': {
        if (
          !state.isPressed &&
          !context.isTargetOwned(eventTarget) &&
          !state.shouldSkipMouseAfterTouch
        ) {
          if ((event: any).pointerType === 'mouse') {
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
      case 'mouseup':
      case 'pointerup': {
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
                  if (e.nativeEvent.defaultPrevented) {
                    state.defaultPrevented = true;
                  }
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
  props: null,
  responder: PressResponder,
};
