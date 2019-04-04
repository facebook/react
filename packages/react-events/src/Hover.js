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

type HoverProps = {
  disabled: boolean,
  delayHoverEnd: number,
  delayHoverStart: number,
  onHoverChange: boolean => void,
  onHoverEnd: (e: HoverEvent) => void,
  onHoverStart: (e: HoverEvent) => void,
};

type HoverState = {
  isHovered: boolean,
  isInHitSlop: boolean,
  isTouched: boolean,
};

type HoverEventType = 'hoverstart' | 'hoverend' | 'hoverchange';

type HoverEvent = {|
  listener: HoverEvent => void,
  target: Element | Document,
  type: HoverEventType,
|};

// const DEFAULT_HOVER_END_DELAY_MS = 0;
// const DEFAULT_HOVER_START_DELAY_MS = 0;

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

function dispatchHoverStartEvents(
  event: ResponderEvent,
  context: ResponderContext,
  props: HoverProps,
): void {
  const {nativeEvent, target} = event;
  if (context.isTargetWithinEventComponent((nativeEvent: any).relatedTarget)) {
    return;
  }
  if (props.onHoverStart) {
    const syntheticEvent = createHoverEvent(
      'hoverstart',
      target,
      props.onHoverStart,
    );
    context.dispatchEvent(syntheticEvent, {discrete: true});
  }
  if (props.onHoverChange) {
    const listener = () => {
      props.onHoverChange(true);
    };
    const syntheticEvent = createHoverEvent('hoverchange', target, listener);
    context.dispatchEvent(syntheticEvent, {discrete: true});
  }
}

function dispatchHoverEndEvents(
  event: ResponderEvent,
  context: ResponderContext,
  props: HoverProps,
) {
  const {nativeEvent, target} = event;
  if (context.isTargetWithinEventComponent((nativeEvent: any).relatedTarget)) {
    return;
  }
  if (props.onHoverEnd) {
    const syntheticEvent = createHoverEvent(
      'hoverend',
      target,
      props.onHoverEnd,
    );
    context.dispatchEvent(syntheticEvent, {discrete: true});
  }
  if (props.onHoverChange) {
    const listener = () => {
      props.onHoverChange(false);
    };
    const syntheticEvent = createHoverEvent('hoverchange', target, listener);
    context.dispatchEvent(syntheticEvent, {discrete: true});
  }
}

const HoverResponder = {
  targetEventTypes,
  createInitialState() {
    return {
      isHovered: false,
      isInHitSlop: false,
      isTouched: false,
    };
  },
  onEvent(
    event: ResponderEvent,
    context: ResponderContext,
    props: HoverProps,
    state: HoverState,
  ): void {
    const {type, nativeEvent} = event;

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
              (nativeEvent: any).x,
              (nativeEvent: any).y,
            )
          ) {
            state.isInHitSlop = true;
            return;
          }
          dispatchHoverStartEvents(event, context, props);
          state.isHovered = true;
        }
        break;
      }
      case 'pointerout':
      case 'mouseout': {
        if (state.isHovered && !state.isTouched) {
          dispatchHoverEndEvents(event, context, props);
          state.isHovered = false;
        }
        state.isInHitSlop = false;
        state.isTouched = false;
        break;
      }
      case 'pointermove': {
        if (!state.isTouched) {
          if (state.isInHitSlop) {
            if (
              !context.isPositionWithinTouchHitTarget(
                (nativeEvent: any).x,
                (nativeEvent: any).y,
              )
            ) {
              dispatchHoverStartEvents(event, context, props);
              state.isHovered = true;
              state.isInHitSlop = false;
            }
          } else if (
            state.isHovered &&
            context.isPositionWithinTouchHitTarget(
              (nativeEvent: any).x,
              (nativeEvent: any).y,
            )
          ) {
            dispatchHoverEndEvents(event, context, props);
            state.isHovered = false;
            state.isInHitSlop = true;
          }
        }
        break;
      }
      case 'pointercancel': {
        if (state.isHovered && !state.isTouched) {
          dispatchHoverEndEvents(event, context, props);
          state.isHovered = false;
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
