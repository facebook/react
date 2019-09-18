/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {PointerType} from 'shared/ReactDOMTypes';

import React from 'react';
import {useTap} from 'react-ui/events/tap';
import {useKeyboard} from 'react-ui/events/keyboard';

const emptyObject = {};

type PressProps = $ReadOnly<{|
  disabled?: boolean,
  preventDefault?: boolean,
  onPress?: (e: PressEvent) => void,
  onPressChange?: boolean => void,
  onPressEnd?: (e: PressEvent) => void,
  onPressMove?: (e: PressEvent) => void,
  onPressStart?: (e: PressEvent) => void,
|}>;

type PressEventType =
  | 'pressstart'
  | 'presschange'
  | 'pressmove'
  | 'pressend'
  | 'press';

type PressEvent = {|
  altKey: boolean,
  buttons: null | 0 | 1 | 4,
  ctrlKey: boolean,
  defaultPrevented: boolean,
  key: null | string,
  metaKey: boolean,
  pageX: number,
  pageY: number,
  pointerType: PointerType,
  shiftKey: boolean,
  target: null | Element,
  timeStamp: number,
  type: PressEventType,
  x: number,
  y: number,
|};

function createGestureState(e: any, type: PressEventType): PressEvent {
  return {
    altKey: e.altKey,
    buttons: e.buttons,
    ctrlKey: e.ctrlKey,
    defaultPrevented: e.defaultPrevented,
    key: e.key,
    metaKey: e.metaKey,
    pageX: e.pageX,
    pageY: e.pageX,
    pointerType: e.pointerType,
    shiftKey: e.shiftKey,
    target: e.target,
    timeStamp: e.timeStamp,
    type,
    x: e.x,
    y: e.y,
  };
}

function isValidKey(e): boolean {
  const {key, target} = e;
  const {tagName, isContentEditable} = (target: any);
  return (
    (key === 'Enter' || key === ' ') &&
    (tagName !== 'INPUT' &&
      tagName !== 'TEXTAREA' &&
      isContentEditable !== true)
  );
}

/**
 * The lack of built-in composition for gesture responders means we have to
 * selectively ignore callbacks from useKeyboard or useTap if the other is
 * active.
 */
export function usePress(props: PressProps) {
  const safeProps = props || emptyObject;
  const {
    disabled,
    preventDefault,
    onPress,
    onPressChange,
    onPressEnd,
    onPressMove,
    onPressStart,
  } = safeProps;

  const [active, updateActive] = React.useState(null);

  const tap = useTap({
    disabled: disabled || active === 'keyboard',
    preventDefault,
    onTapStart(e) {
      if (active == null) {
        updateActive('tap');
        if (onPressStart != null) {
          onPressStart(createGestureState(e, 'pressstart'));
        }
      }
    },
    onTapChange: onPressChange,
    onTapUpdate(e) {
      if (active === 'tap') {
        if (onPressMove != null) {
          onPressMove(createGestureState(e, 'pressmove'));
        }
      }
    },
    onTapEnd(e) {
      if (active === 'tap') {
        if (onPressEnd != null) {
          onPressEnd(createGestureState(e, 'pressend'));
        }
        if (onPress != null && e.buttons !== 4) {
          onPress(createGestureState(e, 'press'));
        }
        updateActive(null);
      }
    },
    onTapCancel(e) {
      if (active === 'tap') {
        if (onPressEnd != null) {
          onPressEnd(createGestureState(e, 'pressend'));
        }
        updateActive(null);
      }
    },
  });

  const keyboard = useKeyboard({
    disabled: disabled || active === 'tap',
    preventClick: preventDefault !== false,
    preventKeys: preventDefault !== false ? [' ', 'Enter'] : [],
    onClick(e) {
      if (active == null && onPress != null) {
        onPress(createGestureState(e, 'press'));
      }
    },
    onKeyDown(e) {
      if (active == null && isValidKey(e)) {
        updateActive('keyboard');
        if (onPressStart != null) {
          onPressStart(createGestureState(e, 'pressstart'));
        }
        if (onPressChange != null) {
          onPressChange(true);
        }
        // stop propagation
        return false;
      }
    },
    onKeyUp(e) {
      if (active === 'keyboard' && isValidKey(e)) {
        if (onPressChange != null) {
          onPressChange(false);
        }
        if (onPressEnd != null) {
          onPressEnd(createGestureState(e, 'pressend'));
        }
        if (onPress != null) {
          onPress(createGestureState(e, 'press'));
        }
        updateActive(null);
        // stop propagation
        return false;
      }
    },
  });

  return [tap, keyboard];
}
