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
import {DiscreteEvent} from 'shared/ReactTypes';

type ContextMenuProps = {|
  disabled: boolean,
  onContextMenu: (e: ContextMenuEvent) => void,
  preventDefault: boolean,
|};

type ContextMenuState = {
  pointerType: PointerType,
};

type ContextMenuEvent = {|
  altKey: boolean,
  buttons: 0 | 1 | 2,
  ctrlKey: boolean,
  metaKey: boolean,
  pageX: null | number,
  pageY: null | number,
  pointerType: PointerType,
  shiftKey: boolean,
  target: Element | Document,
  timeStamp: number,
  type: 'contextmenu',
  x: null | number,
  y: null | number,
|};

const hasPointerEvents =
  typeof window !== 'undefined' && window.PointerEvent != null;

function dispatchContextMenuEvent(
  event: ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  props: ContextMenuProps,
  state: ContextMenuState,
): void {
  const nativeEvent: any = event.nativeEvent;
  const target = event.target;
  const timeStamp = context.getTimeStamp();
  const pointerType = state.pointerType;

  const gestureState = {
    altKey: nativeEvent.altKey,
    buttons: nativeEvent.buttons != null ? nativeEvent.buttons : 0,
    ctrlKey: nativeEvent.ctrlKey,
    metaKey: nativeEvent.metaKey,
    pageX: nativeEvent.pageX,
    pageY: nativeEvent.pageY,
    pointerType,
    shiftKey: nativeEvent.shiftKey,
    target,
    timeStamp,
    type: 'contextmenu',
    x: nativeEvent.clientX,
    y: nativeEvent.clientY,
  };

  context.dispatchEvent(gestureState, props.onContextMenu, DiscreteEvent);
}

const contextMenuImpl = {
  targetEventTypes: hasPointerEvents
    ? ['contextmenu_active', 'pointerdown']
    : ['contextmenu_active', 'touchstart', 'mousedown'],
  getInitialState(): ContextMenuState {
    return {
      pointerType: '',
    };
  },
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: ContextMenuProps,
    state: ContextMenuState,
  ): void {
    const nativeEvent: any = event.nativeEvent;
    const pointerType = event.pointerType;
    const type = event.type;

    if (props.disabled) {
      return;
    }

    if (type === 'contextmenu') {
      const onContextMenu = props.onContextMenu;
      const preventDefault = props.preventDefault;
      if (preventDefault !== false && !nativeEvent.defaultPrevented) {
        nativeEvent.preventDefault();
      }
      if (typeof onContextMenu === 'function') {
        dispatchContextMenuEvent(event, context, props, state);
      }
      state.pointerType = '';
    } else {
      state.pointerType = pointerType;
    }
  },
};

export const ContextMenuResponder = React.unstable_createResponder(
  'ContextMenu',
  contextMenuImpl,
);

export function useContextMenu(
  props: ContextMenuProps,
): ReactEventResponderListener<any, any> {
  return React.unstable_useResponder(ContextMenuResponder, props);
}
