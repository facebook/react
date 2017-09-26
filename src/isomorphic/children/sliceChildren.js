/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule sliceChildren
 */

'use strict';

var ReactChildren = require('ReactChildren');

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
