/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactDOMEventResponder,
  ReactDOMResponderEvent,
  ReactDOMResponderContext,
} from 'shared/ReactDOMTypes';
import type {EventPriority} from 'shared/ReactTypes';

import React from 'react';
import {DiscreteEvent, UserBlockingEvent} from 'shared/ReactTypes';

const targetEventTypes = ['pointerdown'];
const rootEventTypes = [
  'pointerup',
  'pointercancel',
  {name: 'pointermove', passive: false},
];

type DragState = {
  dragTarget: null | Element | Document,
  isPointerDown: boolean,
  isDragging: boolean,
  startX: number,
  startY: number,
  x: number,
  y: number,
};

// In the case we don't have PointerEvents (Safari), we listen to touch events
// too
if (typeof window !== 'undefined' && window.PointerEvent === undefined) {
  targetEventTypes.push('touchstart', 'mousedown');
  rootEventTypes.push('mouseup', 'mousemove', 'touchend', 'touchcancel', {
    name: 'touchmove',
    passive: false,
  });
}

type EventData = {
  diffX: number,
  diffY: number,
};
type DragEventType = 'dragstart' | 'dragend' | 'dragchange' | 'dragmove';

type DragEvent = {|
  target: Element | Document,
  type: DragEventType,
  timeStamp: number,
  diffX?: number,
  diffY?: number,
|};

function createDragEvent(
  context: ReactDOMResponderContext,
  type: DragEventType,
  target: Element | Document,
  eventData?: EventData,
): DragEvent {
  return {
    target,
    type,
    timeStamp: context.getTimeStamp(),
    ...eventData,
  };
}

function dispatchDragEvent(
  context: ReactDOMResponderContext,
  name: DragEventType,
  listener: DragEvent => void,
  state: DragState,
  eventPriority: EventPriority,
  eventData?: EventData,
): void {
  const target = ((state.dragTarget: any): Element | Document);
  const syntheticEvent = createDragEvent(context, name, target, eventData);
  context.dispatchEvent(syntheticEvent, listener, eventPriority);
}

const DragResponder: ReactDOMEventResponder = {
  displayName: 'Drag',
  targetEventTypes,
  getInitialState(): DragState {
    return {
      dragTarget: null,
      isPointerDown: false,
      isDragging: false,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
    };
  },
  allowMultipleHostChildren: false,
  allowEventHooks: false,
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: Object,
    state: DragState,
  ): void {
    const {target, type, nativeEvent} = event;

    switch (type) {
      case 'touchstart':
      case 'mousedown':
      case 'pointerdown': {
        if (!state.isDragging) {
          if (props.onShouldClaimOwnership) {
            context.releaseOwnership();
          }
          const obj =
            type === 'touchstart'
              ? (nativeEvent: any).changedTouches[0]
              : nativeEvent;
          const x = (state.startX = (obj: any).screenX);
          const y = (state.startY = (obj: any).screenY);
          state.x = x;
          state.y = y;
          state.dragTarget = target;
          state.isPointerDown = true;

          if (props.onDragStart) {
            dispatchDragEvent(
              context,
              'dragstart',
              props.onDragStart,
              state,
              DiscreteEvent,
            );
          }

          context.addRootEventTypes(rootEventTypes);
        }
        break;
      }
    }
  },
  onRootEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: Object,
    state: DragState,
  ): void {
    const {type, nativeEvent} = event;

    switch (type) {
      case 'touchmove':
      case 'mousemove':
      case 'pointermove': {
        if (event.passive) {
          return;
        }
        if (state.isPointerDown) {
          const obj =
            type === 'touchmove'
              ? (nativeEvent: any).changedTouches[0]
              : nativeEvent;
          const x = (obj: any).screenX;
          const y = (obj: any).screenY;
          state.x = x;
          state.y = y;
          if (x === state.startX && y === state.startY) {
            return;
          }
          if (!state.isDragging) {
            let shouldEnableDragging = true;

            if (
              props.onShouldClaimOwnership &&
              props.onShouldClaimOwnership()
            ) {
              shouldEnableDragging = context.requestGlobalOwnership();
            }
            if (shouldEnableDragging) {
              state.isDragging = true;
              if (props.onDragChange) {
                const dragChangeEventListener = () => {
                  props.onDragChange(true);
                };
                dispatchDragEvent(
                  context,
                  'dragchange',
                  dragChangeEventListener,
                  state,
                  UserBlockingEvent,
                );
              }
            } else {
              state.dragTarget = null;
              state.isPointerDown = false;
              context.removeRootEventTypes(rootEventTypes);
            }
          } else {
            if (props.onDragMove) {
              const eventData = {
                diffX: x - state.startX,
                diffY: y - state.startY,
              };
              dispatchDragEvent(
                context,
                'dragmove',
                props.onDragMove,
                state,
                UserBlockingEvent,
                eventData,
              );
            }
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
        if (state.isDragging) {
          if (props.onShouldClaimOwnership) {
            context.releaseOwnership();
          }
          if (props.onDragEnd) {
            dispatchDragEvent(
              context,
              'dragend',
              props.onDragEnd,
              state,
              DiscreteEvent,
            );
          }
          if (props.onDragChange) {
            const dragChangeEventListener = () => {
              props.onDragChange(false);
            };
            dispatchDragEvent(
              context,
              'dragchange',
              dragChangeEventListener,
              state,
              UserBlockingEvent,
            );
          }
          state.isDragging = false;
        }
        if (state.isPointerDown) {
          state.dragTarget = null;
          state.isPointerDown = false;
          context.removeRootEventTypes(rootEventTypes);
        }
        break;
      }
    }
  },
};

export const Drag = React.unstable_createEvent(DragResponder);

export function useDrag(props: Object): void {
  React.unstable_useEvent(Drag, props);
}
