/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SyntheticEvent from 'legacy-events/SyntheticEvent';

/**
 * @interface Event
 * @see http://www.w3.org/TR/clipboard-apis/
 */
const SyntheticClipboardEvent = SyntheticEvent.extend({
  clipboardData: function(event) {
    return 'clipboardData' in event
      ? event.clipboardData
      : window.clipboardData;
  },
});

export default SyntheticClipboardEvent;
