/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

let is: (x: mixed, y: mixed) => boolean;

if (typeof Object.is === 'function') {
  is = Object.is;
} else {
  // inlined Object.is polyfill to avoid requiring consumers ship their own
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
  is = (x: mixed, y: mixed) => {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      // Added the nonzero y check to make Flow happy, but it is redundant
      return x !== 0 || y !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y; // eslint-disable-line no-self-compare
    }
  };
}

export default is;
