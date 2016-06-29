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
  // var oldProcess;
  var PropTypes;
  var React;
  var ReactTestUtils;

  beforeEach(function() {
    // __DEV__ = false;
    // oldProcess = process;
    // global.process = {env: {NODE_ENV: 'production'}};
    //
    // jest.resetModuleRegistry();
    PropTypes = require('ReactPropTypes');
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  afterEach(function() {
    // __DEV__ = true;
    // global.process = oldProcess;
  });

  function expectWarningInDevelopment(declaration, value) {
    var props = {testProp: value};
    // Call the function three times in all cases to make
    // sure the warning is only output once.
    var propName = 'testProp' + Math.random().toString();
    var componentName = 'testComponent' + Math.random().toString();
    for (var i = 0; i < 3; i ++) {
      declaration(
        props,
        propName,
        componentName,
        'prop'
      );
    }
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'You are manually calling a React.PropTypes validation '
    );
    console.error.calls.reset();
  }


  describe('Primitive Types', function() {
    it('should warn if called manually in development', function() {
      spyOn(console, 'error');
      expectWarningInDevelopment(PropTypes.array, /please/);
      expectWarningInDevelopment(PropTypes.array, []);
      expectWarningInDevelopment(PropTypes.array.isRequired, /please/);
      expectWarningInDevelopment(PropTypes.array.isRequired, []);
      expectWarningInDevelopment(PropTypes.array.isRequired, null);
      expectWarningInDevelopment(PropTypes.array.isRequired, undefined);
      expectWarningInDevelopment(PropTypes.bool, []);
      expectWarningInDevelopment(PropTypes.bool, true);
      expectWarningInDevelopment(PropTypes.bool.isRequired, []);
      expectWarningInDevelopment(PropTypes.bool.isRequired, true);
      expectWarningInDevelopment(PropTypes.bool.isRequired, null);
      expectWarningInDevelopment(PropTypes.bool.isRequired, undefined);
      expectWarningInDevelopment(PropTypes.func, false);
      expectWarningInDevelopment(PropTypes.func, function() {});
      expectWarningInDevelopment(PropTypes.func.isRequired, false);
      expectWarningInDevelopment(PropTypes.func.isRequired, function() {});
      expectWarningInDevelopment(PropTypes.func.isRequired, null);
      expectWarningInDevelopment(PropTypes.func.isRequired, undefined);
      expectWarningInDevelopment(PropTypes.number, function() {});
      expectWarningInDevelopment(PropTypes.number, 42);
      expectWarningInDevelopment(PropTypes.number.isRequired, function() {});
      expectWarningInDevelopment(PropTypes.number.isRequired, 42);
      expectWarningInDevelopment(PropTypes.number.isRequired, null);
      expectWarningInDevelopment(PropTypes.number.isRequired, undefined);
      expectWarningInDevelopment(PropTypes.string, 0);
      expectWarningInDevelopment(PropTypes.string, 'foo');
      expectWarningInDevelopment(PropTypes.string.isRequired, 0);
      expectWarningInDevelopment(PropTypes.string.isRequired, 'foo');
      expectWarningInDevelopment(PropTypes.string.isRequired, null);
      expectWarningInDevelopment(PropTypes.string.isRequired, undefined);
      expectWarningInDevelopment(PropTypes.symbol, 0);
      expectWarningInDevelopment(PropTypes.symbol, Symbol('Foo'));
      expectWarningInDevelopment(PropTypes.symbol.isRequired, 0);
      expectWarningInDevelopment(PropTypes.symbol.isRequired, Symbol('Foo'));
      expectWarningInDevelopment(PropTypes.symbol.isRequired, null);
      expectWarningInDevelopment(PropTypes.symbol.isRequired, undefined);
      expectWarningInDevelopment(PropTypes.object, '');
      expectWarningInDevelopment(PropTypes.object, {foo: 'bar'});
      expectWarningInDevelopment(PropTypes.object.isRequired, '');
      expectWarningInDevelopment(PropTypes.object.isRequired, {foo: 'bar'});
      expectWarningInDevelopment(PropTypes.object.isRequired, null);
      expectWarningInDevelopment(PropTypes.object.isRequired, undefined);
    });
  });


  describe('Any Type', function() {
    it('should warn if called manually in development', function() {
      spyOn(console, 'error');
      expectWarningInDevelopment(PropTypes.any, null);
      expectWarningInDevelopment(PropTypes.any.isRequired, null);
      expectWarningInDevelopment(PropTypes.any.isRequired, undefined);
    });
  });

  describe('ArrayOf Type', function() {
    it('should warn if called manually in development', function() {
      spyOn(console, 'error');
      expectWarningInDevelopment(
      PropTypes.arrayOf({ foo: PropTypes.string }),
        { foo: 'bar' }
      );
      expectWarningInDevelopment(
        PropTypes.arrayOf(PropTypes.number),
        [1, 2, 'b']
      );
      expectWarningInDevelopment(
        PropTypes.arrayOf(PropTypes.number),
        {'0': 'maybe-array', length: 1}
      );
      expectWarningInDevelopment(PropTypes.arrayOf(PropTypes.number).isRequired, null);
      expectWarningInDevelopment(PropTypes.arrayOf(PropTypes.number).isRequired, undefined);
    });
  });


  describe('Component Type', function() {
    it('should warn if called manually in development', function() {
      spyOn(console, 'error');
      expectWarningInDevelopment(PropTypes.element, [<div />, <div />]);
      expectWarningInDevelopment(PropTypes.element, <div />);
      expectWarningInDevelopment(PropTypes.element, 123);
      expectWarningInDevelopment(PropTypes.element, 'foo');
      expectWarningInDevelopment(PropTypes.element, false);
      expectWarningInDevelopment(PropTypes.element.isRequired, null);
      expectWarningInDevelopment(PropTypes.element.isRequired, undefined);
    });
  });

  describe('Instance Types', function() {
    it('should warn if called manually in development', function() {
      spyOn(console, 'error');
      expectWarningInDevelopment(PropTypes.instanceOf(Date), {});
      expectWarningInDevelopment(PropTypes.instanceOf(Date), new Date());
      expectWarningInDevelopment(PropTypes.instanceOf(Date).isRequired, {});
      expectWarningInDevelopment(PropTypes.instanceOf(Date).isRequired, new Date());
    });
  });

  describe('React Component Types', function() {
    it('should warn if called manually in development', function() {
      spyOn(console, 'error');
      expectWarningInDevelopment(PropTypes.node, 'node');
      expectWarningInDevelopment(PropTypes.node, {});
      expectWarningInDevelopment(PropTypes.node.isRequired, 'node');
      expectWarningInDevelopment(PropTypes.node.isRequired, undefined);
      expectWarningInDevelopment(PropTypes.node.isRequired, undefined);
    });
  });

  describe('ObjectOf Type', function() {
    it('should warn if called manually in development', function() {
      spyOn(console, 'error');
      expectWarningInDevelopment(
        PropTypes.objectOf({ foo: PropTypes.string }),
        { foo: 'bar' }
      );
      expectWarningInDevelopment(
        PropTypes.objectOf(PropTypes.number),
        {a: 1, b: 2, c: 'b'}
      );
      expectWarningInDevelopment(PropTypes.objectOf(PropTypes.number), [1, 2]);
      expectWarningInDevelopment(PropTypes.objectOf(PropTypes.number), null);
      expectWarningInDevelopment(PropTypes.objectOf(PropTypes.number), undefined);
    });
  });

  describe('OneOf Types', function() {
    it('should warn if called manually in development', function() {
      spyOn(console, 'error');
      expectWarningInDevelopment(PropTypes.oneOf('red', 'blue'), 'red');
      expectWarningInDevelopment(PropTypes.oneOf(['red', 'blue']), true);
      expectWarningInDevelopment(PropTypes.oneOf(['red', 'blue']), null);
      expectWarningInDevelopment(PropTypes.oneOf(['red', 'blue']), undefined);
    });
  });

  describe('Union Types', function() {
    it('should warn if called manually in development', function() {
      spyOn(console, 'error');
      expectWarningInDevelopment(
        PropTypes.oneOfType(PropTypes.string, PropTypes.number),
        'red'
      );
      expectWarningInDevelopment(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        []
      );
      expectWarningInDevelopment(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        null
      );
      expectWarningInDevelopment(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        undefined
      );
    });
  });

  describe('Shape Types', function() {
    it('should warn if called manually in development', function() {
      spyOn(console, 'error');
      expectWarningInDevelopment(PropTypes.shape({}), 'some string');
      expectWarningInDevelopment(PropTypes.shape({ foo: PropTypes.number }), { foo: 42 });
      expectWarningInDevelopment(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        null
      );
      expectWarningInDevelopment(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        undefined
      );
      expectWarningInDevelopment(PropTypes.element, <div />);
    });
  });

  it('should not warn for type checks performed by React', function() {
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
      <Component foo="foo" bar="bar" baz={{ qux: [1, 2, 3] }}/>
    );
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).not.toContain(
      'You are manually calling a React.PropTypes validation '
    );
  });

});
