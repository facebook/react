/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule escapeTextContentForBrowser
 */

'use strict';

// `"` and `'` are not escaped; they are parsed as regular characters in the
// context of text content.

var ESCAPE_LOOKUP = {
  '&': '&amp;',
  '>': '&gt;',
  '<': '&lt;'
};

var ESCAPE_REGEX = /[&><]/g;

function escaper(match) {
  return ESCAPE_LOOKUP[match];
}

/**
 * Escapes text content to prevent scripting attacks.
 *
 * @param {*} text Text content value to escape.
 * @return {string} An escaped string.
 */
function escapeTextContentForBrowser(text) {
  return ('' + text).replace(ESCAPE_REGEX, escaper);
}

module.exports = escapeTextContentForBrowser;
