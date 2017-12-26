/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const invertObject = require('../invertObject');

const objectValues = target => Object.keys(target).map(key => target[key]);

describe('invertObject', () => {
  it('should return an empty object for an empty input', () => {
    expect(invertObject({})).toEqual({});
  });

  it('should invert key-values', () => {
    expect(
      invertObject({
        a: '3',
        b: '4',
      })
    ).toEqual({
      3: 'a',
      4: 'b',
    });
  });

  it("should take the last value when there're duplications in vals", () => {
    expect(
      invertObject({
        a: '3',
        b: '4',
        c: '3',
      })
    ).toEqual({
      4: 'b',
      3: 'c',
    });
  });

  it('should preserve the original order', () => {
    expect(
      Object.keys(
        invertObject({
          a: '3',
          b: '4',
          c: '3',
        })
      )
    ).toEqual(['3', '4']);

    expect(
      objectValues(
        invertObject({
          a: '3',
          b: '4',
          c: '3',
        })
      )
    ).toEqual(['c', 'b']);
  });
});
