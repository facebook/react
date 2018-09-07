/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
    const UpperCase = createResource(loadUpperCase);
    const cache = createCache();

    let suspender;
    try {
      UpperCase.read(cache, 'hello');
    } catch (v) {
      suspender = v;
    }

    await suspender;
    const result = UpperCase.read(cache, 'hello');
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
    const UpperCase = createResource(loadUpperCase);
    const cache = createCache();

    let suspender;
    try {
      UpperCase.read(cache, 'hello');
    } catch (v) {
      suspender = v;
    }

    let error;
    try {
      await suspender;
    } catch (e) {
      error = e;
    }
    expect(() => UpperCase.read(cache, 'hello')).toThrow(error);
    expect(error.message).toBe('oh no');

    // On a subsequent read, it should still throw.
    try {
      UpperCase.read(cache, 'hello');
    } catch (v) {
      suspender = v;
    }
    await suspender;
    expect(() => UpperCase.read(cache, 'hello')).toThrow(error);
    expect(error.message).toBe('oh no');
  });

  it('can preload data ahead of time', async () => {
    const {createCache, createResource} = SimpleCacheProvider;

    function loadUpperCase(text) {
      return Promise.resolve(text.toUpperCase());
    }
    const UpperCase = createResource(loadUpperCase);
    const cache = createCache();

    UpperCase.preload(cache, 'hello');
    // Wait for next tick
    await Promise.resolve();
    const result = UpperCase.read(cache, 'hello');
    expect(result).toBe('HELLO');
  });

  it('does not throw if preloaded promise rejects', async () => {
    const {createCache, createResource} = SimpleCacheProvider;

    function loadUpperCase(text) {
      return Promise.reject(new Error('uh oh'));
    }
    const UpperCase = createResource(loadUpperCase);
    const cache = createCache();

    UpperCase.preload(cache, 'hello');
    // Wait for next tick
    await Promise.resolve();

    expect(() => UpperCase.read(cache, 'hello')).toThrow('uh oh');
  });

  it('accepts custom hash function', async () => {
    const {createCache, createResource} = SimpleCacheProvider;

    function loadSum([a, b]) {
      return Promise.resolve(a + b);
    }
    function hash([a, b]) {
      return `${a + b}`;
    }
    const Sum = createResource(loadSum, hash);
    const cache = createCache();

    Sum.preload(cache, [5, 5]);
    Sum.preload(cache, [1, 2]);
    await Promise.resolve();

    expect(Sum.read(cache, [5, 5])).toEqual(10);
    expect(Sum.read(cache, [1, 2])).toEqual(3);
    // The fact that the next line returns synchronously and doesn't throw, even
    // though [3, 7] was not preloaded, proves that the hashing function works.
    expect(Sum.read(cache, [3, 7])).toEqual(10);
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
      expect(fn).toWarnDev(
        [
          'Invalid resourceType: Expected a symbol, object, or function, but ' +
            'instead received: foo. Strings and numbers are not permitted as ' +
            'resource types.',
          'Invalid resourceType: Expected a symbol, object, or function, but ' +
            'instead received: 123. Strings and numbers are not permitted as ' +
            'resource types.',
        ],
        {withoutStack: true},
      );
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

    const Sum = createResource(loadSum);
    const cache = createCache();

    function fn() {
      Sum.preload(cache, [5, 5]);
    }

    if (__DEV__) {
      expect(fn).toWarnDev(
        [
          'preload: Invalid key type. Expected a string, number, symbol, or ' +
            'boolean, but instead received: 5,5\n\n' +
            'To use non-primitive values as keys, you must pass a hash ' +
            'function as the second argument to createResource().',
        ],
        {withoutStack: true},
      );
    } else {
      fn();
    }
  });

  it('stays within maximum capacity by evicting the least recently used record', async () => {
    const {createCache, createResource} = SimpleCacheProvider;

    function loadIntegerString(int) {
      return Promise.resolve(int + '');
    }
    const IntegerStringResource = createResource(loadIntegerString);
    const cache = createCache();

    // TODO: This is hard-coded to a maximum size of 500. Make this configurable
    // per resource.
    for (let n = 1; n <= 500; n++) {
      IntegerStringResource.preload(cache, n);
    }

    // Access 1, 2, and 3 again. The least recently used integer is now 4.
    IntegerStringResource.preload(cache, 3);
    IntegerStringResource.preload(cache, 2);
    IntegerStringResource.preload(cache, 1);

    // Evict older integers from the cache by adding new ones.
    IntegerStringResource.preload(cache, 501);
    IntegerStringResource.preload(cache, 502);
    IntegerStringResource.preload(cache, 503);

    await Promise.resolve();

    // 1, 2, and 3 should be in the cache. 4, 5, and 6 should have been evicted.
    expect(IntegerStringResource.read(cache, 1)).toEqual('1');
    expect(IntegerStringResource.read(cache, 2)).toEqual('2');
    expect(IntegerStringResource.read(cache, 3)).toEqual('3');

    expect(() => IntegerStringResource.read(cache, 4)).toThrow(Promise);
    expect(() => IntegerStringResource.read(cache, 5)).toThrow(Promise);
    expect(() => IntegerStringResource.read(cache, 6)).toThrow(Promise);
  });
});
