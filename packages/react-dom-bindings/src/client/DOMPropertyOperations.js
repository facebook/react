/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  getPropertyInfo,
  isAttributeNameSafe,
  BOOLEAN,
  OVERLOADED_BOOLEAN,
  NUMERIC,
  POSITIVE_NUMERIC,
} from '../shared/DOMProperty';
import sanitizeURL from '../shared/sanitizeURL';
import {
  disableJavaScriptURLs,
  enableTrustedTypesIntegration,
  enableCustomElementPropertySupport,
  enableFilterEmptyStringAttributesDOM,
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
    }
    if (!disableJavaScriptURLs && propertyInfo.sanitizeURL) {
      // If we haven't fully disabled javascript: URLs, and if
      // the hydration is successful of a javascript: URL, we
      // still want to warn on the client.
      if (__DEV__) {
        checkAttributeStringCoercion(expected, name);
      }
      sanitizeURL('' + (expected: any));
    }

    const attributeName = propertyInfo.attributeName;

    if (!node.hasAttribute(attributeName)) {
      // shouldRemoveAttribute
      switch (typeof expected) {
        case 'function':
        case 'symbol': // eslint-disable-line
          return expected;
        case 'boolean': {
          if (!propertyInfo.acceptsBooleans) {
            return expected;
          }
        }
      }
      switch (propertyInfo.type) {
        case BOOLEAN: {
          if (!expected) {
            return expected;
          }
          break;
        }
        case OVERLOADED_BOOLEAN: {
          if (expected === false) {
            return expected;
          }
          break;
        }
        case NUMERIC: {
          if (isNaN(expected)) {
            return expected;
          }
          break;
        }
        case POSITIVE_NUMERIC: {
          if (isNaN(expected) || (expected: any) < 1) {
            return expected;
          }
          break;
        }
      }
      if (enableFilterEmptyStringAttributesDOM) {
        if (propertyInfo.removeEmptyString && expected === '') {
          if (__DEV__) {
            if (name === 'src') {
              console.error(
                'An empty string ("") was passed to the %s attribute. ' +
                  'This may cause the browser to download the whole page again over the network. ' +
                  'To fix this, either do not render the element at all ' +
                  'or pass null to %s instead of an empty string.',
                name,
                name,
              );
            } else {
              console.error(
                'An empty string ("") was passed to the %s attribute. ' +
                  'To fix this, either do not render the element at all ' +
                  'or pass null to %s instead of an empty string.',
                name,
                name,
              );
            }
          }
          return expected;
        }
      }
      return expected === undefined ? undefined : null;
    }

    // Even if this property uses a namespace we use getAttribute
    // because we assume its namespaced name is the same as our config.
    // To use getAttributeNS we need the local name which we don't have
    // in our config atm.
    const value = node.getAttribute(attributeName);

    if (expected == null) {
      // We had an attribute but shouldn't have had one, so read it
      // for the error message.
      return value;
    }

    // shouldRemoveAttribute
    switch (propertyInfo.type) {
      case BOOLEAN: {
        if (expected) {
          // If this was a boolean, it doesn't matter what the value is
          // the fact that we have it is the same as the expected.
          // As long as it's positive.
          return expected;
        }
        return value;
      }
      case OVERLOADED_BOOLEAN: {
        if (value === '') {
          return true;
        }
        if (expected === false) {
          // We had an attribute but shouldn't have had one, so read it
          // for the error message.
          return value;
        }
        break;
      }
      case NUMERIC: {
        if (isNaN(expected)) {
          // We had an attribute but shouldn't have had one, so read it
          // for the error message.
          return value;
        }
        break;
      }
      case POSITIVE_NUMERIC: {
        if (isNaN(expected) || (expected: any) < 1) {
          // We had an attribute but shouldn't have had one, so read it
          // for the error message.
          return value;
        }
        break;
      }
    }
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
      // shouldRemoveAttribute
      switch (typeof expected) {
        case 'function':
        case 'symbol': // eslint-disable-line
          return expected;
        case 'boolean': {
          const prefix = name.toLowerCase().slice(0, 5);
          if (prefix !== 'data-' && prefix !== 'aria-') {
            return expected;
          }
        }
      }
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

export function getValueForAttributeOnCustomComponent(
  node: Element,
  name: string,
  expected: mixed,
): mixed {
  if (__DEV__) {
    if (!isAttributeNameSafe(name)) {
      return;
    }
    if (!node.hasAttribute(name)) {
      // shouldRemoveAttribute
      switch (typeof expected) {
        case 'symbol':
        case 'object':
          // Symbols and objects are ignored when they're emitted so
          // it would be expected that they end up not having an attribute.
          return expected;
        case 'function':
          if (enableCustomElementPropertySupport) {
            return expected;
          }
          break;
        case 'boolean':
          if (enableCustomElementPropertySupport) {
            if (expected === false) {
              return expected;
            }
          }
      }
      return expected === undefined ? undefined : null;
    }
    if (enableCustomElementPropertySupport && name === 'className') {
      // className is a special cased property on the server to render as an attribute.
      name = 'class';
    }
    const value = node.getAttribute(name);

    if (enableCustomElementPropertySupport) {
      if (value === '' && expected === true) {
        return true;
      }
    }

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
export function setValueForProperty(node: Element, name: string, value: mixed) {
  if (
    // shouldIgnoreAttribute
    // We have already filtered out reserved words.
    name.length > 2 &&
    (name[0] === 'o' || name[0] === 'O') &&
    (name[1] === 'n' || name[1] === 'N')
  ) {
    return;
  }

  const propertyInfo = getPropertyInfo(name);
  if (propertyInfo !== null) {
    if (propertyInfo.mustUseProperty) {
      // We assume mustUseProperty are of BOOLEAN type because that's the only way we use it
      // right now.
      (node: any)[propertyInfo.propertyName] =
        value && typeof value !== 'function' && typeof value !== 'symbol';
      return;
    }

    // The rest are treated as attributes with special cases.

    const attributeName = propertyInfo.attributeName;

    if (value === null) {
      node.removeAttribute(attributeName);
      return;
    }

    // shouldRemoveAttribute
    switch (typeof value) {
      case 'undefined':
      case 'function':
      case 'symbol': // eslint-disable-line
        node.removeAttribute(attributeName);
        return;
      case 'boolean': {
        if (!propertyInfo.acceptsBooleans) {
          node.removeAttribute(attributeName);
          return;
        }
      }
    }
    if (enableFilterEmptyStringAttributesDOM) {
      if (propertyInfo.removeEmptyString && value === '') {
        if (__DEV__) {
          if (name === 'src') {
            console.error(
              'An empty string ("") was passed to the %s attribute. ' +
                'This may cause the browser to download the whole page again over the network. ' +
                'To fix this, either do not render the element at all ' +
                'or pass null to %s instead of an empty string.',
              name,
              name,
            );
          } else {
            console.error(
              'An empty string ("") was passed to the %s attribute. ' +
                'To fix this, either do not render the element at all ' +
                'or pass null to %s instead of an empty string.',
              name,
              name,
            );
          }
        }
        node.removeAttribute(attributeName);
        return;
      }
    }

    switch (propertyInfo.type) {
      case BOOLEAN:
        if (value) {
          node.setAttribute(attributeName, '');
        } else {
          node.removeAttribute(attributeName);
          return;
        }
        break;
      case OVERLOADED_BOOLEAN:
        if (value === true) {
          node.setAttribute(attributeName, '');
        } else if (value === false) {
          node.removeAttribute(attributeName);
        } else {
          if (__DEV__) {
            checkAttributeStringCoercion(value, attributeName);
          }
          node.setAttribute(attributeName, (value: any));
        }
        return;
      case NUMERIC:
        if (!isNaN(value)) {
          if (__DEV__) {
            checkAttributeStringCoercion(value, attributeName);
          }
          node.setAttribute(attributeName, (value: any));
        } else {
          node.removeAttribute(attributeName);
        }
        break;
      case POSITIVE_NUMERIC:
        if (!isNaN(value) && (value: any) >= 1) {
          if (__DEV__) {
            checkAttributeStringCoercion(value, attributeName);
          }
          node.setAttribute(attributeName, (value: any));
        } else {
          node.removeAttribute(attributeName);
        }
        break;
      default: {
        let attributeValue;
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
        const attributeNamespace = propertyInfo.attributeNamespace;
        if (attributeNamespace) {
          node.setAttributeNS(
            attributeNamespace,
            attributeName,
            attributeValue,
          );
        } else {
          node.setAttribute(attributeName, attributeValue);
        }
      }
    }
  } else if (isAttributeNameSafe(name)) {
    // If the prop isn't in the special list, treat it as a simple attribute.
    // shouldRemoveAttribute
    if (value === null) {
      node.removeAttribute(name);
      return;
    }
    switch (typeof value) {
      case 'undefined':
      case 'function':
      case 'symbol': // eslint-disable-line
        node.removeAttribute(name);
        return;
      case 'boolean': {
        const prefix = name.toLowerCase().slice(0, 5);
        if (prefix !== 'data-' && prefix !== 'aria-') {
          node.removeAttribute(name);
          return;
        }
      }
    }
    if (__DEV__) {
      checkAttributeStringCoercion(value, name);
    }
    node.setAttribute(
      name,
      enableTrustedTypesIntegration ? (value: any) : '' + (value: any),
    );
  }
}

export function setValueForPropertyOnCustomComponent(
  node: Element,
  name: string,
  value: mixed,
) {
  if (
    enableCustomElementPropertySupport &&
    name[0] === 'o' &&
    name[1] === 'n'
  ) {
    const useCapture = name.endsWith('Capture');
    const eventName = name.substr(2, useCapture ? name.length - 9 : undefined);

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

  if (enableCustomElementPropertySupport && name in (node: any)) {
    (node: any)[name] = value;
    return;
  }

  if (isAttributeNameSafe(name)) {
    // shouldRemoveAttribute
    if (value === null) {
      node.removeAttribute(name);
      return;
    }
    switch (typeof value) {
      case 'undefined':
      case 'function':
      case 'symbol': // eslint-disable-line
        node.removeAttribute(name);
        return;
      case 'boolean': {
        if (enableCustomElementPropertySupport) {
          if (value === true) {
            node.setAttribute(name, '');
            return;
          }
          node.removeAttribute(name);
          return;
        }
      }
    }
    if (__DEV__) {
      checkAttributeStringCoercion(value, name);
    }
    node.setAttribute(
      name,
      enableTrustedTypesIntegration ? (value: any) : '' + (value: any),
    );
  }
}
