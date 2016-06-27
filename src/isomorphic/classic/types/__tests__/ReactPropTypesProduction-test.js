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


describe('ReactPropTypesProduction', function() {
  var oldProcess;
  var PropTypes;
  var React;
  var ReactTestUtils;

  beforeEach(function() {
    __DEV__ = false;
    oldProcess = process;
    global.process = {env: {NODE_ENV: 'production'}};

    jest.resetModuleRegistry();
    PropTypes = require('ReactPropTypes');
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  afterEach(function() {
    __DEV__ = true;
    global.process = oldProcess;
  });

  function typeCheckPass(declaration, value) {
    var props = {testProp: value};
    declaration(
      props,
      'testProp',
      'testComponent',
      'prop'
    );
    const expectedCount = __DEV__ ? 0 : 1;
    expect(console.error.calls.count()).toBe(expectedCount);
    if (!__DEV__) {
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'You are manually calling a React.PropTypes validation '
      );
    }
    console.error.calls.reset();
  }


  describe('Primitive Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      typeCheckPass(PropTypes.array, /please/);
      typeCheckPass(PropTypes.array, []);
      typeCheckPass(PropTypes.array.isRequired, /please/);
      typeCheckPass(PropTypes.array.isRequired, []);
      typeCheckPass(PropTypes.array.isRequired, null);
      typeCheckPass(PropTypes.array.isRequired, undefined);
      typeCheckPass(PropTypes.bool, []);
      typeCheckPass(PropTypes.bool, true);
      typeCheckPass(PropTypes.bool.isRequired, []);
      typeCheckPass(PropTypes.bool.isRequired, true);
      typeCheckPass(PropTypes.bool.isRequired, null);
      typeCheckPass(PropTypes.bool.isRequired, undefined);
      typeCheckPass(PropTypes.func, false);
      typeCheckPass(PropTypes.func, function() {});
      typeCheckPass(PropTypes.func.isRequired, false);
      typeCheckPass(PropTypes.func.isRequired, function() {});
      typeCheckPass(PropTypes.func.isRequired, null);
      typeCheckPass(PropTypes.func.isRequired, undefined);
      typeCheckPass(PropTypes.number, function() {});
      typeCheckPass(PropTypes.number, 42);
      typeCheckPass(PropTypes.number.isRequired, function() {});
      typeCheckPass(PropTypes.number.isRequired, 42);
      typeCheckPass(PropTypes.number.isRequired, null);
      typeCheckPass(PropTypes.number.isRequired, undefined);
      typeCheckPass(PropTypes.string, 0);
      typeCheckPass(PropTypes.string, 'foo');
      typeCheckPass(PropTypes.string.isRequired, 0);
      typeCheckPass(PropTypes.string.isRequired, 'foo');
      typeCheckPass(PropTypes.string.isRequired, null);
      typeCheckPass(PropTypes.string.isRequired, undefined);
      typeCheckPass(PropTypes.symbol, 0);
      typeCheckPass(PropTypes.symbol, Symbol('Foo'));
      typeCheckPass(PropTypes.symbol.isRequired, 0);
      typeCheckPass(PropTypes.symbol.isRequired, Symbol('Foo'));
      typeCheckPass(PropTypes.symbol.isRequired, null);
      typeCheckPass(PropTypes.symbol.isRequired, undefined);
      typeCheckPass(PropTypes.object, '');
      typeCheckPass(PropTypes.object, {foo: 'bar'});
      typeCheckPass(PropTypes.object.isRequired, '');
      typeCheckPass(PropTypes.object.isRequired, {foo: 'bar'});
      typeCheckPass(PropTypes.object.isRequired, null);
      typeCheckPass(PropTypes.object.isRequired, undefined);
    });
  });


  describe('Any Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      typeCheckPass(PropTypes.any, null);
      typeCheckPass(PropTypes.any.isRequired, null);
      typeCheckPass(PropTypes.any.isRequired, undefined);
    });
  });

  describe('ArrayOf Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      typeCheckPass(
      PropTypes.arrayOf({ foo: PropTypes.string }),
        { foo: 'bar' }
      );
      typeCheckPass(
        PropTypes.arrayOf(PropTypes.number),
        [1, 2, 'b']
      );
      typeCheckPass(
        PropTypes.arrayOf(PropTypes.number),
        {'0': 'maybe-array', length: 1}
      );
      typeCheckPass(PropTypes.arrayOf(PropTypes.number).isRequired, null);
      typeCheckPass(PropTypes.arrayOf(PropTypes.number).isRequired, undefined);
    });
  });


  describe('Component Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      typeCheckPass(PropTypes.element, [<div />, <div />]);
      typeCheckPass(PropTypes.element, <div />);
      typeCheckPass(PropTypes.element, 123);
      typeCheckPass(PropTypes.element, 'foo');
      typeCheckPass(PropTypes.element, false);
      typeCheckPass(PropTypes.element.isRequired, null);
      typeCheckPass(PropTypes.element.isRequired, undefined);
    });
  });

  describe('Instance Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      typeCheckPass(PropTypes.instanceOf(Date), {});
      typeCheckPass(PropTypes.instanceOf(Date), new Date());
      typeCheckPass(PropTypes.instanceOf(Date).isRequired, {});
      typeCheckPass(PropTypes.instanceOf(Date).isRequired, new Date());
    });
  });

  describe('React Component Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      typeCheckPass(PropTypes.node, 'node');
      typeCheckPass(PropTypes.node, {});
      typeCheckPass(PropTypes.node.isRequired, 'node');
      typeCheckPass(PropTypes.node.isRequired, undefined);
      typeCheckPass(PropTypes.node.isRequired, undefined);
    });
  });

  describe('ObjectOf Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      typeCheckPass(
        PropTypes.objectOf({ foo: PropTypes.string }),
        { foo: 'bar' }
      );
      typeCheckPass(
        PropTypes.objectOf(PropTypes.number),
        {a: 1, b: 2, c: 'b'}
      );
      typeCheckPass(PropTypes.objectOf(PropTypes.number), [1, 2]);
      typeCheckPass(PropTypes.objectOf(PropTypes.number), null);
      typeCheckPass(PropTypes.objectOf(PropTypes.number), undefined);
    });
  });

  describe('OneOf Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      typeCheckPass(PropTypes.oneOf('red', 'blue'), 'red');
      typeCheckPass(PropTypes.oneOf(['red', 'blue']), true);
      typeCheckPass(PropTypes.oneOf(['red', 'blue']), null);
      typeCheckPass(PropTypes.oneOf(['red', 'blue']), undefined);
    });
  });

  describe('Union Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      typeCheckPass(
        PropTypes.oneOfType(PropTypes.string, PropTypes.number),
        'red'
      );
      typeCheckPass(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        []
      );
      typeCheckPass(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        null
      );
      typeCheckPass(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        undefined
      );
    });
  });

  describe('Shape Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      typeCheckPass(PropTypes.shape({}), 'some string');
      typeCheckPass(PropTypes.shape({ foo: PropTypes.number }), { foo: 42 });
      typeCheckPass(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        null
      );
      typeCheckPass(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        undefined
      );
      typeCheckPass(PropTypes.element, <div />);
    });
  });

  it('should not warn in the development environment', () => {
    __DEV__ = true;
    oldProcess = process;
    global.process = {env: {NODE_ENV: 'development'}};
    jest.resetModuleRegistry();
    PropTypes = require('ReactPropTypes');
    React = require('React');

    spyOn(console, 'error');
    typeCheckPass(PropTypes.bool, true);
    typeCheckPass(PropTypes.array, []);
    typeCheckPass(PropTypes.string, 'foo');
    typeCheckPass(PropTypes.any, 'foo');
    typeCheckPass(
      PropTypes.arrayOf(PropTypes.number),
      [1, 2, 3]
    );
    typeCheckPass(PropTypes.instanceOf(Date), new Date());
    typeCheckPass(
      PropTypes.objectOf({ foo: PropTypes.string }),
      { foo: 'bar' }
    );
    typeCheckPass(PropTypes.oneOf('red', 'blue'), 'red');
    typeCheckPass(
      PropTypes.oneOfType(PropTypes.string, PropTypes.number),
      'red'
    );
    typeCheckPass(PropTypes.shape({ foo: PropTypes.number }), { foo: 42 });
  });

  it('should not warn when doing type checks internally', function() {
    spyOn(console, 'error');
    var Component = React.createClass({
      propTypes: {
        foo: PropTypes.string,
        bar: PropTypes.number,
        baz: PropTypes.shape({
          qux: PropTypes.array,
        }),
      },
      render: function() {
        return <div />;
      },
    });
    var instance = (
      <Component foo="foo" bar={42} baz={{ qux: [1, 2, 3] }}/>
    );
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(console.error.calls.count()).toBe(0);
  });

});
