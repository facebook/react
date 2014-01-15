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
 * @providesModule DOMChildrenOperations
 * @typechecks static-only
 */

"use strict";

var Danger = require('Danger');
var ReactMultiChildUpdateTypes = require('ReactMultiChildUpdateTypes');

var getTextContentAccessor = require('getTextContentAccessor');

var immovableTagNames = {
  'iframe': true,
  'object': true,
  'embed': true
};

/**
 * The DOM property to use when setting text content.
 *
 * @type {string}
 * @private
 */
var textContentAccessor = getTextContentAccessor();

/**
 * Inserts `childNode` as a child of `parentNode` at the `index`.
 *
 * @param {DOMElement} parentNode Parent node in which to insert.
 * @param {DOMElement} childNode Child node to insert.
 * @param {number} index Index at which to insert the child.
 * @internal
 */
function insertChildAt(parentNode, childNode, index) {
  var childNodes = parentNode.childNodes;
  if (childNodes[index] === childNode) {
    return;
  }
  // If `childNode` is already a child of `parentNode`, remove it so that
  // computing `childNodes[index]` takes into account the removal.
  if (childNode.parentNode === parentNode) {
    parentNode.removeChild(childNode);
  }
  if (index >= childNodes.length) {
    parentNode.appendChild(childNode);
  } else {
    parentNode.insertBefore(childNode, childNodes[index]);
  }
}

var updateTextContent;
if (textContentAccessor === 'textContent') {
  /**
   * Sets the text content of `node` to `text`.
   *
   * @param {DOMElement} node Node to change
   * @param {string} text New text content
   */
  updateTextContent = function(node, text) {
    node.textContent = text;
  };
} else {
  /**
   * Sets the text content of `node` to `text`.
   *
   * @param {DOMElement} node Node to change
   * @param {string} text New text content
   */
  updateTextContent = function(node, text) {
    // In order to preserve newlines correctly, we can't use .innerText to set
    // the contents (see #1080), so we empty the element then append a text node
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    if (text) {
      var doc = node.ownerDocument || document;
      node.appendChild(doc.createTextNode(text));
    }
  };
}

/**
 * Move `childNode` as a child of `parentNode` `steps` to the right.
 * By shifting nodes on the right side over to the left side, the node moves
 * without being physically moved itself, this is very important for iframes.
 *
 * @param {DOMElement} parentNode Parent node in which to insert.
 * @param {DOMElement} childNode Child node to insert.
 * @param {number} steps Numbers of steps the child should be moved right.
 * @internal
 */
function moveChildTo(parentNode, childNode, index) {
  // We only support moving right as the current implementation of
  // `ReactMultiChild` always moves components by inserting them further right.
  var beforeNode = parentNode.childNodes[index];
  while (childNode.previousSibling !== beforeNode) {
    parentNode.insertBefore(childNode.nextSibling, childNode);
  }
}

/**
 * Detects if `node` is or has any descendants that must not be moved.
 * `getElementsByTagName` relies on special LiveNodeLists which are super fast.
 * 
 * iframe, object and embed reload if they are in any way detached or moved in
 * the DOM and must be considered immovable.
 *
 * @param {DOMElement} node Node to test if it is or has immovable descendants.
 * @return {boolean}
 * @internal
 */
function hasImmovableDescendants(node) {
  for (var tagName in immovableTagNames) {
    if (node.getElementsByTagName(tagName)[0]) {
      return true;
    }
  }
  return immovableTagNames[node.nodeName.toLowerCase()];
}

/**
 * Operations for updating with DOM children.
 */
var DOMChildrenOperations = {

  dangerouslyReplaceNodeWithMarkup: Danger.dangerouslyReplaceNodeWithMarkup,

  updateTextContent: updateTextContent,

  /**
   * Updates a component's children by processing a series of updates. The
   * update configurations are each expected to have a `parentNode` property.
   *
   * @param {array<object>} updates List of update configurations.
   * @param {array<string>} markupList List of markup strings.
   * @internal
   */
  processUpdates: function(updates, markupList) {
    var update, updatedChild, parentID;
    
    // Mapping from parent IDs to initial child orderings.
    var initialChildren = null;
    // List of children that will be moved or removed.
    var updatedChildren = null;

    // Mapping of parents that has immovable descendants.
    var immovableParents = {};
    // Mapping of parents to updates, for immovable parents.
    var immovableUpdates = null;
    // Mapping of parents to inserted children count, for immovable parents.
    var immovableInsertionCount = null;
    
    // Test if there are any has immovable nodes at all in the document.
    // Optimally, this should be done on the React root node instead.
    var rootNodeHasImmovableDescendants =
      hasImmovableDescendants(document.documentElement);
    
    for (var i = 0; update = updates[i]; i++) {
      updatedChild = update.parentNode.childNodes[update.fromIndex];
      parentID = update.parentID;
      
      /**
       * This implementation for solving immovable nodes relies on two
       * assumptions that make it extra fast and simple.
       *
       * 1. `ReactMultiChild` sends updates in strict ascending `toIndex` order.
       * 2. `ReactMultiChild` removes from the left and inserts to the right.
       *
       * Since immovable nodes must not be detached, we need to push them right
       * and out of the way so that the indexes remain consistent as is
       * expected. We do this by counting all insertions taking place before the
       * immovable node. This allows us to compute its actual toIndex, and thus
       * its expected previous sibling, after all touches nodes have detached.
       * This saves us from having to detach it and performs the minimal number
       * of moves necessary.
       */
       
      if (rootNodeHasImmovableDescendants) {
        // Test if parent has immovable descendants and cache results.
        if (!(parentID in immovableParents)) {
          immovableParents[parentID] =
            hasImmovableDescendants(update.parentNode);
          
          if (immovableParents[parentID]) {
            immovableInsertionCount = immovableInsertionCount || {};
            immovableInsertionCount[parentID] = 0;
          }
        }
        
        if (update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING) {
          // Test if child has immovable descendants and cache results.
          if (immovableParents[parentID] &&
              hasImmovableDescendants(updatedChild)) {
            immovableUpdates = immovableUpdates || {};
            immovableUpdates[parentID] = immovableUpdates[parentID] || [];
            
            var lastImmovableUpdate =
              immovableUpdates[parentID][immovableUpdates[parentID].length - 1];
            
            // Determine if crossing the boundary of another immovable object.
            // Assumption: `ReactMultiChild` moves nodes by `toIndex` in
            // ascending order.
            if (!lastImmovableUpdate ||
                lastImmovableUpdate.fromIndex < update.fromIndex) {
              update.type = ReactMultiChildUpdateTypes.SHIFT_IMMOVABLE;
              update.toIndex -= immovableInsertionCount[parentID];
              immovableUpdates[parentID].push(update);
            } else if (__DEV__) {
              // Unstoppable force meets immovable object, this is a violation,
              // our only way out is treat it as movable and let it break/reset.
              console.warn(
                'React has moved an "immovable" iframe/object/embed DOM node ' +
                'over to the other side of another "immovable" DOM node .' +
                'This is a valid operation, but the contents of the ' +
                '"immovable" DOM node has been reset/reloaded. This is a ' +
                'flaw in HTML that cannot be fixed.'
              );
            }
          }
        }
        
        if (update.type === ReactMultiChildUpdateTypes.INSERT_MARKUP ||
            update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING) {
          if (immovableParents[parentID]) {
            // Insertion of a movable object in an immovable parent, count it.
            immovableInsertionCount[parentID]++;
          }
        }
      }
      
      if (update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING ||
          update.type === ReactMultiChildUpdateTypes.SHIFT_IMMOVABLE ||
          update.type === ReactMultiChildUpdateTypes.REMOVE_NODE) {
        initialChildren = initialChildren || {};
        initialChildren[parentID] = initialChildren[parentID] || [];
        initialChildren[parentID][update.fromIndex] = updatedChild;
      }
      
      if (update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING ||
          update.type === ReactMultiChildUpdateTypes.REMOVE_NODE) {
        updatedChildren = updatedChildren || [];
        updatedChildren.push(updatedChild);
      }
    }

    var renderedMarkup = Danger.dangerouslyRenderMarkup(markupList);

    // Remove updated children first so that `toIndex` is consistent.
    if (updatedChildren) {
      for (var j = 0; updatedChild = updatedChildren[j]; j++) {
        updatedChild.parentNode.removeChild(updatedChild);
      }
    }
    
    // We found immovable nodes, move them into position immediately.
    if (immovableUpdates) {
      for (parentID in immovableUpdates) {
        for (var k = immovableUpdates[parentID].length - 1; k >= 0; k--) {
          update = immovableUpdates[parentID][k];
          
          moveChildTo(
            update.parentNode,
            initialChildren[parentID][update.fromIndex],
            update.toIndex
          );
        }
      }
    }
       
    for (var l = 0; update = updates[l]; l++) {
      switch (update.type) {
        case ReactMultiChildUpdateTypes.INSERT_MARKUP:
          insertChildAt(
            update.parentNode,
            renderedMarkup[update.markupIndex],
            update.toIndex
          );
          break;
        case ReactMultiChildUpdateTypes.MOVE_EXISTING:
          insertChildAt(
            update.parentNode,
            initialChildren[update.parentID][update.fromIndex],
            update.toIndex
          );
          break;
        //case ReactMultiChildUpdateTypes.SHIFT_IMMOVABLE:
          // Already moved into position by the loops above.
          //break;
        case ReactMultiChildUpdateTypes.TEXT_CONTENT:
          updateTextContent(
            update.parentNode,
            update.textContent
          );
          break;
        //case ReactMultiChildUpdateTypes.REMOVE_NODE:
          // Already removed by the for-loop above.
          //break;
      }
    }
  }

};

module.exports = DOMChildrenOperations;
