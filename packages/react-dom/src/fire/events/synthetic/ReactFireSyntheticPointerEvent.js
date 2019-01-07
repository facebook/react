/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extendSyntheticEvent} from './ReactFireSyntheticEvent';
import {SyntheticMouseEvent} from './ReactFireSyntheticMouseEvent';

/**
 * @interface PointerEvent
 * @see http://www.w3.org/TR/pointerevents/
 */
export const SyntheticPointerEvent = extendSyntheticEvent(SyntheticMouseEvent, {
  pointerId: null,
  width: null,
  height: null,
  pressure: null,
  tangentialPressure: null,
  tiltX: null,
  tiltY: null,
  twist: null,
  pointerType: null,
  isPrimary: null,
});
