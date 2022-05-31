/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */
'use strict';

describe('ReactSymbols', () => {
  beforeEach(() => jest.resetModules());

  const expectToBeUnique = keyValuePairs => {
    const map = new Map();
    keyValuePairs.forEach(([key, value]) => {
      if (map.has(value)) {
        throw Error(
          `${key} value ${value.toString()} is the same as ${map.get(value)}.`,
        );
      }
      map.set(value, key);
    });
  };

  it('Symbol values should be unique', () => {
    expectToBeUnique(Object.entries(require('shared/ReactSymbols')));
  });

  // @gate enableSymbolFallbackForWWW
  it('numeric values should be unique', () => {
    const originalSymbolFor = global.Symbol.for;
    global.Symbol.for = null;
    try {
      const entries = Object.entries(require('shared/ReactSymbols.www')).filter(
        // REACT_ASYNC_MODE_TYPE and REACT_CONCURRENT_MODE_TYPE have the same numeric value
        // for legacy backwards compatibility
        ([key]) => key !== 'REACT_ASYNC_MODE_TYPE',
      );
      expectToBeUnique(entries);
    } finally {
      global.Symbol.for = originalSymbolFor;
    }
  });
});
