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
  context: EventResponderContext,
  props: HoverProps,
): void {
  const {event, eventTarget} = context;
  if (context.isTargetWithinEventComponent((event: any).relatedTarget)) {
    return;
  }
  if (props.onHoverStart) {
    const syntheticEvent = createHoverEvent(
      'hoverstart',
      eventTarget,
      props.onHoverStart,
    );
    context.dispatchEvent(syntheticEvent, {discrete: true});
  }
  if (props.onHoverChange) {
    const listener = () => {
      props.onHoverChange(true);
    };
    const syntheticEvent = createHoverEvent(
      'hoverchange',
      eventTarget,
      listener,
    );
    context.dispatchEvent(syntheticEvent, {discrete: true});
  }
}

function dispatchHoverEndEvents(
  context: EventResponderContext,
  props: HoverProps,
) {
  const {event, eventTarget} = context;
  if (context.isTargetWithinEventComponent((event: any).relatedTarget)) {
    return;
  }
  if (props.onHoverEnd) {
    const syntheticEvent = createHoverEvent(
      'hoverend',
      eventTarget,
      props.onHoverEnd,
    );
    context.dispatchEvent(syntheticEvent, {discrete: true});
  }
  if (props.onHoverChange) {
    const listener = () => {
      props.onHoverChange(false);
    };
    const syntheticEvent = createHoverEvent(
      'hoverchange',
      eventTarget,
      listener,
    );
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
  handleEvent(
    context: EventResponderContext,
    props: HoverProps,
    state: HoverState,
  ): void {
    const {eventType, eventTarget, event} = context;

    switch (eventType) {
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
        if (
          !state.isHovered &&
          !state.isTouched &&
          !context.isTargetOwned(eventTarget)
        ) {
          if ((event: any).pointerType === 'touch') {
            state.isTouched = true;
            return;
          }
          if (
            context.isPositionWithinTouchHitTarget(
              (event: any).x,
              (event: any).y,
            )
          ) {
            state.isInHitSlop = true;
            return;
          }
          dispatchHoverStartEvents(context, props);
          state.isHovered = true;
        }
        break;
      }
      case 'pointerout':
      case 'mouseout': {
        if (state.isHovered && !state.isTouched) {
          dispatchHoverEndEvents(context, props);
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
                (event: any).x,
                (event: any).y,
              )
            ) {
              dispatchHoverStartEvents(context, props);
              state.isHovered = true;
              state.isInHitSlop = false;
            }
          } else if (
            state.isHovered &&
            context.isPositionWithinTouchHitTarget(
              (event: any).x,
              (event: any).y,
            )
          ) {
            dispatchHoverEndEvents(context, props);
            state.isHovered = false;
            state.isInHitSlop = true;
          }
        }
        break;
      }
      case 'pointercancel': {
        if (state.isHovered && !state.isTouched) {
          dispatchHoverEndEvents(context, props);
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
