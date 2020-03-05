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

type UninitializedLazyComponent<T> = {
  $$typeof: Symbol | number,
  _status: -1,
  _result: () => Thenable<{default: T, ...} | T, mixed>,
};

type PendingLazyComponent<T> = {
  $$typeof: Symbol | number,
  _status: 0,
  _result: Thenable<{default: T, ...} | T, mixed>,
};

type ResolvedLazyComponent<T> = {
  $$typeof: Symbol | number,
  _status: 1,
  _result: T,
};

type RejectedLazyComponent = {
  $$typeof: Symbol | number,
  _status: 2,
  _result: mixed,
};

export type LazyComponent<T> =
  | UninitializedLazyComponent<T>
  | PendingLazyComponent<T>
  | ResolvedLazyComponent<T>
  | RejectedLazyComponent;

export const Uninitialized = -1;
export const Pending = 0;
export const Resolved = 1;
export const Rejected = 2;

export function refineResolvedLazyComponent<T>(
  lazyComponent: LazyComponent<T>,
): T | null {
  return lazyComponent._status === Resolved ? lazyComponent._result : null;
}

export function initializeLazyComponentType(
  lazyComponent: LazyComponent<any>,
): void {
  if (lazyComponent._status === Uninitialized) {
    const ctor = lazyComponent._result;
    const thenable = ctor();
    // Transition to the next state.
    const pending: PendingLazyComponent<any> = (lazyComponent: any);
    pending._status = Pending;
    pending._result = thenable;
    thenable.then(
      moduleObject => {
        if (lazyComponent._status === Pending) {
          const defaultExport = moduleObject.default;
          if (__DEV__) {
            if (defaultExport === undefined) {
              console.error(
                'lazy: Expected the result of a dynamic import() call. ' +
                  'Instead received: %s\n\nYour code should look like: \n  ' +
                  "const MyComponent = lazy(() => import('./MyComponent'))",
                moduleObject,
              );
            }
          }
          // Transition to the next state.
          const resolved: ResolvedLazyComponent<any> = (lazyComponent: any);
          resolved._status = Resolved;
          resolved._result = defaultExport;
        }
      },
      error => {
        if (lazyComponent._status === Pending) {
          // Transition to the next state.
          const rejected: RejectedLazyComponent = (lazyComponent: any);
          rejected._status = Rejected;
          rejected._result = error;
        }
      },
    );
  }
}
