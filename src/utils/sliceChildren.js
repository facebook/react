/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
