/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DOMMarkupOperations
 */

'use strict';

var DOMProperty = require('DOMProperty');

var quoteAttributeValueForBrowser = require('quoteAttributeValueForBrowser');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
}

// isAttributeNameSafe() is currently duplicated in DOMPropertyOperations.
// TODO: Find a better place for this.
var VALID_ATTRIBUTE_NAME_REGEX = new RegExp(
  '^[' +
    DOMProperty.ATTRIBUTE_NAME_START_CHAR +
    '][' +
    DOMProperty.ATTRIBUTE_NAME_CHAR +
    ']*$',
);
var illegalAttributeNameCache = {};
var validatedAttributeNameCache = {};
function isAttributeNameSafe(attributeName) {
  if (validatedAttributeNameCache.hasOwnProperty(attributeName)) {
    return true;
  }
  if (illegalAttributeNameCache.hasOwnProperty(attributeName)) {
    return false;
  }
  if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
    validatedAttributeNameCache[attributeName] = true;
    return true;
  }
  illegalAttributeNameCache[attributeName] = true;
  if (__DEV__) {
    warning(false, 'Invalid attribute name: `%s`', attributeName);
  }
  return false;
}

// shouldIgnoreValue() is currently duplicated in DOMPropertyOperations.
// TODO: Find a better place for this.
function shouldIgnoreValue(name, value) {
  return (
    value == null ||
    (DOMProperty.isBooleanValue(name) && !value) ||
    (DOMProperty.isNumericValue(name) && isNaN(value)) ||
    (DOMProperty.isPositiveNumericValue(name) && value < 1) ||
    (DOMProperty.isOverloadedBooleanValue(name) && value === false)
  );
}

/**
 * Operations for dealing with DOM properties.
 */
var DOMMarkupOperations = {
  /**
   * Creates markup for the ID property.
   *
   * @param {string} id Unescaped ID.
   * @return {string} Markup string.
   */
  createMarkupForID: function(id) {
    return (
      DOMProperty.ID_ATTRIBUTE_NAME + '=' + quoteAttributeValueForBrowser(id)
    );
  },

  createMarkupForRoot: function() {
    return DOMProperty.ROOT_ATTRIBUTE_NAME + '=""';
  },

  /**
   * Creates markup for a property.
   *
   * @param {string} name
   * @param {*} value
   * @return {?string} Markup string, or null if the property was invalid.
   */
  createMarkupForProperty: function(name, value) {
    if (DOMProperty.isReservedProp(name)) {
      return null
    } else if (shouldIgnoreValue(name, value)) {
      return '';
    }

    var attributeName = DOMProperty.getAttributeName(name);

    if (DOMProperty.needsEmptyStringValue(name, value)) {
      return attributeName + '=""';
    } else if (value == null) {
      return '';
    }

    return attributeName + '=' + quoteAttributeValueForBrowser(value);
  },

  /**
   * Creates markup for a custom property.
   *
   * @param {string} name
   * @param {*} value
   * @return {string} Markup string, or empty string if the property was invalid.
   */
  createMarkupForCustomAttribute: function(name, value) {
    if (!isAttributeNameSafe(name) || value == null) {
      return '';
    }
    return name + '=' + quoteAttributeValueForBrowser(value);
  },
};

module.exports = DOMMarkupOperations;
