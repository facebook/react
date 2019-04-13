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

const targetEventTypes = ['pointerdown', 'pointercancel'];
const rootEventTypes = ['pointerup', {name: 'pointermove', passive: false}];

// In the case we don't have PointerEvents (Safari), we listen to touch events
// too
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('touchstart', 'touchend', 'mousedown', 'touchcancel');
  rootEventTypes.push('mouseup', 'mousemove', {
    name: 'touchmove',
    passive: false,
  });
}

type EventData = {
  diffX: number,
  diffY: number,
};
type SwipeEventType = 'swipeleft' | 'swiperight' | 'swipeend' | 'swipemove';

type SwipeEvent = {|
  target: Element | Document,
  type: SwipeEventType,
  diffX?: number,
  diffY?: number,
|};

function createSwipeEvent(
  type: SwipeEventType,
  target: Element | Document,
  eventData?: EventData,
): SwipeEvent {
  return {
    target,
    type,
    ...eventData,
  };
}

function dispatchSwipeEvent(
  context: ReactResponderContext,
  name: SwipeEventType,
  listener: SwipeEvent => void,
  state: SwipeState,
  discrete: boolean,
  eventData?: EventData,
) {
  const target = ((state.swipeTarget: any): Element | Document);
  const syntheticEvent = createSwipeEvent(name, target, eventData);
  context.dispatchEvent(syntheticEvent, listener, {discrete});
}

type SwipeState = {
  direction: number,
  isSwiping: boolean,
  lastDirection: number,
  startX: number,
  startY: number,
  touchId: null | number,
  swipeTarget: null | Element | Document,
  x: number,
  y: number,
};

const SwipeResponder = {
  targetEventTypes,
  createInitialState(): SwipeState {
    return {
      direction: 0,
      isSwiping: false,
      lastDirection: 0,
      startX: 0,
      startY: 0,
      touchId: null,
      swipeTarget: null,
      x: 0,
      y: 0,
    };
  },
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: Object,
    state: SwipeState,
  ): void {
    const {target, type, nativeEvent} = event;

    switch (type) {
      case 'touchstart':
      case 'mousedown':
      case 'pointerdown': {
        if (!state.isSwiping && !context.hasOwnership()) {
          let obj = nativeEvent;
          if (type === 'touchstart') {
            obj = (nativeEvent: any).targetTouches[0];
            state.touchId = obj.identifier;
          }
          const x = (obj: any).screenX;
          const y = (obj: any).screenY;

          let shouldEnableSwiping = true;

          if (props.onShouldClaimOwnership && props.onShouldClaimOwnership()) {
            shouldEnableSwiping = context.requestOwnership();
          }
          if (shouldEnableSwiping) {
            state.isSwiping = true;
            state.startX = x;
            state.startY = y;
            state.x = x;
            state.y = y;
            state.swipeTarget = target;
            context.addRootEventTypes(target.ownerDocument, rootEventTypes);
          } else {
            state.touchId = null;
          }
        }
        break;
      }
      case 'touchmove':
      case 'mousemove':
      case 'pointermove': {
        if (event.passive) {
          return;
        }
        if (state.isSwiping) {
          let obj = null;
          if (type === 'touchmove') {
            const targetTouches = (nativeEvent: any).targetTouches;
            for (let i = 0; i < targetTouches.length; i++) {
              if (state.touchId === targetTouches[i].identifier) {
                obj = targetTouches[i];
                break;
              }
            }
          } else {
            obj = nativeEvent;
          }
          if (obj === null) {
            state.isSwiping = false;
            state.swipeTarget = null;
            state.touchId = null;
            context.removeRootEventTypes(rootEventTypes);
            return;
          }
          const x = (obj: any).screenX;
          const y = (obj: any).screenY;
          if (x < state.x && props.onSwipeLeft) {
            state.direction = 3;
          } else if (x > state.x && props.onSwipeRight) {
            state.direction = 1;
          }
          state.x = x;
          state.y = y;
          if (props.onSwipeMove) {
            const eventData = {
              diffX: x - state.startX,
              diffY: y - state.startY,
            };
            dispatchSwipeEvent(
              context,
              'swipemove',
              props.onSwipeMove,
              state,
              false,
              eventData,
            );
            (nativeEvent: any).preventDefault();
          }
        }
        break;
      }
      case 'pointercancel':
      case 'touchcancel':
      case 'touchend':
      case 'mouseup':
      case 'pointerup': {
        if (state.isSwiping) {
          if (state.x === state.startX && state.y === state.startY) {
            return;
          }
          if (props.onShouldClaimOwnership) {
            context.releaseOwnership();
          }
          const direction = state.direction;
          const lastDirection = state.lastDirection;
          if (direction !== lastDirection) {
            if (props.onSwipeLeft && direction === 3) {
              dispatchSwipeEvent(
                context,
                'swipeleft',
                props.onSwipeLeft,
                state,
                true,
              );
            } else if (props.onSwipeRight && direction === 1) {
              dispatchSwipeEvent(
                context,
                'swiperight',
                props.onSwipeRight,
                state,
                true,
              );
            }
          }
          if (props.onSwipeEnd) {
            dispatchSwipeEvent(
              context,
              'swipeend',
              props.onSwipeEnd,
              state,
              true,
            );
          }
          state.lastDirection = direction;
          state.isSwiping = false;
          state.swipeTarget = null;
          state.touchId = null;
          context.removeRootEventTypes(rootEventTypes);
        }
        break;
      }
    }
  },
};

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName: 'Swipe',
  props: null,
  responder: SwipeResponder,
};
