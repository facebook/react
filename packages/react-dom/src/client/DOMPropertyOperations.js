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
  getAttributeNamespace,
  isWhitelisted,
  hasBooleanValue,
  hasOverloadedBooleanValue,
  shouldIgnoreValue,
  shouldSetAttribute,
  shouldUseProperty,
} from '../shared/DOMProperty';
import warning from 'fbjs/lib/warning';

// isAttributeNameSafe() is currently duplicated in DOMMarkupOperations.
// TODO: Find a better place for this.
var VALID_ATTRIBUTE_NAME_REGEX = new RegExp(
  '^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$',
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

/**
 * Operations for dealing with DOM properties.
 */

export function setAttributeForID(node, id) {
  node.setAttribute(ID_ATTRIBUTE_NAME, id);
}

export function setAttributeForRoot(node) {
  node.setAttribute(ROOT_ATTRIBUTE_NAME, '');
}

/**
 * Get the value for a property on a node. Only used in DEV for SSR validation.
 * The "expected" argument is used as a hint of what the expected value is.
 * Some properties have multiple equivalent values.
 */
export function getValueForProperty(node, name, expected) {
  if (__DEV__) {
    if (isWhitelisted(name)) {
      if (shouldUseProperty(name)) {
        return node[name];
      } else {
        var attributeName = getAttributeName(name);

        var stringValue = null;

        if (hasOverloadedBooleanValue(name)) {
          if (node.hasAttribute(attributeName)) {
            var value = node.getAttribute(attributeName);
            if (value === '') {
              return true;
            }
            if (shouldIgnoreValue(name, expected)) {
              return value;
            }
            if (value === '' + expected) {
              return expected;
            }
            return value;
          }
        } else if (node.hasAttribute(attributeName)) {
          if (shouldIgnoreValue(name, expected)) {
            // We had an attribute but shouldn't have had one, so read it
            // for the error message.
            return node.getAttribute(attributeName);
          }
          if (hasBooleanValue(name)) {
            // If this was a boolean, it doesn't matter what the value is
            // the fact that we have it is the same as the expected.
            return expected;
          }
          // Even if this property uses a namespace we use getAttribute
          // because we assume its namespaced name is the same as our config.
          // To use getAttributeNS we need the local name which we don't have
          // in our config atm.
          stringValue = node.getAttribute(attributeName);
        }

        if (shouldIgnoreValue(name, expected)) {
          return stringValue === null ? expected : stringValue;
        } else if (stringValue === '' + expected) {
          return expected;
        } else {
          return stringValue;
        }
      }
    }
  }
}

/**
 * Get the value for a attribute on a node. Only used in DEV for SSR validation.
 * The third argument is used as a hint of what the expected value is. Some
 * attributes have multiple equivalent values.
 */
export function getValueForAttribute(node, name, expected) {
  if (__DEV__) {
    if (!isAttributeNameSafe(name)) {
      return;
    }
    if (!node.hasAttribute(name)) {
      return expected === undefined ? undefined : null;
    }
    var value = node.getAttribute(name);
    if (value === '' + expected) {
      return expected;
    }
    return value;
  }
}

/**
 * Sets the value for a property on a node.
 *
 * @param {DOMElement} node
 * @param {string} name
 * @param {*} value
 */
export function setValueForProperty(node, name, value) {
  if (isWhitelisted(name) && shouldSetAttribute(name, value)) {
    if (shouldIgnoreValue(name, value)) {
      deleteValueForProperty(node, name);
      return;
    } else if (shouldUseProperty(name)) {
      // Contrary to `setAttribute`, object properties are properly
      // `toString`ed by IE8/9.
      node[name] = value;
    } else {
      var attributeName = getAttributeName(name);
      var namespace = getAttributeNamespace(name);
      // `setAttribute` with objects becomes only `[object]` in IE8/9,
      // ('' + value) makes it output the correct toString()-value.
      if (namespace) {
        node.setAttributeNS(namespace, attributeName, '' + value);
      } else if (
        hasBooleanValue(name) ||
        (hasOverloadedBooleanValue(name) && value === true)
      ) {
        node.setAttribute(attributeName, '');
      } else {
        node.setAttribute(attributeName, '' + value);
      }
    }
  } else {
    setValueForAttribute(
      node,
      name,
      shouldSetAttribute(name, value) ? value : null,
    );
    return;
  }
}

export function setValueForAttribute(node, name, value) {
  if (!isAttributeNameSafe(name)) {
    return;
  }
  if (value == null) {
    node.removeAttribute(name);
  } else {
    node.setAttribute(name, '' + value);
  }
}

/**
 * Deletes an attributes from a node.
 *
 * @param {DOMElement} node
 * @param {string} name
 */
export function deleteValueForAttribute(node, name) {
  node.removeAttribute(name);
}

/**
 * Deletes the value for a property on a node.
 *
 * @param {DOMElement} node
 * @param {string} name
 */
export function deleteValueForProperty(node, name) {
  if (isWhitelisted(name)) {
    if (shouldUseProperty(name)) {
      if (hasBooleanValue(name)) {
        node[name] = false;
      } else {
        node[name] = '';
      }
    } else {
      const attributeName = getAttributeName(name);
      node.removeAttribute(attributeName);
    }
  } else {
    node.removeAttribute(name);
  }
}
