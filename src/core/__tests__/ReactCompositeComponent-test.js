/**
 * Copyright 2013-2014 Facebook, Inc.
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

var MorphingComponent;
var ChildUpdates;
var React;
var ReactComponent;
var ReactCurrentOwner;
var ReactPropTypes;
var ReactTestUtils;
var ReactMount;
var ReactDoNotBindDeprecated;

var cx;
var reactComponentExpect;
var mocks;
var warn;

describe('ReactCompositeComponent', function() {

  beforeEach(function() {
    cx = require('cx');
    mocks = require('mocks');

    reactComponentExpect = require('reactComponentExpect');
    React = require('React');
    ReactComponent = require('ReactComponent');
    ReactCurrentOwner = require('ReactCurrentOwner');
    ReactDoNotBindDeprecated = require('ReactDoNotBindDeprecated');
    ReactPropTypes = require('ReactPropTypes');
    ReactTestUtils = require('ReactTestUtils');
    ReactMount = require('ReactMount');

    MorphingComponent = React.createClass({
      getInitialState: function() {
        return {activated: false};
      },

      _toggleActivatedState: function() {
        this.setState({activated: !this.state.activated});
      },

      render: function() {
        var toggleActivatedState = this._toggleActivatedState;
        return !this.state.activated ?
          <a ref="x" onClick={toggleActivatedState} /> :
          <b ref="x" onClick={toggleActivatedState} />;
      }
    });

    /**
     * We'll use this to ensure that an old version is not cached when it is
     * reallocated again.
     */
    ChildUpdates = React.createClass({
      getAnchorID: function() {
        return this.refs.anch._rootNodeID;
      },
      render: function() {
        var className = cx({'anchorClass': this.props.anchorClassOn});
        return this.props.renderAnchor ?
          <a ref="anch" className={className}></a> :
          <b></b>;
      }
    });

    warn = console.warn;
    console.warn = mocks.getMockFunction();
  });

  afterEach(function() {
    console.warn = warn;
  });

  it('should support rendering to different child types over time', function() {
    var instance = <MorphingComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    reactComponentExpect(instance)
      .expectRenderedChild()
      .toBeDOMComponentWithTag('a');

    instance._toggleActivatedState();
    reactComponentExpect(instance)
      .expectRenderedChild()
      .toBeDOMComponentWithTag('b');

    instance._toggleActivatedState();
    reactComponentExpect(instance)
      .expectRenderedChild()
      .toBeDOMComponentWithTag('a');
  });

  it('should react to state changes from callbacks', function() {
    var instance = <MorphingComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    var renderedChild = reactComponentExpect(instance)
      .expectRenderedChild()
      .instance();

    ReactTestUtils.Simulate.click(renderedChild);
    reactComponentExpect(instance)
      .expectRenderedChild()
      .toBeDOMComponentWithTag('b');
  });

  it('should rewire refs when rendering to different child types', function() {
    var instance = <MorphingComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    reactComponentExpect(instance.refs.x).toBeDOMComponentWithTag('a');
    instance._toggleActivatedState();
    reactComponentExpect(instance.refs.x).toBeDOMComponentWithTag('b');
    instance._toggleActivatedState();
    reactComponentExpect(instance.refs.x).toBeDOMComponentWithTag('a');
  });

  it('should not cache old DOM nodes when switching constructors', function() {
    var instance = <ChildUpdates renderAnchor={true} anchorClassOn={false}/>;
    instance = ReactTestUtils.renderIntoDocument(instance);
    instance.setProps({anchorClassOn: true});  // Warm any cache
    instance.setProps({renderAnchor: false});  // Clear out the anchor
    // rerender
    instance.setProps({renderAnchor: true, anchorClassOn: false});
    var anchorID = instance.getAnchorID();
    var actualDOMAnchorNode = ReactMount.getNode(anchorID);
    expect(actualDOMAnchorNode.className).toBe('');
  });

  it('should auto bind methods and values correctly', function() {
    spyOn(console, 'warn');

    var ComponentClass = React.createClass({
      getInitialState: function() {
        return {valueToReturn: 'hi'};
      },
      methodToBeExplicitlyBound: function() {
        return this;
      },
      methodAutoBound: function() {
        return this;
      },
      methodExplicitlyNotBound: ReactDoNotBindDeprecated.doNotBind(function() {
        return this;
      }),
      render: function() {
        return <div></div>;
      }
    });
    var instance = <ComponentClass />;

    // Next, prove that once mounted, the scope is bound correctly to the actual
    // component.
    var mountedInstance = ReactTestUtils.renderIntoDocument(instance);

    expect(function() {
      mountedInstance.methodToBeExplicitlyBound.bind(instance)();
    }).not.toThrow();
    expect(function() {
      mountedInstance.methodAutoBound();
    }).not.toThrow();
    expect(function() {
      mountedInstance.methodExplicitlyNotBound();
    }).not.toThrow();

    expect(console.warn.argsForCall.length).toBe(1);
    var explicitlyBound = mountedInstance.methodToBeExplicitlyBound.bind(
      mountedInstance
    );
    expect(console.warn.argsForCall.length).toBe(2);
    var autoBound = mountedInstance.methodAutoBound;
    var explicitlyNotBound = mountedInstance.methodExplicitlyNotBound;

    var context = {};
    expect(explicitlyBound.call(context)).toBe(mountedInstance);
    expect(autoBound.call(context)).toBe(mountedInstance);
    expect(explicitlyNotBound.call(context)).toBe(context);

    expect(explicitlyBound.call(mountedInstance)).toBe(mountedInstance);
    expect(autoBound.call(mountedInstance)).toBe(mountedInstance);
    // This one is the weird one
    expect(explicitlyNotBound.call(mountedInstance)).toBe(mountedInstance);

  });

  it('should use default values for undefined props', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        return {key: 'testKey'};
      },
      render: function() {
        return <span />;
      }
    });

    var instance1 = <Component />;
    instance1 = ReactTestUtils.renderIntoDocument(instance1);
    reactComponentExpect(instance1).scalarPropsEqual({key: 'testKey'});

    var instance2 = <Component key={undefined} />;
    instance2 = ReactTestUtils.renderIntoDocument(instance2);
    reactComponentExpect(instance2).scalarPropsEqual({key: 'testKey'});

    var instance3 = <Component key={null} />;
    instance3 = ReactTestUtils.renderIntoDocument(instance3);
    reactComponentExpect(instance3).scalarPropsEqual({key: null});
  });

  it('should not mutate passed-in props object', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        return {key: 'testKey'};
      },
      render: function() {
        return <span />;
      }
    });

    var inputProps = {};
    var instance1 = Component(inputProps);
    instance1 = ReactTestUtils.renderIntoDocument(instance1);
    expect(instance1.props.key).toBe('testKey');

    // We don't mutate the input, just in case the caller wants to do something
    // with it after using it to instantiate a component
    expect(inputProps.key).not.toBeDefined();
  });

  it('should use default prop value when removing a key', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        return {fruit: 'persimmon'};
      },
      render: function() {
        return <span />;
      }
    });

    var container = document.createElement('div');
    var instance = React.renderComponent(
      <Component fruit="mango" />,
      container
    );
    expect(instance.props.fruit).toBe('mango');

    React.renderComponent(<Component />, container);
    expect(instance.props.fruit).toBe('persimmon');
  });

  it('should normalize props with default values', function() {
    var Component = React.createClass({
      propTypes: {key: ReactPropTypes.string.isRequired},
      getDefaultProps: function() {
        return {key: 'testKey'};
      },
      getInitialState: function() {
        return {key: this.props.key + 'State'};
      },
      render: function() {
        return <span>{this.props.key}</span>;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    reactComponentExpect(instance).scalarPropsEqual({key: 'testKey'});
    reactComponentExpect(instance).scalarStateEqual({key: 'testKeyState'});

    ReactTestUtils.renderIntoDocument(<Component key={null} />);

    expect(console.warn.mock.calls.length).toBe(1);
    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Required prop `key` was not specified in `Component`.'
    );
  });

  it('should check default prop values', function() {
    var Component = React.createClass({
      propTypes: {key: ReactPropTypes.string.isRequired},
      getDefaultProps: function() {
        return {key: null};
      },
      render: function() {
        return <span>{this.props.key}</span>;
      }
    });

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(console.warn.mock.calls.length).toBe(1);
    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Required prop `key` was not specified in `Component`.'
    );
  });

  it('should check declared prop types', function() {
    var Component = React.createClass({
      propTypes: {
        key: ReactPropTypes.string.isRequired
      },
      render: function() {
        return <span>{this.props.key}</span>;
      }
    });

    ReactTestUtils.renderIntoDocument(<Component />);
    ReactTestUtils.renderIntoDocument(<Component key={42} />);

    expect(console.warn.mock.calls.length).toBe(2);
    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Required prop `key` was not specified in `Component`.'
    );

    expect(console.warn.mock.calls[1][0]).toBe(
      'Warning: Invalid prop `key` of type `number` supplied to ' +
      '`Component`, expected `string`.'
    );

    ReactTestUtils.renderIntoDocument(<Component key="string" />);

    // Should not error for strings
    expect(console.warn.mock.calls.length).toBe(2);
  });

  it('should throw on invalid prop types', function() {
    expect(function() {
      React.createClass({
        displayName: 'Component',
        propTypes: {
          key: null
        },
        render: function() {
          return <span>{this.props.key}</span>;
        }
      });
    }).toThrow(
      'Invariant Violation: Component: prop type `key` is invalid; ' +
      'it must be a function, usually from React.PropTypes.'
    );
  });

  it('should throw on invalid context types', function() {
    expect(function() {
      React.createClass({
        displayName: 'Component',
        contextTypes: {
          key: null
        },
        render: function() {
          return <span>{this.props.key}</span>;
        }
      });
    }).toThrow(
      'Invariant Violation: Component: context type `key` is invalid; ' +
      'it must be a function, usually from React.PropTypes.'
    );
  });

  it('should throw on invalid child context types', function() {
    expect(function() {
      React.createClass({
        displayName: 'Component',
        childContextTypes: {
          key: null
        },
        render: function() {
          return <span>{this.props.key}</span>;
        }
      });
    }).toThrow(
      'Invariant Violation: Component: child context type `key` is invalid; ' +
      'it must be a function, usually from React.PropTypes.'
    );
  });

  it('should not allow `forceUpdate` on unmounted components', function() {
    var container = document.createElement('div');
    document.documentElement.appendChild(container);

    var Component = React.createClass({
      render: function() {
        return <div />;
      }
    });

    var instance = <Component />;
    expect(function() {
      instance.forceUpdate();
    }).toThrow(
      'Invariant Violation: forceUpdate(...): Can only force an update on ' +
      'mounted or mounting components.'
    );

    instance = React.renderComponent(instance, container);
    expect(function() {
      instance.forceUpdate();
    }).not.toThrow();

    React.unmountComponentAtNode(container);
    expect(function() {
      instance.forceUpdate();
    }).toThrow(
      'Invariant Violation: forceUpdate(...): Can only force an update on ' +
      'mounted or mounting components.'
    );
  });

  it('should cleanup even if render() fatals', function() {
    var BadComponent = React.createClass({
      render: function() {
        throw new Error();
      }
    });
    var instance = <BadComponent />;

    expect(ReactCurrentOwner.current).toBe(null);

    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
    }).toThrow();

    expect(ReactCurrentOwner.current).toBe(null);
  });

  it('should support mixins with getInitialState()', function() {
    var Mixin = {
      getInitialState: function() {
        return {mixin: true};
      }
    };
    var Component = React.createClass({
      mixins: [Mixin],
      getInitialState: function() {
        return {component: true};
      },
      render: function() {
        return <span />;
      }
    });
    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state.component).toBe(true);
    expect(instance.state.mixin).toBe(true);
  });

  it('should throw with conflicting getInitialState() methods', function() {
    var Mixin = {
      getInitialState: function() {
        return {x: true};
      }
    };
    var Component = React.createClass({
      mixins: [Mixin],
      getInitialState: function() {
        return {x: true};
      },
      render: function() {
        return <span />;
      }
    });
    var instance = <Component />;
    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
    }).toThrow(
      'Invariant Violation: mergeObjectsWithNoDuplicateKeys(): ' +
      'Tried to merge two objects with the same key: x'
    );
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

  it('should work with a null getInitialState return value and a mixin', () => {
    var Component;
    var instance;

    var Mixin = {
      getInitialState: function() {
        return {foo: 'bar'};
      }
    };
    Component = React.createClass({
      mixins: [Mixin],
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

    instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'bar'});

    // Also the other way round should work
    var Mixin2 = {
      getInitialState: function() {
        return null;
      }
    };
    Component = React.createClass({
      mixins: [Mixin2],
      getInitialState: function() {
        return {foo: 'bar'};
      },
      render: function() {
        return <span />;
      }
    });
    expect(
      () => ReactTestUtils.renderIntoDocument(<Component />)
    ).not.toThrow();

    instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'bar'});

    // Multiple mixins should be fine too
    Component = React.createClass({
      mixins: [Mixin, Mixin2],
      getInitialState: function() {
        return {x: true};
      },
      render: function() {
        return <span />;
      }
    });
    expect(
      () => ReactTestUtils.renderIntoDocument(<Component />)
    ).not.toThrow();

    instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'bar', x: true});
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

  it('should call componentWillUnmount before unmounting', function() {
    var container = document.createElement('div');
    var innerUnmounted = false;

    spyOn(ReactMount, 'purgeID').andCallThrough();

    var Component = React.createClass({
      render: function() {
        return <div>
          <Inner />
        </div>;
      }
    });
    var Inner = React.createClass({
      componentWillUnmount: function() {
        // It's important that ReactMount.purgeID be called after any component
        // lifecycle methods, because a componentWillMount implementation is
        // likely call this.getDOMNode(), which will repopulate the node cache
        // after it's been cleared, causing a memory leak.
        expect(ReactMount.purgeID.callCount).toBe(0);
        innerUnmounted = true;
      },
      render: function() {
        return <div />;
      }
    });

    React.renderComponent(<Component />, container);
    React.unmountComponentAtNode(container);
    expect(innerUnmounted).toBe(true);

    // <Component />, <Inner />, and both <div /> elements each call
    // unmountIDFromEnvironment which calls purgeID, for a total of 4.
    expect(ReactMount.purgeID.callCount).toBe(4);
  });

  it('should detect valid CompositeComponent classes', function() {
    var Component = React.createClass({
      render: function() {
        return <div/>;
      }
    });

    expect(React.isValidClass(Component)).toBe(true);
  });

  it('should detect invalid CompositeComponent classes', function() {
    var FnComponent = function() {
      return false;
    };

    var NullComponent = null;

    var TrickFnComponent = function() {
      return true;
    };
    TrickFnComponent.componentConstructor = true;

    expect(React.isValidClass(FnComponent)).toBe(false);
    expect(React.isValidClass(NullComponent)).toBe(false);
    expect(React.isValidClass(TrickFnComponent)).toBe(false);
  });

  it('should warn when mispelling shouldComponentUpdate', function() {
    var warn = console.warn;
    console.warn = mocks.getMockFunction();

    try {
      React.createClass({
        componentShouldUpdate: function() {
          return false;
        },
        render: function() {
          return <div />;
        }
      });
      expect(console.warn.mock.calls.length).toBe(1);
      expect(console.warn.mock.calls[0][0]).toBe(
        'A component has a method called componentShouldUpdate(). Did you ' +
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
      expect(console.warn.mock.calls.length).toBe(2);
      expect(console.warn.mock.calls[1][0]).toBe(
        'NamedComponent has a method called componentShouldUpdate(). Did you ' +
        'mean shouldComponentUpdate()? The name is phrased as a question ' +
        'because the function is expected to return a value.'
      );

      NamedComponent(); // Shut up lint
    } finally {
      console.warn = warn;
    }
  });

  xit('should warn when using deprecated non-static spec keys', function() {
    var warn = console.warn;
    console.warn = mocks.getMockFunction();
    try {
      React.createClass({
        mixins: [{}],
        propTypes: {
          foo: ReactPropTypes.string
        },
        contextTypes: {
          foo: ReactPropTypes.string
        },
        childContextTypes: {
          foo: ReactPropTypes.string
        },
        render: function() {
          return <div />;
        }
      });
      expect(console.warn.mock.calls.length).toBe(4);
      expect(console.warn.mock.calls[0][0]).toBe(
        'createClass(...): `mixins` is now a static property and should ' +
        'be defined inside "statics".'
      );
      expect(console.warn.mock.calls[1][0]).toBe(
        'createClass(...): `propTypes` is now a static property and should ' +
        'be defined inside "statics".'
      );
      expect(console.warn.mock.calls[2][0]).toBe(
        'createClass(...): `contextTypes` is now a static property and ' +
        'should be defined inside "statics".'
      );
      expect(console.warn.mock.calls[3][0]).toBe(
        'createClass(...): `childContextTypes` is now a static property and ' +
        'should be defined inside "statics".'
      );
    } finally {
      console.warn = warn;
    }
  });

  it('should pass context', function() {
    var childInstance = null;
    var grandchildInstance = null;

    var Parent = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number
      },

      getChildContext: function() {
        return {
          foo: 'bar',
          depth: 0
        };
      },

      render: function() {
        return <Child />;
      }
    });

    var Child = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number
      },

      childContextTypes: {
        depth: ReactPropTypes.number
      },

      getChildContext: function() {
        return {
          depth: this.context.depth + 1
        };
      },

      render: function() {
        childInstance = this;
        return <Grandchild />;
      }
    });

    var Grandchild = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number
      },

      render: function() {
        grandchildInstance = this;
        return <div />;
      }
    });

    ReactTestUtils.renderIntoDocument(<Parent />);
    reactComponentExpect(childInstance).scalarContextEqual({foo: 'bar', depth: 0});
    reactComponentExpect(grandchildInstance).scalarContextEqual({foo: 'bar', depth: 1});
  });

  it('should check context types', function() {
    var Component = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string.isRequired
      },

      render: function() {
        return <div />;
      }
    });

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(console.warn.mock.calls.length).toBe(1);
    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Required context `foo` was not specified in `Component`.'
    );

    React.withContext({foo: 'bar'}, function() {
      ReactTestUtils.renderIntoDocument(<Component />);
    });

    // Previous call should not error
    expect(console.warn.mock.calls.length).toBe(1);

    React.withContext({foo: 123}, function() {
      ReactTestUtils.renderIntoDocument(<Component />);
    });

    expect(console.warn.mock.calls.length).toBe(2);
    expect(console.warn.mock.calls[1][0]).toBe(
      'Warning: Invalid context `foo` of type `number` supplied ' +
      'to `Component`, expected `string`.'
    );
  });

  it('should check child context types', function() {
    var Component = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string.isRequired,
        bar: ReactPropTypes.number
      },

      getChildContext: function() {
        return this.props.testContext;
      },

      render: function() {
        return <div />;
      }
    });

    ReactTestUtils.renderIntoDocument(<Component testContext={{bar: 123}} />);

    expect(console.warn.mock.calls.length).toBe(1);
    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Required child context `foo` was not specified in `Component`.'
    );

    ReactTestUtils.renderIntoDocument(<Component testContext={{foo: 123}} />);

    expect(console.warn.mock.calls.length).toBe(2);
    expect(console.warn.mock.calls[1][0]).toBe(
      'Warning: Invalid child context `foo` of type `number` ' +
      'supplied to `Component`, expected `string`.'
    );

    ReactTestUtils.renderIntoDocument(
      <Component testContext={{foo: 'foo', bar: 123}} />
    );

    ReactTestUtils.renderIntoDocument(
      <Component testContext={{foo: 'foo'}} />
    );

    // Previous calls should not log errors
    expect(console.warn.mock.calls.length).toBe(2);
  });

  it('should filter out context not in contextTypes', function() {
    var Component = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string
      },

      render: function() {
        return <div />;
      }
    });

    var instance = React.withContext({foo: 'abc', bar: 123}, function() {
      return <Component />;
    });
    instance = ReactTestUtils.renderIntoDocument(instance);
    reactComponentExpect(instance).scalarContextEqual({foo: 'abc'});
  });

  it('should filter context properly in callbacks', function() {
    var actualComponentWillReceiveProps;
    var actualShouldComponentUpdate;
    var actualComponentWillUpdate;
    var actualComponentDidUpdate;

    var Parent = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string.isRequired,
        bar: ReactPropTypes.string.isRequired
      },

      getChildContext: function() {
        return {
          foo: this.props.foo,
          bar: "bar"
        };
      },

      render: function() {
        return <Component />;
      }
    });

    var Component = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string
      },

      componentWillReceiveProps: function(nextProps, nextContext) {
        actualComponentWillReceiveProps = nextContext;
        return true;
      },

      shouldComponentUpdate: function(nextProps, nextState, nextContext) {
        actualShouldComponentUpdate = nextContext;
        return true;
      },

      componentWillUpdate: function(nextProps, nextState, nextContext) {
        actualComponentWillUpdate = nextContext;
      },

      componentDidUpdate: function(prevProps, prevState, prevContext) {
        actualComponentDidUpdate = prevContext;
      },

      render: function() {
        return <div />;
      }
    });

    var instance = <Parent foo="abc" />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    instance.replaceProps({foo: "def"});
    expect(actualComponentWillReceiveProps).toEqual({foo: 'def'});
    expect(actualShouldComponentUpdate).toEqual({foo: 'def'});
    expect(actualComponentWillUpdate).toEqual({foo: 'def'});
    expect(actualComponentDidUpdate).toEqual({foo: 'abc'});
  });

  it('should support statics', function() {
    var Component = React.createClass({
      statics: {
        abc: 'def',
        def: 0,
        ghi: null,
        jkl: 'mno'
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
  });

  it('should support statics in mixins', function() {
    var Mixin = {
      statics: {
        foo: 'bar'
      }
    };
    var Component = React.createClass({
      mixins: [Mixin],

      statics: {
        abc: 'def'
      },

      render: function() {
        return <span />;
      }
    });
    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.constructor.foo).toBe('bar');
    expect(Component.foo).toBe('bar');
    expect(instance.constructor.abc).toBe('def');
    expect(Component.abc).toBe('def');
  });

  it("should throw if mixins override each others' statics", function() {
    expect(function() {
      var Mixin = {
        statics: {
          abc: 'foo'
        }
      };
      React.createClass({
        mixins: [Mixin],

        statics: {
          abc: 'bar'
        },

        render: function() {
          return <span />;
        }
      });
    }).toThrow(
      'Invariant Violation: ReactCompositeComponent: You are attempting to ' +
      'define `abc` on your component more than once, but that is only ' +
      'supported for functions, which are chained together. This conflict ' +
      'may be due to a mixin.'
    );
  });

  it("should throw if the mixin is a React component", function() {
    expect(function() {
      React.createClass({
        mixins: [<div />],

        render: function() {
          return <span />;
        }
      });
    }).toThrow(
      'Invariant Violation: ReactCompositeComponent: You\'re attempting to ' +
      'use a component as a mixin. Instead, just use a regular object.'
    );
  });

  it("should throw if the mixin is a React component class", function() {
    expect(function() {
      var Component = React.createClass({
        render: function() {
          return <span />;
        }
      });

      React.createClass({
        mixins: [Component],

        render: function() {
          return <span />;
        }
      });
    }).toThrow(
      'Invariant Violation: ReactCompositeComponent: You\'re attempting to ' +
      'use a component class as a mixin. Instead, just use a regular object.'
    );
  });

  it('should have bound the mixin methods to the component', function() {
    var mixin = {
      mixinFunc: function() {return this;}
    };

    var Component = React.createClass({
      mixins: [mixin],
      componentDidMount: function() {
        expect(this.mixinFunc()).toBe(this);
      },
      render: function() {
        return <span />;
      }
    });
    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
  });

  it('should include the mixin keys in even if their values are falsy',
    function() {
      var mixin = {
        keyWithNullValue: null,
        randomCounter: 0
      };

      var Component = React.createClass({
        mixins: [mixin],
        componentDidMount: function() {
          expect(this.randomCounter).toBe(0);
          expect(this.keyWithNullValue).toBeNull();
        },
        render: function() {
          return <span />;
        }
      });
      var instance = <Component />;
      instance = ReactTestUtils.renderIntoDocument(instance);
  });

  it('should warn if an umounted component is touched', function() {
    spyOn(console, 'warn');

    var ComponentClass = React.createClass({
      getInitialState: function() {
        return {valueToReturn: 'hi'};
      },
      someMethod: function() {
        return this;
      },
      someOtherMethod: function() {
        return this;
      },
      render: function() {
        return <div></div>;
      }
    });

    var descriptor = <ComponentClass />;
    var instance = ReactTestUtils.renderIntoDocument(descriptor);
    instance.someMethod();
    expect(console.warn.argsForCall.length).toBe(0);

    var unmountedInstance = <ComponentClass />;
    unmountedInstance.someMethod();
    expect(console.warn.argsForCall.length).toBe(1);

    var unmountedInstance2 = <ComponentClass />;
    unmountedInstance2.someOtherMethod = 'override';
    expect(console.warn.argsForCall.length).toBe(2);
    expect(unmountedInstance2.someOtherMethod).toBe('override');
  });

  it('should allow static methods called using type property', function() {
    spyOn(console, 'warn');

    var ComponentClass = React.createClass({
      statics: {
        someStaticMethod: function() {
          return 'someReturnValue';
        }
      },
      getInitialState: function() {
        return {valueToReturn: 'hi'};
      },
      render: function() {
        return <div></div>;
      }
    });

    var descriptor = <ComponentClass />;
    expect(descriptor.type.someStaticMethod()).toBe('someReturnValue');
    expect(console.warn.argsForCall.length).toBe(0);
  });

});
