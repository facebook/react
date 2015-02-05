/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule quoteAttributeValueForBrowser
 */

"use strict";

// `'` is not escaped; OWASP asserts "Properly quoted attributes can only be
// escaped with the corresponding quote.". All attribute value quoting must use
// this function which exclusively quotes with `"`. However, `<` and `>` are
// still escaped as a precaution for when markup is served within inline
// scripts or comments without sufficient escaping.

var ESCAPE_LOOKUP = {
  '&': '&amp;',
  '>': '&gt;',
  '<': '&lt;',
  '"': '&quot;'
};

var ESCAPE_REGEX = /[&><"]/g;

function escaper(match) {
  return ESCAPE_LOOKUP[match];
}

/**
 * Escapes attribute value to prevent scripting attacks.
 *
 * @param {*} value Attribute value to escape.
 * @return {string} An escaped string.
 */
function quoteAttributeValueForBrowser(value) {
  return '"' + ('' + value).replace(ESCAPE_REGEX, escaper) + '"';
}

module.exports = quoteAttributeValueForBrowser;
