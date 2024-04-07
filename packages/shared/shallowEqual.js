/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import is from './objectIs';
import hasOwnProperty from './hasOwnProperty';

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
function shallowEqual(objA: mixed, objB: mixed): boolean {
  if (is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  let aLength = 0;
  let bLength = 0;

  for (const key in objA) {
    aLength += 1;
    if (!hasOwnProperty.call(objB, key) || !is(objA[key], objB[key])) {
      return false;
    }
  }

  for (const _ in objB) {
    bLength += 1;
  }

  return aLength === bLength;
}

export default shallowEqual;
