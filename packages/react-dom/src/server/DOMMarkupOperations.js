/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  ROOT_ATTRIBUTE_NAME,
  BOOLEAN,
  OVERLOADED_BOOLEAN,
  getPropertyInfo,
  isAttributeNameSafe,
  shouldIgnoreAttribute,
  shouldRemoveAttribute,
} from '../shared/DOMProperty';
import sanitizeURL from '../shared/sanitizeURL';
import quoteAttributeValueForBrowser from './quoteAttributeValueForBrowser';

/**
 * Operations for dealing with DOM properties.
 */

export function createMarkupForRoot(): string {
  return ROOT_ATTRIBUTE_NAME + '=""';
}

/**
 * Creates markup for a property.
 *
 * @param {string} name
 * @param {*} value
 * @return {?string} Markup string, or null if the property was invalid.
 */
export function createMarkupForProperty(name: string, value: mixed): string {
  const propertyInfo = getPropertyInfo(name);
  if (name !== 'style' && shouldIgnoreAttribute(name, propertyInfo, false)) {
    return '';
  }
  if (shouldRemoveAttribute(name, value, propertyInfo, false)) {
    return '';
  }
  if (propertyInfo !== null) {
    const attributeName = propertyInfo.attributeName;
    const {type} = propertyInfo;
    if (type === BOOLEAN || (type === OVERLOADED_BOOLEAN && value === true)) {
      return attributeName + '=""';
    } else {
      if (propertyInfo.sanitizeURL) {
        value = '' + (value: any);
        sanitizeURL(value);
      }
      return attributeName + '=' + quoteAttributeValueForBrowser(value);
    }
  } else if (isAttributeNameSafe(name)) {
    return name + '=' + quoteAttributeValueForBrowser(value);
  }
  return '';
}

/**
 * Creates markup for a custom property.
 *
 * @param {string} name
 * @param {*} value
 * @return {string} Markup string, or empty string if the property was invalid.
 */
export function createMarkupForCustomAttribute(
  name: string,
  value: mixed,
): string {
  if (
    !isAttributeNameSafe(name) ||
    value == null ||
    typeof value === 'function' ||
    typeof value === 'symbol'
  ) {
    return '';
  }
  return name + '=' + quoteAttributeValueForBrowser(value);
}
