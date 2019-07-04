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
  PointerType,
} from 'shared/ReactDOMTypes';
import {UserBlockingEvent} from 'shared/ReactTypes';
import type {EventPriority} from 'shared/ReactTypes';

import React from 'react';

type ScrollProps = {
  disabled: boolean,
  onScroll: ScrollEvent => void,
  onScrollDragStart: ScrollEvent => void,
  onScrollDragEnd: ScrollEvent => void,
};

type ScrollState = {
  direction: ScrollDirection,
  pointerType: PointerType,
  scrollTarget: null | Element | Document,
  isDragging: boolean,
  isTouching: boolean,
  scrollLeft: number,
  scrollTop: number,
};

type ScrollEventType =
  | 'scroll'
  | 'scrolldragstart'
  | 'scrolldragend'
  | 'scrollmomentumstart'
  | 'scrollmomentumend';

type ScrollDirection = '' | 'up' | 'down' | 'left' | 'right';

type ScrollEvent = {|
  direction: ScrollDirection,
  target: Element | Document,
  type: ScrollEventType,
  pointerType: PointerType,
  timeStamp: number,
  clientX: null | number,
  clientY: null | number,
  pageX: null | number,
  pageY: null | number,
  screenX: null | number,
  screenY: null | number,
  x: null | number,
  y: null | number,
|};

const targetEventTypes = [
  'scroll',
  'pointerdown',
  'touchstart',
  'keyup',
  'wheel',
];
const rootEventTypes = ['touchcancel', 'touchend'];

function createScrollEvent(
  event: ?ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  type: ScrollEventType,
  target: Element | Document,
  pointerType: PointerType,
  direction: ScrollDirection,
): ScrollEvent {
  let clientX = null;
  let clientY = null;
  let pageX = null;
  let pageY = null;
  let screenX = null;
  let screenY = null;

  if (event) {
    const nativeEvent = (event.nativeEvent: any);
    ({clientX, clientY, pageX, pageY, screenX, screenY} = nativeEvent);
  }

  return {
    target,
    type,
    pointerType,
    direction,
    timeStamp: context.getTimeStamp(),
    clientX,
    clientY,
    pageX,
    pageY,
    screenX,
    screenY,
    x: clientX,
    y: clientY,
  };
}

function dispatchEvent(
  event: ?ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  state: ScrollState,
  name: ScrollEventType,
  listener: (e: Object) => void,
  eventPriority: EventPriority,
): void {
  const target = ((state.scrollTarget: any): Element | Document);
  const pointerType = state.pointerType;
  const direction = state.direction;
  const syntheticEvent = createScrollEvent(
    event,
    context,
    name,
    target,
    pointerType,
    direction,
  );
  context.dispatchEvent(syntheticEvent, listener, eventPriority);
}

const ScrollResponder: ReactDOMEventResponder = {
  displayName: 'Scroll',
  targetEventTypes,
  getInitialState() {
    return {
      direction: '',
      isTouching: false,
      pointerType: '',
      prevScrollTop: 0,
      prevScrollLeft: 0,
      scrollTarget: null,
    };
  },
  allowMultipleHostChildren: true,
  allowEventHooks: true,
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: ScrollProps,
    state: ScrollState,
  ): void {
    const {pointerType, target, type} = event;

    if (props.disabled) {
      if (state.isTouching) {
        state.isTouching = false;
        state.scrollTarget = null;
        state.isDragging = false;
        state.direction = '';
        context.removeRootEventTypes(rootEventTypes);
      }
      return;
    }

    switch (type) {
      case 'scroll': {
        const prevScrollTarget = state.scrollTarget;
        let scrollLeft = 0;
        let scrollTop = 0;

        // Check if target is the document
        if (target.nodeType === 9) {
          const bodyNode = ((target: any): Document).body;
          if (bodyNode !== null) {
            scrollLeft = bodyNode.offsetLeft;
            scrollTop = bodyNode.offsetTop;
          }
        } else {
          scrollLeft = ((target: any): Element).scrollLeft;
          scrollTop = ((target: any): Element).scrollTop;
        }

        if (prevScrollTarget !== null) {
          if (scrollTop === state.scrollTop) {
            if (scrollLeft > state.scrollLeft) {
              state.direction = 'right';
            } else {
              state.direction = 'left';
            }
          } else {
            if (scrollTop > state.scrollTop) {
              state.direction = 'down';
            } else {
              state.direction = 'up';
            }
          }
        } else {
          state.direction = '';
        }
        state.scrollTarget = ((target: any): Element | Document);
        state.scrollLeft = scrollLeft;
        state.scrollTop = scrollTop;

        if (state.isTouching && !state.isDragging) {
          state.isDragging = true;
          if (props.onScrollDragStart) {
            dispatchEvent(
              event,
              context,
              state,
              'scrolldragstart',
              props.onScrollDragStart,
              UserBlockingEvent,
            );
          }
        }
        if (props.onScroll) {
          dispatchEvent(
            event,
            context,
            state,
            'scroll',
            props.onScroll,
            UserBlockingEvent,
          );
        }
        break;
      }
      case 'keyup': {
        state.pointerType = pointerType;
        break;
      }
      case 'wheel': {
        state.pointerType = 'mouse';
        break;
      }
      case 'pointerdown': {
        state.pointerType = pointerType;
        break;
      }
      case 'touchstart': {
        if (!state.isTouching) {
          state.isTouching = true;
          context.addRootEventTypes(rootEventTypes);
        }
      }
    }
  },
  onRootEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: ScrollProps,
    state: ScrollState,
  ) {
    const {type} = event;

    switch (type) {
      case 'touchcancel':
      case 'touchend': {
        if (state.isTouching) {
          if (state.isDragging && props.onScrollDragEnd) {
            dispatchEvent(
              event,
              context,
              state,
              'scrolldragend',
              props.onScrollDragEnd,
              UserBlockingEvent,
            );
          }
          state.isTouching = false;
          state.isDragging = false;
          state.scrollTarget = null;
          state.pointerType = '';
          context.removeRootEventTypes(rootEventTypes);
        }
      }
    }
  },
  onUnmount(
    context: ReactDOMResponderContext,
    props: ScrollProps,
    state: ScrollState,
  ) {
    // TODO
  },
  onOwnershipChange(
    context: ReactDOMResponderContext,
    props: ScrollProps,
    state: ScrollState,
  ) {
    // TODO
  },
};

export const Scroll = React.unstable_createEvent(ScrollResponder);

export function useScroll(props: ScrollProps): void {
  React.unstable_useEvent(Scroll, props);
}
