/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

/**
 * Touch events state machine.
 *
 * Keeps track of the active pointers and allows them to be reflected in touch events.
 */

const activeTouches = new Map();

export function addTouch(touch) {
  const identifier = touch.identifier;
  const target = touch.target;
  if (!activeTouches.has(target)) {
    activeTouches.set(target, new Map());
  }
  if (activeTouches.get(target).get(identifier)) {
    // Do not allow existing touches to be overwritten
    console.error(
      'Touch with identifier %s already exists. Did not record touch start.',
      identifier,
    );
  } else {
    activeTouches.get(target).set(identifier, touch);
  }
}

export function updateTouch(touch) {
  const identifier = touch.identifier;
  const target = touch.target;
  if (activeTouches.get(target) != null) {
    activeTouches.get(target).set(identifier, touch);
  } else {
    console.error(
      'Touch with identifier %s does not exist. Cannot record touch move without a touch start.',
      identifier,
    );
  }
}

export function removeTouch(touch) {
  const identifier = touch.identifier;
  const target = touch.target;
  if (activeTouches.get(target) != null) {
    if (activeTouches.get(target).has(identifier)) {
      activeTouches.get(target).delete(identifier);
    } else {
      console.error(
        'Touch with identifier %s does not exist. Cannot record touch end without a touch start.',
        identifier,
      );
    }
  }
}

export function getTouches() {
  const touches = [];
  activeTouches.forEach((_, target) => {
    touches.push(...getTargetTouches(target));
  });
  return touches;
}

export function getTargetTouches(target) {
  if (activeTouches.get(target) != null) {
    return Array.from(activeTouches.get(target).values());
  }
  return [];
}

export function clear() {
  activeTouches.clear();
}
