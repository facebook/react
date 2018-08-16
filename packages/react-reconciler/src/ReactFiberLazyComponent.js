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

export function readLazyComponentType<T>(thenable: Thenable<T>): T {
  const status = thenable._reactStatus;
  switch (status) {
    case Resolved:
      const Component: T = thenable._reactResult;
      return Component;
    case Rejected:
      throw thenable._reactResult;
    case Pending:
      throw thenable;
    default: {
      thenable._reactStatus = Pending;
      thenable.then(
        resolvedValue => {
          if (thenable._reactStatus === Pending) {
            thenable._reactStatus = Resolved;
            // If the default value is not empty, assume it's the result of
            // an async import() and use that. Otherwise, use resolved value.
            const defaultExport = (resolvedValue: any).default;
            thenable._reactResult =
              defaultExport !== null && defaultExport !== undefined
                ? defaultExport
                : resolvedValue;
          }
        },
        error => {
          if (thenable._reactStatus === Pending) {
            thenable._reactStatus = Rejected;
            thenable._reactResult = error;
          }
        },
      );
      throw thenable;
    }
  }
}
