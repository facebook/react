/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  ID_ATTRIBUTE_NAME,
  ROOT_ATTRIBUTE_NAME,
  getPropertyInfo,
  isAttributeNameSafe,
  shouldSkipAttribute,
  shouldTreatAttributeValueAsNull,
} from '../shared/DOMProperty';
import quoteAttributeValueForBrowser from './quoteAttributeValueForBrowser';

/**
 * Operations for dealing with DOM properties.
 */

/**
 * Creates markup for the ID property.
 *
 * @param {string} id Unescaped ID.
 * @return {string} Markup string.
 */
export function createMarkupForID(id: string): string {
  return ID_ATTRIBUTE_NAME + '=' + quoteAttributeValueForBrowser(id);
}

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
  if (name !== 'style' && shouldSkipAttribute(name, false)) {
    return '';
  }
  if (shouldTreatAttributeValueAsNull(name, value, false)) {
    return '';
  }
  const propertyInfo = getPropertyInfo(name);
  if (propertyInfo) {
    const attributeName = propertyInfo.attributeName;
    if (
      propertyInfo.hasBooleanValue ||
      (propertyInfo.hasOverloadedBooleanValue && value === true)
    ) {
      return attributeName + '=""';
    } else {
      return attributeName + '=' + quoteAttributeValueForBrowser(value);
    }
  } else {
    return name + '=' + quoteAttributeValueForBrowser(value);
  }
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
  if (!isAttributeNameSafe(name) || value == null) {
    return '';
  }
  return name + '=' + quoteAttributeValueForBrowser(value);
}
