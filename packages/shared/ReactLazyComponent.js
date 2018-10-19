/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Thenable<T, R> = {
  then(resolve: (T) => mixed, reject: (mixed) => mixed): R,
};

export type LazyComponent<T> = {
  $$typeof: Symbol | number,
  _ctor: () => Thenable<T, mixed>,
  _status: 0 | 1 | 2,
  _result: any,
};

type ResolvedLazyComponentThenable<T> = {
  $$typeof: Symbol | number,
  _ctor: () => Thenable<T, mixed>,
  _status: 1,
  _result: any,
};

export const Pending = 0;
export const Resolved = 1;
export const Rejected = 2;

export function getResultFromResolvedLazyComponent<T>(
  lazyComponent: ResolvedLazyComponentThenable<T>,
): T {
  return lazyComponent._result;
}

export function refineResolvedLazyComponent<T>(
  lazyComponent: LazyComponent<T>,
): ResolvedLazyComponentThenable<T> | null {
  return lazyComponent._status === Resolved ? lazyComponent._result : null;
}
