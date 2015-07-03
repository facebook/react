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
var ReactMount;
var ReactPropTypes;
var ReactServerRendering;
var ReactTestUtils;
var ReactUpdates;

var reactComponentExpect;

describe('ReactCompositeComponent', function() {

  beforeEach(function() {
    reactComponentExpect = require('reactComponentExpect');
    React = require('React');
    ReactCurrentOwner = require('ReactCurrentOwner');
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
      },
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
      },
    });

    spyOn(console, 'error');
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
      },
    });
    var Parent = React.createClass({
      render: function() {
        return <div><Child /></div>;
      },
    });

    var markup = ReactServerRendering.renderToString(<Parent />);
    var container = document.createElement('div');
    container.innerHTML = markup;

    React.render(<Parent />, container);
    expect(console.error).not.toHaveBeenCalled();
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

    expect(React.findDOMNode(instance.refs.x).tagName).toBe('A');
    instance._toggleActivatedState();
    expect(React.findDOMNode(instance.refs.x).tagName).toBe('B');
    instance._toggleActivatedState();
    expect(React.findDOMNode(instance.refs.x).tagName).toBe('A');
  });

  it('should not cache old DOM nodes when switching constructors', function() {
    var instance = <ChildUpdates renderAnchor={true} anchorClassOn={false}/>;
    instance = ReactTestUtils.renderIntoDocument(instance);
    instance.setProps({anchorClassOn: true});  // Warm any cache
    instance.setProps({renderAnchor: false});  // Clear out the anchor
    // rerender
    instance.setProps({renderAnchor: true, anchorClassOn: false});
    var anchor = instance.getAnchor();
    var actualDOMAnchorNode = React.findDOMNode(anchor);
    expect(actualDOMAnchorNode.className).toBe('');
    expect(actualDOMAnchorNode).toBe(anchor.getDOMNode());
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
      render: function() {
        return <div></div>;
      },
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

    expect(console.error.argsForCall.length).toBe(1);
    var explicitlyBound = mountedInstance.methodToBeExplicitlyBound.bind(
      mountedInstance
    );
    expect(console.error.argsForCall.length).toBe(2);
    var autoBound = mountedInstance.methodAutoBound;

    var context = {};
    expect(explicitlyBound.call(context)).toBe(mountedInstance);
    expect(autoBound.call(context)).toBe(mountedInstance);

    expect(explicitlyBound.call(mountedInstance)).toBe(mountedInstance);
    expect(autoBound.call(mountedInstance)).toBe(mountedInstance);

  });

  it('should not pass this to getDefaultProps', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        expect(this.render).not.toBeDefined();
        return {};
      },
      render: function() {
        return <div />;
      },
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
      },
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
      },
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
    document.body.appendChild(container);

    var Component = React.createClass({
      render: function() {
        return <div />;
      },
    });

    var instance = <Component />;
    expect(instance.forceUpdate).not.toBeDefined();

    instance = React.render(instance, container);
    instance.forceUpdate();

    expect(console.error.calls.length).toBe(0);

    React.unmountComponentAtNode(container);

    instance.forceUpdate();
    expect(console.error.calls.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toBe(
      'Warning: forceUpdate(...): Can only update a mounted or ' +
      'mounting component. This usually means you called forceUpdate() on an ' +
      'unmounted component. This is a no-op. Please check the code for the ' +
      'Component component.'
    );
  });

  it('should warn about `setState` on unmounted components', function() {
    var container = document.createElement('div');
    document.body.appendChild(container);

    var renders = 0;

    var Component = React.createClass({
      getInitialState: function() {
        return {value: 0};
      },
      render: function() {
        renders++;
        return <div />;
      },
    });

    var instance = <Component />;
    expect(instance.setState).not.toBeDefined();

    instance = React.render(instance, container);

    expect(renders).toBe(1);

    instance.setState({value: 1});

    expect(console.error.calls.length).toBe(0);

    expect(renders).toBe(2);

    React.unmountComponentAtNode(container);
    instance.setState({value: 2});

    expect(renders).toBe(2);

    expect(console.error.calls.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toBe(
      'Warning: setState(...): Can only update a mounted or ' +
      'mounting component. This usually means you called setState() on an ' +
      'unmounted component. This is a no-op. Please check the code for the ' +
      'Component component.'
    );
  });

  it('should silently allow `setState`, not call cb on unmounting components',
     function() {
    var cbCalled = false;
    var container = document.createElement('div');
    document.body.appendChild(container);

    var Component = React.createClass({
      getInitialState: function() {
        return {value: 0};
      },
      componentWillUnmount: function() {
        expect(() => {
          this.setState({value: 2}, function() {
            cbCalled = true;
          });
        }).not.toThrow();
      },
      render: function() {
        return <div />;
      },
    });

    var instance = React.render(<Component />, container);

    instance.setState({value: 1});
    expect(console.error.calls.length).toBe(0);

    React.unmountComponentAtNode(container);
    expect(console.error.calls.length).toBe(0);
    expect(cbCalled).toBe(false);
  });


  it('should warn about `setState` in render', function() {
    var container = document.createElement('div');

    var renderedState = -1;
    var renderPasses = 0;

    var Component = React.createClass({
      getInitialState: function() {
        return {value: 0};
      },
      render: function() {
        renderPasses++;
        renderedState = this.state.value;
        if (this.state.value === 0) {
          this.setState({ value: 1 });
        }
        return <div />;
      },
    });

    expect(console.error.calls.length).toBe(0);

    var instance = React.render(<Component />, container);

    expect(console.error.calls.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toBe(
      'Warning: setState(...): Cannot update during an existing state ' +
      'transition (such as within `render`). Render methods should be a pure ' +
      'function of props and state.'
    );

    // The setState call is queued and then executed as a second pass. This
    // behavior is undefined though so we're free to change it to suit the
    // implementation details.
    expect(renderPasses).toBe(2);
    expect(renderedState).toBe(1);
    expect(instance.state.value).toBe(1);

    // Forcing a rerender anywhere will cause the update to happen.
    var instance2 = React.render(<Component prop={123} />, container);
    expect(instance).toBe(instance2);
    expect(renderedState).toBe(1);
    expect(instance2.state.value).toBe(1);
  });

  it('should not allow `setProps` on unmounted components', function() {
    var container = document.createElement('div');
    document.body.appendChild(container);

    var Component = React.createClass({
      render: function() {
        return <div />;
      },
    });

    var instance = <Component />;
    expect(instance.setProps).not.toBeDefined();

    instance = React.render(instance, container);
    expect(function() {
      instance.setProps({value: 1});
    }).not.toThrow();
    expect(console.error.calls.length).toBe(1);  // setProps deprecated

    React.unmountComponentAtNode(container);
    expect(function() {
      instance.setProps({value: 2});
    }).not.toThrow();

    expect(console.error.calls.length).toBe(2);
    expect(console.error.argsForCall[1][0]).toBe(
      'Warning: setProps(...): Can only update a mounted or ' +
      'mounting component. This usually means you called setProps() on an ' +
      'unmounted component. This is a no-op. Please check the code for the ' +
      'Component component.'
    );
  });

  it('should only allow `setProps` on top-level components', function() {
    var container = document.createElement('div');
    document.body.appendChild(container);

    var innerInstance;

    var Inner = React.createClass({
      render: function() {
        return <div />;
      },
    });
    var Component = React.createClass({
      render: function() {
        return <div><Inner ref="inner" /></div>;
      },
      componentDidMount: function() {
        innerInstance = this.refs.inner;
      },
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
      },
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
        return (
          <div>
            <Inner />
            Text
          </div>
        );
      },
    });
    var Inner = React.createClass({
      componentWillUnmount: function() {
        // It's important that ReactMount.purgeID is called after any component
        // lifecycle methods, because a componentWillMount implementation is
        // likely to call React.findDOMNode(this), which will repopulate the
        // node cache after it's been cleared, causing a memory leak.
        expect(ReactMount.purgeID.calls.length).toBe(0);
        innerUnmounted = true;
      },
      render: function() {
        return <div />;
      },
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
      },
    });

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    instance.setState({bogus: true});

    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toBe(
      'Warning: Component.shouldComponentUpdate(): Returned undefined instead of a ' +
      'boolean value. Make sure to return true or false.'
    );
  });

  it('should warn when componentDidUnmount method is defined', function() {
    var Component = React.createClass({
      componentDidUnmount: function() {
      },

      render: function() {
        return <div />;
      },
    });

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(console.error.calls.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toBe(
      'Warning: Component has a method called ' +
      'componentDidUnmount(). But there is no such lifecycle method. ' +
      'Did you mean componentWillUnmount()?'
    );
  });

  it('should pass context to children when not owner', function() {
    var Parent = React.createClass({
      render: function() {
        return <Child><Grandchild /></Child>;
      },
    });

    var Child = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string,
      },

      getChildContext: function() {
        return {
          foo: 'bar',
        };
      },

      render: function() {
        return React.Children.only(this.props.children);
      },
    });

    var Grandchild = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string,
      },

      render: function() {
        return <div>{this.context.foo}</div>;
      },
    });

    var component = ReactTestUtils.renderIntoDocument(<Parent />);
    expect(React.findDOMNode(component).innerHTML).toBe('bar');
  });

  it('should pass context when re-rendered for static child', function() {
    var parentInstance = null;
    var childInstance = null;

    var Parent = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string,
        flag: ReactPropTypes.bool,
      },

      getChildContext: function() {
        return {
          foo: 'bar',
          flag: this.state.flag,
        };
      },

      getInitialState: function() {
        return {
          flag: false,
        };
      },

      render: function() {
        return React.Children.only(this.props.children);
      },
    });

    var Middle = React.createClass({
      render: function() {
        return this.props.children;
      },
    });

    var Child = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string,
        flag: ReactPropTypes.bool,
      },

      render: function() {
        childInstance = this;
        return <span>Child</span>;
      },
    });

    parentInstance = ReactTestUtils.renderIntoDocument(
      <Parent><Middle><Child /></Middle></Parent>
    );

    expect(parentInstance.state.flag).toBe(false);
    reactComponentExpect(childInstance).scalarContextEqual({foo: 'bar', flag: false});

    parentInstance.setState({flag: true});
    expect(parentInstance.state.flag).toBe(true);

    expect(console.error.argsForCall.length).toBe(0);

    reactComponentExpect(childInstance).scalarContextEqual({foo: 'bar', flag: true});
  });

  it('should pass context transitively', function() {
    var childInstance = null;
    var grandchildInstance = null;

    var Parent = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number,
      },

      getChildContext: function() {
        return {
          foo: 'bar',
          depth: 0,
        };
      },

      render: function() {
        return <Child />;
      },
    });

    var Child = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number,
      },

      childContextTypes: {
        depth: ReactPropTypes.number,
      },

      getChildContext: function() {
        return {
          depth: this.context.depth + 1,
        };
      },

      render: function() {
        childInstance = this;
        return <Grandchild />;
      },
    });

    var Grandchild = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number,
      },

      render: function() {
        grandchildInstance = this;
        return <div />;
      },
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
        depth: ReactPropTypes.number,
      },

      getChildContext: function() {
        return {
          foo: 'bar',
          depth: 0,
        };
      },

      getInitialState: function() {
        return {
          flag: false,
        };
      },

      render: function() {
        var output = <Child />;
        if (!this.state.flag) {
          output = <span>Child</span>;
        }
        return output;
      },
    });

    var Child = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number,
      },

      render: function() {
        childInstance = this;
        return <span>Child</span>;
      },
    });

    parentInstance = ReactTestUtils.renderIntoDocument(<Parent />);
    expect(childInstance).toBeNull();

    expect(parentInstance.state.flag).toBe(false);
    ReactUpdates.batchedUpdates(function() {
      parentInstance.setState({flag: true});
    });
    expect(parentInstance.state.flag).toBe(true);

    expect(console.error.argsForCall.length).toBe(0);

    reactComponentExpect(childInstance).scalarContextEqual({foo: 'bar', depth: 0});
  });

  it('unmasked context propagates through updates', function() {

    var Leaf = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string.isRequired,
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
      },
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
      },
    });

    var Parent = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string,
      },

      getChildContext: function() {
        return {
          foo: this.props.cntxt,
        };
      },

      render: function() {
        return <Intermediary />;
      },
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
      },
    });
    var Outer = React.createClass({
      render: function() {
        ReactTestUtils.renderIntoDocument(<Inner />);
        return <div />;
      },
    });

    ReactTestUtils.renderIntoDocument(<Outer />);
    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toBe(
      'Warning: _renderNewRootComponent(): Render methods should ' +
      'be a pure function of props and state; triggering nested component ' +
      'updates from render is not allowed. If necessary, trigger nested ' +
      'updates in componentDidUpdate. Check the render method of Outer.'
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
      },
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
      },
    });
    var Component = React.createClass({
      render: function() {
        if (this.props.flipped) {
          return (
            <div>
              <Static ref="static0" key="B">B (ignored)</Static>
              <Static ref="static1" key="A">A (ignored)</Static>
            </div>
          );
        } else {
          return (
            <div>
              <Static ref="static0" key="A">A</Static>
              <Static ref="static1" key="B">B</Static>
            </div>
          );
        }
      },
    });

    var container = document.createElement('div');
    var comp = React.render(<Component flipped={false} />, container);
    expect(React.findDOMNode(comp.refs.static0).textContent).toBe('A');
    expect(React.findDOMNode(comp.refs.static1).textContent).toBe('B');

    expect(React.findDOMNode(comp.refs.static0))
      .toBe(comp.refs.static0.getDOMNode());
    expect(React.findDOMNode(comp.refs.static1))
      .toBe(comp.refs.static1.getDOMNode());

    // When flipping the order, the refs should update even though the actual
    // contents do not
    React.render(<Component flipped={true} />, container);
    expect(React.findDOMNode(comp.refs.static0).textContent).toBe('B');
    expect(React.findDOMNode(comp.refs.static1).textContent).toBe('A');

    expect(React.findDOMNode(comp.refs.static0))
      .toBe(comp.refs.static0.getDOMNode());
    expect(React.findDOMNode(comp.refs.static1))
      .toBe(comp.refs.static1.getDOMNode());
  });

  it('should allow access to findDOMNode in componentWillUnmount', function() {
    var a = null;
    var b = null;
    var Component = React.createClass({
      componentDidMount: function() {
        a = React.findDOMNode(this);
        expect(a).toBe(this.getDOMNode());
      },
      componentWillUnmount: function() {
        b = React.findDOMNode(this);
        expect(b).toBe(this.getDOMNode());
      },
      render: function() {
        return <div />;
      },
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
    expect(console.error.calls.length).toBe(1);
    expect(console.error.calls[0].args[0]).toContain(
      'NotAComponent(...): No `render` method found'
    );
  });

  it('context should be passed down from the parent', function() {
    var Parent = React.createClass({
      childContextTypes: {
        foo: ReactPropTypes.string,
      },

      getChildContext: function() {
        return {
          foo: 'bar',
        };
      },

      render: function() {
        return <div>{this.props.children}</div>;
      },
    });

    var Component = React.createClass({
      contextTypes: {
        foo: ReactPropTypes.string.isRequired,
      },

      render: function() {
        return <div />;
      },
    });

    var div = document.createElement('div');
    React.render(<Parent><Component /></Parent>, div);

    expect(console.error.argsForCall.length).toBe(0);
  });

  it('should replace state', function() {
    var Moo = React.createClass({
      getInitialState: function() {
        return {x: 1};
      },
      render: function() {
        return <div />;
      },
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
      },
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
