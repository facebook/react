/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var invertObject = require('../invertObject');

var objectValues = (target) => Object.keys(target).map((key) => target[key]);

describe('invertObject', () => {
  it('should return an empty object for an empty input', () => {
    expect(invertObject({})).toEqual({});
  });

  it('should invert key-values', () => {
    expect(invertObject({
      a: '3',
      b: '4',
    })).toEqual({
      3: 'a',
      4: 'b',
    });
  });

  it('should take the last value when there\'re duplications in vals', () => {
    expect(invertObject({
      a: '3',
      b: '4',
      c: '3',
    })).toEqual({
      4: 'b',
      3: 'c',
    });
  });

  it('should preserve the original order', () => {
    expect(Object.keys(invertObject({
      a: '3',
      b: '4',
      c: '3',
    }))).toEqual(['3', '4']);

    expect(objectValues(invertObject({
      a: '3',
      b: '4',
      c: '3',
    }))).toEqual(['c', 'b']);
  });
});
