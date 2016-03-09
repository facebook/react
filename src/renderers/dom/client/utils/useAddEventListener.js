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
 * Checks if a target has addEventListener but not 'attachEvent'.
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
  return typeof opera === 'undefined' ?
    !('attachEvent' in target) : ('addEventListener' in target);
}

module.exports = useAddEventListener;
