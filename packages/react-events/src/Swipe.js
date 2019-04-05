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

// type PointerType = 'mouse' | 'pointer' | 'touch';

type SwipeEventType = 'swipestart' | 'swipeend' | 'swipemove';

type SwipeDirection = 'up' | 'left' | 'down' | 'right';

type Point = {
  x: number,
  y: number,
};

type EventData = {
  // pointerType: PointerType,
  initial: Point,
  delta: Point,
  point: Point,
  direction: null | SwipeDirection,
};

type SwipeEvent = {|
  listener: SwipeEvent => void,
  target: Element | Document,
  type: SwipeEventType,
  // pointerType: PointerType,
  initial: Point,
  delta: Point,
  point: Point,
  direction: null | SwipeDirection,
|};

function createSwipeEvent(
  type: SwipeEventType,
  target: Element | Document,
  listener: SwipeEvent => void,
  eventData?: EventData,
): SwipeEvent {
  return {
    listener,
    target,
    type,
    ...eventData,
  };
}

function dispatchSwipeEvent(
  context: ResponderContext,
  name: SwipeEventType,
  listener: SwipeEvent => void,
  state: SwipeState,
  discrete: boolean,
  eventData?: EventData,
) {
  const target = ((state.swipeTarget: any): Element | Document);
  const syntheticEvent = createSwipeEvent(name, target, listener, eventData);
  context.dispatchEvent(syntheticEvent, {discrete});
}

function dispatchSwipStartEvent(
  context: ResponderContext,
  props: Object,
  state: SwipeState,
  point: Point,
) {
  const eventData = {
    delta: {
      x: point.x - state.startX,
      y: point.y - state.startY,
    },
    initial: {x: state.startX, y: state.startY},
    point,
    // pointerType: state.swipeTarget,
    direction: state.direction,
  };
  dispatchSwipeEvent(
    context,
    'swipestart',
    props.onSwipeStart,
    state,
    true,
    eventData,
  );
}

function dispatchSwipeMoveEvent(
  context: ResponderContext,
  props: Object,
  state: SwipeState,
  point: Point,
) {
  const eventData = {
    delta: {
      x: point.x - state.startX,
      y: point.y - state.startY,
    },
    initial: {x: state.startX, y: state.startY},
    point,
    // pointerType: state.swipeTarget,
    direction: state.direction,
  };
  dispatchSwipeEvent(
    context,
    'swipemove',
    props.onSwipe,
    state,
    false,
    eventData,
  );
}

type SwipeState = {
  direction: null | SwipeDirection,
  isSwiping: boolean,
  lastDirection: null | SwipeDirection,
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
      direction: null,
      isSwiping: false,
      lastDirection: null,
      startX: 0,
      startY: 0,
      touchId: null,
      swipeTarget: null,
      x: 0,
      y: 0,
    };
  },
  onEvent(
    event: ResponderEvent,
    context: ResponderContext,
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
            if (props.onSwipeStart) {
              dispatchSwipStartEvent(context, props, state, {x, y});
            }
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
          if (x < state.x) {
            state.direction = 'left';
          } else if (x > state.x) {
            state.direction = 'right';
          }
          if (y < state.y) {
            state.direction = 'down';
          } else if (y > state.y) {
            state.direction = 'up';
          }
          state.x = x;
          state.y = y;
          state.lastDirection = state.direction;
          if (props.onSwipe) {
            dispatchSwipeMoveEvent(context, props, state, {x, y});
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
          const lastDirection = state.lastDirection;
          if (state.direction !== lastDirection && props.onSwipe) {
            dispatchSwipeMoveEvent(context, props, state, {
              x: state.x,
              y: state.y,
            });
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
          state.lastDirection = null;
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
