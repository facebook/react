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

/**
 * Returns true only if Trusted Types are available in global object and the value is a trusted type.
 */
let isTrustedTypesValue: (value: any) => boolean;
// $FlowExpectedError - TrustedTypes are defined only in some browsers or with polyfill
if (enableTrustedTypesIntegration && typeof trustedTypes !== 'undefined') {
  isTrustedTypesValue = (value: any) =>
    trustedTypes.isHTML(value) ||
    trustedTypes.isScript(value) ||
    trustedTypes.isScriptURL(value) ||
    // TrustedURLs are deprecated and will be removed soon: https://github.com/WICG/trusted-types/pull/204
    (trustedTypes.isURL && trustedTypes.isURL(value));
} else {
  isTrustedTypesValue = () => false;
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
export function toStringOrTrustedType(value: any): string | TrustedValue {
  if (
    enableTrustedTypesIntegration &&
    // fast-path string values as it's most frequent usage of the function
    typeof value !== 'string' &&
    isTrustedTypesValue(value)
  ) {
    return value;
  } else {
    return '' + value;
  }
}
