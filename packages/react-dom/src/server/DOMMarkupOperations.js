/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {TrustedTypes} from './trustedTypes';

import {
  ID_ATTRIBUTE_NAME,
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
 * @param {string} name property name
 * @param {*} value property value
 * @param {string} tagLowercase lowercase tag name of the target element
 * @param {TrustedTypes} trustedTypes Trusted Types implementation, which if provided enforces trusted types on server
 * @return {?string} Markup string, or null if the property was invalid.
 */
export function createMarkupForProperty(
  name: string,
  value: mixed,
  tagLowercase: string,
  trustedTypes: ?TrustedTypes,
): string {
  const propertyInfo = getPropertyInfo(name);
  if (name !== 'style' && shouldIgnoreAttribute(name, propertyInfo, false)) {
    return '';
  }
  if (shouldRemoveAttribute(name, value, propertyInfo, false)) {
    return '';
  }
  if (
    trustedTypes &&
    // TODO: getPropertyType is not yet implemented everywhere.
    // once Trusted Types are stable remove this check.
    trustedTypes.getPropertyType &&
    trustedTypes.getPropertyType(tagLowercase, name)
  ) {
    const requiredTrustedType = trustedTypes.getPropertyType(
      tagLowercase,
      name,
    );
    if (
      (requiredTrustedType === 'TrustedHTML' && !trustedTypes.isHTML(value)) ||
      (requiredTrustedType === 'TrustedScriptURL' &&
        !trustedTypes.isScriptURL(value)) ||
      (requiredTrustedType === 'TrustedURL' && !trustedTypes.isURL(value)) ||
      (requiredTrustedType === 'TrustedScript' && !trustedTypes.isScript(value))
    ) {
      throw new Error(
        `${name} requires ${requiredTrustedType}! Received: ${(value: any)}`,
      );
    }
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
  if (!isAttributeNameSafe(name) || value == null) {
    return '';
  }
  return name + '=' + quoteAttributeValueForBrowser(value);
}
