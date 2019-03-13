/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  type ListenerType,
  PASSIVE_DISABLED,
  PASSIVE_FALLBACK,
  PASSIVE_TRUE,
} from 'events/ListenerTypes';

export function addEventBubbleListener(
  element: Document | Element | Node,
  eventType: string,
  listener: Function,
  listenerType: ListenerType,
): void {
  if (listenerType === PASSIVE_DISABLED || listenerType === PASSIVE_FALLBACK) {
    element.addEventListener(eventType, listener, false);
  } else {
    element.addEventListener(eventType, listener, {
      passive: listenerType === PASSIVE_TRUE,
      capture: false,
    });
  }
}

export function addEventCaptureListener(
  element: Document | Element | Node,
  eventType: string,
  listener: Function,
  listenerType: ListenerType,
): void {
  if (listenerType === PASSIVE_DISABLED || listenerType === PASSIVE_FALLBACK) {
    element.addEventListener(eventType, listener, true);
  } else {
    element.addEventListener(eventType, listener, {
      passive: listenerType === PASSIVE_TRUE,
      capture: true,
    });
  }
}
