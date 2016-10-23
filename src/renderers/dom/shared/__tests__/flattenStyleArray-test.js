/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var flattenStyleArray = require('flattenStyleArray');

describe('flattenStyleArray', () => {
  it('should flatten an array of objects', () => {
    expect(flattenStyleArray([
      {foo: 1},
      {bar: 2},
    ])).toEqual({foo: 1, bar: 2});
  });

  it('should flatten nested arrays of objects', () => {
    expect(flattenStyleArray([
      {foo: 1},
      {bar: 2},
      [{foo: 2, bar: 3}, {bar: 4}],
    ])).toEqual({foo: 2, bar: 4});
  });

  it('should ignore null, false, or undefined values when flattening', () => {
    expect(flattenStyleArray([
      {foo: 1},
      undefined,
      false,
      {bar: 2},
      null,
    ])).toEqual({foo: 1, bar: 2});
  });

  it('should handle deeply nested arrays', () => {
    expect(flattenStyleArray([
      {foo: 1},
      {bar: 2},
      [[[[[
        {foo: 2},
        [[[[[
          {foo: 3},
          [[[[[
            {bar: 3},
            [[[[[
              {bar: 4},
            ]]]]],
          ]]]]],
        ]]]]],
      ]]]]],
    ])).toEqual({foo: 3, bar: 4});
  });
});
