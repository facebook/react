/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extendSyntheticEvent, SyntheticEvent} from './ReactFireSyntheticEvent';

/**
 * @interface Event
 * @see http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105
 *      /#events-inputevents
 */
export const SyntheticInputEvent = extendSyntheticEvent(SyntheticEvent, {
  data: null,
});
