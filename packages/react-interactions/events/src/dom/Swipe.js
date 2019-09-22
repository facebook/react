/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactDOMResponderEvent,
  ReactDOMResponderContext,
} from 'shared/ReactDOMTypes';
import type {
  EventPriority,
  ReactEventResponderListener,
} from 'shared/ReactTypes';

import React from 'react';
import {UserBlockingEvent, DiscreteEvent} from 'shared/ReactTypes';

type SwipeProps = {
  disabled: boolean,
  shouldClaimOwnership: () => boolean,
  onSwipeMove: (e: SwipeEvent) => void,
  onSwipeEnd: (e: SwipeEvent) => void,
  onSwipeLeft: (e: SwipeEvent) => void,
  onSwipeRight: (e: SwipeEvent) => void,
};

const targetEventTypes = ['pointerdown'];
const rootEventTypes = ['pointerup', 'pointercancel', 'pointermove_active'];

// In the case we don't have PointerEvents (Safari), we listen to touch events
// too
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('touchstart', 'mousedown');
  rootEventTypes.push(
    'mouseup',
    'mousemove',
    'touchend',
    'touchcancel',
    'touchmove_active',
  );
}

type EventData = {
  diffX: number,
  diffY: number,
};
type SwipeEventType = 'swipeleft' | 'swiperight' | 'swipeend' | 'swipemove';

type SwipeEvent = {|
  target: Element | Document,
  type: SwipeEventType,
  timeStamp: number,
  diffX?: number,
  diffY?: number,
|};

function isFunction(obj): boolean {
  return typeof obj === 'function';
}

function createSwipeEvent(
  context: ReactDOMResponderContext,
  type: SwipeEventType,
  target: Element | Document,
  eventData?: EventData,
): SwipeEvent {
  return context.objectAssign(
    {
      target,
      type,
      timeStamp: context.getTimeStamp(),
    },
    eventData,
  );
}

function dispatchSwipeEvent(
  context: ReactDOMResponderContext,
  listener: SwipeEvent => void,
  name: SwipeEventType,
  state: SwipeState,
  eventPriority: EventPriority,
  eventData?: EventData,
) {
  const target = ((state.swipeTarget: any): Element | Document);
  const syntheticEvent = createSwipeEvent(context, name, target, eventData);
  context.dispatchEvent(syntheticEvent, listener, eventPriority);
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

const swipeResponderImpl = {
  targetEventTypes,
  getInitialState(): SwipeState {
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
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: SwipeProps,
    state: SwipeState,
  ): void {
    const {target, type, nativeEvent} = event;

    switch (type) {
      case 'touchstart':
      case 'mousedown':
      case 'pointerdown': {
        if (!state.isSwiping) {
          let obj = nativeEvent;
          if (type === 'touchstart') {
            obj = (nativeEvent: any).targetTouches[0];
            state.touchId = obj.identifier;
          }
          const x = (obj: any).screenX;
          const y = (obj: any).screenY;

          state.isSwiping = true;
          state.startX = x;
          state.startY = y;
          state.x = x;
          state.y = y;
          state.swipeTarget = target;
          context.addRootEventTypes(rootEventTypes);
        }
        break;
      }
    }
  },
  onRootEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: SwipeProps,
    state: SwipeState,
  ): void {
    const {type, nativeEvent} = event;

    switch (type) {
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
            state.direction = 3;
          } else if (x > state.x) {
            state.direction = 1;
          }
          state.x = x;
          state.y = y;
          const eventData = {
            diffX: x - state.startX,
            diffY: y - state.startY,
          };
          const onSwipeMove = props.onSwipeMove;

          if (isFunction(onSwipeMove)) {
            dispatchSwipeEvent(
              context,
              onSwipeMove,
              'swipemove',
              state,
              UserBlockingEvent,
              eventData,
            );
          }
          (nativeEvent: any).preventDefault();
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
          const direction = state.direction;
          const lastDirection = state.lastDirection;
          if (direction !== lastDirection) {
            if (direction === 3) {
              const onSwipeLeft = props.onSwipeLeft;

              if (isFunction(onSwipeLeft)) {
                dispatchSwipeEvent(
                  context,
                  onSwipeLeft,
                  'swipeleft',
                  state,
                  DiscreteEvent,
                );
              }
            } else if (direction === 1) {
              const onSwipeRight = props.onSwipeRight;

              if (isFunction(onSwipeRight)) {
                dispatchSwipeEvent(
                  context,
                  onSwipeRight,
                  'swiperight',
                  state,
                  DiscreteEvent,
                );
              }
            }
          }
          const onSwipeEnd = props.onSwipeEnd;

          if (isFunction(onSwipeEnd)) {
            dispatchSwipeEvent(
              context,
              onSwipeEnd,
              'swipeend',
              state,
              DiscreteEvent,
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

export const SwipeResponder = React.unstable_createResponder(
  'Swipe',
  swipeResponderImpl,
);

export function useSwipe(
  props: SwipeProps,
): ReactEventResponderListener<any, any> {
  return React.unstable_useResponder(SwipeResponder, props);
}
