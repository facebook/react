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
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var Props = require('ReactPropTypes');

function typeCheck(declaration, value) {
  var props = {};
  if (arguments.length > 1) {
    props.testProp = value;
  }
  return declaration.bind(null, props, 'testProp', 'testComponent');
}

describe('Primitive Types', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
  });

  it("should throw for invalid strings", function() {
    expect(typeCheck(Props.string, [])).toThrow(
      'Invariant Violation: Invalid prop `testProp` of type `array` ' +
      'supplied to `testComponent`, expected `string`.'
    );
    expect(typeCheck(Props.string, false)).toThrow(
      'Invariant Violation: Invalid prop `testProp` of type `boolean` ' +
      'supplied to `testComponent`, expected `string`.'
    );
    expect(typeCheck(Props.string, 1)).toThrow(
      'Invariant Violation: Invalid prop `testProp` of type `number` ' +
      'supplied to `testComponent`, expected `string`.'
    );
    expect(typeCheck(Props.string, {})).toThrow(
      'Invariant Violation: Invalid prop `testProp` of type `object` ' +
      'supplied to `testComponent`, expected `string`.'
    );
  });

  it("should not throw for valid values", function() {
    expect(typeCheck(Props.array, [])).not.toThrow();
    expect(typeCheck(Props.bool, false)).not.toThrow();
    expect(typeCheck(Props.func, function() {})).not.toThrow();
    expect(typeCheck(Props.number, 0)).not.toThrow();
    expect(typeCheck(Props.object, {})).not.toThrow();
    expect(typeCheck(Props.string, '')).not.toThrow();
  });

  it("should be implicitly optional and not throw without values", function() {
    expect(typeCheck(Props.string, null)).not.toThrow();
    expect(typeCheck(Props.string, undefined)).not.toThrow();
  });

  it("should throw for missing required values", function() {
    expect(typeCheck(Props.string.isRequired, null)).toThrow(
      'Invariant Violation: Required prop `testProp` was not specified in ' +
      '`testComponent`.'
    );
    expect(typeCheck(Props.string.isRequired, undefined)).toThrow(
      'Invariant Violation: Required prop `testProp` was not specified in ' +
      '`testComponent`.'
    );
  });
});

describe('Enum Types', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
  });

  it("should throw for invalid strings", function() {
    expect(typeCheck(Props.oneOf(['red', 'blue']), true)).toThrow(
      'Invariant Violation: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected one of ["blue","red"].'
    );
    expect(typeCheck(Props.oneOf(['red', 'blue']), [])).toThrow(
      'Invariant Violation: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected one of ["blue","red"].'
    );
    expect(typeCheck(Props.oneOf(['red', 'blue']), '')).toThrow(
      'Invariant Violation: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected one of ["blue","red"].'
    );
  });

  it("should not throw for valid values", function() {
    expect(typeCheck(Props.oneOf(['red', 'blue']), 'red')).not.toThrow();
    expect(typeCheck(Props.oneOf(['red', 'blue']), 'blue')).not.toThrow();
  });

  it("should be implicitly optional and not throw without values", function() {
    expect(typeCheck(Props.oneOf(['red', 'blue']), null)).not.toThrow();
    expect(typeCheck(Props.oneOf(['red', 'blue']), undefined)).not.toThrow();
  });
});

describe('Instance Types', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
  });

  it("should throw for invalid instances", function() {
    function Person() {}

    expect(typeCheck(Props.instanceOf(Person), false)).toThrow(
      'Invariant Violation: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected instance of `Person`.'
    );
    expect(typeCheck(Props.instanceOf(Person), {})).toThrow(
      'Invariant Violation: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected instance of `Person`.'
    );
    expect(typeCheck(Props.instanceOf(Person), '')).toThrow(
      'Invariant Violation: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected instance of `Person`.'
    );
  });

  it("should not throw for valid values", function() {
    function Person() {}
    function Engineer() {}
    Engineer.prototype = new Person();

    expect(typeCheck(Props.instanceOf(Person), new Person())).not.toThrow();
    expect(typeCheck(Props.instanceOf(Person), new Engineer())).not.toThrow();
  });
});
