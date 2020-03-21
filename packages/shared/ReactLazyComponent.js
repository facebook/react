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

import type {
  PendingBlockComponent,
  ResolvedBlockComponent,
  RejectedBlockComponent,
  BlockComponent,
} from 'react/src/ReactBlock';

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

export function initializeBlockComponentType<Props, Payload, Data>(
  blockComponent: BlockComponent<Props, Payload, Data>,
): void {
  if (blockComponent._status === Uninitialized) {
    const thenableOrTuple = blockComponent._fn(blockComponent._data);
    if (typeof thenableOrTuple.then !== 'function') {
      let tuple: [any, any] = (thenableOrTuple: any);
      const resolved: ResolvedBlockComponent<
        Props,
        Data,
      > = (blockComponent: any);
      resolved._status = Resolved;
      resolved._data = tuple[0];
      resolved._fn = tuple[1];
      return;
    }
    const thenable = (thenableOrTuple: any);
    // Transition to the next state.
    const pending: PendingBlockComponent<Props, Data> = (blockComponent: any);
    pending._status = Pending;
    pending._data = thenable;
    pending._fn = null;
    thenable.then(
      (tuple: [any, any]) => {
        if (blockComponent._status === Pending) {
          // Transition to the next state.
          const resolved: ResolvedBlockComponent<
            Props,
            Data,
          > = (blockComponent: any);
          resolved._status = Resolved;
          resolved._data = tuple[0];
          resolved._fn = tuple[1];
        }
      },
      error => {
        if (blockComponent._status === Pending) {
          // Transition to the next state.
          const rejected: RejectedBlockComponent = (blockComponent: any);
          rejected._status = Rejected;
          rejected._data = error;
        }
      },
    );
  }
}
