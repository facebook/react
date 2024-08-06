/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/traverse';

/*
 * Trigger an exhaustivess check in TypeScript and throw at runtime.
 *
 * Example:
 *
 * ```ts
 * enum ErrorCode = {
 *    E0001 = "E0001",
 *    E0002 = "E0002"
 * }
 *
 * switch (code) {
 *    case ErrorCode.E0001:
 *      // ...
 *    default:
 *      assertExhaustive(code, "Unhandled error code");
 * }
 * ```
 */
export function assertExhaustive(_: never, errorMsg: string): never {
  throw new Error(errorMsg);
}

// Modifies @param array in place, retaining only the items where the predicate returns true.
export function retainWhere<T>(
  array: Array<T>,
  predicate: (item: T) => boolean,
): void {
  let writeIndex = 0;
  for (let readIndex = 0; readIndex < array.length; readIndex++) {
    const item = array[readIndex];
    if (predicate(item) === true) {
      array[writeIndex++] = item;
    }
  }
  array.length = writeIndex;
}

export function retainWhere_Set<T>(
  items: Set<T>,
  predicate: (item: T) => boolean,
): void {
  for (const item of items) {
    if (!predicate(item)) {
      items.delete(item);
    }
  }
}

export function getOrInsertWith<U, V>(
  m: Map<U, V>,
  key: U,
  makeDefault: () => V,
): V {
  if (m.has(key)) {
    return m.get(key) as V;
  } else {
    const defaultValue = makeDefault();
    m.set(key, defaultValue);
    return defaultValue;
  }
}

export function getOrInsertDefault<U, V>(
  m: Map<U, V>,
  key: U,
  defaultValue: V,
): V {
  if (m.has(key)) {
    return m.get(key) as V;
  } else {
    m.set(key, defaultValue);
    return defaultValue;
  }
}

export function Set_union<T>(a: Set<T>, b: Set<T>): Set<T> {
  const union = new Set<T>();
  for (const item of a) {
    if (b.has(item)) {
      union.add(item);
    }
  }
  return union;
}

export function Iterable_some<T>(
  iter: Iterable<T>,
  pred: (item: T) => boolean,
): boolean {
  for (const item of iter) {
    if (pred(item)) {
      return true;
    }
  }
  return false;
}

export function nonNull<T extends NonNullable<U>, U>(
  value: T | null | undefined,
): value is T {
  return value != null;
}

export function hasNode<T>(
  input: NodePath<T | null | undefined>,
): input is NodePath<NonNullable<T>> {
  /*
   * Internal babel is on an older version that does not have hasNode (v7.17)
   * See https://github.com/babel/babel/pull/13940/files for impl
   * https://github.com/babel/babel/blob/5ebab544af2f1c6fc6abdaae6f4e5426975c9a16/packages/babel-traverse/src/path/index.ts#L128-L130
   */
  return input.node != null;
}

export function hasOwnProperty<T>(
  obj: T,
  key: string | number | symbol,
): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
