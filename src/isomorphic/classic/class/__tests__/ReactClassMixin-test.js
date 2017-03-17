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

var React;
var ReactTestUtils;

var TestComponent;
var TestComponentWithPropTypes;
var TestComponentWithReverseSpec;
var mixinPropValidator;
var componentPropValidator;

describe('ReactClass-mixin', () => {
  beforeEach(() => {
    React = require('react');
    ReactTestUtils = require('ReactTestUtils');
    mixinPropValidator = jest.fn();
    componentPropValidator = jest.fn();

    var MixinA = {
      propTypes: {
        propA: function() {},
      },
      componentDidMount: function() {
        this.props.listener('MixinA didMount');
      },
    };

    var MixinB = {
      mixins: [MixinA],
      propTypes: {
        propB: function() {},
      },
      componentDidMount: function() {
        this.props.listener('MixinB didMount');
      },
    };

    var MixinBWithReverseSpec = {
      componentDidMount: function() {
        this.props.listener('MixinBWithReverseSpec didMount');
      },
      mixins: [MixinA],
    };

    var MixinC = {
      statics: {
        staticC: function() {},
      },
      componentDidMount: function() {
        this.props.listener('MixinC didMount');
      },
    };

    var MixinD = {
      propTypes: {
        value: mixinPropValidator,
      },
    };

    TestComponent = React.createClass({
      mixins: [MixinB, MixinC, MixinD],
      statics: {
        staticComponent: function() {},
      },
      propTypes: {
        propComponent: function() {},
      },
      componentDidMount: function() {
        this.props.listener('Component didMount');
      },
      render: function() {
        return <div />;
      },
    });

    TestComponentWithReverseSpec = React.createClass({
      render: function() {
        return <div />;
      },
      componentDidMount: function() {
        this.props.listener('Component didMount');
      },
      mixins: [MixinBWithReverseSpec, MixinC, MixinD],
    });

    TestComponentWithPropTypes = React.createClass({
      mixins: [MixinD],
      propTypes: {
        value: componentPropValidator,
      },
      render: function() {
        return <div />;
      },
    });
  });

  it('should support merging propTypes and statics', () => {
    var listener = jest.fn();
    var instance = <TestComponent listener={listener} />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    var instancePropTypes = instance.constructor.propTypes;

    expect('propA' in instancePropTypes).toBe(true);
    expect('propB' in instancePropTypes).toBe(true);
    expect('propComponent' in instancePropTypes).toBe(true);

    expect('staticC' in TestComponent).toBe(true);
    expect('staticComponent' in TestComponent).toBe(true);
  });

  it('should support chaining delegate functions', () => {
    var listener = jest.fn();
    var instance = <TestComponent listener={listener} />;
    ReactTestUtils.renderIntoDocument(instance);

    expect(listener.mock.calls).toEqual([
      ['MixinA didMount'],
      ['MixinB didMount'],
      ['MixinC didMount'],
      ['Component didMount'],
    ]);
  });

  it('should chain functions regardless of spec property order', () => {
    var listener = jest.fn();
    var instance = <TestComponentWithReverseSpec listener={listener} />;
    ReactTestUtils.renderIntoDocument(instance);

    expect(listener.mock.calls).toEqual([
      ['MixinA didMount'],
      ['MixinBWithReverseSpec didMount'],
      ['MixinC didMount'],
      ['Component didMount'],
    ]);
  });

  it('should validate prop types via mixins', () => {
    expect(TestComponent.propTypes).toBeDefined();
    expect(TestComponent.propTypes.value).toBe(mixinPropValidator);
  });

  it('should override mixin prop types with class prop types', () => {
    // Sanity check...
    expect(componentPropValidator).not.toBe(mixinPropValidator);
    // Actually check...
    expect(TestComponentWithPropTypes.propTypes).toBeDefined();
    expect(TestComponentWithPropTypes.propTypes.value).not.toBe(
      mixinPropValidator,
    );
    expect(TestComponentWithPropTypes.propTypes.value).toBe(
      componentPropValidator,
    );
  });

  it('should support mixins with getInitialState()', () => {
    var Mixin = {
      getInitialState: function() {
        return {mixin: true};
      },
    };
    var Component = React.createClass({
      mixins: [Mixin],
      getInitialState: function() {
        return {component: true};
      },
      render: function() {
        return <span />;
      },
    });
    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.component).toBe(true);
    expect(instance.state.mixin).toBe(true);
  });

  it('should throw with conflicting getInitialState() methods', () => {
    var Mixin = {
      getInitialState: function() {
        return {x: true};
      },
    };
    var Component = React.createClass({
      mixins: [Mixin],
      getInitialState: function() {
        return {x: true};
      },
      render: function() {
        return <span />;
      },
    });
    expect(function() {
      ReactTestUtils.renderIntoDocument(<Component />);
    }).toThrowError(
      'mergeIntoWithNoDuplicateKeys(): Tried to merge two objects with the ' +
        'same key: `x`. This conflict may be due to a mixin; in particular, ' +
        'this may be caused by two getInitialState() or getDefaultProps() ' +
        'methods returning objects with clashing keys.',
    );
  });

  it('should not mutate objects returned by getInitialState()', () => {
    var Mixin = {
      getInitialState: function() {
        return Object.freeze({mixin: true});
      },
    };
    var Component = React.createClass({
      mixins: [Mixin],
      getInitialState: function() {
        return Object.freeze({component: true});
      },
      render: function() {
        return <span />;
      },
    });
    expect(() => {
      ReactTestUtils.renderIntoDocument(<Component />);
    }).not.toThrow();
  });

  it('should support statics in mixins', () => {
    var Mixin = {
      statics: {
        foo: 'bar',
      },
    };
    var Component = React.createClass({
      mixins: [Mixin],

      statics: {
        abc: 'def',
      },

      render: function() {
        return <span />;
      },
    });
    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.constructor.foo).toBe('bar');
    expect(Component.foo).toBe('bar');
    expect(instance.constructor.abc).toBe('def');
    expect(Component.abc).toBe('def');
  });

  it("should throw if mixins override each others' statics", () => {
    expect(function() {
      var Mixin = {
        statics: {
          abc: 'foo',
        },
      };
      React.createClass({
        mixins: [Mixin],

        statics: {
          abc: 'bar',
        },

        render: function() {
          return <span />;
        },
      });
    }).toThrowError(
      'ReactClass: You are attempting to define `abc` on your component more ' +
        'than once. This conflict may be due to a mixin.',
    );
  });

  it('should throw if mixins override functions in statics', () => {
    expect(function() {
      var Mixin = {
        statics: {
          abc: function() {
            console.log('foo');
          },
        },
      };
      React.createClass({
        mixins: [Mixin],

        statics: {
          abc: function() {
            console.log('bar');
          },
        },

        render: function() {
          return <span />;
        },
      });
    }).toThrowError(
      'ReactClass: You are attempting to define `abc` on your component ' +
        'more than once. This conflict may be due to a mixin.',
    );
  });

  it('should warn if the mixin is undefined', () => {
    spyOn(console, 'error');

    React.createClass({
      mixins: [undefined],

      render: function() {
        return <span />;
      },
    });

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      "Warning: ReactClass: You're attempting to include a mixin that is " +
        'either null or not an object. Check the mixins included by the ' +
        'component, as well as any mixins they include themselves. ' +
        'Expected object but got undefined.',
    );
  });

  it('should warn if the mixin is null', () => {
    spyOn(console, 'error');

    React.createClass({
      mixins: [null],

      render: function() {
        return <span />;
      },
    });

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      "Warning: ReactClass: You're attempting to include a mixin that is " +
        'either null or not an object. Check the mixins included by the ' +
        'component, as well as any mixins they include themselves. ' +
        'Expected object but got null.',
    );
  });

  it('should warn if an undefined mixin is included in another mixin', () => {
    spyOn(console, 'error');

    var mixinA = {
      mixins: [undefined],
    };

    React.createClass({
      mixins: [mixinA],

      render: function() {
        return <span />;
      },
    });

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      "Warning: ReactClass: You're attempting to include a mixin that is " +
        'either null or not an object. Check the mixins included by the ' +
        'component, as well as any mixins they include themselves. ' +
        'Expected object but got undefined.',
    );
  });

  it('should warn if a null mixin is included in another mixin', () => {
    spyOn(console, 'error');

    var mixinA = {
      mixins: [null],
    };

    React.createClass({
      mixins: [mixinA],

      render: function() {
        return <span />;
      },
    });

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      "Warning: ReactClass: You're attempting to include a mixin that is " +
        'either null or not an object. Check the mixins included by the ' +
        'component, as well as any mixins they include themselves. ' +
        'Expected object but got null.',
    );
  });

  it('should throw if the mixin is a React component', () => {
    expect(function() {
      React.createClass({
        mixins: [<div />],

        render: function() {
          return <span />;
        },
      });
    }).toThrowError(
      "ReactClass: You're attempting to use a component as a mixin. " +
        'Instead, just use a regular object.',
    );
  });

  it('should throw if the mixin is a React component class', () => {
    expect(function() {
      var Component = React.createClass({
        render: function() {
          return <span />;
        },
      });

      React.createClass({
        mixins: [Component],

        render: function() {
          return <span />;
        },
      });
    }).toThrowError(
      "ReactClass: You're attempting to use a component class or function " +
        'as a mixin. Instead, just use a regular object.',
    );
  });

  it('should have bound the mixin methods to the component', () => {
    var mixin = {
      mixinFunc: function() {
        return this;
      },
    };

    var Component = React.createClass({
      mixins: [mixin],
      componentDidMount: function() {
        expect(this.mixinFunc()).toBe(this);
      },
      render: function() {
        return <span />;
      },
    });
    ReactTestUtils.renderIntoDocument(<Component />);
  });

  it('should include the mixin keys in even if their values are falsy', () => {
    var mixin = {
      keyWithNullValue: null,
      randomCounter: 0,
    };

    var Component = React.createClass({
      mixins: [mixin],
      componentDidMount: function() {
        expect(this.randomCounter).toBe(0);
        expect(this.keyWithNullValue).toBeNull();
      },
      render: function() {
        return <span />;
      },
    });
    ReactTestUtils.renderIntoDocument(<Component />);
  });

  it('should work with a null getInitialState return value and a mixin', () => {
    var Component;
    var instance;

    var Mixin = {
      getInitialState: function() {
        return {foo: 'bar'};
      },
    };
    Component = React.createClass({
      mixins: [Mixin],
      getInitialState: function() {
        return null;
      },
      render: function() {
        return <span />;
      },
    });
    expect(() =>
      ReactTestUtils.renderIntoDocument(<Component />)).not.toThrow();

    instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state).toEqual({foo: 'bar'});

    // Also the other way round should work
    var Mixin2 = {
      getInitialState: function() {
        return null;
      },
    };
    Component = React.createClass({
      mixins: [Mixin2],
      getInitialState: function() {
        return {foo: 'bar'};
      },
      render: function() {
        return <span />;
      },
    });
    expect(() =>
      ReactTestUtils.renderIntoDocument(<Component />)).not.toThrow();

    instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state).toEqual({foo: 'bar'});

    // Multiple mixins should be fine too
    Component = React.createClass({
      mixins: [Mixin, Mixin2],
      getInitialState: function() {
        return {x: true};
      },
      render: function() {
        return <span />;
      },
    });
    expect(() =>
      ReactTestUtils.renderIntoDocument(<Component />)).not.toThrow();

    instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state).toEqual({foo: 'bar', x: true});
  });
});
