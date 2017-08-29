/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule isCustomComponent
 */

'use strict';

// https://www.w3.org/TR/SVG/eltindex.html
var DashedSVGElements = {
  'color-profile': true,
  'font-face': true,
  'font-face-format': true,
  'font-face-name': true,
  'font-face-src': true,
  'font-face-uri': true,
  'missing-glyph': true,
};

function isCustomComponent(tagName, props) {
  if (DashedSVGElements[tagName]) {
    return false;
  }

  return tagName.indexOf('-') >= 0 || props.is != null;
}

module.exports = isCustomComponent;
