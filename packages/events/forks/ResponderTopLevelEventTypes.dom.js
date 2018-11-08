/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Note: ideally these would be imported from DOMTopLevelEventTypes,
// but our build system currently doesn't let us do that from a fork.

export const TOP_TOUCH_START = 'touchstart';
export const TOP_TOUCH_MOVE = 'touchmove';
export const TOP_TOUCH_END = 'touchend';
export const TOP_TOUCH_CANCEL = 'touchcancel';
export const TOP_SCROLL = 'scroll';
export const TOP_SELECTION_CHANGE = 'selectionchange';
export const TOP_MOUSE_DOWN = 'mousedown';
export const TOP_MOUSE_MOVE = 'mousemove';
export const TOP_MOUSE_UP = 'mouseup';

export function isStartish(topLevelType: mixed): boolean {
  return topLevelType === TOP_TOUCH_START || topLevelType === TOP_MOUSE_DOWN;
}

export function isMoveish(topLevelType: mixed): boolean {
  return topLevelType === TOP_TOUCH_MOVE || topLevelType === TOP_MOUSE_MOVE;
}

export function isEndish(topLevelType: mixed): boolean {
  return (
    topLevelType === TOP_TOUCH_END ||
    topLevelType === TOP_TOUCH_CANCEL ||
    topLevelType === TOP_MOUSE_UP
  );
}

export const startDependencies = [TOP_TOUCH_START, TOP_MOUSE_DOWN];
export const moveDependencies = [TOP_TOUCH_MOVE, TOP_MOUSE_MOVE];
export const endDependencies = [TOP_TOUCH_CANCEL, TOP_TOUCH_END, TOP_MOUSE_UP];
