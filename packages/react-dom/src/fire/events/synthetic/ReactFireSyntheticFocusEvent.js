/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {SyntheticUIEvent} from './ReactFireSyntheticUIEvent';
import {extendSyntheticEvent} from './ReactFireSyntheticEvent';

/**
 * @interface FocusEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
export const SyntheticFocusEvent = extendSyntheticEvent(SyntheticUIEvent, {
  relatedTarget: null,
});
