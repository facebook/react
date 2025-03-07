/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function addEventListener(
  target: EventTarget,
  eventType: string,
  listener: Function,
  isCapture: boolean,
  isPassive: boolean,
): Function {
  target.addEventListener(eventType, listener, {
    capture: isCapture,
    passive: isPassive,
  });
  return listener;
}

export function removeEventListener(
  target: EventTarget,
  eventType: string,
  listener: Function,
  capture: boolean,
): void {
  target.removeEventListener(eventType, listener, capture);
}
