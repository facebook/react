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

  it('throws a promise if the requested value is not in the cache', async () => {
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

  it('throws an error on the subsequent read if the promise is rejected', async () => {
    const {createCache, createResource} = SimpleCacheProvider;

    let shouldFail = true;
    function loadUpperCase(text) {
      if (shouldFail) {
        // Rejects on the first try
        shouldFail = false;
        return Promise.reject(new Error('oh no'));
      } else {
        // Succeeds the second time
        return Promise.resolve(text.toUpperCase());
      }
    }
    const readUpperCase = createResource(loadUpperCase);
    const cache = createCache();

    let suspender;
    try {
      readUpperCase(cache, 'hello');
    } catch (v) {
      suspender = v;
    }

    let error;
    try {
      await suspender;
    } catch (e) {
      error = e;
    }
    expect(() => readUpperCase(cache, 'hello')).toThrow(error);
    expect(error.message).toBe('oh no');

    // On a subsequent read, it should still throw.
    try {
      readUpperCase(cache, 'hello');
    } catch (v) {
      suspender = v;
    }
    await suspender;
    expect(() => readUpperCase(cache, 'hello')).toThrow(error);
    expect(error.message).toBe('oh no');
  });

  it('can preload data ahead of time', async () => {
    const {createCache, createResource} = SimpleCacheProvider;

    function loadUpperCase(text) {
      return Promise.resolve(text.toUpperCase());
    }
    const readUpperCase = createResource(loadUpperCase);
    const cache = createCache();

    readUpperCase.preload(cache, 'hello');
    // Wait for next tick
    await Promise.resolve();
    const result = readUpperCase(cache, 'hello');
    expect(result).toBe('HELLO');
  });

  it('does not throw if preloaded promise rejects', async () => {
    const {createCache, createResource} = SimpleCacheProvider;

    function loadUpperCase(text) {
      return Promise.reject(new Error('uh oh'));
    }
    const readUpperCase = createResource(loadUpperCase);
    const cache = createCache();

    readUpperCase.preload(cache, 'hello');
    // Wait for next tick
    await Promise.resolve();

    expect(() => readUpperCase(cache, 'hello')).toThrow('uh oh');
  });

  it('accepts custom hash function', async () => {
    const {createCache, createResource} = SimpleCacheProvider;

    function loadSum([a, b]) {
      return Promise.resolve(a + b);
    }
    function hash([a, b]) {
      return `${a + b}`;
    }
    const readSum = createResource(loadSum, hash);
    const cache = createCache();

    readSum.preload(cache, [5, 5]);
    readSum.preload(cache, [1, 2]);
    await Promise.resolve();

    expect(readSum(cache, [5, 5])).toEqual(10);
    expect(readSum(cache, [1, 2])).toEqual(3);
    // The fact that the next line returns synchronously and doesn't throw, even
    // though [3, 7] was not preloaded, proves that the hashing function works.
    expect(readSum(cache, [3, 7])).toEqual(10);
  });

  it('warns if resourceType is a string or number', () => {
    const {createCache} = SimpleCacheProvider;

    spyOnDev(console, 'error');
    const cache = createCache();

    function fn() {
      cache.preload('foo', 'uppercaseA', () => Promise.resolve('A'));
      cache.preload(123, 'productOf9And2', () => Promise.resolve(18));
    }

    if (__DEV__) {
      expect(fn).toWarnDev([
        'Invalid resourceType: Expected a symbol, object, or function, but ' +
          'instead received: foo. Strings and numbers are not permitted as ' +
          'resource types.',
        'Invalid resourceType: Expected a symbol, object, or function, but ' +
          'instead received: 123. Strings and numbers are not permitted as ' +
          'resource types.',
      ]);
    } else {
      fn();
    }
  });

  it('warns if non-primitive key is passed to a resource without a hash function', () => {
    const {createCache, createResource} = SimpleCacheProvider;

    spyOnDev(console, 'error');

    function loadSum([a, b]) {
      return Promise.resolve(a + b);
    }

    const readSum = createResource(loadSum);
    const cache = createCache();

    function fn() {
      readSum.preload(cache, [5, 5]);
    }

    if (__DEV__) {
      expect(fn).toWarnDev([
        'preload: Invalid key type. Expected a string, number, symbol, or ' +
          'boolean, but instead received: 5,5\n\n' +
          'To use non-primitive values as keys, you must pass a hash ' +
          'function as the second argument to createResource().',
      ]);
    } else {
      fn();
    }
  });
});
