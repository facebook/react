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
import {UserBlockingEvent} from 'shared/ReactTypes';
import type {EventPriority} from 'shared/ReactTypes';

import React from 'react';

type ScrollProps = {
  disabled: boolean,
  onScroll: ScrollEvent => void,
  onScrollDragStart: ScrollEvent => void,
  onScrollDragEnd: ScrollEvent => void,
  onScrollMomentumStart: ScrollEvent => void,
  onScrollMomentumEnd: ScrollEvent => void,
};

type ScrollState = {
  pointerType: PointerType,
  scrollTarget: null | Element | Document,
  isPointerDown: boolean,
};

type ScrollEventType =
  | 'scroll'
  | 'scrolldragstart'
  | 'scrolldragend'
  | 'scrollmomentumstart'
  | 'scrollmomentumend';

type PointerType = '' | 'mouse' | 'keyboard' | 'pen' | 'touch';

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

const targetEventTypes = ['scroll', 'pointerdown', 'keyup'];
const rootEventTypes = ['pointermove', 'pointerup', 'pointercancel'];

function createScrollEvent(
  event: ?ReactResponderEvent,
  context: ReactResponderContext,
  type: ScrollEventType,
  target: Element | Document,
  pointerType: PointerType,
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
    direction: '', // TODO
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
  event: ?ReactResponderEvent,
  context: ReactResponderContext,
  state: ScrollState,
  name: ScrollEventType,
  listener: (e: Object) => void,
  eventPriority: EventPriority,
): void {
  const target = ((state.scrollTarget: any): Element | Document);
  const pointerType = state.pointerType;
  const syntheticEvent = createScrollEvent(
    event,
    context,
    name,
    target,
    pointerType,
  );
  context.dispatchEvent(syntheticEvent, listener, eventPriority);
}

const ScrollResponder = {
  targetEventTypes,
  createInitialState() {
    return {
      pointerType: '',
      scrollTarget: null,
      isPointerDown: false,
    };
  },
  allowMultipleHostChildren: true,
  stopLocalPropagation: true,
  onEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: ScrollProps,
    state: ScrollState,
  ): void {
    const {target, type} = event;

    if (props.disabled) {
      if (state.isPointerDown) {
        state.isPointerDown = false;
        state.scrollTarget = null;
        context.addRootEventTypes(rootEventTypes);
      }
      return;
    }
    const pointerType = context.getEventPointerType(event);

    switch (type) {
      case 'scroll': {
        state.scrollTarget = ((target: any): Element | Document);
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
      case 'pointerdown': {
        state.pointerType = pointerType;
        if (!state.isPointerDown) {
          state.isPointerDown = true;
          context.addRootEventTypes(rootEventTypes);
        }
        break;
      }
    }
  },
  onRootEvent(
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: ScrollProps,
    state: ScrollState,
  ) {
    const {type} = event;
    const pointerType = context.getEventPointerType(event);

    switch (type) {
      case 'pointercancel':
      case 'pointerup': {
        state.pointerType = pointerType;
        if (state.isPointerDown) {
          state.isPointerDown = false;
          context.removeRootEventTypes(rootEventTypes);
        }
        break;
      }
      case 'pointermove': {
        state.pointerType = pointerType;
      }
    }
  },
  onUnmount(
    context: ReactResponderContext,
    props: ScrollProps,
    state: ScrollState,
  ) {
    // TODO
  },
  onOwnershipChange(
    context: ReactResponderContext,
    props: ScrollProps,
    state: ScrollState,
  ) {
    // TODO
  },
};

export default React.unstable_createEventComponent(ScrollResponder, 'Scroll');
