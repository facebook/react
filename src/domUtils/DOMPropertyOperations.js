/**
 * @providesModule DOMPropertyOperations
 * @typechecks
 */

"use strict";

var DOMProperty = require('DOMProperty');

var escapeTextForBrowser = require('escapeTextForBrowser');
var memoizeStringOnly = require('memoizeStringOnly');

var processAttributeNameAndPrefix = memoizeStringOnly(function(name) {
  return escapeTextForBrowser(name) + '="';
});

/**
 * Operations for dealing with DOM properties.
 */
var DOMPropertyOperations = {

  /**
   * Creates markup for a property.
   *
   * @param {string} name
   * @param {*} value
   * @return {?string} Markup string, or null if the property was invalid.
   */
  createMarkupForProperty: function(name, value) {
    if (DOMProperty.isStandardName[name]) {
      if (value == null || DOMProperty.hasBooleanValue[name] && !value) {
        return '';
      }
      var attributeName = DOMProperty.getAttributeName[name];
      return processAttributeNameAndPrefix(attributeName) +
        escapeTextForBrowser(value) + '"';
    } else if (DOMProperty.isCustomAttribute(name)) {
      if (value == null) {
        return '';
      }
      return processAttributeNameAndPrefix(name) +
        escapeTextForBrowser(value) + '"';
    } else {
      return null;
    }
  },

  /**
   * Sets the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   * @param {*} value
   */
  setValueForProperty: function(node, name, value) {
    if (DOMProperty.isStandardName[name]) {
      var mutationMethod = DOMProperty.getMutationMethod[name];
      if (mutationMethod) {
        mutationMethod(node, value);
      } else if (DOMProperty.mustUseAttribute[name]) {
        if (DOMProperty.hasBooleanValue[name] && !value) {
          node.removeAttribute(DOMProperty.getAttributeName[name]);
        } else {
          node.setAttribute(DOMProperty.getAttributeName[name], value);
        }
      } else {
        var propName = DOMProperty.getPropertyName[name];
        if (!DOMProperty.hasSideEffects[name] || node[propName] !== value) {
          node[propName] = value;
        }
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      node.setAttribute(name, value);
    }
  }

};

module.exports = DOMPropertyOperations;
