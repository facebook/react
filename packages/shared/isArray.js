/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

declare function isArray(a: mixed): boolean %checks(Array.isArray(a));

const isArrayImpl = Array.isArray;

// eslint-disable-next-line no-redeclare
function isArray(a: mixed): boolean {
  return isArrayImpl(a);
}

export default isArray;
