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
} from 'react-dom/src/shared/ReactDOMTypes';

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

// Keyboards, Assitive Technologies, and element.click() all produce a "virtual"
// click event. This is a method of inferring such clicks. Every browser except
// IE 11 only sets a zero value of "detail" for click events that are "virtual".
// However, IE 11 uses a zero value for all click events. For IE 11 we rely on
// the quirk that it produces click events that are of type PointerEvent, and
// where only the "virtual" click lacks a pointerType field.
export function isVirtualClick(event: ReactDOMResponderEvent): boolean {
  const nativeEvent: any = event.nativeEvent;
  // JAWS/NVDA with Firefox.
  if (nativeEvent.mozInputSource === 0 && nativeEvent.isTrusted) {
    return true;
  }
  return nativeEvent.detail === 0 && !nativeEvent.pointerType;
}
