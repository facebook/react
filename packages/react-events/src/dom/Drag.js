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
import {DiscreteEvent, UserBlockingEvent} from 'shared/ReactTypes';

const targetEventTypes = ['pointerdown'];
const rootEventTypes = ['pointerup', 'pointercancel', 'pointermove_active'];

type DragListenerProps = {|
  onDragStart: (e: DragEvent) => void,
  onDragMove: (e: DragEvent) => void,
  onDragEnd: (e: DragEvent) => void,
  onDragChange: boolean => void,
|};

type DragState = {
  dragTarget: null | Element | Document,
  isPointerDown: boolean,
  isDragging: boolean,
  startX: number,
  startY: number,
  x: number,
  y: number,
  ownershipClaimed: boolean,
};

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
  eventPropName: string,
  context: ReactDOMResponderContext,
  name: DragEventType,
  state: DragState,
  eventPriority: EventPriority,
  eventData?: EventData,
): void {
  const target = ((state.dragTarget: any): Element | Document);
  const syntheticEvent = createDragEvent(context, name, target, eventData);
  context.dispatchEvent(eventPropName, syntheticEvent, eventPriority);
}

const dragResponderImpl = {
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
      ownershipClaimed: false,
    };
  },
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

          dispatchDragEvent(
            'onDragStart',
            context,
            'dragstart',
            state,
            DiscreteEvent,
          );
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

            if (props.shouldClaimOwnership && props.shouldClaimOwnership()) {
              shouldEnableDragging = context.requestGlobalOwnership();
              if (shouldEnableDragging) {
                state.ownershipClaimed = true;
              }
            }
            if (shouldEnableDragging) {
              state.isDragging = true;
              context.dispatchEvent('onDragChange', true, UserBlockingEvent);
            } else {
              state.dragTarget = null;
              state.isPointerDown = false;
              context.removeRootEventTypes(rootEventTypes);
            }
          } else {
            const eventData = {
              diffX: x - state.startX,
              diffY: y - state.startY,
            };
            dispatchDragEvent(
              'onDragMove',
              context,
              'dragmove',
              state,
              UserBlockingEvent,
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
        if (state.isDragging) {
          if (state.ownershipClaimed) {
            context.releaseOwnership();
          }
          dispatchDragEvent(
            'onDragEnd',
            context,
            'dragend',
            state,
            DiscreteEvent,
          );
          context.dispatchEvent('onDragChange', false, UserBlockingEvent);
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

export const DragResponder = React.unstable_createResponder(
  'Drag',
  dragResponderImpl,
);

export function useDragListener(props: DragListenerProps): void {
  React.unstable_useListener(DragResponder, props);
}
