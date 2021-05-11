/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Individual util functions.
 */

export function setEq<T>(a: Set<T>, b: Set<T>): boolean {
  return a.size === b.size && [...a].every((v) => b.has(v));
}

export function nullableSetEq<T>(
  a: Set<T> | undefined,
  b: Set<T> | undefined
): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  return a.size === b.size && [...a].every((v) => b.has(v));
}

export function setSubset<T>(a: Set<T>, b: Set<T>): boolean {
  return a.size <= b.size && [...a].every((v) => b.has(v));
}

export function setIntersect<T>(a: Set<T>, b: Set<T>): boolean {
  return [...a].some((v) => b.has(v));
}

export function setFirst<T>(s: Set<T>): T {
  return [...s][0];
}

export function setEmpty<T>(s: Set<T>): boolean {
  return s.size === 0;
}

export function hasOwnProperty<T>(obj: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

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
