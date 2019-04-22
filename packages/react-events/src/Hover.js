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
import {
  getEventPointerType,
  getEventCurrentTarget,
  isEventPositionWithinTouchHitTarget,
} from './utils';

const CAPTURE_PHASE = 2;

type HoverProps = {
  disabled: boolean,
  delayHoverEnd: number,
  delayHoverStart: number,
  onHoverChange: boolean => void,
  onHoverEnd: (e: HoverEvent) => void,
  onHoverMove: (e: HoverEvent) => void,
  onHoverStart: (e: HoverEvent) => void,
  preventDefault: boolean,
  stopPropagation: boolean,
};

type HoverState = {
  hoverTarget: null | Element | Document,
  isActiveHovered: boolean,
  isHovered: boolean,
  isOverTouchHitTarget: boolean,
  isTouched: boolean,
  hoverStartTimeout: null | Symbol,
  hoverEndTimeout: null | Symbol,
  ignoreEmulatedMouseEvents: boolean,
};

type HoverEventType = 'hoverstart' | 'hoverend' | 'hoverchange' | 'hovermove';

type HoverEvent = {|
  target: Element | Document,
  type: HoverEventType,
|};

const DEFAULT_HOVER_END_DELAY_MS = 0;
const DEFAULT_HOVER_START_DELAY_MS = 0;

const targetEventTypes = [
  'pointerover',
  'pointermove',
  'pointerout',
  'pointercancel',
];

// If PointerEvents is not supported (e.g., Safari), also listen to touch and mouse events.
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('touchstart', 'mouseover', 'mousemove', 'mouseout');
}

function createHoverEvent(
  type: HoverEventType,
  target: Element | Document,
): HoverEvent {
  return {
    target,
    type,
  };
}

function dispatchHoverChangeEvent(
  context: ReactResponderContext,
  props: HoverProps,
  state: HoverState,
): void {
  const bool = state.isActiveHovered;
  const listener = () => {
    props.onHoverChange(bool);
  };
  const syntheticEvent = createHoverEvent(
    'hoverchange',
    ((state.hoverTarget: any): Element | Document),
  );
  context.dispatchEvent(syntheticEvent, listener, {discrete: true});
}

function dispatchHoverStartEvents(
  event: ReactResponderEvent,
  context: ReactResponderContext,
  props: HoverProps,
  state: HoverState,
): void {
  const target = state.hoverTarget;
  if (event !== null) {
    const {nativeEvent} = event;
    if (
      context.isTargetWithinEventComponent((nativeEvent: any).relatedTarget)
    ) {
      return;
    }
  }

  state.isHovered = true;

  if (state.hoverEndTimeout !== null) {
    context.clearTimeout(state.hoverEndTimeout);
    state.hoverEndTimeout = null;
  }

  const activate = () => {
    state.isActiveHovered = true;

    if (props.onHoverStart) {
      const syntheticEvent = createHoverEvent(
        'hoverstart',
        ((target: any): Element | Document),
      );
      context.dispatchEvent(syntheticEvent, props.onHoverStart, {
        discrete: true,
      });
    }
    if (props.onHoverChange) {
      dispatchHoverChangeEvent(context, props, state);
    }
  };

  if (!state.isActiveHovered) {
    const delayHoverStart = calculateDelayMS(
      props.delayHoverStart,
      0,
      DEFAULT_HOVER_START_DELAY_MS,
    );
    if (delayHoverStart > 0) {
      state.hoverStartTimeout = context.setTimeout(() => {
        state.hoverStartTimeout = null;
        activate();
        return false;
      }, delayHoverStart);
    } else {
      activate();
    }
  }
}

function dispatchHoverEndEvents(
  event: null | ReactResponderEvent,
  context: ReactResponderContext,
  props: HoverProps,
  state: HoverState,
) {
  const target = state.hoverTarget;
  if (event !== null) {
    const {nativeEvent} = event;
    if (
      context.isTargetWithinEventComponent((nativeEvent: any).relatedTarget)
    ) {
      return;
    }
  }

  state.isHovered = false;

  if (state.hoverStartTimeout !== null) {
    context.clearTimeout(state.hoverStartTimeout);
    state.hoverStartTimeout = null;
  }

  const deactivate = () => {
    state.isActiveHovered = false;

    if (props.onHoverEnd) {
      const syntheticEvent = createHoverEvent(
        'hoverend',
        ((target: any): Element | Document),
      );
      context.dispatchEvent(syntheticEvent, props.onHoverEnd, {discrete: true});
    }
    if (props.onHoverChange) {
      dispatchHoverChangeEvent(context, props, state);
    }

    state.isOverTouchHitTarget = false;
    state.hoverTarget = null;
    state.ignoreEmulatedMouseEvents = false;
    state.isTouched = false;
  };

  if (state.isActiveHovered) {
    const delayHoverEnd = calculateDelayMS(
      props.delayHoverEnd,
      0,
      DEFAULT_HOVER_END_DELAY_MS,
    );
    if (delayHoverEnd > 0) {
      state.hoverEndTimeout = context.setTimeout(() => {
        deactivate();
        return false;
      }, delayHoverEnd);
    } else {
      deactivate();
    }
  }
}

function calculateDelayMS(delay: ?number, min = 0, fallback = 0) {
  const maybeNumber = delay == null ? null : delay;
  return Math.max(min, maybeNumber != null ? maybeNumber : fallback);
}

function unmountResponder(
  context: ReactResponderContext,
  props: HoverProps,
  state: HoverState,
): void {
  if (state.isHovered) {
    dispatchHoverEndEvents(null, context, props, state);
  }
}

function isEmulatedMouseEvent(event, state) {
  const {type} = event;
  return (
    state.ignoreEmulatedMouseEvents &&
    (type === 'mousemove' || type === 'mouseover' || type === 'mouseout')
  );
}

const HoverResponder = {
  targetEventTypes,
  createInitialState() {
    return {
      isActiveHovered: false,
      isHovered: false,
      isOverTouchHitTarget: false,
      isTouched: false,
      hoverStartTimeout: null,
      hoverEndTimeout: null,
      ignoreEmulatedMouseEvents: false,
    };
  },
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: HoverProps,
    state: HoverState,
  ): boolean {
    const {type} = event;

    if (props.disabled) {
      if (state.isHovered) {
        dispatchHoverEndEvents(event, context, props, state);
        state.ignoreEmulatedMouseEvents = false;
      }
      if (state.isTouched) {
        state.isTouched = false;
      }
      return false;
    }

    // Hover doesn't handle capture target events at this point
    if (event.phase === CAPTURE_PHASE) {
      return false;
    }

    const pointerType = getEventPointerType(event);

    switch (type) {
      // START
      case 'pointerover':
      case 'mouseover':
      case 'touchstart': {
        if (!state.isHovered) {
          // Prevent hover events for touch
          if (state.isTouched || pointerType === 'touch') {
            state.isTouched = true;
            return false;
          }

          // Prevent hover events for emulated events
          if (isEmulatedMouseEvent(event, state)) {
            return false;
          }

          if (isEventPositionWithinTouchHitTarget(event, context)) {
            state.isOverTouchHitTarget = true;
            return false;
          }
          state.hoverTarget = getEventCurrentTarget(event, context);
          state.ignoreEmulatedMouseEvents = true;
          dispatchHoverStartEvents(event, context, props, state);
        }
        return false;
      }

      // MOVE
      case 'pointermove':
      case 'mousemove': {
        if (state.isHovered && !isEmulatedMouseEvent(event, state)) {
          if (state.isHovered) {
            if (state.isOverTouchHitTarget) {
              // If we were moving over the TouchHitTarget and have now moved
              // over the Responder target
              if (!isEventPositionWithinTouchHitTarget(event, context)) {
                dispatchHoverStartEvents(event, context, props, state);
                state.isOverTouchHitTarget = false;
              }
            } else {
              // If we were moving over the Responder target and have now moved
              // over the TouchHitTarget
              if (isEventPositionWithinTouchHitTarget(event, context)) {
                dispatchHoverEndEvents(event, context, props, state);
                state.isOverTouchHitTarget = true;
              } else {
                if (props.onHoverMove && state.hoverTarget !== null) {
                  const syntheticEvent = createHoverEvent(
                    'hovermove',
                    state.hoverTarget,
                  );
                  context.dispatchEvent(syntheticEvent, props.onHoverMove, {
                    discrete: false,
                  });
                }
              }
            }
          }
        }
        return false;
      }

      // END
      case 'pointerout':
      case 'pointercancel':
      case 'mouseout':
      case 'touchcancel':
      case 'touchend': {
        if (state.isHovered) {
          dispatchHoverEndEvents(event, context, props, state);
          state.ignoreEmulatedMouseEvents = false;
        }
        if (state.isTouched) {
          state.isTouched = false;
        }
        return false;
      }
    }
    return false;
  },
  onUnmount(
    context: ReactResponderContext,
    props: HoverProps,
    state: HoverState,
  ) {
    unmountResponder(context, props, state);
  },
  onOwnershipChange(
    context: ReactResponderContext,
    props: HoverProps,
    state: HoverState,
  ) {
    unmountResponder(context, props, state);
  },
};

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName: 'Hover',
  props: null,
  responder: HoverResponder,
};
