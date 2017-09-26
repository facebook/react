/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactDOMIDOperations
 */

'use strict';

var DOMChildrenOperations = require('DOMChildrenOperations');
var ReactDOMComponentTree = require('ReactDOMComponentTree');

/**
 * Operations used to process updates to DOM nodes.
 */
var ReactDOMIDOperations = {
  /**
   * Updates a component's children by processing a series of updates.
   *
   * @param {array<object>} updates List of update configurations.
   * @internal
   */
  dangerouslyProcessChildrenUpdates: function(parentInst, updates) {
    var node = ReactDOMComponentTree.getNodeFromInstance(parentInst);
    DOMChildrenOperations.processUpdates(node, updates);
  },
};

module.exports = ReactDOMIDOperations;
