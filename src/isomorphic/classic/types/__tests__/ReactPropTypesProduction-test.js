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
  var ReactPropTypeLocations;
  var ReactTestUtils;

  beforeEach(function() {
    __DEV__ = false;
    oldProcess = process;
    global.process = {
      env: Object.assign({}, process.env, {NODE_ENV: 'production'}),
    };

    jest.resetModules();
    PropTypes = require('ReactPropTypes');
    React = require('React');
    ReactPropTypeLocations = require('ReactPropTypeLocations');
    ReactTestUtils = require('ReactTestUtils');
  });

  afterEach(function() {
    __DEV__ = true;
    global.process = oldProcess;
  });

  function expectThrowsInProduction(declaration, value) {
    var props = {testProp: value};
    expect(() => {
      declaration(
        props,
        'testProp',
        'testComponent',
        ReactPropTypeLocations.prop
      );
    }).toThrowError(
      'React.PropTypes type checking code is stripped in production.'
    );
  }

  describe('Primitive Types', function() {
    it('should be a no-op', function() {
      expectThrowsInProduction(PropTypes.array, /please/);
      expectThrowsInProduction(PropTypes.array.isRequired, /please/);
      expectThrowsInProduction(PropTypes.array.isRequired, null);
      expectThrowsInProduction(PropTypes.array.isRequired, undefined);
      expectThrowsInProduction(PropTypes.bool, []);
      expectThrowsInProduction(PropTypes.bool.isRequired, []);
      expectThrowsInProduction(PropTypes.bool.isRequired, null);
      expectThrowsInProduction(PropTypes.bool.isRequired, undefined);
      expectThrowsInProduction(PropTypes.func, false);
      expectThrowsInProduction(PropTypes.func.isRequired, false);
      expectThrowsInProduction(PropTypes.func.isRequired, null);
      expectThrowsInProduction(PropTypes.func.isRequired, undefined);
      expectThrowsInProduction(PropTypes.number, function() {});
      expectThrowsInProduction(PropTypes.number.isRequired, function() {});
      expectThrowsInProduction(PropTypes.number.isRequired, null);
      expectThrowsInProduction(PropTypes.number.isRequired, undefined);
      expectThrowsInProduction(PropTypes.string, 0);
      expectThrowsInProduction(PropTypes.string.isRequired, 0);
      expectThrowsInProduction(PropTypes.string.isRequired, null);
      expectThrowsInProduction(PropTypes.string.isRequired, undefined);
      expectThrowsInProduction(PropTypes.symbol, 0);
      expectThrowsInProduction(PropTypes.symbol.isRequired, 0);
      expectThrowsInProduction(PropTypes.symbol.isRequired, null);
      expectThrowsInProduction(PropTypes.symbol.isRequired, undefined);
      expectThrowsInProduction(PropTypes.object, '');
      expectThrowsInProduction(PropTypes.object.isRequired, '');
      expectThrowsInProduction(PropTypes.object.isRequired, null);
      expectThrowsInProduction(PropTypes.object.isRequired, undefined);
    });
  });

  describe('Any Type', function() {
    it('should be a no-op', function() {
      expectThrowsInProduction(PropTypes.any, null);
      expectThrowsInProduction(PropTypes.any.isRequired, null);
      expectThrowsInProduction(PropTypes.any.isRequired, undefined);
    });
  });

  describe('ArrayOf Type', function() {
    it('should be a no-op', function() {
      expectThrowsInProduction(
        PropTypes.arrayOf({ foo: PropTypes.string }),
        { foo: 'bar' }
      );
      expectThrowsInProduction(
        PropTypes.arrayOf(PropTypes.number),
        [1, 2, 'b']
      );
      expectThrowsInProduction(
        PropTypes.arrayOf(PropTypes.number),
        {'0': 'maybe-array', length: 1}
      );
      expectThrowsInProduction(PropTypes.arrayOf(PropTypes.number).isRequired, null);
      expectThrowsInProduction(PropTypes.arrayOf(PropTypes.number).isRequired, undefined);
    });
  });

  describe('Component Type', function() {
    it('should be a no-op', function() {
      expectThrowsInProduction(PropTypes.element, [<div />, <div />]);
      expectThrowsInProduction(PropTypes.element, 123);
      expectThrowsInProduction(PropTypes.element, 'foo');
      expectThrowsInProduction(PropTypes.element, false);
      expectThrowsInProduction(PropTypes.element.isRequired, null);
      expectThrowsInProduction(PropTypes.element.isRequired, undefined);
    });
  });

  describe('Instance Types', function() {
    it('should be a no-op', function() {
      expectThrowsInProduction(PropTypes.instanceOf(Date), {});
      expectThrowsInProduction(PropTypes.instanceOf(Date).isRequired, {});
    });
  });

  describe('React Component Types', function() {
    it('should be a no-op', function() {
      expectThrowsInProduction(PropTypes.node, {});
      expectThrowsInProduction(PropTypes.node.isRequired, null);
      expectThrowsInProduction(PropTypes.node.isRequired, undefined);
    });
  });

  describe('ObjectOf Type', function() {
    it('should be a no-op', function() {
      expectThrowsInProduction(
        PropTypes.objectOf({ foo: PropTypes.string }),
        { foo: 'bar' }
      );
      expectThrowsInProduction(
        PropTypes.objectOf(PropTypes.number),
        {a: 1, b: 2, c: 'b'}
      );
      expectThrowsInProduction(PropTypes.objectOf(PropTypes.number), [1, 2]);
      expectThrowsInProduction(PropTypes.objectOf(PropTypes.number), null);
      expectThrowsInProduction(PropTypes.objectOf(PropTypes.number), undefined);
    });
  });

  describe('OneOf Types', function() {
    it('should be a no-op', function() {
      expectThrowsInProduction(PropTypes.oneOf('red', 'blue'), 'red');
      expectThrowsInProduction(PropTypes.oneOf(['red', 'blue']), true);
      expectThrowsInProduction(PropTypes.oneOf(['red', 'blue']), null);
      expectThrowsInProduction(PropTypes.oneOf(['red', 'blue']), undefined);
    });
  });

  describe('Union Types', function() {
    it('should be a no-op', function() {
      expectThrowsInProduction(
        PropTypes.oneOfType(PropTypes.string, PropTypes.number),
        'red'
      );
      expectThrowsInProduction(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        []
      );
      expectThrowsInProduction(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        null
      );
      expectThrowsInProduction(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        undefined
      );
    });
  });

  describe('Shape Types', function() {
    it('should be a no-op', function() {
      expectThrowsInProduction(PropTypes.shape({}), 'some string');
      expectThrowsInProduction(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        null
      );
      expectThrowsInProduction(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        undefined
      );
    });
  });

  describe('Custom validator', function() {
    beforeEach(function() {
      jest.resetModules();
    });

    it('should not have been called', function() {
      var spy = jest.fn();
      var Component = React.createClass({
        propTypes: {num: spy},

        render: function() {
          return <div />;
        },
      });

      var instance = <Component num={5} />;
      ReactTestUtils.renderIntoDocument(instance);

      expect(spy).not.toBeCalled();
    });
  });
});
