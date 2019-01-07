/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extendSyntheticEvent} from './ReactFireSyntheticEvent';
import {SyntheticMouseEvent} from './ReactFireSyntheticMouseEvent';

/**
 * @interface DragEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
export const SyntheticDragEvent = extendSyntheticEvent(SyntheticMouseEvent, {
  dataTransfer: null,
});
