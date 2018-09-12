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
export function toString(value: ?ToStringValue): string {
  return value == null ? '' : '' + (value: any);
}

export function getToStringValue(value: mixed): ToStringValue {
  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'undefined':
    case 'object':
    case 'string':
      return value;
    default:
      // null, undefined, function, symbol are assigned as empty strings
      return '';
  }
}
