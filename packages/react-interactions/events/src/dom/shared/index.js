/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {DiscreteEvent, UserBlockingEvent} from 'shared/ReactTypes';
import type {
  ReactDOMResponderContext,
  ReactDOMResponderEvent,
} from 'shared/ReactDOMTypes';

export const hasPointerEvents =
  typeof window !== 'undefined' && window.PointerEvent !== undefined;

export const isMac =
  typeof window !== 'undefined' && window.navigator != null
    ? /^Mac/.test(window.navigator.platform)
    : false;

export const buttonsEnum = {
  none: 0,
  primary: 1,
  secondary: 2,
  auxiliary: 4,
};

export function dispatchDiscreteEvent(
  context: ReactDOMResponderContext,
  payload: ReactDOMResponderEvent,
  callback: any => void,
) {
  context.dispatchEvent(payload, callback, DiscreteEvent);
}

export function dispatchUserBlockingEvent(
  context: ReactDOMResponderContext,
  payload: ReactDOMResponderEvent,
  callback: any => void,
) {
  context.dispatchEvent(payload, callback, UserBlockingEvent);
}

export function getTouchById(
  nativeEvent: TouchEvent,
  pointerId: null | number,
): null | Touch {
  if (pointerId != null) {
    const changedTouches = nativeEvent.changedTouches;
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i];
      if (touch.identifier === pointerId) {
        return touch;
      }
    }
    return null;
  }
  return null;
}

export function hasModifierKey(event: ReactDOMResponderEvent): boolean {
  const nativeEvent: any = event.nativeEvent;
  const {altKey, ctrlKey, metaKey, shiftKey} = nativeEvent;
  return (
    altKey === true || ctrlKey === true || metaKey === true || shiftKey === true
  );
}

// Keyboards, Assitive Technologies, and element.click() all produce "virtual"
// clicks that do not include coordinates and "detail" is always 0 (where
// pointer clicks are > 0).
export function isVirtualClick(event: ReactDOMResponderEvent): boolean {
  const nativeEvent: any = event.nativeEvent;
  return (
    nativeEvent.detail === 0 &&
    nativeEvent.screenX === 0 &&
    nativeEvent.screenY === 0 &&
    nativeEvent.clientX === 0 &&
    nativeEvent.clientY === 0
  );
}
