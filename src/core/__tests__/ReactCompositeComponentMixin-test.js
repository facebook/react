/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

"use strict";

var mocks = require('mocks');

var React;
var ReactTestUtils;
var reactComponentExpect;

var TestComponent;
var TestComponentWithPropTypes;
var TestComponentWithReverseSpec;
var mixinPropValidator;
var componentPropValidator;

describe('ReactCompositeComponent-mixin', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');
    mixinPropValidator = mocks.getMockFunction();
    componentPropValidator = mocks.getMockFunction();

    var MixinA = {
      propTypes: {
        propA: function() {}
      },
      componentDidMount: function() {
        this.props.listener('MixinA didMount');
      }
    };

    var MixinB = {
      mixins: [MixinA],
      propTypes: {
        propB: function() {}
      },
      componentDidMount: function() {
        this.props.listener('MixinB didMount');
      }
    };

    var MixinBWithReverseSpec = {
      componentDidMount: function() {
        this.props.listener('MixinBWithReverseSpec didMount');
      },
      mixins: [MixinA]
    };

    var MixinC = {
      statics: {
        staticC: function() {}
      },
      componentDidMount: function() {
        this.props.listener('MixinC didMount');
      }
    };

    var MixinD = {
      propTypes: {
        value: mixinPropValidator
      }
    };

    TestComponent = React.createClass({
      mixins: [MixinB, MixinC, MixinD],
      statics: {
        staticComponent: function() {}
      },
      propTypes: {
        propComponent: function() {}
      },
      componentDidMount: function() {
        this.props.listener('Component didMount');
      },
      render: function() {
        return <div />;
      }
    });

    TestComponentWithReverseSpec = React.createClass({
      render: function() {
        return <div />;
      },
      componentDidMount: function() {
        this.props.listener('Component didMount');
      },
      mixins: [MixinBWithReverseSpec, MixinC, MixinD]
    });

    TestComponentWithPropTypes = React.createClass({
      mixins: [MixinD],
      propTypes: {
        value: componentPropValidator
      },
      render: function() {
        return <div />;
      }
    });
  });

  it('should support merging propTypes and statics', function() {
    var listener = mocks.getMockFunction();
    var instance = <TestComponent listener={listener} />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    var instancePropTypes = instance.constructor.propTypes;

    expect('propA' in instancePropTypes).toBe(true);
    expect('propB' in instancePropTypes).toBe(true);
    expect('propComponent' in instancePropTypes).toBe(true);

    expect('staticC' in TestComponent).toBe(true);
    expect('staticComponent' in TestComponent).toBe(true);
  });

  it('should support chaining delegate functions', function() {
    var listener = mocks.getMockFunction();
    var instance = <TestComponent listener={listener} />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(listener.mock.calls).toEqual([
      ['MixinA didMount'],
      ['MixinB didMount'],
      ['MixinC didMount'],
      ['Component didMount']
    ]);
  });

  it('should chain functions regardless of spec property order', function() {
    var listener = mocks.getMockFunction();
    var instance = <TestComponentWithReverseSpec listener={listener} />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(listener.mock.calls).toEqual([
      ['MixinA didMount'],
      ['MixinBWithReverseSpec didMount'],
      ['MixinC didMount'],
      ['Component didMount']
    ]);
  });

  it('should validate prop types via mixins', function() {
    expect(TestComponent.type.propTypes).toBeDefined();
    expect(TestComponent.type.propTypes.value)
      .toBe(mixinPropValidator);
  });

  it('should override mixin prop types with class prop types', function() {
    // Sanity check...
    expect(componentPropValidator).toNotBe(mixinPropValidator);
    // Actually check...
    expect(TestComponentWithPropTypes.type.propTypes)
      .toBeDefined();
    expect(TestComponentWithPropTypes.type.propTypes.value)
      .toNotBe(mixinPropValidator);
    expect(TestComponentWithPropTypes.type.propTypes.value)
      .toBe(componentPropValidator);
  });
});
