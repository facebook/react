/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var mocks = require('mocks');

var React;
var ReactTestUtils;

describe('ReactClass-spec', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    spyOn(console, 'warn');
  });

  it('should throw when `render` is not specified', function() {
    expect(function() {
      React.createClass({});
    }).toThrow(
      'Invariant Violation: createClass(...): Class specification must ' +
      'implement a `render` method.'
    );
  });

  it('should copy `displayName` onto the Constructor', function() {
    var TestComponent = React.createClass({
      render: function() {
        return <div />;
      }
    });

    expect(TestComponent.displayName)
      .toBe('TestComponent');
  });

  it('should warn when accessing .type on a React class', function() {
    var TestComponent = React.createClass({
      render: function() {
        return <div />;
      }
    });
    var SecondTestComponent = React.createClass({
      render: function() {
        return <div />;
      }
    });
    expect(TestComponent.type).toBe(TestComponent);
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: TestComponent.type is deprecated. Use TestComponent ' +
      'directly to access the class.'
    );
    // Warn once per class
    expect(SecondTestComponent.type).toBe(SecondTestComponent);
    expect(console.warn.argsForCall.length).toBe(2);
    expect(console.warn.argsForCall[1][0]).toBe(
      'Warning: SecondTestComponent.type is deprecated. Use ' +
      'SecondTestComponent directly to access the class.'
    );
    // Not again
    expect(TestComponent.type).toBe(TestComponent);
    expect(console.warn.argsForCall.length).toBe(2);
  });

  it('should copy prop types onto the Constructor', function() {
    var propValidator = mocks.getMockFunction();
    var TestComponent = React.createClass({
      propTypes: {
        value: propValidator
      },
      render: function() {
        return <div />;
      }
    });

    expect(TestComponent.propTypes).toBeDefined();
    expect(TestComponent.propTypes.value)
      .toBe(propValidator);
  });

  it('should warn on invalid prop types', function() {
    var warn = console.warn;
    console.warn = mocks.getMockFunction();
    try {

      React.createClass({
        displayName: 'Component',
        propTypes: {
          prop: null
        },
        render: function() {
          return <span>{this.props.prop}</span>;
        }
      });
      expect(console.warn.mock.calls.length).toBe(1);
      expect(console.warn.mock.calls[0][0]).toBe(
        'Warning: Component: prop type `prop` is invalid; ' +
        'it must be a function, usually from React.PropTypes.'
      );
    } finally {
      console.warn = warn;
    }
  });

  it('should warn on invalid context types', function() {
    var warn = console.warn;
    console.warn = mocks.getMockFunction();
    try {
      React.createClass({
        displayName: 'Component',
        contextTypes: {
          prop: null
        },
        render: function() {
          return <span>{this.props.prop}</span>;
        }
      });
      expect(console.warn.mock.calls.length).toBe(1);
      expect(console.warn.mock.calls[0][0]).toBe(
        'Warning: Component: context type `prop` is invalid; ' +
        'it must be a function, usually from React.PropTypes.'
      );
    } finally {
      console.warn = warn;
    }
  });

  it('should throw on invalid child context types', function() {
    var warn = console.warn;
    console.warn = mocks.getMockFunction();
    try {
      React.createClass({
        displayName: 'Component',
        childContextTypes: {
          prop: null
        },
        render: function() {
          return <span>{this.props.prop}</span>;
        }
      });
      expect(console.warn.mock.calls.length).toBe(1);
      expect(console.warn.mock.calls[0][0]).toBe(
        'Warning: Component: child context type `prop` is invalid; ' +
        'it must be a function, usually from React.PropTypes.'
      );
    } finally {
      console.warn = warn;
    }
  });

  it('should warn when mispelling shouldComponentUpdate', function() {
    React.createClass({
      componentShouldUpdate: function() {
        return false;
      },
      render: function() {
        return <div />;
      }
    });
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: A component has a method called componentShouldUpdate(). Did you ' +
      'mean shouldComponentUpdate()? The name is phrased as a question ' +
      'because the function is expected to return a value.'
    );

    var NamedComponent = React.createClass({
      componentShouldUpdate: function() {
        return false;
      },
      render: function() {
        return <div />;
      }
    });
    expect(console.warn.argsForCall.length).toBe(2);
    expect(console.warn.argsForCall[1][0]).toBe(
      'Warning: NamedComponent has a method called componentShouldUpdate(). Did you ' +
      'mean shouldComponentUpdate()? The name is phrased as a question ' +
      'because the function is expected to return a value.'
    );

    <NamedComponent />; // Shut up lint
  });

  it('should throw if a reserved property is in statics', function() {
    expect(function() {
      React.createClass({
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
    }).toThrow(
      'Invariant Violation: ReactClass: You are attempting to ' +
      'define a reserved property, `getDefaultProps`, that shouldn\'t be on ' +
      'the "statics" key. Define it as an instance property instead; it ' +
      'will still be accessible on the constructor.'
    );
  });

  // TODO: Consider actually moving these to statics or drop this unit test.

  xit('should warn when using deprecated non-static spec keys', function() {
    React.createClass({
      mixins: [{}],
      propTypes: {
        foo: React.PropTypes.string
      },
      contextTypes: {
        foo: React.PropTypes.string
      },
      childContextTypes: {
        foo: React.PropTypes.string
      },
      render: function() {
        return <div />;
      }
    });
    expect(console.warn.argsForCall.length).toBe(4);
    expect(console.warn.argsForCall[0][0]).toBe(
      'createClass(...): `mixins` is now a static property and should ' +
      'be defined inside "statics".'
    );
    expect(console.warn.argsForCall[1][0]).toBe(
      'createClass(...): `propTypes` is now a static property and should ' +
      'be defined inside "statics".'
    );
    expect(console.warn.argsForCall[2][0]).toBe(
      'createClass(...): `contextTypes` is now a static property and ' +
      'should be defined inside "statics".'
    );
    expect(console.warn.argsForCall[3][0]).toBe(
      'createClass(...): `childContextTypes` is now a static property and ' +
      'should be defined inside "statics".'
    );
  });

  it('should support statics', function() {
    var Component = React.createClass({
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
    instance = ReactTestUtils.renderIntoDocument(instance);
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

  it('should work with object getInitialState() return values', function() {
    var Component = React.createClass({
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
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state.occupation).toEqual('clown');
  });

  it('renders based on context getInitialState', function() {
    var Foo = React.createClass({
      contextTypes: {
        className: React.PropTypes.string
      },
      getInitialState() {
        return {className: this.context.className};
      },
      render() {
        return <span className={this.state.className} />;
      }
    });

    var Outer = React.createClass({
      childContextTypes: {
        className: React.PropTypes.string
      },
      getChildContext() {
        return {className: 'foo'};
      },
      render() {
        return <Foo />;
      }
    });

    var container = document.createElement('div');
    React.render(<Outer />, container);
    expect(container.firstChild.className).toBe('foo');
  });

  it('should throw with non-object getInitialState() return values', function() {
    [['an array'], 'a string', 1234].forEach(function(state) {
      var Component = React.createClass({
        getInitialState: function() {
          return state;
        },
        render: function() {
          return <span />;
        }
      });
      var instance = <Component />;
      expect(function() {
        instance = ReactTestUtils.renderIntoDocument(instance);
      }).toThrow(
        'Invariant Violation: Component.getInitialState(): ' +
        'must return an object or null'
      );
    });
  });

  it('should work with a null getInitialState() return value', function() {
    var Component = React.createClass({
      getInitialState: function() {
        return null;
      },
      render: function() {
        return <span />;
      }
    });
    expect(
      () => ReactTestUtils.renderIntoDocument(<Component />)
    ).not.toThrow();
  });

  it('should throw when using legacy factories', function() {
    var Component = React.createClass({
      render() {
        return <div />;
      }
    });

    expect(() => Component()).toThrow();
    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Something is calling a React component directly. Use a ' +
      'factory or JSX instead. See: https://fb.me/react-legacyfactory'
    );
  });

});
