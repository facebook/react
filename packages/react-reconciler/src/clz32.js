/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// TODO: This is pretty well supported by browsers. Maybe we can drop it.

export const clz32: (x: number) => number = Math.clz32
  ? Math.clz32
  : clz32Fallback;

// Count leading zeros.
// Based on:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
const log = Math.log;
const LN2 = Math.LN2;
function clz32Fallback(x: number): number {
  const asUint = x >>> 0;
  if (asUint === 0) {
    return 32;
  }
  return (31 - ((log(asUint) / LN2) | 0)) | 0;
}
