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

var objFilter = require('objFilter');

describe('objFilter', function() {

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
    var filtered = objFilter(null, function() {});
    expect(filtered).toBe(null);
  });

  it('should return true to create copy', function() {
    var filtered = objFilter(obj, function() {
      return true;
    });
    expect(filtered).not.toBe(obj);
    expect(filtered).toEqual(obj);
  });

  it('should return empty object for a falsey func', function() {
    var filtered = objFilter(obj, function() {
      return false;
    });
    expect(filtered).toEqual({});
  });

  it('should filter based on value', function() {
    var filtered = objFilter(obj, function(value) {
      return value.indexOf('berry') !== -1;
    });
    expect(filtered).toEqual({
      E: 'elderberry',
      H: 'hackberry'
    });
  });

  it('should filter based on key', function() {
    var filtered = objFilter(obj, function(value, key) {
      return (/[AEIOU]/).test(key);
    });
    expect(filtered).toEqual({
      A: 'apple',
      E: 'elderberry'
    });
  });

  it('should filter based on iteration', function() {
    var filtered = objFilter(obj, function(value, key, iteration) {
      return iteration % 2;
    });
    expect(filtered).toEqual({
      B: 'banana',
      D: 'durian',
      F: 'fig',
      H: 'hackberry'
    });
  });

});
