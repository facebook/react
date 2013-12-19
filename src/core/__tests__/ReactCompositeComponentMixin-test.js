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

var mocks = require('mocks');

var React;
var ReactTestUtils;
var reactComponentExpect;

var TestComponent;
var TestComponentWithPropTypes;
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
    ReactTestUtils.renderIntoDocument(instance);

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
    ReactTestUtils.renderIntoDocument(instance);

    expect(listener.mock.calls).toEqual([
      ['MixinA didMount'],
      ['MixinB didMount'],
      ['MixinC didMount'],
      ['Component didMount']
    ]);
  });

  it('should validate prop types via mixins', function() {
    expect(TestComponent.componentConstructor.propTypes).toBeDefined();
    expect(TestComponent.componentConstructor.propTypes.value)
      .toBe(mixinPropValidator);
  });

  it('should override mixin prop types with class prop types', function() {
    // Sanity check...
    expect(componentPropValidator).toNotBe(mixinPropValidator);
    // Actually check...
    expect(TestComponentWithPropTypes.componentConstructor.propTypes)
      .toBeDefined();
    expect(TestComponentWithPropTypes.componentConstructor.propTypes.value)
      .toNotBe(mixinPropValidator);
    expect(TestComponentWithPropTypes.componentConstructor.propTypes.value)
      .toBe(componentPropValidator);
  });
});
