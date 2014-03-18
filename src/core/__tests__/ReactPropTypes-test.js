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
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var ReactTestUtils;

var Props = require('ReactPropTypes');
var React = require('React');
var ReactPropTypeLocations = require('ReactPropTypeLocations');

var warn;
var mocks;

function typeCheck(declaration, value) {
  var props = {};
  if (arguments.length > 1) {
    props.testProp = value;
  }
  return declaration(
    props, 'testProp', 'testComponent', ReactPropTypeLocations.prop
  );
}

var MyComponent = React.createClass({
  render: function() {
    return <div />;
  }
});

describe('Primitive Types', () => {
  beforeEach(() => {
    require('mock-modules').dumpCache();

    mocks = require('mocks');
    ReactTestUtils = require('ReactTestUtils');

    warn = console.warn;
    console.warn = mocks.getMockFunction();
  });

  afterEach(() => {
    console.warn = warn;
  });

  it("should warn for invalid strings", () => {
    typeCheck(Props.string, []);
    typeCheck(Props.string, false);
    typeCheck(Props.string, 1);
    typeCheck(Props.string, {});

    expect(console.warn.mock.calls.length).toBe(4);

    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Invalid prop `testProp` of type `array` ' +
      'supplied to `testComponent`, expected `string`.'
    );
    expect(console.warn.mock.calls[1][0]).toBe(
      'Warning: Invalid prop `testProp` of type `boolean` ' +
      'supplied to `testComponent`, expected `string`.'
    );
    expect(console.warn.mock.calls[2][0]).toBe(
      'Warning: Invalid prop `testProp` of type `number` ' +
      'supplied to `testComponent`, expected `string`.'
    );
    expect(console.warn.mock.calls[3][0]).toBe(
      'Warning: Invalid prop `testProp` of type `object` ' +
      'supplied to `testComponent`, expected `string`.'
    );
  });

  it("should not warn for valid values", () => {
    typeCheck(Props.array, []);
    typeCheck(Props.bool, false);
    typeCheck(Props.func, function() {});
    typeCheck(Props.number, 0);
    typeCheck(Props.object, {});
    typeCheck(Props.string, '');

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });

  it("should be implicitly optional and not warn without values", () => {
    typeCheck(Props.string, null);
    typeCheck(Props.string, undefined);

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });

  it("should warn for missing required values", () => {
    typeCheck(Props.string.isRequired, null);
    typeCheck(Props.string.isRequired, undefined);

    expect(console.warn.mock.calls.length).toBe(2);

    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Required prop `testProp` was not specified in ' +
      '`testComponent`.'
    );
    expect(console.warn.mock.calls[1][0]).toBe(
      'Warning: Required prop `testProp` was not specified in ' +
      '`testComponent`.'
    );
  });

  it("should have a weak version that returns true/false", () => {
    expect(typeCheck(Props.string.weak, null)).toEqual(true);
    expect(typeCheck(Props.string.weak.isRequired, null)).toEqual(false);
    expect(typeCheck(Props.string.isRequired.weak, null)).toEqual(false);
  });
});

describe('Enum Types', () => {
  beforeEach(() => {
    require('mock-modules').dumpCache();
    mocks = require('mocks');
    warn = console.warn;
    console.warn = mocks.getMockFunction();
  });

  afterEach(() => {
    console.warn = warn;
  });

  it("should warn for invalid strings", () => {
    typeCheck(Props.oneOf(['red', 'blue']), true);
    typeCheck(Props.oneOf(['red', 'blue']), []);
    typeCheck(Props.oneOf(['red', 'blue']), '');

    expect(console.warn.mock.calls.length).toBe(3);

    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected one of ["blue","red"].'
    );

    expect(console.warn.mock.calls[1][0]).toBe(
      'Warning: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected one of ["blue","red"].'
    );

    expect(console.warn.mock.calls[2][0]).toBe(
      'Warning: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected one of ["blue","red"].'
    );
  });

  it("should not warn for valid values", () => {
    typeCheck(Props.oneOf(['red', 'blue']), 'red');
    typeCheck(Props.oneOf(['red', 'blue']), 'blue');

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });

  it("should be implicitly optional and not warn without values", () => {
    typeCheck(Props.oneOf(['red', 'blue']), null);
    typeCheck(Props.oneOf(['red', 'blue']), undefined);

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });

  it("should have a weak version that returns true/false", () => {
    var checker = Props.oneOf(['red', 'blue']);
    expect(typeCheck(checker.weak, null)).toEqual(true);
    expect(typeCheck(checker.weak.isRequired, null)).toEqual(false);
    expect(typeCheck(checker.isRequired.weak, null)).toEqual(false);
  });
});

describe('Shape Types', () => {
  beforeEach(() => {
    require('mock-modules').dumpCache();
    mocks = require('mocks');
    warn = console.warn;
    console.warn = mocks.getMockFunction();
  });

  afterEach(() => {
    console.warn = warn;
  });

  it("should warn for non objects", () => {
    typeCheck(Props.shape({}), 'some string');
    typeCheck(Props.shape({}), ['array']);

    expect(console.warn.mock.calls.length).toBe(2);

    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Invalid prop `testProp` of type `string` ' +
      'supplied to `testComponent`, expected `object`.'
    );
    expect(console.warn.mock.calls[1][0]).toBe(
      'Warning: Invalid prop `testProp` of type `array` ' +
      'supplied to `testComponent`, expected `object`.'
    );
  });

  it("should not warn for empty values", () => {
    typeCheck(Props.shape({}), undefined);
    typeCheck(Props.shape({}), null);
    typeCheck(Props.shape({}), {});

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });

  it("should warn for empty required value", () => {
    typeCheck(Props.shape({}).isRequired, undefined);
    typeCheck(Props.shape({}).isRequired, null);

    expect(console.warn.mock.calls.length).toBe(2);

    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Required prop `testProp` was not specified in ' +
      '`testComponent`.'
    );
    expect(console.warn.mock.calls[1][0]).toBe(
      'Warning: Required prop `testProp` was not specified in ' +
      '`testComponent`.'
    );

    // Should not warn
    typeCheck(Props.shape({}).isRequired, {});
    expect(console.warn.mock.calls.length).toBe(2);
  });

  it("should not warn for non specified types", () => {
    typeCheck(Props.shape({}), {key: 1});

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });

  it("should not warn for valid types", () => {
    typeCheck(Props.shape({
      key: Props.number
    }), {key: 1});

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });

  it("should warn for required valid types", () => {
    typeCheck(Props.shape({
      key: Props.number.isRequired
    }), {});

    expect(console.warn.mock.calls.length).toBe(1);

    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Required prop `key` was not specified in ' +
      '`testComponent`.'
    );
  });

  it("should warn for invalid key types", () => {
    typeCheck(Props.shape({
      key: Props.number
    }), {key: 'abc'});

    expect(console.warn.mock.calls.length).toBe(1);

    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Invalid prop `key` of type `string` supplied to ' +
      '`testComponent`, expected `number`.'
    );
  });
});

describe('ArrayOf Type', () => {
  beforeEach(() => {
    require('mock-modules').dumpCache();
    mocks = require('mocks');
    warn = console.warn;
    console.warn = mocks.getMockFunction();
  });

  afterEach(() => {
    console.warn = warn;
  });

  it('should support the arrayOf propType', () => {
    typeCheck(Props.arrayOf(Props.number), [1, 2, 3]);
    typeCheck(Props.arrayOf(Props.string), ['a', 'b', 'c']);
    typeCheck(Props.arrayOf(Props.oneOf(['a', 'b'])), ['a', 'b']);

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });

  it('should support arrayOf with complex types', () => {
    typeCheck(Props.arrayOf(Props.shape({
      a: Props.number.isRequired
    })), [{a: 1}, {a: 2}]);

    function Thing() {}
    typeCheck(
      Props.arrayOf(Props.instanceOf(Thing)),
      [new Thing(), new Thing()]
    );

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });

  it('should warn with invalid items in the array', () => {
    typeCheck(Props.arrayOf(Props.number), [1, 2, 'b']);

    expect(console.warn.mock.calls.length).toBe(1);

    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Invalid prop `2` of type `string` supplied to ' +
      '`testComponent`, expected `number`.'
    );
  });

  it('should warn with invalid complex types', () => {
    function Thing() {}
    var name = Thing.name || '<<anonymous>>';

    typeCheck(
      Props.arrayOf(Props.instanceOf(Thing)),
      [new Thing(), 'xyz']
    );

    expect(console.warn.mock.calls.length).toBe(1);

    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Invalid prop `1` supplied to ' +
      '`testComponent`, expected instance of `' + name + '`.'
    );
  });

  it('should warn when passed something other than an array', () => {
    typeCheck(Props.arrayOf(Props.number), {'0': 'maybe-array', length: 1});
    typeCheck(Props.arrayOf(Props.number), 123);
    typeCheck(Props.arrayOf(Props.number), 'string');

    expect(console.warn.mock.calls.length).toBe(3);

    var message = 'Warning: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected an array.';

    expect(console.warn.mock.calls[0][0]).toBe(message);
    expect(console.warn.mock.calls[1][0]).toBe(message);
    expect(console.warn.mock.calls[2][0]).toBe(message);
  });

});

describe('Instance Types', () => {
  beforeEach(() => {
    require('mock-modules').dumpCache();
    mocks = require('mocks');
    warn = console.warn;
    console.warn = mocks.getMockFunction();
  });

  afterEach(() => {
    console.warn = warn;
  });

  it("should warn for invalid instances", () => {
    function Person() {}
    var name = Person.name || '<<anonymous>>';
    typeCheck(Props.instanceOf(Person), false);
    typeCheck(Props.instanceOf(Person), {});
    typeCheck(Props.instanceOf(Person), '');

    expect(console.warn.mock.calls.length).toBe(3);

    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected instance of `' + name + '`.'
    );

    expect(console.warn.mock.calls[1][0]).toBe(
      'Warning: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected instance of `' + name + '`.'
    );

    expect(console.warn.mock.calls[2][0]).toBe(
      'Warning: Invalid prop `testProp` supplied to ' +
      '`testComponent`, expected instance of `' + name + '`.'
    );
  });

  it("should not warn for valid values", () => {
    function Person() {}
    function Engineer() {}
    Engineer.prototype = new Person();

    typeCheck(Props.instanceOf(Person), new Person());
    typeCheck(Props.instanceOf(Person), new Engineer());

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });
});

describe('Component Type', () => {
  beforeEach(() => {
    require('mock-modules').dumpCache();
    mocks = require('mocks');
    warn = console.warn;
    console.warn = mocks.getMockFunction();
  });

  afterEach(() => {
    console.warn = warn;
  });

  it('should support components', () => {
    typeCheck(Props.component, <div />);

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });

  it('should not support multiple components or scalar values', () => {
    var list = [[<div />, <div />], 123, 'foo', false];
    list.forEach((value) => typeCheck(Props.component, value));
    expect(console.warn.mock.calls.length).toBe(list.length);
  });

  var Component = React.createClass({
    propTypes: {
      label: Props.component.isRequired
    },

    render: function() {
      return <div>{this.props.label}</div>;
    }
  });

  it('should be able to define a single child as label', () => {
    var instance = <Component label={<div />} />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    // No warnings should have been logged.
    expect(console.warn.mock.calls.length).toBe(0);
  });

  it('should warn when passing no label and isRequired is set', () => {
    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(console.warn.mock.calls.length).toBe(1);
  });
});

describe('Union Types', () => {
  beforeEach(() => {
    require('mock-modules').dumpCache();
    mocks = require('mocks');
    warn = console.warn;
    console.warn = mocks.getMockFunction();
  });

  afterEach(() => {
    console.warn = warn;
  });

  it('should warn if none of the types are valid', () => {
    var checker = Props.oneOfType([
      Props.string,
      Props.number
    ]);
    typeCheck(checker, []);
    checker = Props.oneOfType([
      Props.string.isRequired,
      Props.number.isRequired
    ]);
    typeCheck(checker, null);

    expect(console.warn.mock.calls.length).toBe(2);

    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Invalid prop `testProp` ' +
      'supplied to `testComponent`.'
    );

    expect(console.warn.mock.calls[1][0]).toBe(
      'Warning: Invalid prop `testProp` ' +
      'supplied to `testComponent`.'
    );
  });

  it('should not warn if one of the types are valid', () => {
    var checker = Props.oneOfType([
      Props.string,
      Props.number
    ]);
    typeCheck(checker, null);
    expect(console.warn.mock.calls.length).toBe(0);
    typeCheck(checker, 'foo');
    expect(console.warn.mock.calls.length).toBe(0);
    typeCheck(checker, 123);
    expect(console.warn.mock.calls.length).toBe(0);

    checker = Props.oneOfType([
      Props.string,
      Props.number.isRequired
    ]);
    typeCheck(checker, null);
    expect(console.warn.mock.calls.length).toBe(0);
    typeCheck(checker, 'foo');
    expect(console.warn.mock.calls.length).toBe(0);
    typeCheck(checker, 123);
    expect(console.warn.mock.calls.length).toBe(0);
  });

  describe('React Component Types', () => {
    beforeEach(() => {
      require('mock-modules').dumpCache();
    });

    var myFunc = function() {};

    it('should warn for invalid values', () => {
      typeCheck(Props.renderable, false);
      typeCheck(Props.renderable, myFunc);
      typeCheck(Props.renderable, {key: myFunc});

      expect(console.warn.mock.calls.length).toBe(3);

      expect(console.warn.mock.calls[0][0]).toBe(
        'Warning: Invalid prop `testProp` supplied to ' +
        '`testComponent`, expected a renderable prop.'
      );

      expect(console.warn.mock.calls[1][0]).toBe(
        'Warning: Invalid prop `testProp` supplied to ' +
        '`testComponent`, expected a renderable prop.'
      );

      expect(console.warn.mock.calls[2][0]).toBe(
        'Warning: Invalid prop `testProp` supplied to ' +
        '`testComponent`, expected a renderable prop.'
      );
    });

    it('should not warn for valid values', () => {
      // DOM component
      typeCheck(Props.renderable, <div />);
      expect(console.warn.mock.calls.length).toBe(0);
      // Custom component
      typeCheck(Props.renderable, <MyComponent />);
      expect(console.warn.mock.calls.length).toBe(0);
      // String
      typeCheck(Props.renderable, 'Some string');
      expect(console.warn.mock.calls.length).toBe(0);
      // Empty array
      typeCheck(Props.renderable, []);
      expect(console.warn.mock.calls.length).toBe(0);
      // Empty object
      typeCheck(Props.renderable, {});
      expect(console.warn.mock.calls.length).toBe(0);
      // Array of renderable things

      typeCheck(Props.renderable, [
        123,
        'Some string',
        <div />,
        ['Another string', [456], <span />, <MyComponent />],
        <MyComponent />
      ]);
      expect(console.warn.mock.calls.length).toBe(0);

      // Object of rendereable things
      typeCheck(Props.renderable, {
        k0: 123,
        k1: 'Some string',
        k2: <div />,
        k3: {
          k30: <MyComponent />,
          k31: {k310: <a />},
          k32: 'Another string'
        }
      });
      expect(console.warn.mock.calls.length).toBe(0);
    });

    it('should not warn for null/undefined if not required', () => {
      typeCheck(Props.renderable, null);
      typeCheck(Props.renderable, undefined);

      // No warnings should have been logged.
      expect(console.warn.mock.calls.length).toBe(0);
    });

    it('should warn for missing required values', () => {
      typeCheck(Props.renderable.isRequired, null);
      typeCheck(Props.renderable.isRequired, undefined);

      expect(console.warn.mock.calls.length).toBe(2);

      expect(console.warn.mock.calls[0][0]).toBe(
        'Warning: Required prop `testProp` was not specified in ' +
        '`testComponent`.'
      );
      expect(console.warn.mock.calls[1][0]).toBe(
        'Warning: Required prop `testProp` was not specified in ' +
        '`testComponent`.'
      );
    });

    it('should accept empty array & object for required props', () => {
      typeCheck(Props.renderable.isRequired, []);
      typeCheck(Props.renderable.isRequired, {});

      // No warnings should have been logged.
      expect(console.warn.mock.calls.length).toBe(0);
    });
  });

  describe('Any type', () => {
    it('should should accept any value', () => {
      typeCheck(Props.any, 1);
      expect(console.warn.mock.calls.length).toBe(0);
      typeCheck(Props.any, 'str');
      expect(console.warn.mock.calls.length).toBe(0);
      typeCheck(Props.any.isRequired, 1);
      expect(console.warn.mock.calls.length).toBe(0);
      typeCheck(Props.any.isRequired, 'str');
      expect(console.warn.mock.calls.length).toBe(0);

      typeCheck(Props.any, null);
      expect(console.warn.mock.calls.length).toBe(0);
      typeCheck(Props.any, undefined);
      expect(console.warn.mock.calls.length).toBe(0);

      typeCheck(Props.any.isRequired, null);
      typeCheck(Props.any.isRequired, undefined);

      expect(console.warn.mock.calls.length).toBe(2);
      expect(console.warn.mock.calls[0][0]).toBe(
        'Warning: Required prop `testProp` was not specified in ' +
        '`testComponent`.'
      );

      expect(console.warn.mock.calls[1][0]).toBe(
        'Warning: Required prop `testProp` was not specified in ' +
        '`testComponent`.'
      );
    });

    it('should have a weak version that returns true/false', () => {
      expect(typeCheck(Props.any.weak, null)).toEqual(true);
      expect(typeCheck(Props.any.weak.isRequired, null)).toEqual(false);
      expect(typeCheck(Props.any.isRequired.weak, null)).toEqual(false);
    });
  });
});
