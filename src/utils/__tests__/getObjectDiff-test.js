/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @jsx React.DOM
 */

"use strict";

require('mock-modules')
  .dontMock('getObjectDiff');

var getObjectDiff = require('getObjectDiff');

describe('getObjectDiff', function() {
  it('should return the new object if old one is null', () => {
    var b = {a: 1, b: 2};
    expect(getObjectDiff(null, b)).toEqual(b);
  });

  it('should return the first object with null keys if the second one is null',
    () => {
      var a = {a: 1, b: 2};
      var expected = {a: null, b: null};
      expect(getObjectDiff(a, null)).toEqual(expected);

      expect(getObjectDiff(null, null)).toBe(null);
      expect(getObjectDiff(undefined, undefined)).toBe(undefined);
    }
  );

  it('should add the new values correctly', () => {
    var a = {};
    var b = {a: 1, b: 2};
    var expected = {a: 1, b: 2};
    expect(getObjectDiff(a, b)).toEqual(expected);
  });

  it('should remove the old values correctly', () => {
    var a = {a: 1, b: 2};
    var b = {};
    var expected = {a: null, b: null};
    expect(getObjectDiff(a, b)).toEqual(expected);
  });

  it('should update the values correctly', () => {
    var a = {a: 1, b: 2};
    var b = {a: 3, b: 4};
    var expected = {a: 3, b: 4};
    expect(getObjectDiff(a, b)).toEqual(expected);
  });

  it('should not include the values if they are not changed', () => {
    var a = {a: 1, b: 2};
    expect(getObjectDiff(a, a)).toBe(undefined);
  });

  it('should do add/remove/update correctly at the same time', () => {
    var a = {a: 1, b: 2, c: 3, d: 'bla'};
    var b = {b: 3, c: 4, d: 'bla', e: 5};
    var expected = {a: null, b: 3, c: 4, e: 5};
    expect(getObjectDiff(a, b)).toEqual(expected);
  });
});
