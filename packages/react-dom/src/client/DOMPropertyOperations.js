/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  getPropertyInfo,
  shouldIgnoreAttribute,
  shouldRemoveAttribute,
  isAttributeNameSafe,
  BOOLEAN,
  OVERLOADED_BOOLEAN,
} from '../shared/DOMProperty';
import sanitizeURL from '../shared/sanitizeURL';
import {
  disableJavaScriptURLs,
  enableTrustedTypesIntegration,
  enableCustomElementPropertySupport,
} from 'shared/ReactFeatureFlags';
import {checkAttributeStringCoercion} from 'shared/CheckStringCoercion';
import {getFiberCurrentPropsFromNode} from './ReactDOMComponentTree';

import type {PropertyInfo} from '../shared/DOMProperty';

/**
 * Get the value for a property on a node. Only used in DEV for SSR validation.
 * The "expected" argument is used as a hint of what the expected value is.
 * Some properties have multiple equivalent values.
 */
export function getValueForProperty(
  node: Element,
  name: string,
  expected: mixed,
  propertyInfo: PropertyInfo,
): mixed {
  if (__DEV__) {
    if (propertyInfo.mustUseProperty) {
      const {propertyName} = propertyInfo;
      return (node: any)[propertyName];
    } else {
      // This check protects multiple uses of `expected`, which is why the
      // react-internal/safe-string-coercion rule is disabled in several spots
      // below.
      if (__DEV__) {
        checkAttributeStringCoercion(expected, name);
      }

      if (!disableJavaScriptURLs && propertyInfo.sanitizeURL) {
        // If we haven't fully disabled javascript: URLs, and if
        // the hydration is successful of a javascript: URL, we
        // still want to warn on the client.
        // eslint-disable-next-line react-internal/safe-string-coercion
        sanitizeURL('' + (expected: any));
      }

      const attributeName = propertyInfo.attributeName;

      let stringValue = null;

      if (propertyInfo.type === OVERLOADED_BOOLEAN) {
        if (node.hasAttribute(attributeName)) {
          const value = node.getAttribute(attributeName);
          if (value === '') {
            return true;
          }
          if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
            return value;
          }
          // eslint-disable-next-line react-internal/safe-string-coercion
          if (value === '' + (expected: any)) {
            return expected;
          }
          return value;
        }
      } else if (node.hasAttribute(attributeName)) {
        if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
          // We had an attribute but shouldn't have had one, so read it
          // for the error message.
          return node.getAttribute(attributeName);
        }
        if (propertyInfo.type === BOOLEAN) {
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

      if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
        return stringValue === null ? expected : stringValue;
        // eslint-disable-next-line react-internal/safe-string-coercion
      } else if (stringValue === '' + (expected: any)) {
        return expected;
      } else {
        return stringValue;
      }
    }
  }
}

/**
 * Get the value for a attribute on a node. Only used in DEV for SSR validation.
 * The third argument is used as a hint of what the expected value is. Some
 * attributes have multiple equivalent values.
 */
export function getValueForAttribute(
  node: Element,
  name: string,
  expected: mixed,
): mixed {
  if (__DEV__) {
    if (!isAttributeNameSafe(name)) {
      return;
    }
    if (!node.hasAttribute(name)) {
      return expected === undefined ? undefined : null;
    }
    const value = node.getAttribute(name);
    if (__DEV__) {
      checkAttributeStringCoercion(expected, name);
    }
    if (value === '' + (expected: any)) {
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
export function setValueForProperty(
  node: Element,
  name: string,
  value: mixed,
  isCustomComponentTag: boolean,
) {
  const propertyInfo = getPropertyInfo(name);
  if (shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag)) {
    return;
  }

  if (
    enableCustomElementPropertySupport &&
    isCustomComponentTag &&
    name[0] === 'o' &&
    name[1] === 'n'
  ) {
    let eventName = name.replace(/Capture$/, '');
    const useCapture = name !== eventName;
    eventName = eventName.slice(2);

    const prevProps = getFiberCurrentPropsFromNode(node);
    const prevValue = prevProps != null ? prevProps[name] : null;
    if (typeof prevValue === 'function') {
      node.removeEventListener(eventName, prevValue, useCapture);
    }
    if (typeof value === 'function') {
      if (typeof prevValue !== 'function' && prevValue !== null) {
        // If we previously assigned a non-function type into this node, then
        // remove it when switching to event listener mode.
        if (name in (node: any)) {
          (node: any)[name] = null;
        } else if (node.hasAttribute(name)) {
          node.removeAttribute(name);
        }
      }

      // $FlowFixMe value can't be casted to EventListener.
      node.addEventListener(eventName, (value: EventListener), useCapture);
      return;
    }
  }

  if (
    enableCustomElementPropertySupport &&
    isCustomComponentTag &&
    name in (node: any)
  ) {
    (node: any)[name] = value;
    return;
  }

  if (shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag)) {
    value = null;
  }

  // If the prop isn't in the special list, treat it as a simple attribute.
  if (isCustomComponentTag || propertyInfo === null) {
    if (isAttributeNameSafe(name)) {
      const attributeName = name;
      if (value === null) {
        node.removeAttribute(attributeName);
      } else {
        if (__DEV__) {
          checkAttributeStringCoercion(value, name);
        }
        node.setAttribute(
          attributeName,
          enableTrustedTypesIntegration ? (value: any) : '' + (value: any),
        );
      }
    }
    return;
  }
  const {mustUseProperty} = propertyInfo;
  if (mustUseProperty) {
    const {propertyName} = propertyInfo;
    if (value === null) {
      const {type} = propertyInfo;
      (node: any)[propertyName] = type === BOOLEAN ? false : '';
    } else {
      // Contrary to `setAttribute`, object properties are properly
      // `toString`ed by IE8/9.
      (node: any)[propertyName] = value;
    }
    return;
  }
  // The rest are treated as attributes with special cases.
  const {attributeName, attributeNamespace} = propertyInfo;
  if (value === null) {
    node.removeAttribute(attributeName);
  } else {
    const {type} = propertyInfo;
    let attributeValue;
    if (type === BOOLEAN || (type === OVERLOADED_BOOLEAN && value === true)) {
      // If attribute type is boolean, we know for sure it won't be an execution sink
      // and we won't require Trusted Type here.
      attributeValue = '';
    } else {
      // `setAttribute` with objects becomes only `[object]` in IE8/9,
      // ('' + value) makes it output the correct toString()-value.
      if (enableTrustedTypesIntegration) {
        attributeValue = (value: any);
      } else {
        if (__DEV__) {
          checkAttributeStringCoercion(value, attributeName);
        }
        attributeValue = '' + (value: any);
      }
      if (propertyInfo.sanitizeURL) {
        sanitizeURL(attributeValue.toString());
      }
    }
    if (attributeNamespace) {
      node.setAttributeNS(attributeNamespace, attributeName, attributeValue);
    } else {
      node.setAttribute(attributeName, attributeValue);
    }
  }
}
