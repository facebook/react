/**
 * Copyright 2014 Facebook, Inc.
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

require('mock-modules')
  .dontMock('accumulateInto');

var accumulateInto;

describe('accumulateInto', function() {

  beforeEach(function() {
    accumulateInto = require('accumulateInto');
  });

  it('throws if the second item is null', function() {
    expect(function() {
      accumulateInto([], null);
    }).toThrow(
      'Invariant Violation: accumulateInto(...): Accumulated items must not ' +
      'be null or undefined.'
    );
  });

  it('returns the second item if first is null', function() {
    var a = [];
    expect(accumulateInto(null, a)).toBe(a);
  });

  it('merges the second into the first if first item is an array', function() {
    var a = [1, 2];
    var b = [3, 4];
    accumulateInto(a, b);
    expect(a).toEqual([1, 2, 3, 4]);
    expect(b).toEqual([3, 4]);
    var c = [1];
    accumulateInto(c, 2);
    expect(c).toEqual([1, 2]);
  });

  it('returns a new array if first or both items are scalar', function() {
    var a = [2];
    expect(accumulateInto(1, a)).toEqual([1, 2]);
    expect(a).toEqual([2]);
    expect(accumulateInto(1, 2)).toEqual([1, 2]);
  });
});
