/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_PROVIDER_TYPE, REACT_CONSUMER_TYPE} from 'shared/ReactSymbols';

import type {
  ReactContext,
  ReactConsumer,
  ReactProvider,
  ReactNodeList,
} from 'shared/ReactTypes';

export function createContext<T>(defaultValue: T): ReactContext<T> {
  const context = {
    provide(value: T, children: ReactNodeList, key?: string): ReactProvider<T> {
      return {
        $$typeof: REACT_PROVIDER_TYPE,
        key: key === null || key === undefined ? null : '' + key,
        context, // Recursive
        value,
        children,
      };
    },
    consume(
      render: (value: T) => ReactNodeList,
      key?: string,
    ): ReactConsumer<T> {
      return {
        $$typeof: REACT_CONSUMER_TYPE,
        key: key === null || key === undefined ? null : '' + key,
        context, // Recursive
        memoizedValue: null,
        render,
      };
    },
    defaultValue,
    lastProvider: null,
  };
  return context;
}
