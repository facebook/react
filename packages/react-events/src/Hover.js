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
  onHoverStart: (e: HoverEvent) => void,
};

type HoverState = {
  isActiveHovered: boolean,
  isHovered: boolean,
  isInHitSlop: boolean,
  isTouched: boolean,
  hoverStartTimeout: null | TimeoutID,
  hoverEndTimeout: null | TimeoutID,
};

type HoverEventType = 'hoverstart' | 'hoverend' | 'hoverchange';

type HoverEvent = {|
  listener: HoverEvent => void,
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
  targetEventTypes.push('touchstart', 'mouseover', 'mouseout');
}

function createHoverEvent(
  type: HoverEventType,
  target: Element | Document,
  listener: HoverEvent => void,
): HoverEvent {
  return {
    listener,
    target,
    type,
  };
}

function dispatchHoverChangeEvent(
  event: ReactResponderEvent,
  context: ReactResponderContext,
  props: HoverProps,
  state: HoverState,
): void {
  const listener = () => {
    props.onHoverChange(state.isActiveHovered);
  };
  const syntheticEvent = createHoverEvent(
    'hoverchange',
    event.target,
    listener,
  );
  context.dispatchEvent(syntheticEvent, {discrete: true});
}

function dispatchHoverStartEvents(
  event: ReactResponderEvent,
  context: ReactResponderContext,
  props: HoverProps,
  state: HoverState,
): void {
  const {nativeEvent, target} = event;
  if (context.isTargetWithinEventComponent((nativeEvent: any).relatedTarget)) {
    return;
  }

  state.isHovered = true;

  if (state.hoverEndTimeout !== null) {
    clearTimeout(state.hoverEndTimeout);
    state.hoverEndTimeout = null;
  }

  const activate = () => {
    state.isActiveHovered = true;

    if (props.onHoverStart) {
      const syntheticEvent = createHoverEvent(
        'hoverstart',
        target,
        props.onHoverStart,
      );
      context.dispatchEvent(syntheticEvent, {discrete: true});
    }
    if (props.onHoverChange) {
      dispatchHoverChangeEvent(event, context, props, state);
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
  event: ReactResponderEvent,
  context: ReactResponderContext,
  props: HoverProps,
  state: HoverState,
) {
  const {nativeEvent, target} = event;
  if (context.isTargetWithinEventComponent((nativeEvent: any).relatedTarget)) {
    return;
  }

  state.isHovered = false;

  if (state.hoverStartTimeout !== null) {
    clearTimeout(state.hoverStartTimeout);
    state.hoverStartTimeout = null;
  }

  const deactivate = () => {
    state.isActiveHovered = false;

    if (props.onHoverEnd) {
      const syntheticEvent = createHoverEvent(
        'hoverend',
        target,
        props.onHoverEnd,
      );
      context.dispatchEvent(syntheticEvent, {discrete: true});
    }
    if (props.onHoverChange) {
      dispatchHoverChangeEvent(event, context, props, state);
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
        state.isTouched = false;
        break;
      }

      case 'pointermove': {
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
          } else if (
            state.isHovered &&
            context.isPositionWithinTouchHitTarget(
              target.ownerDocument,
              (nativeEvent: any).x,
              (nativeEvent: any).y,
            )
          ) {
            dispatchHoverEndEvents(event, context, props, state);
            state.isInHitSlop = true;
          }
        }
        break;
      }

      case 'pointercancel': {
        if (state.isHovered && !state.isTouched) {
          dispatchHoverEndEvents(event, context, props, state);
          state.isTouched = false;
        }
        break;
      }
    }
  },
};

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName: 'Hover',
  props: null,
  responder: HoverResponder,
};
