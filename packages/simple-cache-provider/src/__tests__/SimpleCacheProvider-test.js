/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let SimpleCacheProvider;

describe('SimpleCacheProvider', () => {
  beforeEach(() => {
    jest.resetModules();
    SimpleCacheProvider = require('simple-cache-provider');
  });

  it('works', async () => {
    const {createCache, createResource} = SimpleCacheProvider;

    function loadUpperCase(text) {
      return Promise.resolve(text.toUpperCase());
    }
    const readUpperCase = createResource(loadUpperCase);

    const cache = createCache();

    let suspender;
    try {
      readUpperCase(cache, 'hello');
    } catch (v) {
      suspender = v;
    }

    await suspender;
    const result = readUpperCase(cache, 'hello');
    expect(result).toBe('HELLO');
  });
});
