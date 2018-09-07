/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type Thenable<T, R> = {
  then(resolve: (T) => mixed, reject: (mixed) => mixed): R,
};

export function lazy<T, R>(ctor: () => Thenable<T, R>) {
  let thenable = null;
  return {
    then(resolve, reject) {
      if (thenable === null) {
        // Lazily create thenable by wrapping in an extra thenable.
        thenable = ctor();
        ctor = null;
      }
      return thenable.then(resolve, reject);
    },
    // React uses these fields to store the result.
    _reactStatus: -1,
    _reactResult: null,
  };
}
