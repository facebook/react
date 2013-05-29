/**
 * @providesModule getDOMNodeID
 */

"use strict";

/**
 * Accessing "id" or calling getAttribute('id') on a form element can return its
 * control whose name or ID is "id". However, not all DOM nodes support
 * `getAttributeNode` (document - which is not a form) so that is checked first.
 *
 * @param {Element} domNode DOM node element to return ID of.
 * @returns {string} The ID of `domNode`.
 */
function getDOMNodeID(domNode) {
  if (domNode.getAttributeNode) {
    var attributeNode = domNode.getAttributeNode('id');
    return attributeNode && attributeNode.value || '';
  } else {
    return domNode.id || '';
  }
}

module.exports = getDOMNodeID;
