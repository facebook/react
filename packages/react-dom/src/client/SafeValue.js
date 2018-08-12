/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export opaque type SafeValue = boolean | number | Object | string | null | void;

// Flow does not allow string concatenation of most non-string types. To work
// around this limitation, we use an opaque type that can only be obtained by
// passing the value through getSafeValue first.
export function safeValueToString(value: SafeValue): string {
  return '' + (value: any);
}

export function getSafeValue(value: mixed): SafeValue {
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
