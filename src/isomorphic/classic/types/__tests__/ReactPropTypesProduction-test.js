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

  function expectWarningInProduction(declaration, value) {
    var props = {testProp: value};
    declaration(
      props,
      'testProp',
      'testComponent',
      'prop'
    );
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'You are manually calling a React.PropTypes validation '
    );
    console.error.calls.reset();
  }


  describe('Primitive Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      expectWarningInProduction(PropTypes.array, /please/);
      expectWarningInProduction(PropTypes.array, []);
      expectWarningInProduction(PropTypes.array.isRequired, /please/);
      expectWarningInProduction(PropTypes.array.isRequired, []);
      expectWarningInProduction(PropTypes.array.isRequired, null);
      expectWarningInProduction(PropTypes.array.isRequired, undefined);
      expectWarningInProduction(PropTypes.bool, []);
      expectWarningInProduction(PropTypes.bool, true);
      expectWarningInProduction(PropTypes.bool.isRequired, []);
      expectWarningInProduction(PropTypes.bool.isRequired, true);
      expectWarningInProduction(PropTypes.bool.isRequired, null);
      expectWarningInProduction(PropTypes.bool.isRequired, undefined);
      expectWarningInProduction(PropTypes.func, false);
      expectWarningInProduction(PropTypes.func, function() {});
      expectWarningInProduction(PropTypes.func.isRequired, false);
      expectWarningInProduction(PropTypes.func.isRequired, function() {});
      expectWarningInProduction(PropTypes.func.isRequired, null);
      expectWarningInProduction(PropTypes.func.isRequired, undefined);
      expectWarningInProduction(PropTypes.number, function() {});
      expectWarningInProduction(PropTypes.number, 42);
      expectWarningInProduction(PropTypes.number.isRequired, function() {});
      expectWarningInProduction(PropTypes.number.isRequired, 42);
      expectWarningInProduction(PropTypes.number.isRequired, null);
      expectWarningInProduction(PropTypes.number.isRequired, undefined);
      expectWarningInProduction(PropTypes.string, 0);
      expectWarningInProduction(PropTypes.string, 'foo');
      expectWarningInProduction(PropTypes.string.isRequired, 0);
      expectWarningInProduction(PropTypes.string.isRequired, 'foo');
      expectWarningInProduction(PropTypes.string.isRequired, null);
      expectWarningInProduction(PropTypes.string.isRequired, undefined);
      expectWarningInProduction(PropTypes.symbol, 0);
      expectWarningInProduction(PropTypes.symbol, Symbol('Foo'));
      expectWarningInProduction(PropTypes.symbol.isRequired, 0);
      expectWarningInProduction(PropTypes.symbol.isRequired, Symbol('Foo'));
      expectWarningInProduction(PropTypes.symbol.isRequired, null);
      expectWarningInProduction(PropTypes.symbol.isRequired, undefined);
      expectWarningInProduction(PropTypes.object, '');
      expectWarningInProduction(PropTypes.object, {foo: 'bar'});
      expectWarningInProduction(PropTypes.object.isRequired, '');
      expectWarningInProduction(PropTypes.object.isRequired, {foo: 'bar'});
      expectWarningInProduction(PropTypes.object.isRequired, null);
      expectWarningInProduction(PropTypes.object.isRequired, undefined);
    });
  });


  describe('Any Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      expectWarningInProduction(PropTypes.any, null);
      expectWarningInProduction(PropTypes.any.isRequired, null);
      expectWarningInProduction(PropTypes.any.isRequired, undefined);
    });
  });

  describe('ArrayOf Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      expectWarningInProduction(
      PropTypes.arrayOf({ foo: PropTypes.string }),
        { foo: 'bar' }
      );
      expectWarningInProduction(
        PropTypes.arrayOf(PropTypes.number),
        [1, 2, 'b']
      );
      expectWarningInProduction(
        PropTypes.arrayOf(PropTypes.number),
        {'0': 'maybe-array', length: 1}
      );
      expectWarningInProduction(PropTypes.arrayOf(PropTypes.number).isRequired, null);
      expectWarningInProduction(PropTypes.arrayOf(PropTypes.number).isRequired, undefined);
    });
  });


  describe('Component Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      expectWarningInProduction(PropTypes.element, [<div />, <div />]);
      expectWarningInProduction(PropTypes.element, <div />);
      expectWarningInProduction(PropTypes.element, 123);
      expectWarningInProduction(PropTypes.element, 'foo');
      expectWarningInProduction(PropTypes.element, false);
      expectWarningInProduction(PropTypes.element.isRequired, null);
      expectWarningInProduction(PropTypes.element.isRequired, undefined);
    });
  });

  describe('Instance Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      expectWarningInProduction(PropTypes.instanceOf(Date), {});
      expectWarningInProduction(PropTypes.instanceOf(Date), new Date());
      expectWarningInProduction(PropTypes.instanceOf(Date).isRequired, {});
      expectWarningInProduction(PropTypes.instanceOf(Date).isRequired, new Date());
    });
  });

  describe('React Component Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      expectWarningInProduction(PropTypes.node, 'node');
      expectWarningInProduction(PropTypes.node, {});
      expectWarningInProduction(PropTypes.node.isRequired, 'node');
      expectWarningInProduction(PropTypes.node.isRequired, undefined);
      expectWarningInProduction(PropTypes.node.isRequired, undefined);
    });
  });

  describe('ObjectOf Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      expectWarningInProduction(
        PropTypes.objectOf({ foo: PropTypes.string }),
        { foo: 'bar' }
      );
      expectWarningInProduction(
        PropTypes.objectOf(PropTypes.number),
        {a: 1, b: 2, c: 'b'}
      );
      expectWarningInProduction(PropTypes.objectOf(PropTypes.number), [1, 2]);
      expectWarningInProduction(PropTypes.objectOf(PropTypes.number), null);
      expectWarningInProduction(PropTypes.objectOf(PropTypes.number), undefined);
    });
  });

  describe('OneOf Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      expectWarningInProduction(PropTypes.oneOf('red', 'blue'), 'red');
      expectWarningInProduction(PropTypes.oneOf(['red', 'blue']), true);
      expectWarningInProduction(PropTypes.oneOf(['red', 'blue']), null);
      expectWarningInProduction(PropTypes.oneOf(['red', 'blue']), undefined);
    });
  });

  describe('Union Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      expectWarningInProduction(
        PropTypes.oneOfType(PropTypes.string, PropTypes.number),
        'red'
      );
      expectWarningInProduction(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        []
      );
      expectWarningInProduction(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        null
      );
      expectWarningInProduction(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        undefined
      );
    });
  });

  describe('Shape Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      expectWarningInProduction(PropTypes.shape({}), 'some string');
      expectWarningInProduction(PropTypes.shape({ foo: PropTypes.number }), { foo: 42 });
      expectWarningInProduction(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        null
      );
      expectWarningInProduction(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        undefined
      );
      expectWarningInProduction(PropTypes.element, <div />);
    });
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
