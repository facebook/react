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
 * @providesModule ReactDOMIDOperations
 * @typechecks static-only
 */

/*jslint evil: true */

"use strict";

var CSSPropertyOperations = require('CSSPropertyOperations');
var DOMChildrenOperations = require('DOMChildrenOperations');
var DOMPropertyOperations = require('DOMPropertyOperations');
var ReactID = require('ReactID');

var getTextContentAccessor = require('getTextContentAccessor');
var invariant = require('invariant');

/**
 * Errors for properties that should not be updated with `updatePropertyById()`.
 *
 * @type {object}
 * @private
 */
var INVALID_PROPERTY_ERRORS = {
  dangerouslySetInnerHTML:
    '`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.',
  style: '`style` must be set using `updateStylesByID()`.'
};

/**
 * The DOM property to use when setting text content.
 *
 * @type {string}
 * @private
 */
var textContentAccessor = getTextContentAccessor() || 'NA';

/**
 * Operations used to process updates to DOM nodes. This is made injectable via
 * `ReactComponent.DOMIDOperations`.
 */
var ReactDOMIDOperations = {

  /**
   * Updates a DOM node with new property values. This should only be used to
   * update DOM properties in `DOMProperty`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} name A valid property name, see `DOMProperty`.
   * @param {*} value New value of the property.
   * @internal
   */
  updatePropertyByID: function(id, name, value) {
    var node = ReactID.getNode(id);
    invariant(
      !INVALID_PROPERTY_ERRORS.hasOwnProperty(name),
      'updatePropertyByID(...): %s',
      INVALID_PROPERTY_ERRORS[name]
    );
    DOMPropertyOperations.setValueForProperty(node, name, value);
  },

  /**
   * Updates a DOM node to remove a property. This should only be used to remove
   * DOM properties in `DOMProperty`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} name A property name to remove, see `DOMProperty`.
   * @internal
   */
  deletePropertyByID: function(id, name, value) {
    var node = ReactID.getNode(id);
    invariant(
      !INVALID_PROPERTY_ERRORS.hasOwnProperty(name),
      'updatePropertyByID(...): %s',
      INVALID_PROPERTY_ERRORS[name]
    );
    DOMPropertyOperations.deleteValueForProperty(node, name, value);
  },

  /**
   * This should almost never be used instead of `updatePropertyByID()` due to
   * the extra object allocation required by the API. That said, this is useful
   * for batching up several operations across worker thread boundaries.
   *
   * @param {string} id ID of the node to update.
   * @param {object} properties A mapping of valid property names.
   * @internal
   * @see {ReactDOMIDOperations.updatePropertyByID}
   */
  updatePropertiesByID: function(id, properties) {
    for (var name in properties) {
      if (!properties.hasOwnProperty(name)) {
        continue;
      }
      ReactDOMIDOperations.updatePropertiesByID(id, name, properties[name]);
    }
  },

  /**
   * Updates a DOM node with new style values. If a value is specified as '',
   * the corresponding style property will be unset.
   *
   * @param {string} id ID of the node to update.
   * @param {object} styles Mapping from styles to values.
   * @internal
   */
  updateStylesByID: function(id, styles) {
    var node = ReactID.getNode(id);
    CSSPropertyOperations.setValueForStyles(node, styles);
  },

  /**
   * Updates a DOM node's innerHTML set by `props.dangerouslySetInnerHTML`.
   *
   * @param {string} id ID of the node to update.
   * @param {object} html An HTML object with the `__html` property.
   * @internal
   */
  updateInnerHTMLByID: function(id, html) {
    var node = ReactID.getNode(id);
    // HACK: IE8- normalize whitespace in innerHTML, removing leading spaces.
    // @see quirksmode.org/bugreports/archives/2004/11/innerhtml_and_t.html
    node.innerHTML = (html && html.__html || '').replace(/^ /g, '&nbsp;');
  },

  /**
   * Updates a DOM node's text content set by `props.content`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} content Text content.
   * @internal
   */
  updateTextContentByID: function(id, content) {
    var node = ReactID.getNode(id);
    node[textContentAccessor] = content;
  },

  /**
   * Replaces a DOM node that exists in the document with markup.
   *
   * @param {string} id ID of child to be replaced.
   * @param {string} markup Dangerous markup to inject in place of child.
   * @internal
   * @see {Danger.dangerouslyReplaceNodeWithMarkup}
   */
  dangerouslyReplaceNodeWithMarkupByID: function(id, markup) {
    var node = ReactID.getNode(id);
    DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup(node, markup);
  },

  /**
   * TODO: We only actually *need* to purge the cache when we remove elements.
   *       Detect if any elements were removed instead of blindly purging.
   */
  manageChildrenByParentID: function(parentID, domOperations) {
    var parent = ReactID.getNode(parentID);
    DOMChildrenOperations.manageChildren(parent, domOperations);
  }

};

module.exports = ReactDOMIDOperations;
