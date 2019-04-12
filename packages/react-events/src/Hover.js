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

type HoverProps = {
  disabled: boolean,
  delayHoverEnd: number,
  delayHoverStart: number,
  onHoverChange: boolean => void,
  onHoverEnd: (e: HoverEvent) => void,
  onHoverMove: (e: HoverEvent) => void,
  onHoverStart: (e: HoverEvent) => void,
};

type HoverState = {
  hoverTarget: null | Element | Document,
  isActiveHovered: boolean,
  isHovered: boolean,
  isInHitSlop: boolean,
  isTouched: boolean,
  hoverStartTimeout: null | Symbol,
  hoverEndTimeout: null | Symbol,
  skipMouseAfterPointer: boolean,
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

const HoverResponder = {
  targetEventTypes,
  createInitialState() {
    return {
      isActiveHovered: false,
      isHovered: false,
      isInHitSlop: false,
      isTouched: false,
      hoverStartTimeout: null,
      hoverEndTimeout: null,
      skipMouseAfterPointer: false,
    };
  },
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: HoverProps,
    state: HoverState,
  ): void {
    const {type, target, nativeEvent} = event;

    switch (type) {
      /**
       * Prevent hover events when touch is being used.
       */
      case 'touchstart': {
        if (!state.isTouched) {
          state.isTouched = true;
        }
        break;
      }

      case 'pointerover':
      case 'mouseover': {
        if (!state.isHovered && !state.isTouched && !context.hasOwnership()) {
          if ((nativeEvent: any).pointerType === 'touch') {
            state.isTouched = true;
            return;
          }
          if (type === 'pointerover') {
            state.skipMouseAfterPointer = true;
          }
          if (
            context.isPositionWithinTouchHitTarget(
              target.ownerDocument,
              (nativeEvent: any).x,
              (nativeEvent: any).y,
            )
          ) {
            state.isInHitSlop = true;
            return;
          }
          state.hoverTarget = target;
          dispatchHoverStartEvents(event, context, props, state);
        }
        break;
      }
      case 'pointerout':
      case 'mouseout': {
        if (state.isHovered && !state.isTouched) {
          dispatchHoverEndEvents(event, context, props, state);
        }
        state.isInHitSlop = false;
        state.hoverTarget = null;
        state.isTouched = false;
        state.skipMouseAfterPointer = false;
        break;
      }

      case 'pointermove':
      case 'mousemove': {
        if (type === 'mousemove' && state.skipMouseAfterPointer === true) {
          return;
        }

        if (state.isHovered && !state.isTouched) {
          if (state.isInHitSlop) {
            if (
              !context.isPositionWithinTouchHitTarget(
                target.ownerDocument,
                (nativeEvent: any).x,
                (nativeEvent: any).y,
              )
            ) {
              dispatchHoverStartEvents(event, context, props, state);
              state.isInHitSlop = false;
            }
          } else if (state.isHovered) {
            if (
              context.isPositionWithinTouchHitTarget(
                target.ownerDocument,
                (nativeEvent: any).x,
                (nativeEvent: any).y,
              )
            ) {
              dispatchHoverEndEvents(event, context, props, state);
              state.isInHitSlop = true;
            } else {
              if (props.onHoverMove) {
                const syntheticEvent = createHoverEvent(
                  'hovermove',
                  event.target,
                );
                context.dispatchEvent(syntheticEvent, props.onHoverMove, {
                  discrete: false,
                });
              }
            }
          }
        }
        break;
      }

      case 'pointercancel': {
        if (state.isHovered && !state.isTouched) {
          dispatchHoverEndEvents(event, context, props, state);
          state.hoverTarget = null;
          state.isTouched = false;
        }
        break;
      }
    }
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
