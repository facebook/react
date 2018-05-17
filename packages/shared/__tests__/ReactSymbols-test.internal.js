/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */
'use strict';

describe('ReactSymbols', () => {
  beforeEach(() => jest.resetModules());

  const expectToBeUnique = keyValuePair => {
    const set = new Set();
    keyValuePair.forEach(([key, value]) => {
      if (set.has(value)) {
        throw Error(`Value ${value.toString()} for ${key} is not unique`);
      }
      set.add(value);
    });
  };

  it('Symbol values should be unique', () => {
    expectToBeUnique(Object.entries(require('shared/ReactSymbols')));
  });

  it('numeric values should be unique', () => {
    global.Symbol.for = null;
    expectToBeUnique(Object.entries(require('shared/ReactSymbols')));
  });
});
