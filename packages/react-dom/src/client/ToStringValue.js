/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

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
 *
 * Trusted Types undergo a change where window.TrustedTypes was renamed to window.trustedTypes
 * (https://github.com/WICG/trusted-types/pull/205).
 */
function isTrustedTypesValue(value: any): boolean {
  // $FlowExpectedError - TrustedTypes are defined only in some browsers or with polyfill
  if (typeof TrustedTypes !== 'undefined') {
    return (
      TrustedTypes.isHTML(value) ||
      TrustedTypes.isScript(value) ||
      TrustedTypes.isScriptURL(value)
    );
    // $FlowExpectedError - trustedTypes are defined only in some browsers or with polyfill
  } else if (typeof trustedTypes !== 'undefined') {
    return (
      trustedTypes.isHTML(value) ||
      trustedTypes.isScript(value) ||
      trustedTypes.isScriptURL(value)
    );
  } else {
    return false;
  }
}

/** Trusted value is a wrapper for "safe" values which can be assigned to DOM execution sinks. */
export opaque type TrustedValue: {toString(): string} = {toString(): string};

/**
 * We allow passing objects with toString method as element attributes or in dangerouslySetInnerHTML
 * and we do validations that the value is safe. Once we do validation we want to use the validated
 * value instead of the object (because object.toString may return something else on next call).
 *
 * If application uses Trusted Types we don't stringify trusted values, but preserve them as objects.
 */
export function trustedTypesAwareToString(value: any): string | TrustedValue {
  // fast-path string values as it's most frequent usage of the function
  if (typeof value !== 'string' && isTrustedTypesValue(value)) {
    return value;
  } else {
    return '' + value;
  }
}
