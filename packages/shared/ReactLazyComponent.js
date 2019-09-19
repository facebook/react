/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import warning from 'shared/warning';

export type Thenable<T, R> = {
  then(resolve: (T) => mixed, reject: (mixed) => mixed): R,
};

export type LazyComponent<T> = {
  $$typeof: Symbol | number,
  _ctor: () => Thenable<{default: T}, mixed>,
  _status: 0 | 1 | 2,
  _result: any,
};

type ResolvedLazyComponent<T> = {
  $$typeof: Symbol | number,
  _ctor: () => Thenable<{default: T}, mixed>,
  _status: 1,
  _result: any,
};

export const Uninitialized = -1;
export const Pending = 0;
export const Resolved = 1;
export const Rejected = 2;

export function refineResolvedLazyComponent<T>(
  lazyComponent: LazyComponent<T>,
): ResolvedLazyComponent<T> | null {
  return lazyComponent._status === Resolved ? lazyComponent._result : null;
}

export function initializeLazyComponentType(
  lazyComponent: LazyComponent<any>,
): void {
  if (lazyComponent._status === Uninitialized) {
    lazyComponent._status = Pending;
    const ctor = lazyComponent._ctor;
    const thenable = ctor();
    lazyComponent._result = thenable;
    thenable.then(
      moduleObject => {
        if (lazyComponent._status === Pending) {
          const defaultExport = moduleObject.default;
          if (__DEV__) {
            if (defaultExport === undefined) {
              warning(
                false,
                'lazy: Expected the result of a dynamic import() call. ' +
                  'Instead received: %s\n\nYour code should look like: \n  ' +
                  "const MyComponent = lazy(() => import('./MyComponent'))",
                moduleObject,
              );
            }
          }
          lazyComponent._status = Resolved;
          lazyComponent._result = defaultExport;
        }
      },
      error => {
        if (lazyComponent._status === Pending) {
          lazyComponent._status = Rejected;
          lazyComponent._result = error;
        }
      },
    );
  }
}
