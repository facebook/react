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
  PointerType,
} from 'shared/ReactDOMTypes';
import type {ReactEventResponderListener} from 'shared/ReactTypes';

import React from 'react';
import {UserBlockingEvent} from 'shared/ReactTypes';

type HoverProps = {
  disabled: boolean,
  preventDefault: boolean,
  onHoverChange: boolean => void,
  onHoverEnd: (e: HoverEvent) => void,
  onHoverMove: (e: HoverEvent) => void,
  onHoverStart: (e: HoverEvent) => void,
};

type HoverState = {
  hoverTarget: null | Element | Document,
  isActiveHovered: boolean,
  isHovered: boolean,
  isTouched?: boolean,
  ignoreEmulatedMouseEvents?: boolean,
};

type HoverEventType = 'hoverstart' | 'hoverend' | 'hoverchange' | 'hovermove';

type HoverEvent = {|
  clientX: null | number,
  clientY: null | number,
  pageX: null | number,
  pageY: null | number,
  pointerType: PointerType,
  screenX: null | number,
  screenY: null | number,
  target: Element | Document,
  timeStamp: number,
  type: HoverEventType,
  x: null | number,
  y: null | number,
|};

const hasPointerEvents =
  typeof window !== 'undefined' && window.PointerEvent != null;

function isFunction(obj): boolean {
  return typeof obj === 'function';
}

function createHoverEvent(
  event: ?ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  type: HoverEventType,
  target: Element | Document,
): HoverEvent {
  let clientX = null;
  let clientY = null;
  let pageX = null;
  let pageY = null;
  let screenX = null;
  let screenY = null;
  let pointerType = '';

  if (event) {
    const nativeEvent = (event.nativeEvent: any);
    pointerType = event.pointerType;
    ({clientX, clientY, pageX, pageY, screenX, screenY} = nativeEvent);
  }

  return {
    pointerType,
    target,
    type,
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

function dispatchHoverChangeEvent(
  event: null | ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  props: HoverProps,
  state: HoverState,
): void {
  const onHoverChange = props.onHoverChange;
  if (isFunction(onHoverChange)) {
    const bool = state.isActiveHovered;
    context.dispatchEvent(bool, onHoverChange, UserBlockingEvent);
  }
}

function dispatchHoverStartEvents(
  event: ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  props: HoverProps,
  state: HoverState,
): void {
  const target = state.hoverTarget;
  if (event !== null) {
    const {nativeEvent} = event;
    if (
      context.isTargetWithinResponderScope((nativeEvent: any).relatedTarget)
    ) {
      return;
    }
  }

  state.isHovered = true;

  if (!state.isActiveHovered) {
    state.isActiveHovered = true;
    const onHoverStart = props.onHoverStart;
    if (isFunction(onHoverStart)) {
      const syntheticEvent = createHoverEvent(
        event,
        context,
        'hoverstart',
        ((target: any): Element | Document),
      );
      context.dispatchEvent(syntheticEvent, onHoverStart, UserBlockingEvent);
    }
    dispatchHoverChangeEvent(event, context, props, state);
  }
}

function dispatchHoverMoveEvent(event, context, props, state) {
  const target = state.hoverTarget;
  const onHoverMove = props.onHoverMove;
  if (isFunction(onHoverMove)) {
    const syntheticEvent = createHoverEvent(
      event,
      context,
      'hovermove',
      ((target: any): Element | Document),
    );
    context.dispatchEvent(syntheticEvent, onHoverMove, UserBlockingEvent);
  }
}

function dispatchHoverEndEvents(
  event: null | ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  props: HoverProps,
  state: HoverState,
) {
  const target = state.hoverTarget;
  if (event !== null) {
    const {nativeEvent} = event;
    if (
      context.isTargetWithinResponderScope((nativeEvent: any).relatedTarget)
    ) {
      return;
    }
  }

  state.isHovered = false;

  if (state.isActiveHovered) {
    state.isActiveHovered = false;
    const onHoverEnd = props.onHoverEnd;
    if (isFunction(onHoverEnd)) {
      const syntheticEvent = createHoverEvent(
        event,
        context,
        'hoverend',
        ((target: any): Element | Document),
      );
      context.dispatchEvent(syntheticEvent, onHoverEnd, UserBlockingEvent);
    }
    dispatchHoverChangeEvent(event, context, props, state);
    state.hoverTarget = null;
    state.isTouched = false;
  }
}

function unmountResponder(
  context: ReactDOMResponderContext,
  props: HoverProps,
  state: HoverState,
): void {
  if (state.isHovered) {
    dispatchHoverEndEvents(null, context, props, state);
  }
}

const hoverResponderImpl = {
  targetEventTypes: [
    'pointerover',
    'pointermove',
    'pointerout',
    'pointercancel',
  ],
  getInitialState() {
    return {
      isActiveHovered: false,
      isHovered: false,
    };
  },
  allowMultipleHostChildren: false,
  allowEventHooks: true,
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: HoverProps,
    state: HoverState,
  ): void {
    const {pointerType, type} = event;

    if (props.disabled) {
      if (state.isHovered) {
        dispatchHoverEndEvents(event, context, props, state);
      }
      return;
    }

    switch (type) {
      // START
      case 'pointerover': {
        if (!state.isHovered && pointerType !== 'touch') {
          state.hoverTarget = context.getResponderNode();
          dispatchHoverStartEvents(event, context, props, state);
        }
        break;
      }

      // MOVE
      case 'pointermove': {
        if (state.isHovered && state.hoverTarget !== null) {
          dispatchHoverMoveEvent(event, context, props, state);
        }
        break;
      }

      // END
      case 'pointerout':
      case 'pointercancel': {
        if (state.isHovered) {
          dispatchHoverEndEvents(event, context, props, state);
        }
        break;
      }
    }
  },
  onUnmount: unmountResponder,
};

const hoverResponderFallbackImpl = {
  targetEventTypes: ['mouseover', 'mousemove', 'mouseout', 'touchstart'],
  getInitialState() {
    return {
      isActiveHovered: false,
      isHovered: false,
      isTouched: false,
      ignoreEmulatedMouseEvents: false,
    };
  },
  allowMultipleHostChildren: false,
  allowEventHooks: true,
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: HoverProps,
    state: HoverState,
  ): void {
    const {type} = event;

    if (props.disabled) {
      if (state.isHovered) {
        dispatchHoverEndEvents(event, context, props, state);
        state.ignoreEmulatedMouseEvents = false;
      }
      state.isTouched = false;
      return;
    }

    switch (type) {
      // START
      case 'mouseover': {
        if (!state.isHovered && !state.ignoreEmulatedMouseEvents) {
          state.hoverTarget = context.getResponderNode();
          dispatchHoverStartEvents(event, context, props, state);
        }
        break;
      }

      // MOVE
      case 'mousemove': {
        if (
          state.isHovered &&
          state.hoverTarget !== null &&
          !state.ignoreEmulatedMouseEvents
        ) {
          dispatchHoverMoveEvent(event, context, props, state);
        } else if (!state.isHovered && type === 'mousemove') {
          state.ignoreEmulatedMouseEvents = false;
          state.isTouched = false;
        }
        break;
      }

      // END
      case 'mouseout': {
        if (state.isHovered) {
          dispatchHoverEndEvents(event, context, props, state);
        }
        break;
      }

      case 'touchstart': {
        if (!state.isHovered) {
          state.isTouched = true;
          state.ignoreEmulatedMouseEvents = true;
        }
        break;
      }
    }
  },
  onUnmount: unmountResponder,
};

export const HoverResponder = React.unstable_createResponder(
  'Hover',
  hasPointerEvents ? hoverResponderImpl : hoverResponderFallbackImpl,
);

export function useHover(
  props: HoverProps,
): ReactEventResponderListener<any, any> {
  return React.unstable_useResponder(HoverResponder, props);
}
