/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function addEventBubbleListener(
  target: EventTarget,
  eventType: string,
  listener: Function,
): void {
  target.addEventListener(eventType, listener, false);
}

export function addEventCaptureListener(
  target: EventTarget,
  eventType: string,
  listener: Function,
): void {
  target.addEventListener(eventType, listener, true);
}

export function addEventCaptureListenerWithPassiveFlag(
  target: EventTarget,
  eventType: string,
  listener: Function,
  passive: boolean,
): void {
  target.addEventListener(eventType, listener, {
    capture: true,
    passive,
  });
}

export function addEventBubbleListenerWithPassiveFlag(
  target: EventTarget,
  eventType: string,
  listener: Function,
  passive: boolean,
): void {
  target.addEventListener(eventType, listener, {
    passive,
  });
}
