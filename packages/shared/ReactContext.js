/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  REACT_PROVIDER_TYPE,
  REACT_CONSUMER_TYPE,
  REACT_ELEMENT_TYPE,
} from 'shared/ReactSymbols';

import type {
  ReactContext,
  ReactConsumer,
  ReactProvider,
  ReactNodeList,
} from 'shared/ReactTypes';

export function createContext<T>(defaultValue: T): ReactContext<T> {
  let providerType;
  let consumerType;

  const context = {
    provide(value: T, children: ReactNodeList, key?: string): ReactProvider<T> {
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type: providerType,
        key: key === null || key === undefined ? null : '' + key,
        ref: null,
        props: {
          value,
          children,
        },
      };
    },
    consume(
      render: (value: T) => ReactNodeList,
      key?: string,
    ): ReactConsumer<T> {
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type: consumerType,
        key: key === null || key === undefined ? null : '' + key,
        ref: null,
        props: {
          render,
          __memoizedValue: null,
        },
      };
    },
    defaultValue,
    lastProvider: null,
  };

  providerType = {
    $$typeof: REACT_PROVIDER_TYPE,
    context,
  };
  consumerType = {
    $$typeof: REACT_CONSUMER_TYPE,
    context,
  };

  return context;
}
