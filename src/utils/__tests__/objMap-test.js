/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @emails react-core
 */

"use strict";

var objMap = require('objMap');

describe('objMap', function() {

  var obj = {
    A: 'apple',
    B: 'banana',
    C: 'coconut',
    D: 'durian',
    E: 'elderberry',
    F: 'fig',
    G: 'guava',
    H: 'hackberry'
  };

  it('should accept null', function() {
    var mapped = objMap(null, function() {});
    expect(mapped).toBe(null);
  });

  it('should return value to create copy', function() {
    var mapped = objMap(obj, function(value) {
      return value;
    });
    expect(mapped).not.toBe(obj);
    expect(mapped).toEqual(obj);
  });

  it('should always retain keys', function() {
    var mapped = objMap(obj, function() {
      return null;
    });
    expect(mapped).toEqual({
      A: null,
      B: null,
      C: null,
      D: null,
      E: null,
      F: null,
      G: null,
      H: null
    });
  });

  it('should map values', function() {
    var mapped = objMap(obj, function (value) {
      return value.toUpperCase();
    });
    expect(mapped).toEqual({
      A: 'APPLE',
      B: 'BANANA',
      C: 'COCONUT',
      D: 'DURIAN',
      E: 'ELDERBERRY',
      F: 'FIG',
      G: 'GUAVA',
      H: 'HACKBERRY'
    });
  });

  it('should map keys', function() {
    var mapped = objMap(obj, function (value, key) {
      return key;
    });
    expect(mapped).toEqual({
      A: 'A',
      B: 'B',
      C: 'C',
      D: 'D',
      E: 'E',
      F: 'F',
      G: 'G',
      H: 'H'
    });
  });

  it('should map iterations', function() {
    var mapped = objMap(obj, function (value, key, iteration) {
      return iteration;
    });
    expect(mapped).toEqual({
      A: 0,
      B: 1,
      C: 2,
      D: 3,
      E: 4,
      F: 5,
      G: 6,
      H: 7
    });
  });

});
