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
  'pointerover',
  'pointermove',
  'pointerout',
  'pointercancel',
];

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

// In the case we don't have PointerEvents (Safari), we listen to touch events
// too
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('touchstart', 'mouseover', 'mouseout');
}

function dispatchHoverStartEvents(
  context: EventResponderContext,
  props: Object,
  state: HoverState,
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
    const hoverChangeEventListener = () => {
      props.onHoverChange(true);
    };
    const syntheticEvent = createHoverEvent(
      'hoverchange',
      eventTarget,
      hoverChangeEventListener,
    );
    context.dispatchEvent(syntheticEvent, {discrete: true});
  }
}

function dispatchHoverEndEvents(context: EventResponderContext, props: Object) {
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
    const hoverChangeEventListener = () => {
      props.onHoverChange(false);
    };
    const syntheticEvent = createHoverEvent(
      'hoverchange',
      eventTarget,
      hoverChangeEventListener,
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
    props: Object,
    state: HoverState,
  ): void {
    const {eventType, eventTarget, event} = context;

    switch (eventType) {
      case 'touchstart':
        // Touch devices don't have hover support
        if (!state.isTouched) {
          state.isTouched = true;
        }
        break;
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
          dispatchHoverStartEvents(context, props, state);
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
              dispatchHoverStartEvents(context, props, state);
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
  props: null,
  responder: HoverResponder,
};
