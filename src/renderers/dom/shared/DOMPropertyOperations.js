/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DOMPropertyOperations
 */

'use strict';

var DOMProperty = require('DOMProperty');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactInstrumentation = require('ReactInstrumentation');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
}

// isAttributeNameSafe() is currently duplicated in DOMMarkupOperations.
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

// shouldIgnoreValue() is currently duplicated in DOMMarkupOperations.
// TODO: Find a better place for this.
function shouldIgnoreValue(propertyInfo, value) {
  return (
    value == null ||
    (propertyInfo.hasBooleanValue && !value) ||
    (propertyInfo.hasNumericValue && isNaN(value)) ||
    (propertyInfo.hasPositiveNumericValue && value < 1) ||
    (propertyInfo.hasOverloadedBooleanValue && value === false)
  );
}

/**
 * Operations for dealing with DOM properties.
 */
var DOMPropertyOperations = {
  setAttributeForID: function(node, id) {
    node.setAttribute(DOMProperty.ID_ATTRIBUTE_NAME, id);
  },

  setAttributeForRoot: function(node) {
    node.setAttribute(DOMProperty.ROOT_ATTRIBUTE_NAME, '');
  },

  /**
   * Get the value for a property on a node. Only used in DEV for SSR validation.
   * The "expected" argument is used as a hint of what the expected value is.
   * Some properties have multiple equivalent values.
   */
  getValueForProperty: function(node, name, expected) {
    if (__DEV__) {
      var propertyInfo = DOMProperty.getPropertyInfo(name);
      if (propertyInfo) {
        var mutationMethod = propertyInfo.mutationMethod;
        if (mutationMethod || propertyInfo.mustUseProperty) {
          return node[propertyInfo.propertyName];
        } else {
          var attributeName = propertyInfo.attributeName;

          var stringValue = null;

          if (propertyInfo.hasOverloadedBooleanValue) {
            if (node.hasAttribute(attributeName)) {
              var value = node.getAttribute(attributeName);
              if (value === '') {
                return true;
              }
              if (shouldIgnoreValue(propertyInfo, expected)) {
                return value;
              }
              if (value === '' + expected) {
                return expected;
              }
              return value;
            }
          } else if (node.hasAttribute(attributeName)) {
            if (shouldIgnoreValue(propertyInfo, expected)) {
              // We had an attribute but shouldn't have had one, so read it
              // for the error message.
              return node.getAttribute(attributeName);
            }
            if (propertyInfo.hasBooleanValue) {
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

          if (shouldIgnoreValue(propertyInfo, expected)) {
            return stringValue === null ? expected : stringValue;
          } else if (stringValue === '' + expected) {
            return expected;
          } else {
            return stringValue;
          }
        }
      }
    }
  },

  /**
   * Get the value for a attribute on a node. Only used in DEV for SSR validation.
   * The third argument is used as a hint of what the expected value is. Some
   * attributes have multiple equivalent values.
   */
  getValueForAttribute: function(node, name, expected) {
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
  },

  /**
   * Sets the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   * @param {*} value
   */
  setValueForProperty: function(node, name, value) {
    var propertyInfo = DOMProperty.getPropertyInfo(name);

    if (propertyInfo && DOMProperty.shouldSetAttribute(name, value)) {
      var mutationMethod = propertyInfo.mutationMethod;
      if (mutationMethod) {
        mutationMethod(node, value);
      } else if (shouldIgnoreValue(propertyInfo, value)) {
        DOMPropertyOperations.deleteValueForProperty(node, name);
        return;
      } else if (propertyInfo.mustUseProperty) {
        // Contrary to `setAttribute`, object properties are properly
        // `toString`ed by IE8/9.
        node[propertyInfo.propertyName] = value;
      } else {
        var attributeName = propertyInfo.attributeName;
        var namespace = propertyInfo.attributeNamespace;
        // `setAttribute` with objects becomes only `[object]` in IE8/9,
        // ('' + value) makes it output the correct toString()-value.
        if (namespace) {
          node.setAttributeNS(namespace, attributeName, '' + value);
        } else if (
          propertyInfo.hasBooleanValue ||
          (propertyInfo.hasOverloadedBooleanValue && value === true)
        ) {
          node.setAttribute(attributeName, '');
        } else {
          node.setAttribute(attributeName, '' + value);
        }
      }
    } else {
      DOMPropertyOperations.setValueForAttribute(
        node,
        name,
        DOMProperty.shouldSetAttribute(name, value) ? value : null,
      );
      return;
    }

    if (__DEV__) {
      var payload = {};
      payload[name] = value;
      ReactInstrumentation.debugTool.onHostOperation({
        instanceID: ReactDOMComponentTree.getInstanceFromNode(node)._debugID,
        type: 'update attribute',
        payload: payload,
      });
    }
  },

  setValueForAttribute: function(node, name, value) {
    if (!isAttributeNameSafe(name)) {
      return;
    }
    if (value == null) {
      node.removeAttribute(name);
    } else {
      node.setAttribute(name, '' + value);
    }

    if (__DEV__) {
      var payload = {};
      payload[name] = value;
      ReactInstrumentation.debugTool.onHostOperation({
        instanceID: ReactDOMComponentTree.getInstanceFromNode(node)._debugID,
        type: 'update attribute',
        payload: payload,
      });
    }
  },

  /**
   * Deletes an attributes from a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   */
  deleteValueForAttribute: function(node, name) {
    node.removeAttribute(name);
    if (__DEV__) {
      ReactInstrumentation.debugTool.onHostOperation({
        instanceID: ReactDOMComponentTree.getInstanceFromNode(node)._debugID,
        type: 'remove attribute',
        payload: name,
      });
    }
  },

  /**
   * Deletes the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   */
  deleteValueForProperty: function(node, name) {
    var propertyInfo = DOMProperty.getPropertyInfo(name);
    if (propertyInfo) {
      var mutationMethod = propertyInfo.mutationMethod;
      if (mutationMethod) {
        mutationMethod(node, undefined);
      } else if (propertyInfo.mustUseProperty) {
        var propName = propertyInfo.propertyName;
        if (propertyInfo.hasBooleanValue) {
          node[propName] = false;
        } else {
          node[propName] = '';
        }
      } else {
        node.removeAttribute(propertyInfo.attributeName);
      }
    } else {
      node.removeAttribute(name);
    }

    if (__DEV__) {
      ReactInstrumentation.debugTool.onHostOperation({
        instanceID: ReactDOMComponentTree.getInstanceFromNode(node)._debugID,
        type: 'remove attribute',
        payload: name,
      });
    }
  },
};

module.exports = DOMPropertyOperations;
