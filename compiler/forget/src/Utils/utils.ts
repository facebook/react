/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Trigger an exhaustivess check in TypeScript and throw at runtime.
 *
 * Example:
 *
 * ```ts
 * enum ErrorCode = {
 *   E0001 = "E0001",
 *   E0002 = "E0002"
 * }
 *
 * switch (code) {
 *   case ErrorCode.E0001:
 *     // ...
 *   default:
 *     assertExhaustive(code, "Unhandled error code");
 * }
 * ```
 */
export function assertExhaustive(_: never, errorMsg: string): never {
  throw new Error(errorMsg);
}

/**
 * Modifies @param array in place, retaining only the items where the predicate returns true.
 */
export function retainWhere<T>(
  array: Array<T>,
  predicate: (item: T) => boolean
) {
  let writeIndex = 0;
  for (let readIndex = 0; readIndex < array.length; readIndex++) {
    const item = array[readIndex];
    if (predicate(item) === true) {
      array[writeIndex++] = item;
    }
  }
  array.length = writeIndex;
}
