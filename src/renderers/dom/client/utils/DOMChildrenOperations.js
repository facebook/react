/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DOMChildrenOperations
 * @typechecks static-only
 */

'use strict';

var DOMLazyTree = require('DOMLazyTree');
var Danger = require('Danger');
var ReactMultiChildUpdateTypes = require('ReactMultiChildUpdateTypes');
var ReactPerf = require('ReactPerf');

var setInnerHTML = require('setInnerHTML');
var setTextContent = require('setTextContent');
var invariant = require('invariant');

/**
 * Inserts `childNode` as a child of `parentNode` at the `index`.
 *
 * @param {DOMElement} parentNode Parent node in which to insert.
 * @param {DOMElement} childNode Child node to insert.
 * @param {number} index Index at which to insert the child.
 * @internal
 */
function insertChildAt(parentNode, childNode, index) {
  // We can rely exclusively on `insertBefore(node, null)` instead of also using
  // `appendChild(node)`. (Using `undefined` is not allowed by all browsers so
  // we are careful to use `null`.)

  // In Safari, .childNodes[index] can return a DOM node with id={index} so we
  // use .item() instead which is immune to this bug. (See #3560.) In contrast
  // to the spec, IE8 throws an error if index is larger than the list size.
  var referenceNode =
    index < parentNode.childNodes.length ?
    parentNode.childNodes.item(index) : null;

  parentNode.insertBefore(childNode, referenceNode);
}

function insertLazyTreeChildAt(parentNode, childTree, index) {
  // See above.
  var referenceNode =
    index < parentNode.childNodes.length ?
    parentNode.childNodes.item(index) : null;

  DOMLazyTree.insertTreeBefore(parentNode, childTree, referenceNode);
}

/**
 * Operations for updating with DOM children.
 */
var DOMChildrenOperations = {

  dangerouslyReplaceNodeWithMarkup: Danger.dangerouslyReplaceNodeWithMarkup,

  updateTextContent: setTextContent,

  /**
   * Updates a component's children by processing a series of updates. The
   * update configurations are each expected to have a `parentNode` property.
   *
   * @param {array<object>} updates List of update configurations.
   * @param {array<string>} markupList List of markup strings.
   * @internal
   */
  processUpdates: function(updates, markupList) {
    var update;
    // Mapping from parent IDs to initial child orderings.
    var initialChildren = null;
    // List of children that will be moved or removed.
    var updatedChildren = null;

    for (var i = 0; i < updates.length; i++) {
      update = updates[i];
      if (update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING ||
          update.type === ReactMultiChildUpdateTypes.REMOVE_NODE) {
        var updatedIndex = update.fromIndex;
        var updatedChild = update.parentNode.childNodes[updatedIndex];
        var parentID = update.parentID;

        invariant(
          updatedChild,
          'processUpdates(): Unable to find child %s of element. This ' +
          'probably means the DOM was unexpectedly mutated (e.g., by the ' +
          'browser), usually due to forgetting a <tbody> when using tables, ' +
          'nesting tags like <form>, <p>, or <a>, or using non-SVG elements ' +
          'in an <svg> parent. Try inspecting the child nodes of the element ' +
          'with React ID `%s`.',
          updatedIndex,
          parentID
        );

        initialChildren = initialChildren || {};
        initialChildren[parentID] = initialChildren[parentID] || [];
        initialChildren[parentID][updatedIndex] = updatedChild;

        updatedChildren = updatedChildren || [];
        updatedChildren.push(updatedChild);
      }
    }

    // markupList is either a list of markup or just a list of elements
    var isHTML = markupList.length && typeof markupList[0] === 'string';
    var renderedMarkup;
    if (isHTML) {
      renderedMarkup = Danger.dangerouslyRenderMarkup(markupList);
    } else {
      renderedMarkup = markupList;
    }

    // Remove updated children first so that `toIndex` is consistent.
    if (updatedChildren) {
      for (var j = 0; j < updatedChildren.length; j++) {
        updatedChildren[j].parentNode.removeChild(updatedChildren[j]);
      }
    }

    for (var k = 0; k < updates.length; k++) {
      update = updates[k];
      switch (update.type) {
        case ReactMultiChildUpdateTypes.INSERT_MARKUP:
          if (isHTML) {
            insertChildAt(
              update.parentNode,
              renderedMarkup[update.markupIndex],
              update.toIndex
            );
          } else {
            insertLazyTreeChildAt(
              update.parentNode,
              renderedMarkup[update.markupIndex],
              update.toIndex
            );
          }
          break;
        case ReactMultiChildUpdateTypes.MOVE_EXISTING:
          insertChildAt(
            update.parentNode,
            initialChildren[update.parentID][update.fromIndex],
            update.toIndex
          );
          break;
        case ReactMultiChildUpdateTypes.SET_MARKUP:
          setInnerHTML(
            update.parentNode,
            update.content
          );
          break;
        case ReactMultiChildUpdateTypes.TEXT_CONTENT:
          setTextContent(
            update.parentNode,
            update.content
          );
          break;
        case ReactMultiChildUpdateTypes.REMOVE_NODE:
          // Already removed by the for-loop above.
          break;
      }
    }
  },

};

ReactPerf.measureMethods(DOMChildrenOperations, 'DOMChildrenOperations', {
  updateTextContent: 'updateTextContent',
});

module.exports = DOMChildrenOperations;
