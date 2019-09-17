/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableTrustedTypesIntegration} from 'shared/ReactFeatureFlags';

export opaque type ToStringValue =
  | boolean
  | number
  | Object
  | string
  | null
  | void;

// Flow does not allow string concatenation of most non-string types. To work
// around this limitation, we use an opaque type that can only be obtained by
// passing the value through getToStringValue first.
export function toString(value: ToStringValue): string {
  return '' + (value: any);
}

export function getToStringValue(value: mixed): ToStringValue {
  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'object':
    case 'string':
    case 'undefined':
      return value;
    default:
      // function, symbol are assigned as empty strings
      return '';
  }
}

/** Trusted value is a wrapper for "safe" values which can be assigned to DOM execution sinks. */
export opaque type TrustedValue: {toString(): string, valueOf(): string} = {
  toString(): string,
  valueOf(): string,
};

/**
 * We allow passing objects with toString method as element attributes or in dangerouslySetInnerHTML
 * and we do validations that the value is safe. Once we do validation we want to use the validated
 * value instead of the object (because object.toString may return something else on next call).
 *
 * If application uses Trusted Types we don't stringify trusted values, but preserve them as objects.
 */
export let toStringOrTrustedType: any => string | TrustedValue = toString;
if (enableTrustedTypesIntegration && typeof trustedTypes !== 'undefined') {
  const isHTML = trustedTypes.isHTML;
  const isScript = trustedTypes.isScript;
  const isScriptURL = trustedTypes.isScriptURL;
  // TrustedURLs are deprecated and will be removed soon: https://github.com/WICG/trusted-types/pull/204
  const isURL = trustedTypes.isURL ? trustedTypes.isURL : value => false;
  toStringOrTrustedType = value => {
    if (
      typeof value === 'object' &&
      (isHTML(value) || isScript(value) || isScriptURL(value) || isURL(value))
    ) {
      // Pass Trusted Types through.
      return value;
    }
    return toString(value);
  };
}
