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

var mergeMethod = require('mergeMethod');
var mocks = require('mocks');
describe('mergeMethod', function() {
  var spec, mockFunction;

  beforeEach(function() {
    spec = {};
    mockFunction = mocks.getMockFunction();
  });

  it('should add function to spec if named spec is undefined', function() {
    mergeMethod(spec, 'pizza', mockFunction);
    expect(spec.pizza).toBe(mockFunction);
  });

  it('should add function to spec if named spec is null', function() {
    spec.pizza = null;
    mergeMethod(spec, 'pizza', mockFunction);
    expect(spec.pizza).toBe(mockFunction);
  });

  it('should throw if named spec is not a function', function() {
    spec.pizza = 'pasta';
    expect(function() {
      mergeMethod(spec, 'pizza', mockFunction);
    }).toThrow();
  });

  // TODO(brainkim): How do we unit-test behavior which relies on SpecPolicy?
});
