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
 * @providesModule ReactInstanceHandles
 * @typechecks
 */

"use strict";

var getDOMNodeID = require('getDOMNodeID');
var invariant = require('invariant');

var SEPARATOR = '.';
var SEPARATOR_LENGTH = SEPARATOR.length;

/**
 * Maximum depth of traversals before we consider the possibility of a bad ID.
 */
var MAX_TREE_DEPTH = 100;

/**
 * Checks if a character in the supplied ID is a separator or the end.
 *
 * @param {string} id A React DOM ID.
 * @param {number} index Index of the character to check.
 * @return {boolean} True if the character is a separator or end of the ID.
 * @private
 */
function isMarker(id, index) {
  return id.charAt(index) === SEPARATOR || index === id.length;
}

/**
 * Checks if the supplied string is a valid React DOM ID.
 *
 * @param {string} id A React DOM ID, maybe.
 * @return {boolean} True if the string is a valid React DOM ID.
 * @private
 */
function isValidID(id) {
  return id === '' || (
    id.charAt(0) === SEPARATOR && id.charAt(id.length - 1) !== SEPARATOR
  );
}

/**
 * True if the supplied `node` is rendered by React.
 *
 * @param {DOMEventTarget} node DOM Element to check.
 * @return {boolean} True if the DOM Element appears to be rendered by React.
 * @private
 */
function isRenderedByReact(node) {
  var id = getDOMNodeID(node);
  return id ? id.charAt(0) === SEPARATOR : false;
}

/**
 * Gets the parent ID of the supplied React DOM ID, `id`.
 *
 * @param {string} id ID of a component.
 * @return {string} ID of the parent, or an empty string.
 * @private
 */
function parentID(id) {
  return id ? id.substr(0, id.lastIndexOf(SEPARATOR)) : '';
}

/**
 * Traverses the parent path between two IDs (either up or down). The IDs must
 * not be the same, and there must exist a parent path between them.
 *
 * @param {?string} start ID at which to start traversal.
 * @param {?string} stop ID at which to end traversal.
 * @param {function} cb Callback to invoke each ID with.
 * @param {?boolean} skipFirst Whether or not to skip the first node.
 * @param {?boolean} skipLast Whether or not to skip the last node.
 * @private
 */
function traverseParentPath(start, stop, cb, arg, skipFirst, skipLast) {
  start = start || '';
  stop = stop || '';
  invariant(
    start !== stop,
    'traverseParentPath(...): Cannot traverse from and to the same ID, `%s`.',
    start
  );
  var ancestorID = ReactInstanceHandles.getFirstCommonAncestorID(start, stop);
  var traverseUp = ancestorID === stop;
  invariant(
    traverseUp || ancestorID === start,
    'traverseParentPath(%s, %s, ...): Cannot traverse from two IDs that do ' +
    'not have a parent path.',
    start,
    stop
  );
  // Traverse from `start` to `stop` one depth at a time.
  var depth = 0;
  var traverse = traverseUp ? parentID : ReactInstanceHandles.nextDescendantID;
  for (var id = start; /* until break */; id = traverse(id, stop)) {
    if ((!skipFirst || id !== start) && (!skipLast || id !== stop)) {
      cb(id, traverseUp, arg);
    }
    if (id === stop) {
      // Only break //after// visiting `stop`.
      break;
    }
    invariant(
      depth++ < MAX_TREE_DEPTH,
      'traverseParentPath(%s, %s, ...): Detected an infinite loop while ' +
      'traversing the React DOM ID tree. This may be due to malformed IDs: %s',
      start, stop
    );
  }
}

/**
 * Manages the IDs assigned to DOM representations of React components. This
 * uses a specific scheme in order to traverse the DOM efficiently (e.g. in
 * order to simulate events).
 *
 * @internal
 */
var ReactInstanceHandles = {

  separator: SEPARATOR,

  /**
   * Traverses up the ancestors of the supplied node to find a node that is a
   * DOM representation of a React component.
   *
   * @param {?DOMEventTarget} node
   * @return {?DOMEventTarget}
   * @internal
   */
  getFirstReactDOM: function(node) {
    var current = node;
    while (current && current.parentNode !== current) {
      if (isRenderedByReact(current)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  },

  /**
   * Finds a node with the supplied `id` inside of the supplied `ancestorNode`.
   * Exploits the ID naming scheme to perform the search quickly.
   *
   * @param {DOMEventTarget} ancestorNode Search from this root.
   * @pararm {string} id ID of the DOM representation of the component.
   * @return {?DOMEventTarget} DOM node with the supplied `id`, if one exists.
   * @internal
   */
  findComponentRoot: function(ancestorNode, id) {
    var child = ancestorNode.firstChild;
    while (child) {
      if (id === child.id) {
        return child;
      } else if (id.indexOf(child.id) === 0) {
        return ReactInstanceHandles.findComponentRoot(child, id);
      }
      child = child.nextSibling;
    }
    // Effectively: return null;
  },

  /**
   * Gets the nearest common ancestor ID of two IDs.
   *
   * Using this ID scheme, the nearest common ancestor ID is the longest common
   * prefix of the two IDs that immediately preceded a "marker" in both strings.
   *
   * @param {string} oneID
   * @param {string} twoID
   * @return {string} Nearest common ancestor ID, or the empty string if none.
   * @internal
   */
  getFirstCommonAncestorID: function(oneID, twoID) {
    var minLength = Math.min(oneID.length, twoID.length);
    if (minLength === 0) {
      return '';
    }
    var lastCommonMarkerIndex = 0;
    // Use `<=` to traverse until the "EOL" of the shorter string.
    for (var i = 0; i <= minLength; i++) {
      if (isMarker(oneID, i) && isMarker(twoID, i)) {
        lastCommonMarkerIndex = i;
      } else if (oneID.charAt(i) !== twoID.charAt(i)) {
        break;
      }
    }
    var longestCommonID = oneID.substr(0, lastCommonMarkerIndex);
    invariant(
      isValidID(longestCommonID),
      'getFirstCommonAncestorID(%s, %s): Expected a valid React DOM ID: %s',
      oneID,
      twoID,
      longestCommonID
    );
    return longestCommonID;
  },
  /**
   * Creates a DOM ID to use when mounting React components.
   *
   * @param {number} mountPointCount The count of React renders so far.
   * @return {string} React root ID.
   * @internal
   */
  getReactRootID: function(mountPointCount) {
    return '.reactRoot[' + mountPointCount + ']';
  },

  /**
   * Gets the DOM ID of the React component that is the root of the tree that
   * contains the React component with the supplied DOM ID.
   *
   * @param {string} id DOM ID of a React component.
   * @return {?string} DOM ID of the React component that is the root.
   * @internal
   */
  getReactRootIDFromNodeID: function(id) {
    var regexResult = /\.reactRoot\[[^\]]+\]/.exec(id);
    return regexResult && regexResult[0];
  },

  /**
   * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
   * should would receive a `mouseEnter` or `mouseLeave` event.
   *
   * NOTE: Does not invoke the callback on the nearest common ancestor because
   * nothing "entered" or "left" that element.
   *
   * @param {string} leaveID ID being left.
   * @param {string} enterID ID being entered.
   * @param {function} cb Callback to invoke on each entered/left ID.
   * @param {*} upArg Argument to invoke the callback with on left IDs.
   * @param {*} downArg Argument to invoke the callback with on entered IDs.
   * @internal
   */
  traverseEnterLeave: function(leaveID, enterID, cb, upArg, downArg) {
    var longestCommonID = ReactInstanceHandles.getFirstCommonAncestorID(
      leaveID,
      enterID
    );
    if (longestCommonID !== leaveID) {
      traverseParentPath(leaveID, longestCommonID, cb, upArg, false, true);
    }
    if (longestCommonID !== enterID) {
      traverseParentPath(longestCommonID, enterID, cb, downArg, true, false);
    }
  },

  /**
   * Simulates the traversal of a two-phase, capture/bubble event dispatch.
   *
   * NOTE: This traversal happens on IDs without touching the DOM.
   *
   * @param {string} targetID ID of the target node.
   * @param {function} cb Callback to invoke.
   * @param {*} arg Argument to invoke the callback with.
   * @internal
   */
  traverseTwoPhase: function(targetID, cb, arg) {
    if (targetID) {
      traverseParentPath('', targetID, cb, arg, true, false);
      traverseParentPath(targetID, '', cb, arg, false, true);
    }
  },

  /**
   * Gets the next DOM ID on the tree path from the supplied `ancestorID` to the
   * supplied `destinationID`. If they are equal, the ID is returned.
   *
   * @param {string} ancestorID ID of an ancestor node of `destinationID`.
   * @param {string} destinationID ID of the destination node.
   * @return {string} Next ID on the path from `ancestorID` to `destinationID`.
   * @internal
   */
  nextDescendantID: function(ancestorID, destinationID) {
    invariant(
      isValidID(ancestorID) && isValidID(destinationID),
      'nextDescendantID(%s, %s): Received an invalid React DOM ID.',
      ancestorID,
      destinationID
    );
    var longestCommonID = ReactInstanceHandles.getFirstCommonAncestorID(
      ancestorID,
      destinationID
    );
    invariant(
      longestCommonID === ancestorID,
      'nextDescendantID(...): React has made an invalid assumption about the ' +
      'DOM hierarchy. Expected `%s` to be an ancestor of `%s`.',
      ancestorID,
      destinationID
    );
    if (ancestorID === destinationID) {
      return ancestorID;
    }
    // Skip over the ancestor and the immediate separator. Traverse until we hit
    // another separator or we reach the end of `destinationID`.
    var start = ancestorID.length + SEPARATOR_LENGTH;
    for (var i = start; i < destinationID.length; i++) {
      if (isMarker(destinationID, i)) {
        break;
      }
    }
    return destinationID.substr(0, i);
  }

};

module.exports = ReactInstanceHandles;
