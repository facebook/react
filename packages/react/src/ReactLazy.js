/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_LAZY_TYPE} from 'shared/ReactSymbols';

type Thenable<T, R> = {
  then(resolve: (T) => mixed, reject: (mixed) => mixed): R,
};

export type UninitializedLazyComponent<T> = {
  $$typeof: Symbol | number,
  _status: -1,
  _result: () => Thenable<{default: T, ...} | T, mixed>,
};

export type PendingLazyComponent<T> = {
  $$typeof: Symbol | number,
  _status: 0,
  _result: Thenable<{default: T, ...} | T, mixed>,
};

export type ResolvedLazyComponent<T> = {
  $$typeof: Symbol | number,
  _status: 1,
  _result: T,
};

export type RejectedLazyComponent = {
  $$typeof: Symbol | number,
  _status: 2,
  _result: mixed,
};

export type LazyComponent<T> =
  | UninitializedLazyComponent<T>
  | PendingLazyComponent<T>
  | ResolvedLazyComponent<T>
  | RejectedLazyComponent;

export function lazy<T>(
  ctor: () => Thenable<{default: T, ...} | T, mixed>,
): LazyComponent<T> {
  let lazyType: LazyComponent<T> = {
    $$typeof: REACT_LAZY_TYPE,
    // React uses these fields to store the result.
    _status: -1,
    _result: ctor,
  };

  if (__DEV__) {
    // In production, this would just set it on the object.
    let defaultProps;
    let propTypes;
    // $FlowFixMe
    Object.defineProperties(lazyType, {
      defaultProps: {
        configurable: true,
        get() {
          return defaultProps;
        },
        set(newDefaultProps) {
          console.error(
            'React.lazy(...): It is not supported to assign `defaultProps` to ' +
              'a lazy component import. Either specify them where the component ' +
              'is defined, or create a wrapping component around it.',
          );
          defaultProps = newDefaultProps;
          // Match production behavior more closely:
          // $FlowFixMe
          Object.defineProperty(lazyType, 'defaultProps', {
            enumerable: true,
          });
        },
      },
      propTypes: {
        configurable: true,
        get() {
          return propTypes;
        },
        set(newPropTypes) {
          console.error(
            'React.lazy(...): It is not supported to assign `propTypes` to ' +
              'a lazy component import. Either specify them where the component ' +
              'is defined, or create a wrapping component around it.',
          );
          propTypes = newPropTypes;
          // Match production behavior more closely:
          // $FlowFixMe
          Object.defineProperty(lazyType, 'propTypes', {
            enumerable: true,
          });
        },
      },
    });
  }

  return lazyType;
}
