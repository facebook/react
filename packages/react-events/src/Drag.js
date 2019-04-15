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

const CAPTURE_PHASE = 2;
const targetEventTypes = ['pointerdown', 'pointercancel'];
const rootEventTypes = ['pointerup', {name: 'pointermove', passive: false}];

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
type DragEventType = 'dragstart' | 'dragend' | 'dragchange' | 'dragmove';

type DragEvent = {|
  target: Element | Document,
  type: DragEventType,
  diffX?: number,
  diffY?: number,
|};

function createDragEvent(
  type: DragEventType,
  target: Element | Document,
  eventData?: EventData,
): DragEvent {
  return {
    target,
    type,
    ...eventData,
  };
}

function dispatchDragEvent(
  context: ReactResponderContext,
  name: DragEventType,
  listener: DragEvent => void,
  state: DragState,
  discrete: boolean,
  eventData?: EventData,
): void {
  const target = ((state.dragTarget: any): Element | Document);
  const syntheticEvent = createDragEvent(name, target, eventData);
  context.dispatchEvent(syntheticEvent, listener, {discrete});
}

const DragResponder = {
  targetEventTypes,
  createInitialState(): DragState {
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
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: Object,
    state: DragState,
  ): boolean {
    const {target, phase, type, nativeEvent} = event;

    // Drag doesn't handle capture target events at this point
    if (phase === CAPTURE_PHASE) {
      return false;
    }
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
              true,
            );
          }

          context.addRootEventTypes(target.ownerDocument, rootEventTypes);
        }
        break;
      }
      case 'touchmove':
      case 'mousemove':
      case 'pointermove': {
        if (event.passive) {
          return false;
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
          if (!state.isDragging && x !== state.startX && y !== state.startY) {
            let shouldEnableDragging = true;

            if (
              props.onShouldClaimOwnership &&
              props.onShouldClaimOwnership()
            ) {
              shouldEnableDragging = context.requestOwnership();
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
                  true,
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
                false,
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
            dispatchDragEvent(context, 'dragend', props.onDragEnd, state, true);
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
              true,
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
    return false;
  },
};

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName: 'Drag',
  props: null,
  responder: DragResponder,
};
