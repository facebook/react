/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {LazyComponent, Thenable} from 'shared/ReactLazyComponent';

import {Resolved, Rejected, Pending} from 'shared/ReactLazyComponent';
import warning from 'shared/warning';

export function resolveDefaultProps(Component: any, baseProps: Object): Object {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = Object.assign({}, baseProps);
    const defaultProps = Component.defaultProps;
    for (let propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
    return props;
  }
  return baseProps;
}

export function readLazyComponentType<T>(lazyComponent: LazyComponent<T>): T {
  const status = lazyComponent._status;
  const result = lazyComponent._result;
  switch (status) {
    case Resolved: {
      const Component: T = result;
      return Component;
    }
    case Rejected: {
      const error: mixed = result;
      throw error;
    }
    case Pending: {
      const thenable: Thenable<T, mixed> = result;
      throw thenable;
    }
    default: {
      lazyComponent._status = Pending;
      const ctor = lazyComponent._ctor;
      const thenable = ctor();
      thenable.then(
        resolvedComponent => {
          if (lazyComponent._status === Pending) {
            if (resolvedComponent.default) {
              resolvedComponent = resolvedComponent.default;
            }
            if (__DEV__) {
              if (resolvedComponent === undefined) {
                warning(
                  false,
                  'lazy: Expected a promise that resolves to a React component. ' +
                    'Instead received: %s\n\nYour code should look like: \n  ' +
                    "const MyComponent = lazy(() => import('./MyComponent'))",
                  resolvedComponent,
                );
              }
            }
            lazyComponent._status = Resolved;
            lazyComponent._result = resolvedComponent;
          }
        },
        error => {
          if (lazyComponent._status === Pending) {
            lazyComponent._status = Rejected;
            lazyComponent._result = error;
          }
        },
      );
      lazyComponent._result = thenable;
      throw thenable;
    }
  }
}
