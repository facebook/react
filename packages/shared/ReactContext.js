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
  REACT_CONTEXT_TYPE,
  REACT_ELEMENT_TYPE,
} from 'shared/ReactSymbols';

import type {
  ReactContext,
  ReactConsumer,
  ReactProvider,
  ReactNodeList,
} from 'shared/ReactTypes';

import warning from 'fbjs/lib/warning';

export function createContext<T>(
  defaultValue: T,
  calculateChangedBits: ?(a: T, b: T) => number,
): ReactContext<T> {
  let providerType;

  if (calculateChangedBits === undefined) {
    calculateChangedBits = null;
  } else {
    if (__DEV__) {
      warning(
        calculateChangedBits === null ||
          typeof calculateChangedBits === 'function',
        'createContext: Expected the optional second argument to be a ' +
          'function. Instead received: %s',
        calculateChangedBits,
      );
    }
  }

  const context = {
    $$typeof: REACT_CONTEXT_TYPE,
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
      bits?: number,
      key?: string,
    ): ReactConsumer<T> {
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type: context,
        key: key === null || key === undefined ? null : '' + key,
        ref: null,
        props: {
          bits,
          render,
        },
      };
    },
    calculateChangedBits,
    defaultValue,
    currentValue: defaultValue,
    changedBits: 0,
  };

  providerType = {
    $$typeof: REACT_PROVIDER_TYPE,
    context,
  };

  return context;
}
