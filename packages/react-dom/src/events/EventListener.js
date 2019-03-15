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

export function addEventListener(
  element: Document | Element | Node,
  eventType: string,
  listener: Function,
  options: {passive: boolean},
): void {
  element.addEventListener(eventType, listener, (options: any));
}
