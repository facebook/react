/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TrustedValue} from './ToStringValue';

/**
 * Set attribute for a node. The attribute value can be either string or
 * Trusted value (if application uses Trusted Types).
 */
export function setAttribute(
  node: Element,
  attributeName: string,
  attributeValue: string | TrustedValue,
) {
  node.setAttribute(attributeName, (attributeValue: any));
}

/**
 * Set attribute with namespace for a node. The attribute value can be either string or
 * Trusted value (if application uses Trusted Types).
 */
export function setAttributeNS(
  node: Element,
  attributeNamespace: string,
  attributeName: string,
  attributeValue: string | TrustedValue,
) {
  node.setAttributeNS(attributeNamespace, attributeName, (attributeValue: any));
}
