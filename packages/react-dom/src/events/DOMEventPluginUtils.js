/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TOP_MOUSE_DOWN,
  TOP_MOUSE_MOVE,
  TOP_MOUSE_UP,
  TOP_TOUCH_CANCEL,
  TOP_TOUCH_END,
  TOP_TOUCH_MOVE,
  TOP_TOUCH_START,
} from './DOMTopLevelEventTypes';

export function isEndish(topLevelType) {
return (
  topLevelType === TOP_MOUSE_UP ||
  topLevelType === TOP_TOUCH_END ||
  topLevelType === TOP_TOUCH_CANCEL
);
}

export function isMoveish(topLevelType) {
return topLevelType === TOP_MOUSE_MOVE || topLevelType === TOP_TOUCH_MOVE;
}
export function isStartish(topLevelType) {
return topLevelType === TOP_MOUSE_DOWN || topLevelType === TOP_TOUCH_START;
}
