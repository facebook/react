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
    global.process = {env: {NODE_ENV: 'production'}};

    jest.resetModuleRegistry();
    PropTypes = require('ReactPropTypes');
    React = require('React');
    ReactPropTypeLocations = require('ReactPropTypeLocations');
    ReactTestUtils = require('ReactTestUtils');
  });

  afterEach(function() {
    __DEV__ = true;
    global.process = oldProcess;
  });

  function typeCheckPass(declaration, value) {
    var props = {testProp: value};
    var error = declaration(
      props,
      'testProp',
      'testComponent',
      ReactPropTypeLocations.prop
    );
    expect(error).toBe(null);
  }

  describe('Primitive Types', function() {
    it('should be a no-op', function() {
      typeCheckPass(PropTypes.array, /please/);
      typeCheckPass(PropTypes.array.isRequired, /please/);
      typeCheckPass(PropTypes.array.isRequired, null);
      typeCheckPass(PropTypes.array.isRequired, undefined);
      typeCheckPass(PropTypes.bool, []);
      typeCheckPass(PropTypes.bool.isRequired, []);
      typeCheckPass(PropTypes.bool.isRequired, null);
      typeCheckPass(PropTypes.bool.isRequired, undefined);
      typeCheckPass(PropTypes.func, false);
      typeCheckPass(PropTypes.func.isRequired, false);
      typeCheckPass(PropTypes.func.isRequired, null);
      typeCheckPass(PropTypes.func.isRequired, undefined);
      typeCheckPass(PropTypes.number, function() {});
      typeCheckPass(PropTypes.number.isRequired, function() {});
      typeCheckPass(PropTypes.number.isRequired, null);
      typeCheckPass(PropTypes.number.isRequired, undefined);
      typeCheckPass(PropTypes.string, 0);
      typeCheckPass(PropTypes.string.isRequired, 0);
      typeCheckPass(PropTypes.string.isRequired, null);
      typeCheckPass(PropTypes.string.isRequired, undefined);
      typeCheckPass(PropTypes.symbol, 0);
      typeCheckPass(PropTypes.symbol.isRequired, 0);
      typeCheckPass(PropTypes.symbol.isRequired, null);
      typeCheckPass(PropTypes.symbol.isRequired, undefined);
      typeCheckPass(PropTypes.object, '');
      typeCheckPass(PropTypes.object.isRequired, '');
      typeCheckPass(PropTypes.object.isRequired, null);
      typeCheckPass(PropTypes.object.isRequired, undefined);
    });
  })

  describe('Any Type', function() {
    it('should be a no-op', function() {
      typeCheckPass(PropTypes.any, null);
      typeCheckPass(PropTypes.any.isRequired, null);
      typeCheckPass(PropTypes.any.isRequired, undefined);
    });
  });

  describe('ArrayOf Type', function() {
    it('should be a no-op', function() {
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
    it('should be a no-op', function() {
      typeCheckPass(PropTypes.element, [<div />, <div />]);
      typeCheckPass(PropTypes.element, 123);
      typeCheckPass(PropTypes.element, 'foo');
      typeCheckPass(PropTypes.element, false);
      typeCheckPass(PropTypes.element.isRequired, null);
      typeCheckPass(PropTypes.element.isRequired, undefined);
    });
  });

  describe('Instance Types', function() {
    it('should be a no-op', function() {
      typeCheckPass(PropTypes.instanceOf(Date), {});
      typeCheckPass(PropTypes.instanceOf(Date).isRequired, {});
    });
  });

  describe('React Component Types', function() {
    it('should be a no-op', function() {
      typeCheckPass(PropTypes.node, {});
      typeCheckPass(PropTypes.node.isRequired, null);
      typeCheckPass(PropTypes.node.isRequired, undefined);
    });
  });

  describe('ObjectOf Type', function() {
    it('should be a no-op', function() {
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
    it('should be a no-op', function() {
      typeCheckPass(PropTypes.oneOf('red', 'blue'), 'red');
      typeCheckPass(PropTypes.oneOf(['red', 'blue']), true);
      typeCheckPass(PropTypes.oneOf(['red', 'blue']), null);
      typeCheckPass(PropTypes.oneOf(['red', 'blue']), undefined);
    });
  });

  describe('Union Types', function() {
    it('should be a no-op', function() {
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
    it('should be a no-op', function() {
      typeCheckPass(PropTypes.shape({}), 'some string');
      typeCheckPass(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        null
      );
      typeCheckPass(
        PropTypes.shape({key: PropTypes.number}).isRequired,
        undefined
      );
    });
  });

  describe('Custom validator', function() {
    beforeEach(function() {
      jest.resetModuleRegistry();
    });

    it('should not have been called', function() {
      var spy = jasmine.createSpy();
      var Component = React.createClass({
        propTypes: {num: spy},

        render: function() {
          return <div />;
        },
      });

      var instance = <Component num={5} />;
      instance = ReactTestUtils.renderIntoDocument(instance);

      expect(spy.calls.count()).toBe(0);
    });
  });
});
