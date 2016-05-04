/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NativeNodes
 */

'use strict';

var TEXT_NODE_TYPE = 3;
var COMMENT_NODE_TYPE = 8;
var ELEMENT_NODE_TYPE = 1;

var EMPTY_ARRAY = [];

var types = {
  // UNKNOWN means this DOM node doesn't seem to correspond to any React component.
  UNKNOWN:0,
  // A single DOM element, which corresponds to a ReactDOMComponent.
  ELEMENT:1,
  // A DOM text node surrounded by react-text comment nodes. this is used in
  // the DOM when there is a ReactDOMTextComponent.
  TEXT:2,
  // A single comment DOM node, which corresponds to ReactDOMEmptyComponent.
  EMPTY:4,
};

/**
 * Returns the type of React component that corresponds to the DOM node sent in.
 * @param {DOMNode} nativeNode a DOM node that corresponds to a React component in
 *  the client rendering. Note that this is the **first** DOM node in the markup, but that
 *  the React component may render more nodes after this node. For example, a text component
 *  (ReactDOMTextComponent) renders two comment nodes (for empty text) or two comment nodes
 *  and a text node (for non-empty text). In both cases, this method expects the first comment
 *  node to be passed in.
 */
function getType(nativeNode) {
  if (isTextComponentOpeningNode(nativeNode)
    && nativeNode.nextSibling
    && nativeNode.nextSibling.nodeType === TEXT_NODE_TYPE
    && nativeNode.nextSibling.nextSibling
    && isTextComponentClosingNode(nativeNode.nextSibling.nextSibling)) {

    return types.TEXT;
  } else if (isTextComponentOpeningNode(nativeNode)
    && nativeNode.nextSibling
    && isTextComponentClosingNode(nativeNode.nextSibling)) {

    return types.TEXT;
  } else {
    switch (nativeNode.nodeType) {
      case ELEMENT_NODE_TYPE:
        return types.ELEMENT;
      case COMMENT_NODE_TYPE:
        return types.EMPTY;
    }
  }
  return types.UNKNOWN;
}

/**
 * Returns the text content of the component represented by this domNode.
 * @param {DOMNode} nativeNode the first node of the component
 */
function getText(nativeNode) {
  if (getType(nativeNode) === types.TEXT) {
    if (!nativeNode.nextSibling ||
      (nativeNode.nextSibling
      && nativeNode.nextSibling.nodeType === COMMENT_NODE_TYPE)) {
      return '';
    } else {
      return nativeNode.nextSibling.textContent;
    }
  }
  return nativeNode.textContent;
}

/*
 * If nativeNode is the first DOM node used to represent a particular component, this
 * function returns the last DOM node to represent that component. Note that for components
 * that are represented by just one DOM node, this function returns its input.
 * @param {DOMNode} nativeNode the first DOM node representing a particular component
 */
function getLastNode(nativeNode) {
  if (getType(nativeNode) === types.TEXT) {
    if (nativeNode.nextSibling
      && nativeNode.nextSibling.nodeType === TEXT_NODE_TYPE) {
      return nativeNode.nextSibling.nextSibling;
    }
    return nativeNode.nextSibling;
  }
  return nativeNode;
}

function isTextComponentOpeningNode(node) {
  return (node.nodeType === COMMENT_NODE_TYPE
    && node.nodeValue.lastIndexOf(' react-text', 0) === 0);
}

function isTextComponentClosingNode(node) {
  return (node.nodeType === COMMENT_NODE_TYPE
    && node.nodeValue.lastIndexOf(' /react-text', 0) === 0);
}

/**
 * Returns the children of this dom node in a way that is easily consumable for
 * comparing to the component hierarchy.
 * Unfortunately, a node's DOM children don't correspond exactly to its component's
 * children. For example, text nodes in the component tree become 2 commment DOM
 * nodes and an optional text dom node. Empty components become a single comment DOM node.
 *
 * Returns an array of DOM nodes. Each item in
 * the returned array represents the first DOM node in the tree that corresponds
 * to a particular component in the client render tree.
 */
function getNativeNodeChildren(parent) {
  var childNode = parent.firstChild;
  // special case: if there's just one child and it's text, then it's not a separate
  // component in the client render tree. Instead, it's just the text of a
  // ReactDOMComponent. In that case, return an empty child array.
  if (childNode && !childNode.nextSibling && childNode.nodeType === TEXT_NODE_TYPE) {
    return EMPTY_ARRAY;
  }

  var result = [];
  while (childNode) {
    result.push(childNode);
    if (childNode.nextSibling
      && childNode.nextSibling.nextSibling
      && isTextComponentOpeningNode(childNode)
      && childNode.nextSibling.nodeType === TEXT_NODE_TYPE
      && isTextComponentClosingNode(childNode.nextSibling.nextSibling)) {
      // text component with content: two comment nodes surrounding a text node.
      childNode = childNode.nextSibling.nextSibling.nextSibling;
    } else if (childNode.nextSibling
      && isTextComponentOpeningNode(childNode)
      && isTextComponentClosingNode(childNode.nextSibling)) {
        // text component with no content; two comment nodes next to each other.
      childNode = childNode.nextSibling.nextSibling;
    } else {
      // a regular node.
      childNode = childNode.nextSibling;
    }
  }
  return result;
}

module.exports = {
  getLastNode,
  getNativeNodeChildren,
  getText,
  getType,
  types,
};
