/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule removeAllChildren
 */

'use strict';

/**
 * @param {DOMElement} node
 */
function removeAllChildren(node) {
  // http://jsperf.com/emptying-a-node
  var firstChild;
  while ((firstChild = node.firstChild)) {
    node.removeChild(firstChild);
  }
}

module.exports = removeAllChildren;
