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

var ChildUpdates;
var MorphingComponent;
var React;
var ReactComponent;
var ReactCurrentOwner;
var ReactDoNotBindDeprecated;
var ReactMount;
var ReactPropTypes;
var ReactServerRendering;
var ReactTestUtils;
var TogglingComponent;

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
    ReactServerRendering = require('ReactServerRendering');

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

    TogglingComponent = React.createClass({
      getInitialState: function() {
        return {component: this.props.firstComponent};
      },
      componentDidMount: function() {
        console.log(this.getDOMNode());
        this.setState({component: this.props.secondComponent});
      },
      componentDidUpdate: function() {
        console.log(this.getDOMNode());
      },
      render: function() {
        var Component = this.state.component;
        return Component ? <Component /> : null;
      }
    });

    warn = console.warn;
    console.warn = mocks.getMockFunction();
  });

  afterEach(function() {
    console.warn = warn;
  });

  it('should give context for PropType errors in nested components.', () => {
    // In this test, we're making sure that if a proptype error is found in a
    // component, we give a small hint as to which parent instantiated that
    // component as per warnings about key usage in ReactElementValidator.
    spyOn(console, 'warn');
    var MyComp = React.createClass({
      propTypes: {
        color: ReactPropTypes.string
      },
      render: function() {
        return <div>My color is {this.color}</div>;
      }
    });
    var ParentComp = React.createClass({
      render: function() {
        return <MyComp color={123} />;
      }
    });
    ReactTestUtils.renderIntoDocument(<ParentComp />);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: Invalid prop `color` of type `number` supplied to `MyComp`, ' +
      'expected `string`. Check the render method of `ParentComp`.'
    );
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

  it('should render null and false as a noscript tag under the hood', () => {
    var Component1 = React.createClass({
      render: function() {
        return null;
      }
    });
    var Component2 = React.createClass({
      render: function() {
        return false;
      }
    });

    var instance1 = ReactTestUtils.renderIntoDocument(<Component1 />);
    var instance2 = ReactTestUtils.renderIntoDocument(<Component2 />);
    reactComponentExpect(instance1)
      .expectRenderedChild()
      .toBeDOMComponentWithTag('noscript');
    reactComponentExpect(instance2)
      .expectRenderedChild()
      .toBeDOMComponentWithTag('noscript');
  });

  it('should still throw when rendering to undefined', () => {
    var Component = React.createClass({
      render: function() {}
    });
    expect(function() {
      ReactTestUtils.renderIntoDocument(<Component />);
    }).toThrow(
      'Invariant Violation: Component.render(): A valid ReactComponent must ' +
      'be returned. You may have returned undefined, an array or some other ' +
      'invalid object.'
    );
  });

  it('should be able to switch between rendering null and a normal tag', () => {
    spyOn(console, 'log');

    var instance1 =
      <TogglingComponent
        firstComponent={null}
        secondComponent={'div'}
      />;
    var instance2 =
      <TogglingComponent
        firstComponent={'div'}
        secondComponent={null}
      />;

    expect(function() {
      ReactTestUtils.renderIntoDocument(instance1);
      ReactTestUtils.renderIntoDocument(instance2);
    }).not.toThrow();

    expect(console.log.argsForCall.length).toBe(4);
    expect(console.log.argsForCall[0][0]).toBe(null);
    expect(console.log.argsForCall[1][0].tagName).toBe('DIV');
    expect(console.log.argsForCall[2][0].tagName).toBe('DIV');
    expect(console.log.argsForCall[3][0]).toBe(null);
  });

  it('should distinguish between a script placeholder and an actual script tag',
    () => {
      spyOn(console, 'log');

      var instance1 =
        <TogglingComponent
          firstComponent={null}
          secondComponent={'script'}
        />;
      var instance2 =
        <TogglingComponent
          firstComponent={'script'}
          secondComponent={null}
        />;

      expect(function() {
        ReactTestUtils.renderIntoDocument(instance1);
      }).not.toThrow();
      expect(function() {
        ReactTestUtils.renderIntoDocument(instance2);
      }).not.toThrow();

      expect(console.log.argsForCall.length).toBe(4);
      expect(console.log.argsForCall[0][0]).toBe(null);
      expect(console.log.argsForCall[1][0].tagName).toBe('SCRIPT');
      expect(console.log.argsForCall[2][0].tagName).toBe('SCRIPT');
      expect(console.log.argsForCall[3][0]).toBe(null);
    }
  );

  it('should have getDOMNode return null when multiple layers of composite ' +
    'components render to the same null placeholder', () => {
      spyOn(console, 'log');

      var GrandChild = React.createClass({
        render: function() {
          return null;
        }
      });

      var Child = React.createClass({
        render: function() {
          return <GrandChild />;
        }
      });

      var instance1 =
        <TogglingComponent
          firstComponent={'div'}
          secondComponent={Child}
        />;
      var instance2 =
        <TogglingComponent
          firstComponent={Child}
          secondComponent={'div'}
        />;

      expect(function() {
        ReactTestUtils.renderIntoDocument(instance1);
      }).not.toThrow();
      expect(function() {
        ReactTestUtils.renderIntoDocument(instance2);
      }).not.toThrow();

      expect(console.log.argsForCall.length).toBe(4);
      expect(console.log.argsForCall[0][0].tagName).toBe('DIV');
      expect(console.log.argsForCall[1][0]).toBe(null);
      expect(console.log.argsForCall[2][0]).toBe(null);
      expect(console.log.argsForCall[3][0].tagName).toBe('DIV');
    }
  );

  it('should not thrash a server rendered layout with client side one', () => {
    var Child = React.createClass({
      render: function() {
        return null;
      }
    });
    var Parent = React.createClass({
      render: function() {
        return <div><Child /></div>;
      }
    });

    var markup = ReactServerRendering.renderToString(<Parent />);
    var container = document.createElement('div');
    container.innerHTML = markup;

    spyOn(console, 'warn');
    React.render(<Parent />, container);
    expect(console.warn).not.toHaveBeenCalled();
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

  it('should not pass this to getDefaultProps', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        expect(this.render).not.toBeDefined();
        return {};
      },
      render: function() {
        return <div />;
      }
    });
    ReactTestUtils.renderIntoDocument(<Component />);
  });

  it('should use default values for undefined props', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        return {prop: 'testKey'};
      },
      render: function() {
        return <span />;
      }
    });

    var instance1 = <Component />;
    instance1 = ReactTestUtils.renderIntoDocument(instance1);
    reactComponentExpect(instance1).scalarPropsEqual({prop: 'testKey'});

    var instance2 = <Component prop={undefined} />;
    instance2 = ReactTestUtils.renderIntoDocument(instance2);
    reactComponentExpect(instance2).scalarPropsEqual({prop: 'testKey'});

    var instance3 = <Component prop={null} />;
    instance3 = ReactTestUtils.renderIntoDocument(instance3);
    reactComponentExpect(instance3).scalarPropsEqual({prop: null});
  });

  it('should not mutate passed-in props object', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        return {prop: 'testKey'};
      },
      render: function() {
        return <span />;
      }
    });

    var inputProps = {};
    var instance1 = <Component {...inputProps} />;
    instance1 = ReactTestUtils.renderIntoDocument(instance1);
    expect(instance1.props.prop).toBe('testKey');

    // We don't mutate the input, just in case the caller wants to do something
    // with it after using it to instantiate a component
    expect(inputProps.prop).not.toBeDefined();
  });

  it('should use default prop value when removing a prop', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        return {fruit: 'persimmon'};
      },
      render: function() {
        return <span />;
      }
    });

    var container = document.createElement('div');
    var instance = React.render(
      <Component fruit="mango" />,
      container
    );
    expect(instance.props.fruit).toBe('mango');

    React.render(<Component />, container);
    expect(instance.props.fruit).toBe('persimmon');
  });

  it('should normalize props with default values', function() {
    var Component = React.createClass({
      propTypes: {prop: ReactPropTypes.string.isRequired},
      getDefaultProps: function() {
        return {prop: 'testKey'};
      },
      getInitialState: function() {
        return {prop: this.props.prop + 'State'};
      },
      render: function() {
        return <span>{this.props.prop}</span>;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    reactComponentExpect(instance).scalarPropsEqual({prop: 'testKey'});
    reactComponentExpect(instance).scalarStateEqual({prop: 'testKeyState'});

    ReactTestUtils.renderIntoDocument(<Component prop={null} />);

    expect(console.warn.mock.calls.length).toBe(1);
    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Required prop `prop` was not specified in `Component`.'
    );
  });

  it('should check default prop values', function() {
    var Component = React.createClass({
      propTypes: {prop: ReactPropTypes.string.isRequired},
      getDefaultProps: function() {
        return {prop: null};
      },
      render: function() {
        return <span>{this.props.prop}</span>;
      }
    });

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(console.warn.mock.calls.length).toBe(1);
    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Required prop `prop` was not specified in `Component`.'
    );
  });

  it('should check declared prop types', function() {
    var Component = React.createClass({
      propTypes: {
        prop: ReactPropTypes.string.isRequired
      },
      render: function() {
        return <span>{this.props.prop}</span>;
      }
    });

    ReactTestUtils.renderIntoDocument(<Component />);
    ReactTestUtils.renderIntoDocument(<Component prop={42} />);

    expect(console.warn.mock.calls.length).toBe(2);
    expect(console.warn.mock.calls[0][0]).toBe(
      'Warning: Required prop `prop` was not specified in `Component`.'
    );

    expect(console.warn.mock.calls[1][0]).toBe(
      'Warning: Invalid prop `prop` of type `number` supplied to ' +
      '`Component`, expected `string`.'
    );

    ReactTestUtils.renderIntoDocument(<Component prop="string" />);

    // Should not error for strings
    expect(console.warn.mock.calls.length).toBe(2);
  });

  it('should throw on invalid prop types', function() {
    expect(function() {
      React.createClass({
        displayName: 'Component',
        propTypes: {
          prop: null
        },
        render: function() {
          return <span>{this.props.prop}</span>;
        }
      });
    }).toThrow(
      'Invariant Violation: Component: prop type `prop` is invalid; ' +
      'it must be a function, usually from React.PropTypes.'
    );
  });

  it('should throw on invalid context types', function() {
    expect(function() {
      React.createClass({
        displayName: 'Component',
        contextTypes: {
          prop: null
        },
        render: function() {
          return <span>{this.props.prop}</span>;
        }
      });
    }).toThrow(
      'Invariant Violation: Component: context type `prop` is invalid; ' +
      'it must be a function, usually from React.PropTypes.'
    );
  });

  it('should throw on invalid child context types', function() {
    expect(function() {
      React.createClass({
        displayName: 'Component',
        childContextTypes: {
          prop: null
        },
        render: function() {
          return <span>{this.props.prop}</span>;
        }
      });
    }).toThrow(
      'Invariant Violation: Component: child context type `prop` is invalid; ' +
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
    expect(instance.forceUpdate).not.toBeDefined();

    instance = React.render(instance, container);
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
      'Tried to merge two objects with the same key: `x`. This conflict ' +
      'may be due to a mixin; in particular, this may be caused by two ' +
      'getInitialState() or getDefaultProps() methods returning objects ' +
      'with clashing keys.'
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

    React.render(<Component />, container);
    React.unmountComponentAtNode(container);
    expect(innerUnmounted).toBe(true);

    // <Component />, <Inner />, and both <div /> elements each call
    // unmountIDFromEnvironment which calls purgeID, for a total of 4.
    expect(ReactMount.purgeID.callCount).toBe(4);
  });

  it('should warn but detect valid CompositeComponent classes', function() {
    var warn = console.warn;
    console.warn = mocks.getMockFunction();

    var Component = React.createClass({
      render: function() {
        return <div/>;
      }
    });

    expect(React.isValidClass(Component)).toBe(true);

    expect(console.warn.mock.calls.length).toBe(1);
    expect(console.warn.mock.calls[0][0]).toContain(
      'isValidClass is deprecated and will be removed in a future release'
    );
  });

  it('should warn but detect invalid CompositeComponent classes', function() {
    var warn = console.warn;
    console.warn = mocks.getMockFunction();

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

    expect(console.warn.mock.calls.length).toBe(3);
    console.warn.mock.calls.forEach(function(call) {
      expect(call[0]).toContain(
        'isValidClass is deprecated and will be removed in a future release'
      );
    });
  });

  it('should warn when shouldComponentUpdate() returns undefined', function() {
    var warn = console.warn;
    console.warn = mocks.getMockFunction();

    try {
      var Component = React.createClass({
        getInitialState: function () {
          return {bogus: false};
        },

        shouldComponentUpdate: function() {
          return undefined;
        },

        render: function() {
          return <div />;
        }
      });

      var instance = ReactTestUtils.renderIntoDocument(<Component />);
      instance.setState({bogus: true});

      expect(console.warn.mock.calls.length).toBe(1);
      expect(console.warn.mock.calls[0][0]).toBe(
        'Component.shouldComponentUpdate(): Returned undefined instead of a ' +
        'boolean value. Make sure to return true or false.'
      );
    } finally {
      console.warn = warn;
    }
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

      <NamedComponent />; // Shut up lint
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
    expect(instance.constructor.pqr()).toBe(Component.type);
    expect(Component.pqr()).toBe(Component.type);
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
      'Invariant Violation: ReactCompositeComponent: You are attempting to ' +
      'define a reserved property, `getDefaultProps`, that shouldn\'t be on ' +
      'the "statics" key. Define it as an instance property instead; it ' +
      'will still be accessible on the constructor.'
    );
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
      'define `abc` on your component more than once. This conflict may be ' +
      'due to a mixin.'
    );
  });

  it("should throw if mixins override functions in statics", function() {
    expect(function() {
      var Mixin = {
        statics: {
          abc: function() { console.log('foo'); }
        }
      };
      React.createClass({
        mixins: [Mixin],

        statics: {
          abc: function() { console.log('bar'); }
        },

        render: function() {
          return <span />;
        }
      });
    }).toThrow(
      'Invariant Violation: ReactCompositeComponent: You are attempting to ' +
      'define `abc` on your component more than once. This conflict may be ' +
      'due to a mixin.'
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

  it('should disallow nested render calls', function() {
    spyOn(console, 'warn');
    var Inner = React.createClass({
      render: function() {
        return <div />;
      }
    });
    var Outer = React.createClass({
      render: function() {
        ReactTestUtils.renderIntoDocument(<Inner />);
        return <div />;
      }
    });

    ReactTestUtils.renderIntoDocument(<Outer />);
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: _renderNewRootComponent(): Render methods should ' +
      'be a pure function of props and state; triggering nested component ' +
      'updates from render is not allowed. If necessary, trigger nested ' +
      'updates in componentDidUpdate.'
    );
  });

  it('gives a helpful error when passing null or undefined', function() {
    spyOn(console, 'warn');
    React.createElement(undefined);
    React.createElement(null);
    expect(console.warn.calls.length).toBe(2);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: React.createElement: type should not be null or undefined. ' +
      'It should be a string (for DOM elements) or a ReactClass (for ' +
      'composite components).'
    );
    expect(console.warn.calls[1].args[0]).toBe(
      'Warning: React.createElement: type should not be null or undefined. ' +
      'It should be a string (for DOM elements) or a ReactClass (for ' +
      'composite components).'
    );
    React.createElement('div');
    expect(console.warn.calls.length).toBe(2);

    expect(() => React.createElement(undefined)).not.toThrow()
  });

});
