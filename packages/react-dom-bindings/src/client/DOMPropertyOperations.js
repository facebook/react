/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import isAttributeNameSafe from '../shared/isAttributeNameSafe';
import {enableTrustedTypesIntegration} from 'shared/ReactFeatureFlags';
import {checkAttributeStringCoercion} from 'shared/CheckStringCoercion';
import {getFiberCurrentPropsFromNode} from './ReactDOMComponentTree';
import {trackHostMutation} from 'react-reconciler/src/ReactFiberMutationTracking';

/**
 * Safe check for object property ownership to avoid method-unbinding error.
 */
function hasOwn(obj: mixed, key: string): boolean %checks {
  return typeof obj === 'object' &&
    obj !== null &&
    typeof (obj: any).hasOwnProperty === 'function' &&
    (obj: any).hasOwnProperty(key);
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
      switch (typeof expected) {
        case 'function':
        case 'symbol':
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
      switch (typeof expected) {
        case 'symbol':
        case 'object':
        case 'function':
          return expected;
        case 'boolean':
          if (expected === false) {
            return expected;
          }
      }
      return expected === undefined ? undefined : null;
    }
    const value = node.getAttribute(name);

    if (value === '' && expected === true) {
      return true;
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

export function setValueForAttribute(
  node: Element,
  name: string,
  value: mixed,
) {
  if (isAttributeNameSafe(name)) {
    if (
      (name === 'value' || name === 'defaultValue') &&
      (typeof value === 'function' || typeof value === 'symbol')
    ) {
      node.removeAttribute(name);
      return;
    }

    if (value === null) {
      node.removeAttribute(name);
      return;
    }

    switch (typeof value) {
      case 'undefined':
      case 'function':
      case 'symbol':
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

export function setValueForKnownAttribute(
  node: Element,
  name: string,
  value: mixed,
) {
  if (value === null) {
    node.removeAttribute(name);
    return;
  }
  switch (typeof value) {
    case 'undefined':
    case 'function':
    case 'symbol':
    case 'boolean': {
      node.removeAttribute(name);
      return;
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

export function setValueForNamespacedAttribute(
  node: Element,
  namespace: string,
  name: string,
  value: mixed,
) {
  if (value === null) {
    node.removeAttribute(name);
    return;
  }
  switch (typeof value) {
    case 'undefined':
    case 'function':
    case 'symbol':
    case 'boolean': {
      node.removeAttribute(name);
      return;
    }
  }
  if (__DEV__) {
    checkAttributeStringCoercion(value, name);
  }
  node.setAttributeNS(
    namespace,
    name,
    enableTrustedTypesIntegration ? (value: any) : '' + (value: any),
  );
}

export function setValueForPropertyOnCustomComponent(
  node: Element,
  name: string,
  value: mixed,
) {
  if (name[0] === 'o' && name[1] === 'n') {
    const useCapture = name.endsWith('Capture');
    const eventName: string = name.slice(2, useCapture ? name.length - 7 : undefined).toLowerCase();

    const prevProps = getFiberCurrentPropsFromNode(node);
    let prevValue = null;
    if (prevProps != null && hasOwn(prevProps, name)) {
      prevValue = ((prevProps: any)[name]: mixed);
    }

    if (typeof prevValue === 'function' && typeof eventName === 'string') {
      (node: any).removeEventListener(eventName, prevValue, useCapture);
    }
    if (typeof value === 'function' && typeof eventName === 'string') {
      if (typeof prevValue !== 'function' && prevValue !== null) {
        if (name in (node: any)) {
          (node: any)[name] = null;
        } else if (node.hasAttribute(name)) {
          node.removeAttribute(name);
        }
      }
      (node: any).addEventListener(eventName, (value: any), useCapture);
      return;
    }
  }

  trackHostMutation();

  if (name in (node: any)) {
    (node: any)[name] = value;
    return;
  }

  if (value === true) {
    node.setAttribute(name, '');
    return;
  }

  setValueForAttribute(node, name, value);
}
