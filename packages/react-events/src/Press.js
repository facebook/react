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
} from 'shared/ReactTypes';
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

type PressState = {
  isActivePressed: boolean,
  isActivePressStart: boolean,
  isAnchorTouched: boolean,
  isLongPressed: boolean,
  isPressed: boolean,
  isPressWithinResponderRegion: boolean,
  longPressTimeout: null | TimeoutID,
  pressTarget: null | Element | Document,
  pressEndTimeout: null | TimeoutID,
  pressStartTimeout: null | TimeoutID,
  responderRegion: null | $ReadOnly<{|
    bottom: number,
    left: number,
    right: number,
    top: number,
  |}>,
  shouldSkipMouseAfterTouch: boolean,
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
  listener: PressEvent => void,
  target: Element | Document,
  type: PressEventType,
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
  'pointerdown',
  'pointercancel',
  'contextmenu',
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
  listener: PressEvent => void,
): PressEvent {
  return {
    listener,
    target,
    type,
  };
}

function dispatchEvent(
  context: ReactResponderContext,
  state: PressState,
  name: PressEventType,
  listener: (e: Object) => void,
): void {
  const target = ((state.pressTarget: any): Element | Document);
  const syntheticEvent = createPressEvent(name, target, listener);
  context.dispatchEvent(syntheticEvent, {discrete: true});
}

function dispatchPressChangeEvent(
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const listener = () => {
    props.onPressChange(state.isActivePressed);
  };
  dispatchEvent(context, state, 'presschange', listener);
}

function dispatchLongPressChangeEvent(
  context: ReactResponderContext,
  props: PressProps,
  state: PressState,
): void {
  const listener = () => {
    props.onLongPressChange(state.isLongPressed);
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
    clearTimeout(state.pressEndTimeout);
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

  state.isActivePressStart = false;
  state.isPressed = false;

  if (state.longPressTimeout !== null) {
    clearTimeout(state.longPressTimeout);
    state.longPressTimeout = null;
  }

  if (!wasActivePressStart && state.pressStartTimeout !== null) {
    clearTimeout(state.pressStartTimeout);
    state.pressStartTimeout = null;
    // don't activate if a press has moved beyond the responder region
    if (state.isPressWithinResponderRegion) {
      // if we haven't yet activated (due to delays), activate now
      activate(context, props, state);
    }
  }

  if (state.isActivePressed) {
    const delayPressEnd = calculateDelayMS(
      props.delayPressEnd,
      0,
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
      isActivePressed: false,
      isActivePressStart: false,
      isAnchorTouched: false,
      isLongPressed: false,
      isPressed: false,
      isPressWithinResponderRegion: true,
      longPressTimeout: null,
      pressEndTimeout: null,
      pressStartTimeout: null,
      pressTarget: null,
      responderRegion: null,
      shouldSkipMouseAfterTouch: false,
    };
  },
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
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
                target.ownerDocument,
                (nativeEvent: any).x,
                (nativeEvent: any).y,
              )
            ) {
              return;
            }
          }
          state.pressTarget = target;
          state.isPressWithinResponderRegion = true;
          dispatchPressStartEvents(context, props, state);
          context.addRootEventTypes(target.ownerDocument, rootEventTypes);
        }
        break;
      }
      case 'pointermove':
      case 'mousemove':
      case 'touchmove': {
        if (state.isPressed) {
          if (state.shouldSkipMouseAfterTouch) {
            return;
          }

          if (state.responderRegion == null) {
            let currentTarget = (target: any);
            while (
              currentTarget.parentNode &&
              context.isTargetWithinEventComponent(currentTarget.parentNode)
            ) {
              currentTarget = currentTarget.parentNode;
            }
            state.responderRegion = calculateResponderRegion(
              currentTarget,
              props,
            );
          }

          if (isPressWithinResponderRegion(nativeEvent, state)) {
            state.isPressWithinResponderRegion = true;
            if (props.onPressMove) {
              dispatchEvent(context, state, 'pressmove', props.onPressMove);
            }
          } else {
            state.isPressWithinResponderRegion = false;
            dispatchPressEndEvents(context, props, state);
          }
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
                dispatchEvent(context, state, 'press', props.onPress);
              }
            }
          }
          context.removeRootEventTypes(rootEventTypes);
        }
        state.isAnchorTouched = false;
        state.shouldSkipMouseAfterTouch = false;
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
          state.isPressWithinResponderRegion = true;
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
        if (isAnchorTagElement(target)) {
          const {ctrlKey, metaKey, shiftKey} = ((nativeEvent: any): MouseEvent);
          const preventDefault = props.preventDefault;
          // Check "open in new window/tab" key modifiers
          if (preventDefault !== false && !shiftKey && !ctrlKey && !metaKey) {
            (nativeEvent: any).preventDefault();
          }
        }
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
  // TODO This method doesn't work as of yet
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
