/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ATTRIBUTE_NAME_CHAR,
  ATTRIBUTE_NAME_START_CHAR,
  ID_ATTRIBUTE_NAME,
  ROOT_ATTRIBUTE_NAME,
  getAttributeName,
  isWhitelisted,
  hasBooleanValue,
  hasOverloadedBooleanValue,
  shouldAttributeAcceptBooleanValue,
  shouldIgnoreValue,
  shouldSetAttribute,
} from '../shared/DOMProperty';
import quoteAttributeValueForBrowser from './quoteAttributeValueForBrowser';
import warning from 'fbjs/lib/warning';

// isAttributeNameSafe() is currently duplicated in DOMPropertyOperations.
// TODO: Find a better place for this.
var VALID_ATTRIBUTE_NAME_REGEX = new RegExp(
  '^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$',
);
var illegalAttributeNameCache = new Set();
var validatedAttributeNameCache = new Set();
function isAttributeNameSafe(attributeName) {
  if (validatedAttributeNameCache.has(attributeName)) {
    return true;
  }
  if (illegalAttributeNameCache.has(attributeName)) {
    return false;
  }
  if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
    validatedAttributeNameCache.add(attributeName);
    return true;
  }
  illegalAttributeNameCache.add(attributeName);
  if (__DEV__) {
    warning(false, 'Invalid attribute name: `%s`', attributeName);
  }
  return false;
}

/**
 * Operations for dealing with DOM properties.
 */

/**
 * Creates markup for the ID property.
 *
 * @param {string} id Unescaped ID.
 * @return {string} Markup string.
 */
export function createMarkupForID(id) {
  return ID_ATTRIBUTE_NAME + '=' + quoteAttributeValueForBrowser(id);
}

export function createMarkupForRoot() {
  return ROOT_ATTRIBUTE_NAME + '=""';
}

/**
 * Creates markup for a property.
 *
 * @param {string} name
 * @param {*} value
 * @return {?string} Markup string, or null if the property was invalid.
 */
export function createMarkupForProperty(name, value) {
  if (isWhitelisted(name)) {
    if (shouldIgnoreValue(name, value)) {
      return '';
    }
    var attributeName = getAttributeName(name);
    if (
      hasBooleanValue(name) ||
      (hasOverloadedBooleanValue(name) && value === true)
    ) {
      return attributeName;
    } else if (
      typeof value !== 'boolean' ||
      shouldAttributeAcceptBooleanValue(name)
    ) {
      return attributeName + '=' + quoteAttributeValueForBrowser(value);
    }
  } else if (shouldSetAttribute(name, value)) {
    if (value == null) {
      return '';
    }
    return name + '=' + quoteAttributeValueForBrowser(value);
  }
  return null;
}

/**
 * Creates markup for a custom property.
 *
 * @param {string} name
 * @param {*} value
 * @return {string} Markup string, or empty string if the property was invalid.
 */
export function createMarkupForCustomAttribute(name, value) {
  if (!isAttributeNameSafe(name) || value == null) {
    return '';
  }
  return name + '=' + quoteAttributeValueForBrowser(value);
}
