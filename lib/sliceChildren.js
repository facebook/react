/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule sliceChildren
 */

'use strict';

var ReactChildren = require('./ReactChildren');

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

  var array = ReactChildren.toArray(children);
  return array.slice(start, end);
}

module.exports = sliceChildren;