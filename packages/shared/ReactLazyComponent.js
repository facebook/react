/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  PendingLazyComponent,
  ResolvedLazyComponent,
  RejectedLazyComponent,
  LazyComponent,
} from 'react/src/ReactLazy';

import {
  Uninitialized,
  Pending,
  Resolved,
  Rejected,
} from './ReactLazyStatusTags';

export function refineResolvedLazyComponent<T>(
  lazyComponent: LazyComponent<T>,
): T | null {
  return lazyComponent._status === Resolved ? lazyComponent._result : null;
}

export function initializeLazyComponentType(
  lazyComponent: LazyComponent<any>,
): void {
  if (lazyComponent._status === Uninitialized) {
    let ctor = lazyComponent._result;
    if (!ctor) {
      // TODO: Remove this later. THis only exists in case you use an older "react" package.
      ctor = ((lazyComponent: any)._ctor: typeof ctor);
    }
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
                  // Break up imports to avoid accidentally parsing them as dependencies.
                  'const MyComponent = lazy(() => imp' +
                  "ort('./MyComponent'))",
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
