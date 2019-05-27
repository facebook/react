/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function addEventBubbleListener(
  element: Document | Element | Node,
  eventType: string,
  listener: Function,
): void {
  element.addEventListener(eventType, listener, false);
}

export function addEventCaptureListener(
  element: Document | Element | Node,
  eventType: string,
  listener: Function,
): void {
  element.addEventListener(eventType, listener, true);
}

export function addEventCaptureListenerWithPassiveFlag(
  element: Document | Element | Node,
  eventType: string,
  listener: Function,
  passive: boolean,
): void {
  element.addEventListener(eventType, listener, {
    capture: true,
    passive,
  });
}
