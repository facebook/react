/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var PropTypes;
var React;
var ReactDOM;
var createReactClass;

// Catch stray warnings
var env = jasmine.getEnv();
var callCount = 0;
var oldError = console.error;
var newError = function() {
  callCount++;
  oldError.apply(this, arguments);
};
console.error = newError;
env.beforeEach(() => {
  callCount = 0;
  jasmine.addMatchers({
    toBeReset() {
      return {
        compare(actual) {
          if (actual !== newError && !jasmine.isSpy(actual)) {
            return {
              pass: false,
              message: 'Test did not tear down console.error mock properly.'
            };
          }
          return {pass: true};
        }
      };
    },
    toNotHaveBeenCalled() {
      return {
        compare(actual) {
          return {
            pass: callCount === 0,
            message:
              'Expected test not to warn. If the warning is expected, mock ' +
                "it out using spyOn(console, 'error'); and test that the " +
                'warning occurs.'
          };
        }
      };
    }
  });
});
env.afterEach(() => {
  expect(console.error).toBeReset();
  expect(console.error).toNotHaveBeenCalled();
});

// Suppress warning expectations for prod builds
function suppressDevMatcher(obj, name) {
  const original = obj[name];
  obj[name] = function devMatcher() {
    try {
      original.apply(this, arguments);
    } catch (e) {
      // skip
    }
  };
}
function expectDev(actual) {
  const expectation = expect(actual);
  if (process.env.NODE_ENV === 'production') {
    Object.keys(expectation).forEach(name => {
      suppressDevMatcher(expectation, name);
      suppressDevMatcher(expectation.not, name);
    });
  }
  return expectation;
}

function renderIntoDocument(element) {
  var node = document.createElement('div');
  return ReactDOM.render(element, node);
}

describe('ReactClass-spec', () => {
  beforeEach(() => {
    PropTypes = require('prop-types');
    React = require('react');
    ReactDOM = require('react-dom');
    createReactClass = require(process.env.TEST_ENTRY);
  });

  it('should throw when `render` is not specified', () => {
    expect(function() {
      createReactClass({});
    }).toThrowError(
      'createClass(...): Class specification must implement a `render` method.'
    );
  });

  // TODO: Update babel-plugin-transform-react-display-name
  xit('should copy `displayName` onto the Constructor', () => {
    var TestComponent = createReactClass({
      render: function() {
        return <div />;
      }
    });

    expect(TestComponent.displayName).toBe('TestComponent');
  });

  it('should copy prop types onto the Constructor', () => {
    var propValidator = jest.fn();
    var TestComponent = createReactClass({
      propTypes: {
        value: propValidator
      },
      render: function() {
        return <div />;
      }
    });

    expect(TestComponent.propTypes).toBeDefined();
    expect(TestComponent.propTypes.value).toBe(propValidator);
  });

  it('should warn on invalid prop types', () => {
    spyOn(console, 'error');
    createReactClass({
      displayName: 'Component',
      propTypes: {
        prop: null
      },
      render: function() {
        return <span>{this.props.prop}</span>;
      }
    });
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Component: prop type `prop` is invalid; ' +
        'it must be a function, usually from React.PropTypes.'
    );
  });

  it('should warn on invalid context types', () => {
    spyOn(console, 'error');
    createReactClass({
      displayName: 'Component',
      contextTypes: {
        prop: null
      },
      render: function() {
        return <span>{this.props.prop}</span>;
      }
    });
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Component: context type `prop` is invalid; ' +
        'it must be a function, usually from React.PropTypes.'
    );
  });

  it('should throw on invalid child context types', () => {
    spyOn(console, 'error');
    createReactClass({
      displayName: 'Component',
      childContextTypes: {
        prop: null
      },
      render: function() {
        return <span>{this.props.prop}</span>;
      }
    });
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Component: child context type `prop` is invalid; ' +
        'it must be a function, usually from React.PropTypes.'
    );
  });

  it('should warn when mispelling shouldComponentUpdate', () => {
    spyOn(console, 'error');

    createReactClass({
      componentShouldUpdate: function() {
        return false;
      },
      render: function() {
        return <div />;
      }
    });
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: A component has a method called componentShouldUpdate(). Did you ' +
        'mean shouldComponentUpdate()? The name is phrased as a question ' +
        'because the function is expected to return a value.'
    );

    createReactClass({
      displayName: 'NamedComponent',
      componentShouldUpdate: function() {
        return false;
      },
      render: function() {
        return <div />;
      }
    });
    expectDev(console.error.calls.count()).toBe(2);
    expectDev(console.error.calls.argsFor(1)[0]).toBe(
      'Warning: NamedComponent has a method called componentShouldUpdate(). Did you ' +
        'mean shouldComponentUpdate()? The name is phrased as a question ' +
        'because the function is expected to return a value.'
    );
  });

  it('should warn when mispelling componentWillReceiveProps', () => {
    spyOn(console, 'error');
    createReactClass({
      componentWillRecieveProps: function() {
        return false;
      },
      render: function() {
        return <div />;
      }
    });
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: A component has a method called componentWillRecieveProps(). Did you ' +
        'mean componentWillReceiveProps()?'
    );
  });

  it('should throw if a reserved property is in statics', () => {
    expect(function() {
      createReactClass({
        statics: {
          getDefaultProps: function() {
            return {
              foo: 0
            };
          }
        },

        render: function() {
          return <span />;
        }
      });
    }).toThrowError(
      'ReactClass: You are attempting to define a reserved property, ' +
        '`getDefaultProps`, that shouldn\'t be on the "statics" key. Define ' +
        'it as an instance property instead; it will still be accessible on ' +
        'the constructor.'
    );
  });

  // TODO: Consider actually moving these to statics or drop this unit test.
  xit('should warn when using deprecated non-static spec keys', () => {
    spyOn(console, 'error');
    createReactClass({
      mixins: [{}],
      propTypes: {
        foo: PropTypes.string
      },
      contextTypes: {
        foo: PropTypes.string
      },
      childContextTypes: {
        foo: PropTypes.string
      },
      render: function() {
        return <div />;
      }
    });
    expectDev(console.error.calls.count()).toBe(4);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'createClass(...): `mixins` is now a static property and should ' +
        'be defined inside "statics".'
    );
    expectDev(console.error.calls.argsFor(1)[0]).toBe(
      'createClass(...): `propTypes` is now a static property and should ' +
        'be defined inside "statics".'
    );
    expectDev(console.error.calls.argsFor(2)[0]).toBe(
      'createClass(...): `contextTypes` is now a static property and ' +
        'should be defined inside "statics".'
    );
    expectDev(console.error.calls.argsFor(3)[0]).toBe(
      'createClass(...): `childContextTypes` is now a static property and ' +
        'should be defined inside "statics".'
    );
  });

  it('should support statics', () => {
    var Component = createReactClass({
      statics: {
        abc: 'def',
        def: 0,
        ghi: null,
        jkl: 'mno',
        pqr: function() {
          return this;
        }
      },

      render: function() {
        return <span />;
      }
    });
    var instance = <Component />;
    instance = renderIntoDocument(instance);
    expect(instance.constructor.abc).toBe('def');
    expect(Component.abc).toBe('def');
    expect(instance.constructor.def).toBe(0);
    expect(Component.def).toBe(0);
    expect(instance.constructor.ghi).toBe(null);
    expect(Component.ghi).toBe(null);
    expect(instance.constructor.jkl).toBe('mno');
    expect(Component.jkl).toBe('mno');
    expect(instance.constructor.pqr()).toBe(Component);
    expect(Component.pqr()).toBe(Component);
  });

  it('should work with object getInitialState() return values', () => {
    var Component = createReactClass({
      getInitialState: function() {
        return {
          occupation: 'clown'
        };
      },
      render: function() {
        return <span />;
      }
    });
    var instance = <Component />;
    instance = renderIntoDocument(instance);
    expect(instance.state.occupation).toEqual('clown');
  });

  it('renders based on context getInitialState', () => {
    var Foo = createReactClass({
      contextTypes: {
        className: PropTypes.string
      },
      getInitialState() {
        return {className: this.context.className};
      },
      render() {
        return <span className={this.state.className} />;
      }
    });

    var Outer = createReactClass({
      childContextTypes: {
        className: PropTypes.string
      },
      getChildContext() {
        return {className: 'foo'};
      },
      render() {
        return <Foo />;
      }
    });

    var container = document.createElement('div');
    ReactDOM.render(<Outer />, container);
    expect(container.firstChild.className).toBe('foo');
  });

  it('should throw with non-object getInitialState() return values', () => {
    spyOn(console, 'error');

    [['an array'], 'a string', 1234].forEach(function(state) {
      var Component = createReactClass({
        getInitialState: function() {
          return state;
        },
        render: function() {
          return <span />;
        }
      });
      var instance = <Component />;
      expect(function() {
        instance = renderIntoDocument(instance);
      }).toThrowError(
        'Component.getInitialState(): must return an object or null'
      );
    });
  });

  it('should work with a null getInitialState() return value', () => {
    var Component = createReactClass({
      getInitialState: function() {
        return null;
      },
      render: function() {
        return <span />;
      }
    });
    expect(() => renderIntoDocument(<Component />)).not.toThrow();
  });

  it('should throw when using legacy factories', () => {
    spyOn(console, 'error');
    var Component = createReactClass({
      render() {
        return <div />;
      }
    });

    expect(() => Component()).toThrow();
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Something is calling a React component directly. Use a ' +
        'factory or JSX instead. See: https://fb.me/react-legacyfactory'
    );
  });

  it('replaceState and callback works', () => {
    var ops = [];
    var Component = createReactClass({
      getInitialState() {
        return {step: 0};
      },
      render() {
        ops.push('Render: ' + this.state.step);
        return <div />;
      }
    });

    var instance = renderIntoDocument(<Component />);
    instance.replaceState({step: 1}, () => {
      ops.push('Callback: ' + instance.state.step);
    });
    expect(ops).toEqual(['Render: 0', 'Render: 1', 'Callback: 1']);
  });

  it('isMounted works', () => {
    spyOn(console, 'error');

    var ops = [];
    var instance;
    var Component = createReactClass({
      displayName: 'MyComponent',
      mixins: [
        {
          componentWillMount() {
            this.log('mixin.componentWillMount');
          },
          componentDidMount() {
            this.log('mixin.componentDidMount');
          },
          componentWillUpdate() {
            this.log('mixin.componentWillUpdate');
          },
          componentDidUpdate() {
            this.log('mixin.componentDidUpdate');
          },
          componentWillUnmount() {
            this.log('mixin.componentWillUnmount');
          }
        }
      ],
      log(name) {
        ops.push(`${name}: ${this.isMounted()}`);
      },
      getInitialState() {
        this.log('getInitialState');
        return {};
      },
      componentWillMount() {
        this.log('componentWillMount');
      },
      componentDidMount() {
        this.log('componentDidMount');
      },
      componentWillUpdate() {
        this.log('componentWillUpdate');
      },
      componentDidUpdate() {
        this.log('componentDidUpdate');
      },
      componentWillUnmount() {
        this.log('componentWillUnmount');
      },
      render() {
        instance = this;
        this.log('render');
        return <div />;
      }
    });

    var container = document.createElement('div');
    ReactDOM.render(<Component />, container);
    ReactDOM.render(<Component />, container);
    ReactDOM.unmountComponentAtNode(container);
    instance.log('after unmount');
    expect(ops).toEqual([
      'getInitialState: false',
      'mixin.componentWillMount: false',
      'componentWillMount: false',
      'render: false',
      'mixin.componentDidMount: true',
      'componentDidMount: true',
      'mixin.componentWillUpdate: true',
      'componentWillUpdate: true',
      'render: true',
      'mixin.componentDidUpdate: true',
      'componentDidUpdate: true',
      'mixin.componentWillUnmount: true',
      'componentWillUnmount: true',
      'after unmount: false'
    ]);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toEqual(
      'Warning: MyComponent: isMounted is deprecated. Instead, make sure to ' +
        'clean up subscriptions and pending requests in componentWillUnmount ' +
        'to prevent memory leaks.'
    );
  });

  it('should support getInitialState mixin', () => {
    const Component = createReactClass({
      mixins: [{
        getInitialState: function(props) {
          return {
            foo: 'foo'
          };
        },
      }],
      getInitialState: function(props) {
        return {
          bar: 'bar'
        };
      },
      render: function() {
        return <div />;
      }
    });
    const instance = renderIntoDocument(<Component />);
    expect(instance.state.foo).toEqual('foo');
    expect(instance.state.bar).toEqual('bar');
  });

  it('should merge return values for static getDerivedStateFromProps mixin', () => {
    const Component = createReactClass({
      mixins: [{
        statics: {
          getDerivedStateFromProps: function(props, prevState) {
            return {
              foo: 'foo'
            };
          }
        },
      }],
      statics: {
        getDerivedStateFromProps: function(props, prevState) {
          return {
            bar: 'bar'
          };
        }
      },
      render: function() {
        return <div />;
      }
    });

    const state = Component.getDerivedStateFromProps();
    expect(state.foo).toEqual('foo');
    expect(state.bar).toEqual('bar');
  });
});
