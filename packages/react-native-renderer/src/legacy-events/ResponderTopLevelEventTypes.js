/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const TOP_TOUCH_START = 'topTouchStart';
export const TOP_TOUCH_MOVE = 'topTouchMove';
export const TOP_TOUCH_END = 'topTouchEnd';
export const TOP_TOUCH_CANCEL = 'topTouchCancel';
export const TOP_SCROLL = 'topScroll';
export const TOP_SELECTION_CHANGE = 'topSelectionChange';

export function isStartish(topLevelType: mixed): boolean {
  return topLevelType === TOP_TOUCH_START;
}

export function isMoveish(topLevelType: mixed): boolean {
  return topLevelType === TOP_TOUCH_MOVE;
}

export function isEndish(topLevelType: mixed): boolean {
  return topLevelType === TOP_TOUCH_END || topLevelType === TOP_TOUCH_CANCEL;
}

export const startDependencies = [TOP_TOUCH_START];
export const moveDependencies = [TOP_TOUCH_MOVE];
export const endDependencies = [TOP_TOUCH_CANCEL, TOP_TOUCH_END];
