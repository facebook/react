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

export function getToStringValue(value: mixed): ToStringValue {
  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'object':
    case 'string':
    case 'undefined':
      return value;
    default:
      // function and symbol are assigned as empty strings
      return '';
  }
}
