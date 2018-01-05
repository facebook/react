/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function addEventBubbleListener(
  element: Element,
  eventType: string,
  listener: Function,
): void {
  element.addEventListener(eventType, listener, false);
}

export function addEventCaptureListener(
  element: Element,
  eventType: string,
  listener: Function,
): void {
  element.addEventListener(eventType, listener, true);
}
