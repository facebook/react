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

var ChildUpdates;
var MorphingComponent;
var React;
var ReactCurrentOwner;
var ReactDoNotBindDeprecated;
var ReactMount;
var ReactPropTypes;
var ReactServerRendering;
var ReactTestUtils;
var ReactUpdates;

var reactComponentExpect;
var mocks;

describe('ReactCompositeComponent', function() {

  beforeEach(function() {
    mocks = require('mocks');

    reactComponentExpect = require('reactComponentExpect');
    React = require('React');
    ReactCurrentOwner = require('ReactCurrentOwner');
    ReactDoNotBindDeprecated = require('ReactDoNotBindDeprecated');
    ReactPropTypes = require('ReactPropTypes');
    ReactTestUtils = require('ReactTestUtils');
    ReactMount = require('ReactMount');
    ReactServerRendering = require('ReactServerRendering');
    ReactUpdates = require('ReactUpdates');

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
      getAnchor: function() {
        return this.refs.anch;
      },
      render: function() {
        var className = this.props.anchorClassOn ? 'anchorClass' : '';
        return this.props.renderAnchor ?
          <a ref="anch" className={className}></a> :
          <b></b>;
      }
    });

    // Ignore the first warning which is fired by using withContext at all.
    // That way we don't have to reset and assert it on every subsequent test.
    // This will be killed soon anyway.
    console.warn = mocks.getMockFunction();
    React.withContext({}, function() { });

    spyOn(console, 'warn');
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
    var anchor = instance.getAnchor();
    var actualDOMAnchorNode = anchor.getDOMNode();
    expect(actualDOMAnchorNode.className).toBe('');
  });

  it('should auto bind methods and values correctly', function() {
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

  it('should warn about `forceUpdate` on unmounted components', function() {
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
    instance.forceUpdate();

    expect(console.warn.calls.length).toBe(0);

    React.unmountComponentAtNode(container);

    instance.forceUpdate();
    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: forceUpdate(...): Can only update a mounted or ' +
      'mounting component. This usually means you called forceUpdate() on ' +
      'an unmounted component. This is a no-op.'
    );
  });

  it('should warn about `setState` on unmounted components', function() {
    var container = document.createElement('div');
    document.documentElement.appendChild(container);

    var Component = React.createClass({
      getInitialState: function() {
        return {value: 0};
      },
      render: function() {
        return <div />;
      }
    });

    var instance = <Component />;
    expect(instance.setState).not.toBeDefined();

    instance = React.render(instance, container);
    instance.setState({value: 1});

    expect(console.warn.calls.length).toBe(0);

    React.unmountComponentAtNode(container);
    instance.setState({value: 2});
    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: setState(...): Can only update a mounted or ' +
      'mounting component. This usually means you called setState() on an ' +
      'unmounted component. This is a no-op.'
    );
  });

  it('should silently allow `setState`, not call cb on unmounting components',
     function() {
    var cbCalled = false;
    var container = document.createElement('div');
    document.documentElement.appendChild(container);

    var Component = React.createClass({
      getInitialState: function() {
        return {value: 0};
      },
      componentWillUnmount: function() {
        expect(() => {
          this.setState({value: 2}, function() {
            cbCalled = true;
          })
        }).not.toThrow();
      },
      render: function() {
        return <div />;
      }
    });

    var instance = React.render(<Component />, container);

    instance.setState({value: 1});
    expect(console.warn.calls.length).toBe(0);

    React.unmountComponentAtNode(container);
    expect(console.warn.calls.length).toBe(0);
    expect(cbCalled).toBe(false);
  });

  it('should not allow `setProps` on unmounted components', function() {
    var container = document.createElement('div');
    document.documentElement.appendChild(container);

    var Component = React.createClass({
      render: function() {
        return <div />;
      }
    });

    var instance = <Component />;
    expect(instance.setProps).not.toBeDefined();

    instance = React.render(instance, container);
    expect(function() {
      instance.setProps({value: 1});
    }).not.toThrow();
    expect(console.warn.calls.length).toBe(0);

    React.unmountComponentAtNode(container);
    expect(function() {
      instance.setProps({value: 2});
    }).not.toThrow();

    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: setProps(...): Can only update a mounted or ' +
      'mounting component. This usually means you called setProps() on an ' +
      'unmounted component. This is a no-op.'
    );
  });

  it('should only allow `setProps` on top-level components', function() {
    var container = document.createElement('div');
    document.documentElement.appendChild(container);

    var innerInstance;

    var Component = React.createClass({
      render: function() {
        return <div><div ref="inner" /></div>;
      },
      componentDidMount: function() {
        innerInstance = this.refs.inner;
      }
    });
    React.render(<Component />, container);

    expect(innerInstance).not.toBe(undefined);
    expect(function() {
      innerInstance.setProps({value: 1});
    }).toThrow(
      'Invariant Violation: setProps(...): You called `setProps` on a ' +
      'component with a parent. This is an anti-pattern since props will get ' +
      'reactively updated when rendered. Instead, change the owner\'s ' +
      '`render` method to pass the correct value as props to the component ' +
      'where it is created.'
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

  it('should call componentWillUnmount before unmounting', function() {
    var container = document.createElement('div');
    var innerUnmounted = false;

    spyOn(ReactMount, 'purgeID').andCallThrough();

    var Component = React.createClass({
      render: function() {
        return <div>
          <Inner />
          Text
        </div>;
      }
    });
    var Inner = React.createClass({
      componentWillUnmount: function() {
        // It's important that ReactMount.purgeID be called after any component
        // lifecycle methods, because a componentWillMount implementation is
        // likely call this.getDOMNode(), which will repopulate the node cache
        // after it's been cleared, causing a memory leak.
        expect(ReactMount.purgeID.calls.length).toBe(0);
        innerUnmounted = true;
      },
      render: function() {
        return <div />;
      }
    });

    React.render(<Component />, container);
    React.unmountComponentAtNode(container);
    expect(innerUnmounted).toBe(true);

    // The text and both <div /> elements and their wrappers each call
    // unmountIDFromEnvironment which calls purgeID, for a total of 3.
    // TODO: Test the effect of this. E.g. does the node cache get repopulated
    // after a getDOMNode call?
    expect(ReactMount.purgeID.callCount).toBe(3);
  });

  it('should warn when shouldComponentUpdate() returns undefined', function() {
    var Component = React.createClass({
      getInitialState: function() {
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

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Component.shouldComponentUpdate(): Returned undefined instead of a ' +
      'boolean value. Make sure to return true or false.'
    );
  });

  it('should warn when owner is necessary', function() {

    var Chooser = React.createClass({
      render: function() {
        return this.props.selection == 1 ? this.props.child1 : this.props.child2;
      }
    });

    var CoolParent1 = React.createClass({
      render: function() {
        return <Chooser
          selection={this.props.selection}
          child1={<input value='foo' readOnly='true' />}
          child2={this.props.child2} />;
      }
    });

    var CoolParent2 = React.createClass({
      render: function() {
        return <CoolParent1
          selection={this.props.selection}
          child2={<input value='foo' readOnly='true' />} />;
      }
    });

    var div = document.createElement('div');
    React.render(<CoolParent2 selection={1} />, div);
    expect(console.warn.argsForCall.length).toBe(0);
    React.render(<CoolParent2 selection={2} />, div);
    expect(console.warn.argsForCall.length).toBe(1);
    React.render(<CoolParent2 selection={1} />, div);
    React.render(<CoolParent2 selection={2} />, div);
    expect(console.warn.argsForCall.length).toBe(1);

    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: <input /> is being rendered by both CoolParent1 and ' +
      'CoolParent2 using the same key (null) in the same place. Currently, ' +
      'this means that they don\'t preserve state. This behavior should be ' +
      'very rare so we\'re considering deprecating it. Please contact the ' +
      'React team and explain your use case so that we can take that into ' +
      'consideration.'
    );
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

  it('should pass context when re-rendered', function() {
    var parentInstance = null;
    var childInstance = null;

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

      getInitialState: function() {
        return {
          flag: false
        }
      },

      render: function() {
        var output = <Child />;
        if (!this.state.flag) {
          output = <span>Child</span>;
        }
        return output;
      }
    });

    var Child = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number
      },

      render: function() {
        childInstance = this;
        return <span>Child</span>;
      }
    });

    parentInstance = ReactTestUtils.renderIntoDocument(<Parent />);
    expect(childInstance).toBeNull();

    expect(parentInstance.state.flag).toBe(false);
    ReactUpdates.batchedUpdates(function() {
        parentInstance.setState({flag: true});
    });
    expect(parentInstance.state.flag).toBe(true);

    expect(console.warn.argsForCall.length).toBe(0);

    reactComponentExpect(childInstance).scalarContextEqual({foo: 'bar', depth: 0});
  });

  it('warn if context keys differ', function() {
    var Component = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string.isRequired
      },

      render: function() {
        return <div />;
      }
    });

    React.withContext({foo: 'bar'}, function() {
      ReactTestUtils.renderIntoDocument(<Component />);
    });

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: owner-based and parent-based contexts differ ' +
      '(values: `bar` vs `undefined`) for key (foo) ' +
      'while mounting Component (see: http://fb.me/react-context-by-parent)'
    );

  });

  it('warn if context values differ', function() {
    var Parent = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string
      },

      getChildContext: function() {
        return {
          foo: "bar"
        };
      },

      render: function() {
        return <div>{this.props.children}</div>;
      }
    });
    var Component = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string.isRequired
      },

      render: function() {
        return <div />;
      }
    });

    var component = React.withContext({foo: 'noise'}, function() {
      return <Component />;
    });

    ReactTestUtils.renderIntoDocument(<Parent>{component}</Parent>);

    // Two warnings, one for the component and one for the div
    // We may want to make this expect one warning in the future
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: owner-based and parent-based contexts differ ' +
      '(values: `noise` vs `bar`) for key (foo) while mounting Component ' +
      '(see: http://fb.me/react-context-by-parent)'
    );

  });

  it('should warn if context values differ on update using withContext', function() {
    var Parent = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string
      },

      getChildContext: function() {
        return {
          foo: "bar"
        };
      },

      render: function() {
        return <div>{this.props.children}</div>;
      }
    });

    var Component = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string.isRequired
      },

      render: function() {
        return <div />;
      }
    });

    var div = document.createElement('div');

    var componentWithSameContext = React.withContext({foo: 'bar'}, function() {
      return <Component />;
    });
    React.render(<Parent>{componentWithSameContext}</Parent>, div);

    expect(console.warn.argsForCall.length).toBe(0);

    var componentWithDifferentContext = React.withContext({foo: 'noise'}, function() {
      return <Component />;
    });
    React.render(<Parent>{componentWithDifferentContext}</Parent>, div);

    // Two warnings, one for the component and one for the div
    // We may want to make this expect one warning in the future
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: owner-based and parent-based contexts differ ' +
      '(values: `noise` vs `bar`) for key (foo) while mounting Component ' +
      '(see: http://fb.me/react-context-by-parent)'
    );
  });

  it('should warn if context values differ on update using wrapper', function() {
    var Parent = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string
      },

      getChildContext: function() {
        return {
          foo: "bar"
        };
      },

      render: function() {
        return <div>{this.props.children}</div>;
      }
    });

    var Component = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string.isRequired
      },

      render: function() {
        return <div />;
      }
    });

    var Wrapper = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string
      },

      getChildContext: function() {
        return {foo: this.props.foo};
      },

      render: function() { return <Parent><Component /></Parent>; }

    });

    var div = document.createElement('div');
    React.render(<Wrapper foo='bar' />, div);
    React.render(<Wrapper foo='noise' />, div);

    // Two warnings, one for the component and one for the div
    // We may want to make this expect one warning in the future
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: owner-based and parent-based contexts differ ' +
      '(values: `noise` vs `bar`) for key (foo) while mounting Component ' +
      '(see: http://fb.me/react-context-by-parent)'
    );
  });

  it('should not warn if getChildContext returns a new object', function() {
    var getChildContextCalls = 0;

    var Parent = React.createClass({
      childContextTypes: {
        x: React.PropTypes.object
      },
      getChildContext: function() {
        getChildContextCalls++;
        return {
          x: {}
        };
      },
      render: function() {
        return <Child />;
      }
    });

    var Child = React.createClass({
      contextTypes: {
        x: React.PropTypes.object
      },
      render: function() {
        return null;
      }
    });

    var div = document.createElement('div');

    // Initial render gives no context warning
    React.render(<Parent />, div);
    expect(getChildContextCalls).toBe(1);
    expect(console.warn.argsForCall.length).toBe(0);

    // Rerender
    React.render(<Parent />, div);
    expect(getChildContextCalls).toBe(2);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('unmasked context propagates through updates', function() {

    var Leaf = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string.isRequired
      },

      componentWillReceiveProps: function(nextProps, nextContext) {
        expect('foo' in nextContext).toBe(true);
      },

      componentDidUpdate: function(prevProps, prevState, prevContext) {
        expect('foo' in prevContext).toBe(true);
      },

      shouldComponentUpdate: function(nextProps, nextState, nextContext) {
        expect('foo' in nextContext).toBe(true);
        return true;
      },

      render: function() {
        return <span>{this.context.foo}</span>;
      }
    });

    var Intermediary = React.createClass({

      componentWillReceiveProps: function(nextProps, nextContext) {
        expect('foo' in nextContext).toBe(false);
      },

      componentDidUpdate: function(prevProps, prevState, prevContext) {
        expect('foo' in prevContext).toBe(false);
      },

      shouldComponentUpdate: function(nextProps, nextState, nextContext) {
        expect('foo' in nextContext).toBe(false);
        return true;
      },

      render: function() {
        return <Leaf />;
      }
    });

    var Parent = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string
      },

      getChildContext: function() {
        return {
          foo: this.props.cntxt
        };
      },

      render: function() {
        return <Intermediary />;
      }
    });

    var div = document.createElement('div');
    React.render(<Parent cntxt="noise" />, div);
    expect(div.children[0].innerHTML).toBe('noise');
    div.children[0].innerHTML = 'aliens';
    div.children[0].id = 'aliens';
    expect(div.children[0].innerHTML).toBe('aliens');
    expect(div.children[0].id).toBe('aliens');
    React.render(<Parent cntxt="bar" />, div);
    expect(div.children[0].innerHTML).toBe('bar');
    expect(div.children[0].id).toBe('aliens');
  });

  it('should disallow nested render calls', function() {
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

  it('only renders once if updated in componentWillReceiveProps', function() {
    var renders = 0;
    var Component = React.createClass({
      getInitialState: function() {
        return {updated: false};
      },
      componentWillReceiveProps: function(props) {
        expect(props.update).toBe(1);
        this.setState({updated: true});
      },
      render: function() {
        renders++;
        return <div />;
      }
    });

    var container = document.createElement('div');
    var instance = React.render(<Component update={0} />, container);
    expect(renders).toBe(1);
    expect(instance.state.updated).toBe(false);
    React.render(<Component update={1} />, container);
    expect(renders).toBe(2);
    expect(instance.state.updated).toBe(true);
  });

  it('should update refs if shouldComponentUpdate gives false', function() {
    var Static = React.createClass({
      shouldComponentUpdate: function() {
        return false;
      },
      render: function() {
        return <div>{this.props.children}</div>;
      }
    });
    var Component = React.createClass({
      render: function() {
        if (this.props.flipped) {
          return <div>
            <Static ref="static0" key="B">B (ignored)</Static>
            <Static ref="static1" key="A">A (ignored)</Static>
          </div>;
        } else {
          return <div>
            <Static ref="static0" key="A">A</Static>
            <Static ref="static1" key="B">B</Static>
          </div>;
        }
      }
    });

    var comp = ReactTestUtils.renderIntoDocument(<Component flipped={false} />);
    expect(comp.refs.static0.getDOMNode().textContent).toBe('A');
    expect(comp.refs.static1.getDOMNode().textContent).toBe('B');

    // When flipping the order, the refs should update even though the actual
    // contents do not
    comp.setProps({flipped: true});
    expect(comp.refs.static0.getDOMNode().textContent).toBe('B');
    expect(comp.refs.static1.getDOMNode().textContent).toBe('A');
  });

  it('should allow access to getDOMNode in componentWillUnmount', function() {
    var a = null;
    var b = null;
    var Component = React.createClass({
      componentDidMount: function() {
        a = this.getDOMNode();
      },
      componentWillUnmount: function() {
        b = this.getDOMNode();
      },
      render: function() {
        return <div />;
      }
    });
    var container = document.createElement('div');
    expect(a).toBe(container.firstChild);
    React.render(<Component />, container);
    React.unmountComponentAtNode(container);
    expect(a).toBe(b);
  });

  it('should warn when using non-React functions in JSX', function() {
    function NotAComponent() {
      return [<div />, <div />];
    }
    expect(function() {
      ReactTestUtils.renderIntoDocument(<div><NotAComponent /></div>);
    }).toThrow();  // has no method 'render'
    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.calls[0].args[0]).toContain(
      'NotAComponent(...): No `render` method found'
    );
  });

  it('should replace state', function() {
    var Moo = React.createClass({
      getInitialState: function() {
        return {x: 1};
      },
      render: function() {
        return <div />;
      }
    });

    var moo = ReactTestUtils.renderIntoDocument(<Moo />);
    moo.replaceState({y: 2});
    expect('x' in moo.state).toBe(false);
    expect(moo.state.y).toBe(2);
  });

  it('should support objects with prototypes as state', function() {
    var NotActuallyImmutable = function(str) {
      this.str = str;
    };
    NotActuallyImmutable.prototype.amIImmutable = function() {
      return true;
    };
    var Moo = React.createClass({
      getInitialState: function() {
        return new NotActuallyImmutable('first');
      },
      render: function() {
        return <div />;
      }
    });

    var moo = ReactTestUtils.renderIntoDocument(<Moo />);
    expect(moo.state.str).toBe('first');
    expect(moo.state.amIImmutable()).toBe(true);

    var secondState = new NotActuallyImmutable('second');
    moo.replaceState(secondState);
    expect(moo.state.str).toBe('second');
    expect(moo.state.amIImmutable()).toBe(true);
    expect(moo.state).toBe(secondState);

    moo.setState({str: 'third'});
    expect(moo.state.str).toBe('third');
    // Here we lose the prototype.
    expect(moo.state.amIImmutable).toBe(undefined);

    // When more than one state update is enqueued, we have the same behavior
    var fifthState = new NotActuallyImmutable('fifth');
    ReactUpdates.batchedUpdates(function() {
      moo.setState({str: 'fourth'});
      moo.replaceState(fifthState);
    });
    expect(moo.state).toBe(fifthState);

    // When more than one state update is enqueued, we have the same behavior
    var sixthState = new NotActuallyImmutable('sixth');
    ReactUpdates.batchedUpdates(function() {
      moo.replaceState(sixthState);
      moo.setState({str: 'seventh'});
    });
    expect(moo.state.str).toBe('seventh');
    expect(moo.state.amIImmutable).toBe(undefined);
  });

});
