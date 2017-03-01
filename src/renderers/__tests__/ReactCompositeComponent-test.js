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

var ChildUpdates;
var MorphingComponent;
var React;
var ReactDOM;
var ReactDOMFeatureFlags;
var ReactDOMServer;
var ReactCurrentOwner;
var ReactPropTypes;
var ReactTestUtils;

describe('ReactCompositeComponent', () => {

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
    ReactDOMServer = require('react-dom/server');
    ReactCurrentOwner = require('react/lib/ReactCurrentOwner');
    ReactPropTypes = require('ReactPropTypes');
    ReactTestUtils = require('ReactTestUtils');

    MorphingComponent = class extends React.Component {
      state = {activated: false};

      _toggleActivatedState = () => {
        this.setState({activated: !this.state.activated});
      };

      render() {
        var toggleActivatedState = this._toggleActivatedState;
        return !this.state.activated ?
          <a ref="x" onClick={toggleActivatedState} /> :
          <b ref="x" onClick={toggleActivatedState} />;
      }
    };

    /**
     * We'll use this to ensure that an old version is not cached when it is
     * reallocated again.
     */
    ChildUpdates = class extends React.Component {
      getAnchor = () => {
        return this.refs.anch;
      };

      render() {
        var className = this.props.anchorClassOn ? 'anchorClass' : '';
        return this.props.renderAnchor ?
          <a ref="anch" className={className} /> :
          <b />;
      }
    };
  });

  it('should support module pattern components', () => {
    function Child({test}) {
      return {
        render() {
          return <div>{test}</div>;
        },
      };
    }

    var el = document.createElement('div');
    ReactDOM.render(<Child test="test" />, el);

    expect(el.textContent).toBe('test');
  });

  it('should support rendering to different child types over time', () => {
    var instance = ReactTestUtils.renderIntoDocument(<MorphingComponent />);
    var el = ReactDOM.findDOMNode(instance);
    expect(el.tagName).toBe('A');

    instance._toggleActivatedState();
    el = ReactDOM.findDOMNode(instance);
    expect(el.tagName).toBe('B');

    instance._toggleActivatedState();
    el = ReactDOM.findDOMNode(instance);
    expect(el.tagName).toBe('A');
  });

  it('should not thrash a server rendered layout with client side one', () => {
    class Child extends React.Component {
      render() {
        return null;
      }
    }

    class Parent extends React.Component {
      render() {
        return <div><Child /></div>;
      }
    }

    var markup = ReactDOMServer.renderToString(<Parent />);
    var container = document.createElement('div');
    container.innerHTML = markup;

    ReactDOM.render(<Parent />, container);
  });

  it('should react to state changes from callbacks', () => {
    var instance = ReactTestUtils.renderIntoDocument(<MorphingComponent />);
    var el = ReactDOM.findDOMNode(instance);
    expect(el.tagName).toBe('A');

    ReactTestUtils.Simulate.click(el);
    el = ReactDOM.findDOMNode(instance);
    expect(el.tagName).toBe('B');
  });

  it('should rewire refs when rendering to different child types', () => {
    var instance = ReactTestUtils.renderIntoDocument(<MorphingComponent />);

    expect(ReactDOM.findDOMNode(instance.refs.x).tagName).toBe('A');
    instance._toggleActivatedState();
    expect(ReactDOM.findDOMNode(instance.refs.x).tagName).toBe('B');
    instance._toggleActivatedState();
    expect(ReactDOM.findDOMNode(instance.refs.x).tagName).toBe('A');
  });

  it('should not cache old DOM nodes when switching constructors', () => {
    var container = document.createElement('div');
    var instance = ReactDOM.render(
      <ChildUpdates renderAnchor={true} anchorClassOn={false} />,
      container
    );
    ReactDOM.render(  // Warm any cache
      <ChildUpdates renderAnchor={true} anchorClassOn={true} />,
      container
    );
    ReactDOM.render(  // Clear out the anchor
      <ChildUpdates renderAnchor={false} anchorClassOn={true} />,
      container
    );
    ReactDOM.render(  // rerender
      <ChildUpdates renderAnchor={true} anchorClassOn={false} />,
      container
    );
    expect(instance.getAnchor().className).toBe('');
  });

  it('should auto bind methods and values correctly', () => {
    spyOn(console, 'error');

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
        return <div />;
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

    expectDev(console.error.calls.count()).toBe(1);
    var explicitlyBound = mountedInstance.methodToBeExplicitlyBound.bind(
      mountedInstance
    );
    expectDev(console.error.calls.count()).toBe(2);
    var autoBound = mountedInstance.methodAutoBound;

    var context = {};
    expect(explicitlyBound.call(context)).toBe(mountedInstance);
    expect(autoBound.call(context)).toBe(mountedInstance);

    expect(explicitlyBound.call(mountedInstance)).toBe(mountedInstance);
    expect(autoBound.call(mountedInstance)).toBe(mountedInstance);

  });

  it('should not pass this to getDefaultProps', () => {
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

  it('should use default values for undefined props', () => {
    class Component extends React.Component {
      static defaultProps = {prop: 'testKey'};

      render() {
        return <span />;
      }
    }

    var instance1 = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance1.props).toEqual({prop: 'testKey'});

    var instance2 = ReactTestUtils.renderIntoDocument(<Component prop={undefined} />);
    expect(instance2.props).toEqual({prop: 'testKey'});

    var instance3 = ReactTestUtils.renderIntoDocument(<Component prop={null} />);
    expect(instance3.props).toEqual({prop: null});
  });

  it('should not mutate passed-in props object', () => {
    class Component extends React.Component {
      static defaultProps = {prop: 'testKey'};

      render() {
        return <span />;
      }
    }

    var inputProps = {};
    var instance1 = <Component {...inputProps} />;
    instance1 = ReactTestUtils.renderIntoDocument(instance1);
    expect(instance1.props.prop).toBe('testKey');

    // We don't mutate the input, just in case the caller wants to do something
    // with it after using it to instantiate a component
    expect(inputProps.prop).not.toBeDefined();
  });

  it('should warn about `forceUpdate` on unmounted components', () => {
    spyOn(console, 'error');

    var container = document.createElement('div');
    document.body.appendChild(container);

    class Component extends React.Component {
      render() {
        return <div />;
      }
    }

    var instance = <Component />;
    expect(instance.forceUpdate).not.toBeDefined();

    instance = ReactDOM.render(instance, container);
    instance.forceUpdate();

    expectDev(console.error.calls.count()).toBe(0);

    ReactDOM.unmountComponentAtNode(container);

    instance.forceUpdate();
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Can only update a mounted or mounting component. This usually means ' +
      'you called setState, replaceState, or forceUpdate on an unmounted ' +
      'component. This is a no-op.\n\nPlease check the code for the ' +
      'Component component.'
    );
  });

  it('should warn about `setState` on unmounted components', () => {
    spyOn(console, 'error');

    var container = document.createElement('div');
    document.body.appendChild(container);

    var renders = 0;

    class Component extends React.Component {
      state = {value: 0};

      render() {
        renders++;
        return <div />;
      }
    }

    var instance = <Component />;
    expect(instance.setState).not.toBeDefined();

    instance = ReactDOM.render(instance, container);

    expect(renders).toBe(1);

    instance.setState({value: 1});

    expectDev(console.error.calls.count()).toBe(0);

    expect(renders).toBe(2);

    ReactDOM.unmountComponentAtNode(container);
    instance.setState({value: 2});

    expect(renders).toBe(2);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Can only update a mounted or mounting component. This usually means ' +
      'you called setState, replaceState, or forceUpdate on an unmounted ' +
      'component. This is a no-op.\n\nPlease check the code for the ' +
      'Component component.'
    );
  });

  it('should silently allow `setState`, not call cb on unmounting components', () => {
    var cbCalled = false;
    var container = document.createElement('div');
    document.body.appendChild(container);

    class Component extends React.Component {
      state = {value: 0};

      componentWillUnmount() {
        expect(() => {
          this.setState({value: 2}, function() {
            cbCalled = true;
          });
        }).not.toThrow();
      }

      render() {
        return <div />;
      }
    }

    var instance = ReactDOM.render(<Component />, container);
    instance.setState({value: 1});

    ReactDOM.unmountComponentAtNode(container);
    expect(cbCalled).toBe(false);
  });


  it('should warn about `setState` in render', () => {
    spyOn(console, 'error');

    var container = document.createElement('div');

    var renderedState = -1;
    var renderPasses = 0;

    class Component extends React.Component {
      state = {value: 0};

      render() {
        renderPasses++;
        renderedState = this.state.value;
        if (this.state.value === 0) {
          this.setState({ value: 1 });
        }
        return <div />;
      }
    }

    expectDev(console.error.calls.count()).toBe(0);

    var instance = ReactDOM.render(<Component />, container);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Cannot update during an existing state transition (such as within ' +
      '`render` or another component\'s constructor). Render methods should ' +
      'be a pure function of props and state; constructor side-effects are ' +
      'an anti-pattern, but can be moved to `componentWillMount`.'
    );

    // The setState call is queued and then executed as a second pass. This
    // behavior is undefined though so we're free to change it to suit the
    // implementation details.
    expect(renderPasses).toBe(2);
    expect(renderedState).toBe(1);
    expect(instance.state.value).toBe(1);

    // Forcing a rerender anywhere will cause the update to happen.
    var instance2 = ReactDOM.render(<Component prop={123} />, container);
    expect(instance).toBe(instance2);
    expect(renderedState).toBe(1);
    expect(instance2.state.value).toBe(1);
  });

  it('should warn about `setState` in getChildContext', () => {
    spyOn(console, 'error');

    var container = document.createElement('div');

    var renderPasses = 0;

    class Component extends React.Component {
      state = {value: 0};

      getChildContext() {
        if (this.state.value === 0) {
          this.setState({ value: 1 });
        }
      }

      render() {
        renderPasses++;
        return <div />;
      }
    }
    Component.childContextTypes = {};

    expectDev(console.error.calls.count()).toBe(0);
    var instance = ReactDOM.render(<Component />, container);
    expect(renderPasses).toBe(2);
    expect(instance.state.value).toBe(1);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: setState(...): Cannot call setState() inside getChildContext()'
    );
  });

  it('should cleanup even if render() fatals', () => {
    class BadComponent extends React.Component {
      render() {
        throw new Error();
      }
    }

    var instance = <BadComponent />;

    expect(ReactCurrentOwner.current).toBe(null);

    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
    }).toThrow();

    expect(ReactCurrentOwner.current).toBe(null);
  });

  it('should call componentWillUnmount before unmounting', () => {
    var container = document.createElement('div');
    var innerUnmounted = false;

    class Component extends React.Component {
      render() {
        return (
          <div>
            <Inner />
            Text
          </div>
        );
      }
    }

    class Inner extends React.Component {
      componentWillUnmount() {
        innerUnmounted = true;
      }

      render() {
        return <div />;
      }
    }

    ReactDOM.render(<Component />, container);
    ReactDOM.unmountComponentAtNode(container);
    expect(innerUnmounted).toBe(true);
  });

  it('should warn when shouldComponentUpdate() returns undefined', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      state = {bogus: false};

      shouldComponentUpdate() {
        return undefined;
      }

      render() {
        return <div />;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    instance.setState({bogus: true});

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Component.shouldComponentUpdate(): Returned undefined instead of a ' +
      'boolean value. Make sure to return true or false.'
    );
  });

  it('should warn when componentDidUnmount method is defined', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      componentDidUnmount = () => {
      };

      render() {
        return <div />;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Component has a method called ' +
      'componentDidUnmount(). But there is no such lifecycle method. ' +
      'Did you mean componentWillUnmount()?'
    );
  });

  it('should pass context to children when not owner', () => {
    class Parent extends React.Component {
      render() {
        return <Child><Grandchild /></Child>;
      }
    }

    class Child extends React.Component {
      static childContextTypes = {
        foo: ReactPropTypes.string,
      };

      getChildContext() {
        return {
          foo: 'bar',
        };
      }

      render() {
        return React.Children.only(this.props.children);
      }
    }

    class Grandchild extends React.Component {
      static contextTypes = {
        foo: ReactPropTypes.string,
      };

      render() {
        return <div>{this.context.foo}</div>;
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<Parent />);
    expect(ReactDOM.findDOMNode(component).innerHTML).toBe('bar');
  });

  it('should skip update when rerendering element in container', () => {
    class Parent extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    var childRenders = 0;

    class Child extends React.Component {
      render() {
        childRenders++;
        return <div />;
      }
    }

    var container = document.createElement('div');
    var child = <Child />;

    ReactDOM.render(<Parent>{child}</Parent>, container);
    ReactDOM.render(<Parent>{child}</Parent>, container);
    expect(childRenders).toBe(1);
  });

  it('should pass context when re-rendered for static child', () => {
    var parentInstance = null;
    var childInstance = null;

    class Parent extends React.Component {
      static childContextTypes = {
        foo: ReactPropTypes.string,
        flag: ReactPropTypes.bool,
      };

      state = {
        flag: false,
      };

      getChildContext() {
        return {
          foo: 'bar',
          flag: this.state.flag,
        };
      }

      render() {
        return React.Children.only(this.props.children);
      }
    }

    class Middle extends React.Component {
      render() {
        return this.props.children;
      }
    }

    class Child extends React.Component {
      static contextTypes = {
        foo: ReactPropTypes.string,
        flag: ReactPropTypes.bool,
      };

      render() {
        childInstance = this;
        return <span>Child</span>;
      }
    }

    parentInstance = ReactTestUtils.renderIntoDocument(
      <Parent><Middle><Child /></Middle></Parent>
    );

    expect(parentInstance.state.flag).toBe(false);
    expect(childInstance.context).toEqual({foo: 'bar', flag: false});

    parentInstance.setState({flag: true});
    expect(parentInstance.state.flag).toBe(true);
    expect(childInstance.context).toEqual({foo: 'bar', flag: true});
  });

  it('should pass context when re-rendered for static child within a composite component', () => {
    class Parent extends React.Component {
      static childContextTypes = {
        flag: ReactPropTypes.bool,
      };

      state = {
        flag: true,
      };

      getChildContext() {
        return {
          flag: this.state.flag,
        };
      }

      render() {
        return <div>{this.props.children}</div>;
      }
    }

    class Child extends React.Component {
      static contextTypes = {
        flag: ReactPropTypes.bool,
      };

      render() {
        return <div />;
      }
    }

    class Wrapper extends React.Component {
      render() {
        return (
          <Parent ref="parent">
            <Child ref="child" />
          </Parent>
        );
      }
    }


    var wrapper = ReactTestUtils.renderIntoDocument(
      <Wrapper />
    );

    expect(wrapper.refs.parent.state.flag).toEqual(true);
    expect(wrapper.refs.child.context).toEqual({flag: true});

    // We update <Parent /> while <Child /> is still a static prop relative to this update
    wrapper.refs.parent.setState({flag: false});

    expect(wrapper.refs.parent.state.flag).toEqual(false);
    expect(wrapper.refs.child.context).toEqual({flag: false});
  });

  it('should pass context transitively', () => {
    var childInstance = null;
    var grandchildInstance = null;

    class Parent extends React.Component {
      static childContextTypes = {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number,
      };

      getChildContext() {
        return {
          foo: 'bar',
          depth: 0,
        };
      }

      render() {
        return <Child />;
      }
    }

    class Child extends React.Component {
      static contextTypes = {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number,
      };

      static childContextTypes = {
        depth: ReactPropTypes.number,
      };

      getChildContext() {
        return {
          depth: this.context.depth + 1,
        };
      }

      render() {
        childInstance = this;
        return <Grandchild />;
      }
    }

    class Grandchild extends React.Component {
      static contextTypes = {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number,
      };

      render() {
        grandchildInstance = this;
        return <div />;
      }
    }

    ReactTestUtils.renderIntoDocument(<Parent />);
    expect(childInstance.context).toEqual({foo: 'bar', depth: 0});
    expect(grandchildInstance.context).toEqual({foo: 'bar', depth: 1});
  });

  it('should pass context when re-rendered', () => {
    var parentInstance = null;
    var childInstance = null;

    class Parent extends React.Component {
      static childContextTypes = {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number,
      };

      state = {
        flag: false,
      };

      getChildContext() {
        return {
          foo: 'bar',
          depth: 0,
        };
      }

      render() {
        var output = <Child />;
        if (!this.state.flag) {
          output = <span>Child</span>;
        }
        return output;
      }
    }

    class Child extends React.Component {
      static contextTypes = {
        foo: ReactPropTypes.string,
        depth: ReactPropTypes.number,
      };

      render() {
        childInstance = this;
        return <span>Child</span>;
      }
    }

    parentInstance = ReactTestUtils.renderIntoDocument(<Parent />);
    expect(childInstance).toBeNull();

    expect(parentInstance.state.flag).toBe(false);
    ReactDOM.unstable_batchedUpdates(function() {
      parentInstance.setState({flag: true});
    });
    expect(parentInstance.state.flag).toBe(true);

    expect(childInstance.context).toEqual({foo: 'bar', depth: 0});
  });

  it('unmasked context propagates through updates', () => {
    class Leaf extends React.Component {
      static contextTypes = {
        foo: ReactPropTypes.string.isRequired,
      };

      componentWillReceiveProps(nextProps, nextContext) {
        expect('foo' in nextContext).toBe(true);
      }

      componentDidUpdate(prevProps, prevState, prevContext) {
        if (!ReactDOMFeatureFlags.useFiber) {
          // Fiber does not pass the previous context.
          expect('foo' in prevContext).toBe(true);
        }
      }

      shouldComponentUpdate(nextProps, nextState, nextContext) {
        expect('foo' in nextContext).toBe(true);
        return true;
      }

      render() {
        return <span>{this.context.foo}</span>;
      }
    }

    class Intermediary extends React.Component {
      componentWillReceiveProps(nextProps, nextContext) {
        expect('foo' in nextContext).toBe(false);
      }

      componentDidUpdate(prevProps, prevState, prevContext) {
        if (!ReactDOMFeatureFlags.useFiber) {
          // Fiber does not pass the previous context.
          expect('foo' in prevContext).toBe(false);
        }
      }

      shouldComponentUpdate(nextProps, nextState, nextContext) {
        expect('foo' in nextContext).toBe(false);
        return true;
      }

      render() {
        return <Leaf />;
      }
    }

    class Parent extends React.Component {
      static childContextTypes = {
        foo: ReactPropTypes.string,
      };

      getChildContext() {
        return {
          foo: this.props.cntxt,
        };
      }

      render() {
        return <Intermediary />;
      }
    }

    var div = document.createElement('div');
    ReactDOM.render(<Parent cntxt="noise" />, div);
    expect(div.children[0].innerHTML).toBe('noise');
    div.children[0].innerHTML = 'aliens';
    div.children[0].id = 'aliens';
    expect(div.children[0].innerHTML).toBe('aliens');
    expect(div.children[0].id).toBe('aliens');
    ReactDOM.render(<Parent cntxt="bar" />, div);
    expect(div.children[0].innerHTML).toBe('bar');
    expect(div.children[0].id).toBe('aliens');
  });

  it('should trigger componentWillReceiveProps for context changes', () => {
    var contextChanges = 0;
    var propChanges = 0;

    class GrandChild extends React.Component {
      static contextTypes = {
        foo: ReactPropTypes.string.isRequired,
      };

      componentWillReceiveProps(nextProps, nextContext) {
        expect('foo' in nextContext).toBe(true);

        if (nextProps !== this.props) {
          propChanges++;
        }

        if (nextContext !== this.context) {
          contextChanges++;
        }
      }

      render() {
        return <span className="grand-child">{this.props.children}</span>;
      }
    }

    class ChildWithContext extends React.Component {
      static contextTypes = {
        foo: ReactPropTypes.string.isRequired,
      };

      componentWillReceiveProps(nextProps, nextContext) {
        expect('foo' in nextContext).toBe(true);

        if (nextProps !== this.props) {
          propChanges++;
        }

        if (nextContext !== this.context) {
          contextChanges++;
        }
      }

      render() {
        return <div className="child-with">{this.props.children}</div>;
      }
    }

    class ChildWithoutContext extends React.Component {
      componentWillReceiveProps(nextProps, nextContext) {
        expect('foo' in nextContext).toBe(false);

        if (nextProps !== this.props) {
          propChanges++;
        }

        if (nextContext !== this.context) {
          contextChanges++;
        }
      }

      render() {
        return <div className="child-without">{this.props.children}</div>;
      }
    }

    class Parent extends React.Component {
      static childContextTypes = {
        foo: ReactPropTypes.string,
      };

      state = {
        foo: 'abc',
      };

      getChildContext() {
        return {
          foo: this.state.foo,
        };
      }

      render() {
        return <div className="parent">{this.props.children}</div>;
      }
    }

    var div = document.createElement('div');

    var parentInstance = null;
    ReactDOM.render(
      <Parent ref={inst => parentInstance = inst}>
        <ChildWithoutContext>
          A1
          <GrandChild>A2</GrandChild>
        </ChildWithoutContext>

        <ChildWithContext>
          B1
          <GrandChild>B2</GrandChild>
        </ChildWithContext>
      </Parent>,
      div
    );

    parentInstance.setState({
      foo: 'def',
    });

    expect(propChanges).toBe(0);
    expect(contextChanges).toBe(3); // ChildWithContext, GrandChild x 2
  });

  it('should disallow nested render calls', () => {
    spyOn(console, 'error');

    class Inner extends React.Component {
      render() {
        return <div />;
      }
    }

    class Outer extends React.Component {
      render() {
        ReactTestUtils.renderIntoDocument(<Inner />);
        return <div />;
      }
    }

    ReactTestUtils.renderIntoDocument(<Outer />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toMatch(
      'Render methods should be a pure function of props and state; ' +
      'triggering nested component updates from render is not allowed. If ' +
      'necessary, trigger nested updates in componentDidUpdate.\n\nCheck the ' +
      'render method of Outer.'
    );
  });

  it('only renders once if updated in componentWillReceiveProps', () => {
    var renders = 0;

    class Component extends React.Component {
      state = {updated: false};

      componentWillReceiveProps(props) {
        expect(props.update).toBe(1);
        expect(renders).toBe(1);
        this.setState({updated: true});
        expect(renders).toBe(1);
      }

      render() {
        renders++;
        return <div />;
      }
    }

    var container = document.createElement('div');
    var instance = ReactDOM.render(<Component update={0} />, container);
    expect(renders).toBe(1);
    expect(instance.state.updated).toBe(false);
    ReactDOM.render(<Component update={1} />, container);
    expect(renders).toBe(2);
    expect(instance.state.updated).toBe(true);
  });

  it('only renders once if updated in componentWillReceiveProps when batching', () => {
    var renders = 0;

    class Component extends React.Component {
      state = {updated: false};

      componentWillReceiveProps(props) {
        expect(props.update).toBe(1);
        expect(renders).toBe(1);
        this.setState({updated: true});
        expect(renders).toBe(1);
      }

      render() {
        renders++;
        return <div />;
      }
    }

    var container = document.createElement('div');
    var instance = ReactDOM.render(<Component update={0} />, container);
    expect(renders).toBe(1);
    expect(instance.state.updated).toBe(false);
    ReactDOM.unstable_batchedUpdates(() => {
      ReactDOM.render(<Component update={1} />, container);
    });
    expect(renders).toBe(2);
    expect(instance.state.updated).toBe(true);
  });

  it('should update refs if shouldComponentUpdate gives false', () => {
    class Static extends React.Component {
      shouldComponentUpdate() {
        return false;
      }

      render() {
        return <div>{this.props.children}</div>;
      }
    }

    class Component extends React.Component {
      render() {
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
      }
    }

    var container = document.createElement('div');
    var comp = ReactDOM.render(<Component flipped={false} />, container);
    expect(ReactDOM.findDOMNode(comp.refs.static0).textContent).toBe('A');
    expect(ReactDOM.findDOMNode(comp.refs.static1).textContent).toBe('B');

    // When flipping the order, the refs should update even though the actual
    // contents do not
    ReactDOM.render(<Component flipped={true} />, container);
    expect(ReactDOM.findDOMNode(comp.refs.static0).textContent).toBe('B');
    expect(ReactDOM.findDOMNode(comp.refs.static1).textContent).toBe('A');
  });

  it('should allow access to findDOMNode in componentWillUnmount', () => {
    var a = null;
    var b = null;

    class Component extends React.Component {
      componentDidMount() {
        a = ReactDOM.findDOMNode(this);
        expect(a).not.toBe(null);
      }

      componentWillUnmount() {
        b = ReactDOM.findDOMNode(this);
        expect(b).not.toBe(null);
      }

      render() {
        return <div />;
      }
    }

    var container = document.createElement('div');
    expect(a).toBe(container.firstChild);
    ReactDOM.render(<Component />, container);
    ReactDOM.unmountComponentAtNode(container);
    expect(a).toBe(b);
  });

  it('context should be passed down from the parent', () => {
    class Parent extends React.Component {
      static childContextTypes = {
        foo: ReactPropTypes.string,
      };

      getChildContext() {
        return {
          foo: 'bar',
        };
      }

      render() {
        return <div>{this.props.children}</div>;
      }
    }

    class Component extends React.Component {
      static contextTypes = {
        foo: ReactPropTypes.string.isRequired,
      };

      render() {
        return <div />;
      }
    }

    var div = document.createElement('div');
    ReactDOM.render(<Parent><Component /></Parent>, div);
  });

  it('should replace state', () => {
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

  it('should support objects with prototypes as state', () => {
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
    ReactDOM.unstable_batchedUpdates(function() {
      moo.setState({str: 'fourth'});
      moo.replaceState(fifthState);
    });
    expect(moo.state).toBe(fifthState);

    // When more than one state update is enqueued, we have the same behavior
    var sixthState = new NotActuallyImmutable('sixth');
    ReactDOM.unstable_batchedUpdates(function() {
      moo.replaceState(sixthState);
      moo.setState({str: 'seventh'});
    });
    expect(moo.state.str).toBe('seventh');
    expect(moo.state.amIImmutable).toBe(undefined);
  });

  it('should not warn about unmounting during unmounting', () => {
    var container = document.createElement('div');
    var layer = document.createElement('div');

    class Component extends React.Component {
      componentDidMount() {
        ReactDOM.render(<div />, layer);
      }

      componentWillUnmount() {
        ReactDOM.unmountComponentAtNode(layer);
      }

      render() {
        return <div />;
      }
    }

    class Outer extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    ReactDOM.render(<Outer><Component /></Outer>, container);
    ReactDOM.render(<Outer />, container);
  });

  it('should warn when mutated props are passed', () => {
    spyOn(console, 'error');

    var container = document.createElement('div');

    class Foo extends React.Component {
      constructor(props) {
        var _props = { idx: props.idx + '!' };
        super(_props);
      }

      render() {
        return <span />;
      }
    }

    expectDev(console.error.calls.count()).toBe(0);

    ReactDOM.render(<Foo idx="qwe" />, container);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Foo(...): When calling super() in `Foo`, make sure to pass ' +
      'up the same props that your component\'s constructor was passed.'
    );

  });

  it('should only call componentWillUnmount once', () => {
    var app;
    var count = 0;

    class App extends React.Component {
      render() {
        if (this.props.stage === 1) {
          return <UnunmountableComponent />;
        } else {
          return null;
        }
      }
    }

    class UnunmountableComponent extends React.Component {
      componentWillUnmount() {
        app.setState({});
        count++;
        throw Error('always fails');
      }

      render() {
        return <div>Hello {this.props.name}</div>;
      }
    }

    var container = document.createElement('div');

    var setRef = (ref) => {
      if (ref) {
        app = ref;
      }
    };

    expect(function() {
      ReactDOM.render(<App ref={setRef} stage={1} />, container);
      ReactDOM.render(<App ref={setRef} stage={2} />, container);
    }).toThrow();
    expect(count).toBe(1);
  });

  it('prepares new child before unmounting old', () => {
    var log = [];

    class Spy extends React.Component {
      componentWillMount() {
        log.push(this.props.name + ' componentWillMount');
      }
      render() {
        log.push(this.props.name + ' render');
        return <div />;
      }
      componentDidMount() {
        log.push(this.props.name + ' componentDidMount');
      }
      componentWillUnmount() {
        log.push(this.props.name + ' componentWillUnmount');
      }
    }

    class Wrapper extends React.Component {
      render() {
        return <Spy key={this.props.name} name={this.props.name} />;
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<Wrapper name="A" />, container);
    ReactDOM.render(<Wrapper name="B" />, container);

    expect(log).toEqual([
      'A componentWillMount',
      'A render',
      'A componentDidMount',

      'B componentWillMount',
      'B render',
      'A componentWillUnmount',
      'B componentDidMount',
    ]);
  });

});
