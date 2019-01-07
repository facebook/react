/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {SyntheticUIEvent} from './ReactFireSyntheticUIEvent';
import {extendSyntheticEvent} from './ReactFireSyntheticEvent';
import {getEventModifierState} from '../../ReactFireUtils';

/**
 * @interface TouchEvent
 * @see http://www.w3.org/TR/touch-events/
 */
export const SyntheticTouchEvent = extendSyntheticEvent(SyntheticUIEvent, {
  touches: null,
  targetTouches: null,
  changedTouches: null,
  altKey: null,
  metaKey: null,
  ctrlKey: null,
  shiftKey: null,
  getModifierState: getEventModifierState,
});
