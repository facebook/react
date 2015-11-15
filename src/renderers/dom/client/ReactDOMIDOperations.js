/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMIDOperations
 * @typechecks static-only
 */

'use strict';

var DOMChildrenOperations = require('DOMChildrenOperations');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactPerf = require('ReactPerf');

/**
 * Operations used to process updates to DOM nodes.
 */
var ReactDOMIDOperations = {

  /**
   * Updates a component's children by processing a series of updates.
   *
   * @param {array<object>} updates List of update configurations.
   * @param {array<string>} markup List of markup strings.
   * @internal
   */
  dangerouslyProcessChildrenUpdates: function(updates, markup) {
    for (var i = 0; i < updates.length; i++) {
      var update = updates[i];
      var node = ReactDOMComponentTree.getNodeFromInstance(update.parentInst);
      update.parentNode = node;
    }
    DOMChildrenOperations.processUpdates(updates, markup);
  },
};

ReactPerf.measureMethods(ReactDOMIDOperations, 'ReactDOMIDOperations', {
  dangerouslyProcessChildrenUpdates: 'dangerouslyProcessChildrenUpdates',
});

module.exports = ReactDOMIDOperations;
