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

  function productionWarningCheck(declaration, value) {
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
      productionWarningCheck(PropTypes.array, /please/);
      productionWarningCheck(PropTypes.array, []);
      productionWarningCheck(PropTypes.array.isRequired, /please/);
      productionWarningCheck(PropTypes.array.isRequired, []);
      productionWarningCheck(PropTypes.array.isRequired, null);
      productionWarningCheck(PropTypes.array.isRequired, undefined);
      productionWarningCheck(PropTypes.bool, []);
      productionWarningCheck(PropTypes.bool, true);
      productionWarningCheck(PropTypes.bool.isRequired, []);
      productionWarningCheck(PropTypes.bool.isRequired, true);
      productionWarningCheck(PropTypes.bool.isRequired, null);
      productionWarningCheck(PropTypes.bool.isRequired, undefined);
      productionWarningCheck(PropTypes.func, false);
      productionWarningCheck(PropTypes.func, function() {});
      productionWarningCheck(PropTypes.func.isRequired, false);
      productionWarningCheck(PropTypes.func.isRequired, function() {});
      productionWarningCheck(PropTypes.func.isRequired, null);
      productionWarningCheck(PropTypes.func.isRequired, undefined);
      productionWarningCheck(PropTypes.number, function() {});
      productionWarningCheck(PropTypes.number, 42);
      productionWarningCheck(PropTypes.number.isRequired, function() {});
      productionWarningCheck(PropTypes.number.isRequired, 42);
      productionWarningCheck(PropTypes.number.isRequired, null);
      productionWarningCheck(PropTypes.number.isRequired, undefined);
      productionWarningCheck(PropTypes.string, 0);
      productionWarningCheck(PropTypes.string, 'foo');
      productionWarningCheck(PropTypes.string.isRequired, 0);
      productionWarningCheck(PropTypes.string.isRequired, 'foo');
      productionWarningCheck(PropTypes.string.isRequired, null);
      productionWarningCheck(PropTypes.string.isRequired, undefined);
      productionWarningCheck(PropTypes.symbol, 0);
      productionWarningCheck(PropTypes.symbol, Symbol('Foo'));
      productionWarningCheck(PropTypes.symbol.isRequired, 0);
      productionWarningCheck(PropTypes.symbol.isRequired, Symbol('Foo'));
      productionWarningCheck(PropTypes.symbol.isRequired, null);
      productionWarningCheck(PropTypes.symbol.isRequired, undefined);
      productionWarningCheck(PropTypes.object, '');
      productionWarningCheck(PropTypes.object, {foo: 'bar'});
      productionWarningCheck(PropTypes.object.isRequired, '');
      productionWarningCheck(PropTypes.object.isRequired, {foo: 'bar'});
      productionWarningCheck(PropTypes.object.isRequired, null);
      productionWarningCheck(PropTypes.object.isRequired, undefined);
    });
  });


  describe('Any Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      productionWarningCheck(PropTypes.any, null);
      productionWarningCheck(PropTypes.any.isRequired, null);
      productionWarningCheck(PropTypes.any.isRequired, undefined);
    });
  });

  describe('ArrayOf Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      productionWarningCheck(
      PropTypes.arrayOf({ foo: PropTypes.string }),
        { foo: 'bar' }
      );
      productionWarningCheck(
        PropTypes.arrayOf(PropTypes.number),
        [1, 2, 'b']
      );
      productionWarningCheck(
        PropTypes.arrayOf(PropTypes.number),
        {'0': 'maybe-array', length: 1}
      );
      productionWarningCheck(PropTypes.arrayOf(PropTypes.number).isRequired, null);
      productionWarningCheck(PropTypes.arrayOf(PropTypes.number).isRequired, undefined);
    });
  });


  describe('Component Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      productionWarningCheck(PropTypes.element, [<div />, <div />]);
      productionWarningCheck(PropTypes.element, <div />);
      productionWarningCheck(PropTypes.element, 123);
      productionWarningCheck(PropTypes.element, 'foo');
      productionWarningCheck(PropTypes.element, false);
      productionWarningCheck(PropTypes.element.isRequired, null);
      productionWarningCheck(PropTypes.element.isRequired, undefined);
    });
  });

  describe('Instance Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      productionWarningCheck(PropTypes.instanceOf(Date), {});
      productionWarningCheck(PropTypes.instanceOf(Date), new Date());
      productionWarningCheck(PropTypes.instanceOf(Date).isRequired, {});
      productionWarningCheck(PropTypes.instanceOf(Date).isRequired, new Date());
    });
  });

  describe('React Component Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      productionWarningCheck(PropTypes.node, 'node');
      productionWarningCheck(PropTypes.node, {});
      productionWarningCheck(PropTypes.node.isRequired, 'node');
      productionWarningCheck(PropTypes.node.isRequired, undefined);
      productionWarningCheck(PropTypes.node.isRequired, undefined);
    });
  });

  describe('ObjectOf Type', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      productionWarningCheck(
        PropTypes.objectOf({ foo: PropTypes.string }),
        { foo: 'bar' }
      );
      productionWarningCheck(
        PropTypes.objectOf(PropTypes.number),
        {a: 1, b: 2, c: 'b'}
      );
      productionWarningCheck(PropTypes.objectOf(PropTypes.number), [1, 2]);
      productionWarningCheck(PropTypes.objectOf(PropTypes.number), null);
      productionWarningCheck(PropTypes.objectOf(PropTypes.number), undefined);
    });
  });

  describe('OneOf Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      productionWarningCheck(PropTypes.oneOf('red', 'blue'), 'red');
      productionWarningCheck(PropTypes.oneOf(['red', 'blue']), true);
      productionWarningCheck(PropTypes.oneOf(['red', 'blue']), null);
      productionWarningCheck(PropTypes.oneOf(['red', 'blue']), undefined);
    });
  });

  describe('Union Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      productionWarningCheck(
        PropTypes.oneOfType(PropTypes.string, PropTypes.number),
        'red'
      );
      productionWarningCheck(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        []
      );
      productionWarningCheck(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        null
      );
      productionWarningCheck(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        undefined
      );
    });
  });

  describe('Shape Types', function() {
    it('should warn if called manually in production', function() {
      spyOn(console, 'error');
      productionWarningCheck(PropTypes.shape({}), 'some string');
      productionWarningCheck(PropTypes.shape({ foo: PropTypes.number }), { foo: 42 });
      productionWarningCheck(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        null
      );
      productionWarningCheck(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        undefined
      );
      productionWarningCheck(PropTypes.element, <div />);
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
