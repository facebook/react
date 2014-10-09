/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule sliceChildren
 */

"use strict";

var flattenChildren = require('flattenChildren');

/**
 * Slice children that are typically specified as `props.children`. This version
 * of slice children ignores empty child components.
 *
 * @param {*} children The children set to filter.
 * @param {number} start The first zero-based index to include in the subset.
 * @param {?number} end The non-inclusive last index of the subset.
 * @return {object} mirrored array with mapped children
 */
function sliceChildren(children, start, end) {
  if (children == null) {
    return children;
  }

  var slicedChildren = {};
  var flattenedMap = flattenChildren(children);
  var ii = 0;
  for (var key in flattenedMap) {
    if (!flattenedMap.hasOwnProperty(key)) {
      continue;
    }
    var child = flattenedMap[key];
    if (ii >= start) {
      slicedChildren[key] = child;
    }
    ii++;
    if (end != null && ii >= end) {
      break;
    }
  }
  return slicedChildren;
}

module.exports = sliceChildren;
