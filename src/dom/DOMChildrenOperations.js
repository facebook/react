/**
 * Copyright 2013 Facebook, Inc.
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
 * @providesModule DOMChildrenOperations
 */

// Empty blocks improve readability so disable that warning
// jshint -W035

"use strict";

var Danger = require('Danger');

var insertNodeAt = require('insertNodeAt');
var keyOf = require('keyOf');
var throwIf = require('throwIf');

var NON_INCREASING_OPERATIONS;
if (__DEV__) {
  NON_INCREASING_OPERATIONS =
    'DOM child management operations must be provided in order ' +
    'of increasing destination index. This is likely an issue with ' +
    'the core framework.';
}

var MOVE_NODE_AT_ORIG_INDEX = keyOf({moveFrom: null});
var INSERT_MARKUP = keyOf({insertMarkup: null});
var REMOVE_AT = keyOf({removeAt: null});

/**
 * In order to carry out movement of DOM nodes without knowing their IDs, we
 * have to first store knowledge about nodes' original indices before beginning
 * to carry out the sequence of operations. Once we begin the sequence, the DOM
 * indices in future instructions are no longer valid.
 *
 * @param {Element} parent Parent DOM node.
 * @param {Object} childOperations Description of child operations.
 * @returns {Array?} Sparse array containing elements by their current index in
 * the DOM.
 */
var _getNodesByOriginalIndex = function(parent, childOperations) {
  var nodesByOriginalIndex; // Sparse array.
  var childOperation;
  var origIndex;
  for (var i = 0; i < childOperations.length; i++) {
    childOperation = childOperations[i];
    if (MOVE_NODE_AT_ORIG_INDEX in childOperation) {
      nodesByOriginalIndex = nodesByOriginalIndex || [];
      origIndex = childOperation.moveFrom;
      nodesByOriginalIndex[origIndex] = parent.childNodes[origIndex];
    } else if (REMOVE_AT in childOperation) {
      nodesByOriginalIndex = nodesByOriginalIndex || [];
      origIndex = childOperation.removeAt;
      nodesByOriginalIndex[origIndex] = parent.childNodes[origIndex];
    }
  }
  return nodesByOriginalIndex;
};

/**
 * Removes DOM elements from their parent, or moved.
 * @param {Element} parent Parent DOM node.
 * @param {Array} nodesByOriginalIndex Child nodes by their original index
 * (potentially sparse.)
 */
var _removeChildrenByOriginalIndex = function(parent, nodesByOriginalIndex) {
  for (var j = 0; j < nodesByOriginalIndex.length; j++) {
    var nodeToRemove = nodesByOriginalIndex[j];
    if (nodeToRemove) {     // We used a sparse array.
      parent.removeChild(nodesByOriginalIndex[j]);
    }
  }
};

/**
 * Once all nodes that will be removed or moved - are removed from the parent
 * node, we can begin the process of placing nodes into their final locations.
 * We must perform all operations in the order of the final DOM index -
 * otherwise, we couldn't count on the fact that an insertion at index X, will
 * remain at index X. This will iterate through the child operations, adding
 * content where needed, skip over removals (they've already been removed) and
 * insert "moved" Elements that were previously removed. The "moved" elements
 * are only temporarily removed from the parent, so that index calculations can
 * be manageable and perform well in the cases that matter.
 */
var _placeNodesAtDestination =
  function(parent, childOperations, nodesByOriginalIndex) {
    var origNode;
    var finalIndex;
    var lastFinalIndex = -1;
    var childOperation;
    for (var k = 0; k < childOperations.length; k++) {
      childOperation = childOperations[k];
      if (MOVE_NODE_AT_ORIG_INDEX in childOperation) {
        origNode = nodesByOriginalIndex[childOperation.moveFrom];
        finalIndex = childOperation.finalIndex;
        insertNodeAt(parent, origNode, finalIndex);
        if (__DEV__) {
          throwIf(finalIndex <= lastFinalIndex, NON_INCREASING_OPERATIONS);
          lastFinalIndex = finalIndex;
        }
      } else if (REMOVE_AT in childOperation) {
      } else if (INSERT_MARKUP in childOperation) {
        finalIndex = childOperation.finalIndex;
        var markup = childOperation.insertMarkup;
        Danger.dangerouslyInsertMarkupAt(parent, markup, finalIndex);
        if (__DEV__) {
          throwIf(finalIndex <= lastFinalIndex, NON_INCREASING_OPERATIONS);
          lastFinalIndex = finalIndex;
        }
      }
    }
  };

var manageChildren = function(parent, childOperations) {
  var nodesByOriginalIndex = _getNodesByOriginalIndex(parent, childOperations);
  if (nodesByOriginalIndex) {
    _removeChildrenByOriginalIndex(parent, nodesByOriginalIndex);
  }
  _placeNodesAtDestination(parent, childOperations, nodesByOriginalIndex);
};

var setTextNodeValueAtIndex = function(parent, index, val) {
  parent.childNodes[index].nodeValue = val;
};

/**
 * Also reexport all of the dangerous functions. It helps to have all dangerous
 * functions located in a single module `Danger`.
 */
var DOMChildrenOperations = {
  dangerouslyReplaceNodeWithMarkup: Danger.dangerouslyReplaceNodeWithMarkup,
  manageChildren: manageChildren,
  setTextNodeValueAtIndex: setTextNodeValueAtIndex
};

module.exports = DOMChildrenOperations;
