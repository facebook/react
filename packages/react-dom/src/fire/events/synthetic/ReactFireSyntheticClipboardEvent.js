/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extendSyntheticEvent, SyntheticEvent} from './ReactFireSyntheticEvent';

/**
 * @interface Event
 * @see http://www.w3.org/TR/clipboard-apis/
 */
export const SyntheticClipboardEvent = extendSyntheticEvent(SyntheticEvent, {
  clipboardData: function(event) {
    return 'clipboardData' in event
      ? event.clipboardData
      : window.clipboardData;
  },
});
