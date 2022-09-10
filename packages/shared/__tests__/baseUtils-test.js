/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */
'use strict';

describe('test shared utils', () => {
  let shallowEqual;
  beforeEach(() => {
    shallowEqual = require('shared/shallowEqual').default;
  });
  it('shallowEqual basic usage', () => {
    const oldProps = {
      name: 'kiner',
      age: 30,
      favs: null,
      sport: undefined,
    };
    const newProps = {
      name: 'kiner',
      age: 30,
      favs: null,
      sport: undefined,
    };
    expect(shallowEqual(oldProps, newProps)).toBe(true);
    newProps.name = 'kiner-tang';
    expect(shallowEqual(oldProps, newProps)).toBe(false);
    oldProps.name = 'kiner-tang';
    expect(shallowEqual(oldProps, newProps)).toBe(true);
    oldProps.favs = false;
    expect(shallowEqual(oldProps, newProps)).toBe(false);
  });
  it('shallowEqual with sub-object', () => {
    const oldProps = {
      name: 'kiner',
      age: 30,
      favs: {},
      sport: ['football'],
    };
    const newProps = {
      name: 'kiner',
      age: 30,
      favs: {},
      sport: ['football'],
    };
    expect(shallowEqual(oldProps, newProps)).toBe(false);
  });
  it('shallowEqual with same object ref', () => {
    const oldProps = {
      name: 'kiner',
      age: 30,
      favs: {},
      sport: ['football'],
    };
    expect(shallowEqual(oldProps, oldProps)).toBe(true);
  });
  it('shallowEqual with null or not an object', () => {
    const oldProps = {
      name: 'kiner',
      age: 30,
      favs: {},
      sport: ['football'],
    };
    expect(shallowEqual(null, oldProps)).toBe(false);
    expect(shallowEqual('kiner', 'kiner')).toBe(true);
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual(false, false)).toBe(true);
    expect(shallowEqual(false, '')).toBe(false);
  });
});
