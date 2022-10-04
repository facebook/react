/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

const base = Object.create(Object.prototype, {
  enumerableStringBase: {
    value: 1,
    writable: true,
    enumerable: true,
    configurable: true,
  },
  [Symbol('enumerableSymbolBase')]: {
    value: 1,
    writable: true,
    enumerable: true,
    configurable: true,
  },
  nonEnumerableStringBase: {
    value: 1,
    writable: true,
    enumerable: false,
    configurable: true,
  },
  [Symbol('nonEnumerableSymbolBase')]: {
    value: 1,
    writable: true,
    enumerable: false,
    configurable: true,
  },
});

const data = Object.create(base, {
  enumerableString: {
    value: 2,
    writable: true,
    enumerable: true,
    configurable: true,
  },
  nonEnumerableString: {
    value: 3,
    writable: true,
    enumerable: false,
    configurable: true,
  },
  [123]: {
    value: 3,
    writable: true,
    enumerable: true,
    configurable: true,
  },
  [Symbol('nonEnumerableSymbol')]: {
    value: 2,
    writable: true,
    enumerable: false,
    configurable: true,
  },
  [Symbol('enumerableSymbol')]: {
    value: 3,
    writable: true,
    enumerable: true,
    configurable: true,
  },
});

export default function SymbolKeys(): React.Node {
  return <ChildComponent data={data} />;
}

function ChildComponent(props: any) {
  return null;
}
