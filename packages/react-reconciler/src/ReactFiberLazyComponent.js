/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {LazyComponent} from 'shared/ReactLazyComponent';

import {Resolved, Rejected, Pending} from 'shared/ReactLazyComponent';

export function readLazyComponentType<T>(lazyComponent: LazyComponent<T>): T {
  const status = lazyComponent._status;
  switch (status) {
    case Resolved:
      const Component: T = lazyComponent._result;
      return Component;
    case Rejected:
      throw lazyComponent._result;
    case Pending:
      throw lazyComponent;
    default: {
      lazyComponent._status = Pending;
      const ctor = lazyComponent._ctor;
      const thenable = ctor();
      thenable.then(
        resolvedValue => {
          if (lazyComponent._status === Pending) {
            lazyComponent._status = Resolved;
            if (typeof resolvedValue === 'object' && resolvedValue !== null) {
              // If the `default` property is not empty, assume it's the result
              // of an async import() and use that. Otherwise, use the
              // resolved value itself.
              const defaultExport = (resolvedValue: any).default;
              resolvedValue =
                defaultExport !== undefined && defaultExport !== null
                  ? defaultExport
                  : resolvedValue;
            } else {
              resolvedValue = resolvedValue;
            }
            lazyComponent._result = resolvedValue;
          }
        },
        error => {
          if (lazyComponent._status === Pending) {
            lazyComponent._status = Rejected;
            lazyComponent._result = error;
          }
        },
      );
      throw thenable;
    }
  }
}
