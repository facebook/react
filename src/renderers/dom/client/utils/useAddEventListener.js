/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule useAddEventListener
 */

'use strict';

/**
 * Checks if a target has 'addEventListener' but not 'attachEvent'.
 *
 * NOTE: This fixes problems with other libraries that tries to normalize IE8.
 *
 * Brought in by Andrea Giammarchi for the sake of https://github.com/WebReflection/ie8
 *
 * @param {DOMElement} node
 * @return {boolean} True if 'addEventListener' should be used.
 * @internal
 */
function useAddEventListener(target) {
         // verify the most common case first
  return 'addEventListener' in target &&
         // be sure there's no 'attachEvent'
         // if there is one, be sure it's not an old version of opera
         !('attachEvent' in target && typeof opera === 'undefined');
}

module.exports = useAddEventListener;
