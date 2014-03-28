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

var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactPropTypeLocations = require('ReactPropTypeLocations');

var Component;
var MyComponent;
var requiredMessage =
  'Required prop `testProp` was not specified in `testComponent`.';

function typeCheck(declaration, value, message) {
  var props = {testProp: value};
  expect(
    declaration(props, 'testProp', 'testComponent', ReactPropTypeLocations.prop)
  ).toBe(message);
}

describe('Primitive Types', function() {
  it("should warn for invalid strings", function() {
    typeCheck(
      PropTypes.string,
      [],
      'Invalid prop `testProp` of type `array` supplied to `testComponent`, ' +
      'expected `string`.'
    );
    typeCheck(
      PropTypes.string,
      false,
      'Invalid prop `testProp` of type `boolean` supplied to ' +
      '`testComponent`, expected `string`.'
    );
    typeCheck(
      PropTypes.string,
      0,
      'Invalid prop `testProp` of type `number` supplied to ' +
      '`testComponent`, expected `string`.'
    );
    typeCheck(
      PropTypes.string,
      {},
      'Invalid prop `testProp` of type `object` supplied to ' +
      '`testComponent`, expected `string`.'
    );
  });

  it("should not warn for valid values", function() {
    typeCheck(PropTypes.array, []);
    typeCheck(PropTypes.bool, false);
    typeCheck(PropTypes.func, function() {});
    typeCheck(PropTypes.number, 0);
    typeCheck(PropTypes.object, {});
    typeCheck(PropTypes.string, '');
  });

  it("should be implicitly optional and not warn without values", function() {
    typeCheck(PropTypes.string, null);
    typeCheck(PropTypes.string, undefined);
  });

  it("should warn for missing required values", function() {
    typeCheck(PropTypes.string.isRequired, null, requiredMessage);
    typeCheck(PropTypes.string.isRequired, undefined, requiredMessage);
  });
});

describe('Any type', function() {
  it('should should accept any value', function() {
    typeCheck(PropTypes.any, 0);
    typeCheck(PropTypes.any, 'str');
    typeCheck(PropTypes.any, []);
  });

  it("should be implicitly optional and not warn without values", function() {
    typeCheck(PropTypes.any, null);
    typeCheck(PropTypes.any, undefined);
  });

  it("should warn for missing required values", function() {
    typeCheck(PropTypes.any.isRequired, null, requiredMessage);
    typeCheck(PropTypes.any.isRequired, undefined, requiredMessage);
  });
});

describe('ArrayOf Type', function() {
  it('should support the arrayOf propTypes', function() {
    typeCheck(PropTypes.arrayOf(PropTypes.number), [1, 2, 3]);
    typeCheck(PropTypes.arrayOf(PropTypes.string), ['a', 'b', 'c']);
    typeCheck(PropTypes.arrayOf(PropTypes.oneOf(['a', 'b'])), ['a', 'b']);
  });

  it('should support arrayOf with complex types', function() {
    typeCheck(
      PropTypes.arrayOf(PropTypes.shape({a: PropTypes.number.isRequired})),
      [{a: 1}, {a: 2}]
    );

    function Thing() {}
    typeCheck(
      PropTypes.arrayOf(PropTypes.instanceOf(Thing)),
      [new Thing(), new Thing()]
    );
  });

  it('should warn with invalid items in the array', function() {
    typeCheck(
      PropTypes.arrayOf(PropTypes.number),
      [1, 2, 'b'],
      'Invalid prop `2` of type `string` supplied to `testComponent`, ' +
      'expected `number`.'
    );
  });

  it('should warn with invalid complex types', function() {
    function Thing() {}
    var name = Thing.name || '<<anonymous>>';

    typeCheck(
      PropTypes.arrayOf(PropTypes.instanceOf(Thing)),
      [new Thing(), 'xyz'],
      'Invalid prop `1` supplied to `testComponent`, expected instance of `' +
      name + '`.'
    );
  });

  it('should warn when passed something other than an array', function() {
    typeCheck(
      PropTypes.arrayOf(PropTypes.number),
      {'0': 'maybe-array', length: 1},
      'Invalid prop `testProp` of type `object` supplied to `testComponent`, ' +
      'expected an array.'
    );
    typeCheck(
      PropTypes.arrayOf(PropTypes.number),
      123,
      'Invalid prop `testProp` of type `number` supplied to `testComponent`, ' +
      'expected an array.'
    );
    typeCheck(
      PropTypes.arrayOf(PropTypes.number),
      'string',
      'Invalid prop `testProp` of type `string` supplied to `testComponent`, ' +
      'expected an array.'
    );
  });

  it('should not warn when passing an empty array', function() {
    typeCheck(PropTypes.arrayOf(PropTypes.number), []);
  });

  it("should be implicitly optional and not warn without values", function() {
    typeCheck(PropTypes.arrayOf(PropTypes.number), null);
    typeCheck(PropTypes.arrayOf(PropTypes.number), undefined);
  });

  it("should warn for missing required values", function() {
    typeCheck(
      PropTypes.arrayOf(PropTypes.number).isRequired, null, requiredMessage
    );
    typeCheck(
      PropTypes.arrayOf(PropTypes.number).isRequired, undefined, requiredMessage
    );
  });
});

describe('Component Type', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
    ReactTestUtils = require('ReactTestUtils');
    Component = React.createClass({
      propTypes: {label: PropTypes.component.isRequired},

      render: function() {
        return <div>{this.props.label}</div>;
      }
    });
    spyOn(console, 'warn');
  });

  it('should support components', () => {
    typeCheck(PropTypes.component, <div />);
  });

  it('should not support multiple components or scalar values', () => {
    var message = 'Invalid prop `testProp` supplied to `testComponent`, ' +
      'expected a React component.';
    typeCheck(PropTypes.component, [<div />, <div />], message);
    typeCheck(PropTypes.component, 123, message);
    typeCheck(PropTypes.component, 'foo', message);
    typeCheck(PropTypes.component, false, message);
  });

  it('should be able to define a single child as label', () => {
    var instance = <Component label={<div />} />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('should warn when passing no label and isRequired is set', () => {
    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(console.warn.argsForCall.length).toBe(1);
  });

  it("should be implicitly optional and not warn without values", function() {
    typeCheck(PropTypes.component, null);
    typeCheck(PropTypes.component, undefined);
  });

  it("should warn for missing required values", function() {
    typeCheck(PropTypes.component.isRequired, null, requiredMessage);
    typeCheck(PropTypes.component.isRequired, undefined, requiredMessage);
  });
});

describe('Instance Types', function() {
  it("should warn for invalid instances", function() {
    function Person() {}
    var name = Person.name || '<<anonymous>>';
    typeCheck(
      PropTypes.instanceOf(Person),
      false,
      'Invalid prop `testProp` supplied to `testComponent`, expected ' +
      'instance of `' + name + '`.'
    );
    typeCheck(
      PropTypes.instanceOf(Person),
      {},
      'Invalid prop `testProp` supplied to `testComponent`, expected ' +
      'instance of `' + name + '`.'
    );
    typeCheck(
      PropTypes.instanceOf(Person),
      '',
      'Invalid prop `testProp` supplied to `testComponent`, expected ' +
      'instance of `' + name + '`.'
    );
  });

  it("should not warn for valid values", function() {
    function Person() {}
    function Engineer() {}
    Engineer.prototype = new Person();

    typeCheck(PropTypes.instanceOf(Person), new Person());
    typeCheck(PropTypes.instanceOf(Person), new Engineer());
  });

  it("should be implicitly optional and not warn without values", function() {
    typeCheck(PropTypes.instanceOf(String), null);
    typeCheck(PropTypes.instanceOf(String), undefined);
  });

  it("should warn for missing required values", function() {
    typeCheck(PropTypes.instanceOf(String).isRequired, null, requiredMessage);
    typeCheck(
      PropTypes.instanceOf(String).isRequired, undefined, requiredMessage
    );
  });
});

describe('React Component Types', function() {
  beforeEach(function() {
    MyComponent = React.createClass({
      render: function() {
        return <div />;
      }
    });
  });

  it('should warn for invalid values', function() {
    typeCheck(
      PropTypes.renderable,
      false,
      'Invalid prop `testProp` supplied to `testComponent`, expected a ' +
      'renderable prop.'
    );
    typeCheck(
      PropTypes.renderable,
      function() {},
      'Invalid prop `testProp` supplied to `testComponent`, expected a ' +
      'renderable prop.'
    );
    typeCheck(
      PropTypes.renderable,
      {key: function() {}},
      'Invalid prop `testProp` supplied to `testComponent`, expected a ' +
      'renderable prop.'
    );
  });

  it('should not warn for valid values', function() {
    // DOM component
    typeCheck(PropTypes.renderable, <div />);
    // Custom component
    typeCheck(PropTypes.renderable, <MyComponent />);
    // String
    typeCheck(PropTypes.renderable, 'Some string');
    // Empty array
    typeCheck(PropTypes.renderable, []);
    // Empty object
    typeCheck(PropTypes.renderable, {});
    // Array of renderable things
    typeCheck(PropTypes.renderable, [
      123,
      'Some string',
      <div />,
      ['Another string', [456], <span />, <MyComponent />],
      <MyComponent />
    ]);

    // Object of rendereable things
    typeCheck(PropTypes.renderable, {
      k0: 123,
      k1: 'Some string',
      k2: <div />,
      k3: {
        k30: <MyComponent />,
        k31: {k310: <a />},
        k32: 'Another string'
      }
    });
  });

  it('should not warn for null/undefined if not required', function() {
    typeCheck(PropTypes.renderable, null);
    typeCheck(PropTypes.renderable, undefined);
  });

  it('should warn for missing required values', function() {
    typeCheck(
      PropTypes.renderable.isRequired,
      null,
      'Required prop `testProp` was not specified in `testComponent`.'
    );
    typeCheck(
      PropTypes.renderable.isRequired,
      undefined,
      'Required prop `testProp` was not specified in `testComponent`.'
    );
  });

  it('should accept empty array & object for required props', function() {
    typeCheck(PropTypes.renderable.isRequired, []);
    typeCheck(PropTypes.renderable.isRequired, {});
  });
});

describe('OneOf Types', function() {
  it("should warn for invalid strings", function() {
    typeCheck(
      PropTypes.oneOf(['red', 'blue']),
      true,
      'Invalid prop `testProp` of value `true` supplied to `testComponent`, ' +
      'expected one of ["red","blue"].'
    );
    typeCheck(
      PropTypes.oneOf(['red', 'blue']),
      [],
      'Invalid prop `testProp` of value `` supplied to `testComponent`, ' +
      'expected one of ["red","blue"].'
    );
    typeCheck(
      PropTypes.oneOf(['red', 'blue']),
      '',
      'Invalid prop `testProp` of value `` supplied to `testComponent`, ' +
      'expected one of ["red","blue"].'
    );
    typeCheck(
      PropTypes.oneOf([0, 'false']),
      false,
      'Invalid prop `testProp` of value `false` supplied to `testComponent`, ' +
      'expected one of [0,"false"].'
    );
  });

  it("should not warn for valid values", function() {
    typeCheck(PropTypes.oneOf(['red', 'blue']), 'red');
    typeCheck(PropTypes.oneOf(['red', 'blue']), 'blue');
  });

  it("should be implicitly optional and not warn without values", function() {
    typeCheck(PropTypes.oneOf(['red', 'blue']), null);
    typeCheck(PropTypes.oneOf(['red', 'blue']), undefined);
  });

  it("should warn for missing required values", function() {
    typeCheck(
      PropTypes.oneOf(['red', 'blue']).isRequired, null, requiredMessage
    );
    typeCheck(
      PropTypes.oneOf(['red', 'blue']).isRequired, undefined, requiredMessage
    );
  });
});

describe('Union Types', function() {
  it('should warn if none of the types are valid', function() {
    typeCheck(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      [],
      'Invalid prop `testProp` supplied to `testComponent`.'
    );
  });

  it('should not warn if one of the types are valid', function() {
    var checker = PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]);
    typeCheck(checker, null);
    typeCheck(checker, 'foo');
    typeCheck(checker, 123);
  });

  it("should be implicitly optional and not warn without values", function() {
    typeCheck(PropTypes.oneOfType([PropTypes.string, PropTypes.number]), null);
    typeCheck(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number]), undefined
    );
  });

  it("should warn for missing required values", function() {
    typeCheck(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      null,
      requiredMessage
    );
    typeCheck(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      undefined,
      requiredMessage
    );
  });
});

describe('Shape Types', function() {
  it("should warn for non objects", function() {
    typeCheck(
      PropTypes.shape({}),
      'some string',
      'Invalid prop `testProp` of type `string` supplied to `testComponent`, ' +
      'expected `object`.'
    );
    typeCheck(
      PropTypes.shape({}),
      ['array'],
      'Invalid prop `testProp` of type `array` supplied to `testComponent`, ' +
      'expected `object`.'
    );
  });

  it("should not warn for empty values", function() {
    typeCheck(PropTypes.shape({}), undefined);
    typeCheck(PropTypes.shape({}), null);
    typeCheck(PropTypes.shape({}), {});
  });

  it("should not warn for an empty object", function() {
    typeCheck(PropTypes.shape({}).isRequired, {});
  });

  it("should not warn for non specified types", function() {
    typeCheck(PropTypes.shape({}), {key: 1});
  });

  it("should not warn for valid types", function() {
    typeCheck(PropTypes.shape({key: PropTypes.number}), {key: 1});
  });

  it("should warn for required valid types", function() {
    typeCheck(
      PropTypes.shape({key: PropTypes.number.isRequired}),
      {},
      'Required prop `key` was not specified in `testComponent`.'
    );
  });

  it("should warn for invalid key types", function() {
    typeCheck(PropTypes.shape({key: PropTypes.number}),
      {key: 'abc'},
      'Invalid prop `key` of type `string` supplied to `testComponent`, ' +
      'expected `number`.'
    );
  });

  it("should be implicitly optional and not warn without values", function() {
    typeCheck(PropTypes.shape(PropTypes.shape({key: PropTypes.number})), null);
    typeCheck(
      PropTypes.shape(PropTypes.shape({key: PropTypes.number})), undefined
    );
  });

  it("should warn for missing required values", function() {
    typeCheck(
      PropTypes.shape({key: PropTypes.number}).isRequired,
      null,
      requiredMessage
    );
    typeCheck(
      PropTypes.shape({key: PropTypes.number}).isRequired,
      undefined,
      requiredMessage
    );
  });
});

describe('Custom validator', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
    ReactTestUtils = require('ReactTestUtils');
    spyOn(console, 'warn');
  });

  it('should have been called with the right params', function() {
    var spy = jasmine.createSpy();
    var Component = React.createClass({
      propTypes: {num: spy},

      render: function() {
        return <div />;
      }
    });

    var instance = <Component num={5} />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(spy.argsForCall.length).toBe(1);
    expect(spy.argsForCall[0][1]).toBe('num');
    expect(spy.argsForCall[0][2]).toBe('Component');
  });

  it('should have been called even if the prop is not present', function() {
    var spy = jasmine.createSpy();
    var Component = React.createClass({
      propTypes: {num: spy},

      render: function() {
        return <div />;
      }
    });

    var instance = <Component bla={5} />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(spy.argsForCall.length).toBe(1);
  });

  it('should have received the validator\'s return value', function() {
    var spy = jasmine.createSpy().andCallFake(
      function(props, propName, componentName) {
        if (props[propName] !== 5) {
          return 'num must be 5!';
        }
      }
    );
    var Component = React.createClass({
      propTypes: {num: spy},

      render: function() {
        return <div />;
      }
    });

    var instance = <Component num={6} />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe('Warning: num must be 5!');
  });

  it('should not warn if the validator returned nothing', function() {
    var spy = jasmine.createSpy().andCallFake(
      function(props, propName, componentName) {
        if (props[propName] !== 5) {
          return 'num must be 5!' + props[propName];
        }
      }
    );
    var Component = React.createClass({
      propTypes: {num: spy},

      render: function() {
        return <div />;
      }
    });

    var instance = <Component num={5} />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(console.warn.argsForCall.length).toBe(0);
  });
});
