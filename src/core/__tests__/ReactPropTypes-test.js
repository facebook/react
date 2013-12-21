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
var React = require('React');
var ReactPropTypeLocations = require('ReactPropTypeLocations');

function typeCheck(declaration, value) {
  var props = {};
  if (arguments.length > 1) {
    props.testProp = value;
  }
  return declaration.bind(
    null,
    props,
    'testProp',
    'testComponent',
    ReactPropTypeLocations.prop
  );
}

var MyComponent = React.createClass({
  render: function() {
    return <div />;
  }
});

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

  it("should have a weak version that returns true/false", function() {
    expect(typeCheck(Props.string.weak, null)()).toEqual(true);
    expect(typeCheck(Props.string.weak.isRequired, null)()).toEqual(false);
    expect(typeCheck(Props.string.isRequired.weak, null)()).toEqual(false);
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

  it("should have a weak version that returns true/false", function() {
    var checker = Props.oneOf(['red', 'blue']);
    expect(typeCheck(checker.weak, null)()).toEqual(true);
    expect(typeCheck(checker.weak.isRequired, null)()).toEqual(false);
    expect(typeCheck(checker.isRequired.weak, null)()).toEqual(false);
  });
});

describe('Instance Types', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
  });

  it("should throw for invalid instances", function() {
    function Person() {}
    var name = Person.name || '<<anonymous>>';

    expect(typeCheck(Props.instanceOf(Person), false)).toThrow(
      'Invariant Violation: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected instance of `' + name + '`.'
    );
    expect(typeCheck(Props.instanceOf(Person), {})).toThrow(
      'Invariant Violation: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected instance of `' + name + '`.'
    );
    expect(typeCheck(Props.instanceOf(Person), '')).toThrow(
      'Invariant Violation: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected instance of `' + name + '`.'
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

describe('Union Types', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
  });

  it('should throw if none of the types are valid', function() {
    var checker = Props.oneOfType([
      Props.string,
      Props.number
    ]);
    expect(typeCheck(checker, [])).toThrow(
      'Invariant Violation: Invalid prop `testProp` ' +
      'supplied to `testComponent`.'
    );

    checker = Props.oneOfType([
      Props.string.isRequired,
      Props.number.isRequired
    ]);
    expect(typeCheck(checker, null)).toThrow(
      'Invariant Violation: Invalid prop `testProp` ' +
      'supplied to `testComponent`.'
    );
  });

  it('should not throw if one of the types are valid', function() {
    var checker = Props.oneOfType([
      Props.string,
      Props.number
    ]);
    expect(typeCheck(checker, null)).not.toThrow();
    expect(typeCheck(checker, 'foo')).not.toThrow();
    expect(typeCheck(checker, 123)).not.toThrow();

    checker = Props.oneOfType([
      Props.string,
      Props.number.isRequired
    ]);
    expect(typeCheck(checker, null)).not.toThrow();
    expect(typeCheck(checker, 'foo')).not.toThrow();
    expect(typeCheck(checker, 123)).not.toThrow();
  });

  describe('React Component Types', function() {
    beforeEach(function() {
      require('mock-modules').dumpCache();
    });

    var myFunc = function() {};

    it('should throw for invalid values', function() {
      expect(typeCheck(Props.renderable, false)).toThrow(
        'Invariant Violation: Invalid prop `testProp` supplied to ' +
        '`testComponent`, expected a renderable prop.'
      );
      expect(typeCheck(Props.renderable, myFunc)).toThrow(
        'Invariant Violation: Invalid prop `testProp` supplied to ' +
        '`testComponent`, expected a renderable prop.'
      );
      expect(typeCheck(Props.renderable, {key: myFunc})).toThrow(
        'Invariant Violation: Invalid prop `testProp` supplied to ' +
        '`testComponent`, expected a renderable prop.'
      );
    });

    it('should not throw for valid values', function() {
      // DOM component
      expect(typeCheck(Props.renderable, <div />)).not.toThrow();
      // Custom component
      expect(typeCheck(Props.renderable, <MyComponent />)).not.toThrow();
      // String
      expect(typeCheck(Props.renderable, 'Some string')).not.toThrow();
      // Empty array
      expect(typeCheck(Props.renderable, [])).not.toThrow();
      // Empty object
      expect(typeCheck(Props.renderable, {})).not.toThrow();
      // Array of renderable things
      expect(
        typeCheck(Props.renderable, [
          123,
          'Some string',
          <div />,
          ['Another string', [456], <span />, <MyComponent />],
          <MyComponent />
        ])
      ).not.toThrow();
      // Object of rendereable things
      expect(
        typeCheck(Props.renderable, {
          k0: 123,
          k1: 'Some string',
          k2: <div />,
          k3: {
            k30: <MyComponent />,
            k31: {k310: <a />},
            k32: 'Another string'
          }
        })
      ).not.toThrow();
    });

    it('should not throw for null/undefined if not required', function() {
      expect(typeCheck(Props.renderable, null)).not.toThrow();
      expect(typeCheck(Props.renderable, undefined)).not.toThrow();
    });

    it('should throw for missing required values', function() {
      expect(typeCheck(Props.renderable.isRequired, null)).toThrow(
        'Invariant Violation: Required prop `testProp` was not specified in ' +
        '`testComponent`.'
      );
      expect(typeCheck(Props.renderable.isRequired, undefined)).toThrow(
        'Invariant Violation: Required prop `testProp` was not specified in ' +
        '`testComponent`.'
      );
    });

    it('should accept empty array & object for required props', function() {
      expect(typeCheck(Props.renderable.isRequired, [])).not.toThrow();
      expect(typeCheck(Props.renderable.isRequired, {})).not.toThrow();
    });
  });

});
