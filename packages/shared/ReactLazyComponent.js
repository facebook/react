/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Thenable<T> = {
  then(resolve: (T) => mixed, reject: (mixed) => mixed): mixed,
  _reactStatus?: 0 | 1 | 2,
  _reactResult: any,
};

type ResolvedThenable<T> = {
  then(resolve: (T) => mixed, reject: (mixed) => mixed): mixed,
  _reactStatus?: 1,
  _reactResult: T,
};

export const Pending = 0;
export const Resolved = 1;
export const Rejected = 2;

export function getResultFromResolvedThenable<T>(
  thenable: ResolvedThenable<T>,
): T {
  return thenable._reactResult;
}

export function refineResolvedThenable<T>(
  thenable: Thenable<T>,
): ResolvedThenable<T> | null {
  return thenable._reactStatus === Resolved ? thenable._reactResult : null;
}
