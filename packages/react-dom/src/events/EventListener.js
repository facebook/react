/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function addEventToTarget(
  target: EventTarget,
  eventType: string,
  listener: Function,
  capture: boolean,
): Function {
  target.addEventListener(eventType, listener, capture);
  return listener;
}

export function addEventToTargetWithPassiveFlag(
  target: EventTarget,
  eventType: string,
  listener: Function,
  capture: boolean,
): Function {
  target.addEventListener(eventType, listener, {
    passive: true,
    capture,
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
