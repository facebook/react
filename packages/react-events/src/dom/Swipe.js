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
import type {EventPriority} from 'shared/ReactTypes';

import React from 'react';
import {UserBlockingEvent, DiscreteEvent} from 'shared/ReactTypes';

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
  eventPropName: string,
  context: ReactDOMResponderContext,
  name: SwipeEventType,
  state: SwipeState,
  eventPriority: EventPriority,
  eventData?: EventData,
) {
  const target = ((state.swipeTarget: any): Element | Document);
  const syntheticEvent = createSwipeEvent(context, name, target, eventData);
  context.dispatchEvent(eventPropName, syntheticEvent, eventPriority);
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
  ownershipClaimed: boolean,
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
      ownershipClaimed: false,
    };
  },
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: Object,
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

          let shouldEnableSwiping = true;

          if (props.shouldClaimOwnership && props.shouldClaimOwnership()) {
            shouldEnableSwiping = context.requestGlobalOwnership();
            if (shouldEnableSwiping) {
              state.ownershipClaimed = true;
            }
          }
          if (shouldEnableSwiping) {
            state.isSwiping = true;
            state.startX = x;
            state.startY = y;
            state.x = x;
            state.y = y;
            state.swipeTarget = target;
            context.addRootEventTypes(rootEventTypes);
          } else {
            state.touchId = null;
          }
        }
        break;
      }
    }
  },
  onRootEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: Object,
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
          dispatchSwipeEvent(
            'onSwipeMove',
            context,
            'swipemove',
            state,
            UserBlockingEvent,
            eventData,
          );
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
          if (state.ownershipClaimed) {
            context.releaseOwnership();
          }
          const direction = state.direction;
          const lastDirection = state.lastDirection;
          if (direction !== lastDirection) {
            if (props.onSwipeLeft && direction === 3) {
              dispatchSwipeEvent(
                'onSwipeLeft',
                context,
                'swipeleft',
                state,
                DiscreteEvent,
              );
            } else if (props.onSwipeRight && direction === 1) {
              dispatchSwipeEvent(
                'onSwipeRight',
                context,
                'swiperight',
                state,
                DiscreteEvent,
              );
            }
          }
          if (props.onSwipeEnd) {
            dispatchSwipeEvent(
              'onSwipeEnd',
              context,
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

export function useSwipeListener(props: Object): void {
  React.unstable_useListener(SwipeResponder, props);
}
