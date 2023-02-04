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
  const { identifier, target } = touch;
  let targetTouches = activeTouches.get(target);
  if (!targetTouches) {
    activeTouches.set(target, targetTouches = new Map());
  }
  if (targetTouches.has(identifier)) {
    // Do not allow existing touches to be overwritten
    console.error(
      'Touch with identifier %s already exists. Did not record touch start.',
      identifier
    );
  } else {
    targetTouches.set(identifier, touch);
  }
}


export function updateTouch(touch) {
  const { identifier, target } = touch;
  const targetTouches = activeTouches.get(target);
  if (targetTouches) {
    targetTouches.set(identifier, touch);
  } else {
    console.error(
      'Touch with identifier %s does not exist. Cannot record touch move without a touch start.',
      identifier
    );
  }
}

export function removeTouch(touch) {
  const { identifier, target } = touch;
  const targetTouches = activeTouches.get(target);
  if (targetTouches && targetTouches.has(identifier)) {
    targetTouches.delete(identifier);
  } else {
    console.error(
      'Touch with identifier %s does not exist. Cannot record touch end without a touch start.',
      identifier
    );
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
