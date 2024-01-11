/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let act;

let ChildUpdates;
let MorphingComponent;
let React;
let ReactDOM;
let ReactDOMClient;
let ReactCurrentOwner;
let ReactTestUtils;
let PropTypes;

describe('ReactCompositeComponent', () => {
  const hasOwnProperty = Object.prototype.hasOwnProperty;

  /**
   * Performs equality by iterating through keys on an object and returning false
   * when any key has values which are not strictly equal between the arguments.
   * Returns true when the values of all keys are strictly equal.
   */
  function shallowEqual(objA: mixed, objB: mixed): boolean {
    if (Object.is(objA, objB)) {
      return true;
    }
    if (
      typeof objA !== 'object' ||
      objA === null ||
      typeof objB !== 'object' ||
      objB === null
    ) {
      return false;
    }
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) {
      return false;
    }
    for (let i = 0; i < keysA.length; i++) {
      if (
        !hasOwnProperty.call(objB, keysA[i]) ||
        !Object.is(objA[keysA[i]], objB[keysA[i]])
      ) {
        return false;
      }
    }
    return true;
  }

  function shallowCompare(instance, nextProps, nextState) {
    return (
      !shallowEqual(instance.props, nextProps) ||
      !shallowEqual(instance.state, nextState)
    );
  }

  beforeEach(() => {
    jest.resetModules();

    act = require('internal-test-utils').act;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactCurrentOwner =
      require('react').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .ReactCurrentOwner;
    ReactTestUtils = require('react-dom/test-utils');
    PropTypes = require('prop-types');

    MorphingComponent = class extends React.Component {
      state = {activated: false};

      xRef = React.createRef();

      _toggleActivatedState = () => {
        this.setState({activated: !this.state.activated});
      };

      render() {
        const toggleActivatedState = this._toggleActivatedState;
        return !this.state.activated ? (
          <a ref={this.xRef} onClick={toggleActivatedState} />
        ) : (
          <b ref={this.xRef} onClick={toggleActivatedState} />
        );
      }
    };

    /**
     * We'll use this to ensure that an old version is not cached when it is
     * reallocated again.
     */
    ChildUpdates = class extends React.Component {
      anchorRef = React.createRef();

      getAnchor = () => {
        return this.anchorRef.current;
      };

      render() {
        const className = this.props.anchorClassOn ? 'anchorClass' : '';
        return this.props.renderAnchor ? (
          <a ref={this.anchorRef} className={className} />
        ) : (
          <b />
        );
      }
    };
  });

  if (require('shared/ReactFeatureFlags').disableModulePatternComponents) {
    it('should not support module pattern components', async () => {
      function Child({test}) {
        return {
          render() {
            return <div>{test}</div>;
          },
        };
      }

      const el = document.createElement('div');
      const root = ReactDOMClient.createRoot(el);
      await expect(async () => {
        await expect(async () => {
          await act(() => {
            root.render(<Child test="test" />);
          });
        }).toThrow(
          'Objects are not valid as a React child (found: object with keys {render}).',
        );
      }).toErrorDev(
        'Warning: The <Child /> component appears to be a function component that returns a class instance. ' +
          'Change Child to a class that extends React.Component instead. ' +
          "If you can't use a class try assigning the prototype on the function as a workaround. " +
          '`Child.prototype = React.Component.prototype`. ' +
          "Don't use an arrow function since it cannot be called with `new` by React.",
      );

      expect(el.textContent).toBe('');
    });
  } else {
    it('should support module pattern components', async () => {
      function Child({test}) {
        return {
          render() {
            return <div>{test}</div>;
          },
        };
      }

      const el = document.createElement('div');
      const root = ReactDOMClient.createRoot(el);
      await expect(async () => {
        await act(() => {
          root.render(<Child test="test" />);
        });
      }).toErrorDev(
        'Warning: The <Child /> component appears to be a function component that returns a class instance. ' +
          'Change Child to a class that extends React.Component instead. ' +
          "If you can't use a class try assigning the prototype on the function as a workaround. " +
          '`Child.prototype = React.Component.prototype`. ' +
          "Don't use an arrow function since it cannot be called with `new` by React.",
      );

      expect(el.textContent).toBe('test');
    });
  }

  it('should support rendering to different child types over time', () => {
    const instance = ReactTestUtils.renderIntoDocument(<MorphingComponent />);
    let el = ReactDOM.findDOMNode(instance);
    expect(el.tagName).toBe('A');

    instance._toggleActivatedState();
    el = ReactDOM.findDOMNode(instance);
    expect(el.tagName).toBe('B');

    instance._toggleActivatedState();
    el = ReactDOM.findDOMNode(instance);
    expect(el.tagName).toBe('A');
  });

  it('should react to state changes from callbacks', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    document.body.appendChild(container);

    const ref = React.createRef();
    await act(() => {
      root.render(<MorphingComponent ref={ref} />);
    });
    const instance = ref.current;
    let el = ReactDOM.findDOMNode(instance);
    expect(el.tagName).toBe('A');
    await act(() => {
      el.click();
    });
    el = ReactDOM.findDOMNode(instance);
    expect(el.tagName).toBe('B');

    document.body.removeChild(container);
  });

  it('should rewire refs when rendering to different child types', () => {
    const instance = ReactTestUtils.renderIntoDocument(<MorphingComponent />);

    expect(instance.xRef.current.tagName).toBe('A');
    instance._toggleActivatedState();
    expect(instance.xRef.current.tagName).toBe('B');
    instance._toggleActivatedState();
    expect(instance.xRef.current.tagName).toBe('A');
  });

  it('should not cache old DOM nodes when switching constructors', async () => {
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    const ref = React.createRef();
    await act(() => {
      root.render(
        <ChildUpdates ref={ref} renderAnchor={true} anchorClassOn={false} />,
      );
    });
    const instance = ref.current;
    await act(() => {
      root.render(
        // Warm any cache
        <ChildUpdates renderAnchor={true} anchorClassOn={true} />,
      );
    });
    await act(() => {
      root.render(
        // Clear out the anchor
        <ChildUpdates renderAnchor={false} anchorClassOn={true} />,
      );
    });
    await act(() => {
      root.render(
        // rerender
        <ChildUpdates renderAnchor={true} anchorClassOn={false} />,
      );
    });
    expect(instance.getAnchor().className).toBe('');
  });

  it('should use default values for undefined props', () => {
    class Component extends React.Component {
      static defaultProps = {prop: 'testKey'};

      render() {
        return <span />;
      }
    }

    const instance1 = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance1.props).toEqual({prop: 'testKey'});

    const instance2 = ReactTestUtils.renderIntoDocument(
      <Component prop={undefined} />,
    );
    expect(instance2.props).toEqual({prop: 'testKey'});

    const instance3 = ReactTestUtils.renderIntoDocument(
      <Component prop={null} />,
    );
    expect(instance3.props).toEqual({prop: null});
  });

  it('should not mutate passed-in props object', () => {
    class Component extends React.Component {
      static defaultProps = {prop: 'testKey'};

      render() {
        return <span />;
      }
    }

    const inputProps = {};
    let instance1 = <Component {...inputProps} />;
    instance1 = ReactTestUtils.renderIntoDocument(instance1);
    expect(instance1.props.prop).toBe('testKey');

    // We don't mutate the input, just in case the caller wants to do something
    // with it after using it to instantiate a component
    expect(inputProps.prop).not.toBeDefined();
  });

  it('should warn about `forceUpdate` on not-yet-mounted components', async () => {
    class MyComponent extends React.Component {
      constructor(props) {
        super(props);
        this.forceUpdate();
      }
      render() {
        return <div />;
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await expect(async () => {
      await act(() => {
        root.render(<MyComponent />);
      });
    }).toErrorDev(
      "Warning: Can't call forceUpdate on a component that is not yet mounted. " +
        'This is a no-op, but it might indicate a bug in your application. ' +
        'Instead, assign to `this.state` directly or define a `state = {};` ' +
        'class property with the desired state in the MyComponent component.',
    );

    // No additional warning should be recorded
    const container2 = document.createElement('div');
    await act(() => {
      root.render(<MyComponent />);
    });
  });

  it('should warn about `setState` on not-yet-mounted components', async () => {
    class MyComponent extends React.Component {
      constructor(props) {
        super(props);
        this.setState();
      }
      render() {
        return <div />;
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await expect(async () => {
      await act(() => {
        root.render(<MyComponent />);
      });
    }).toErrorDev(
      "Warning: Can't call setState on a component that is not yet mounted. " +
        'This is a no-op, but it might indicate a bug in your application. ' +
        'Instead, assign to `this.state` directly or define a `state = {};` ' +
        'class property with the desired state in the MyComponent component.',
    );

    // No additional warning should be recorded
    const container2 = document.createElement('div');
    await act(() => {
      root.render(<MyComponent />);
    });
  });

  it('should not warn about `forceUpdate` on unmounted components', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    document.body.appendChild(container);

    class Component extends React.Component {
      render() {
        return <div />;
      }
    }

    const ref = React.createRef();
    let instance = <Component ref={ref} />;
    expect(instance.forceUpdate).not.toBeDefined();

    await act(() => {
      root.render(instance);
    });
    instance = ref.current;
    await act(() => {
      instance.forceUpdate();
    });

    await act(() => {
      root.unmount(container);
    });

    await act(() => {
      instance.forceUpdate();
    });
    await act(() => {
      instance.forceUpdate();
    });
  });

  it('should not warn about `setState` on unmounted components', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    document.body.appendChild(container);

    let renders = 0;

    class Component extends React.Component {
      state = {value: 0};

      render() {
        renders++;
        return <div />;
      }
    }

    let instance;
    await act(() => {
      root.render(
        <div>
          <span>
            <Component ref={c => (instance = c || instance)} />
          </span>
        </div>,
      );
    });

    expect(renders).toBe(1);

    await act(() => {
      instance.setState({value: 1});
    });
    expect(renders).toBe(2);

    await act(() => {
      root.render(<div />);
    });
    await act(() => {
      instance.setState({value: 2});
    });
    expect(renders).toBe(2);
  });

  it('should silently allow `setState`, not call cb on unmounting components', async () => {
    let cbCalled = false;
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    document.body.appendChild(container);

    class Component extends React.Component {
      state = {value: 0};

      componentWillUnmount() {
        expect(() => {
          this.setState({value: 2}, function () {
            cbCalled = true;
          });
        }).not.toThrow();
      }

      render() {
        return <div />;
      }
    }

    const ref = React.createRef();
    await act(() => {
      root.render(<Component ref={ref} />);
    });
    const instance = ref.current;
    act(() => {
      instance.setState({value: 1});
    });

    await act(() => {
      root.unmount();
    });
    expect(cbCalled).toBe(false);
  });

  it('should warn when rendering a class with a render method that does not extend React.Component', () => {
    const container = document.createElement('div');
    class ClassWithRenderNotExtended {
      render() {
        return <div />;
      }
    }
    expect(() => {
      expect(() => {
        ReactDOM.render(<ClassWithRenderNotExtended />, container);
      }).toThrow(TypeError);
    }).toErrorDev(
      'Warning: The <ClassWithRenderNotExtended /> component appears to have a render method, ' +
        "but doesn't extend React.Component. This is likely to cause errors. " +
        'Change ClassWithRenderNotExtended to extend React.Component instead.',
    );

    // Test deduplication
    expect(() => {
      ReactDOM.render(<ClassWithRenderNotExtended />, container);
    }).toThrow(TypeError);
  });

  it('should warn about `setState` in render', () => {
    const container = document.createElement('div');

    let renderedState = -1;
    let renderPasses = 0;

    class Component extends React.Component {
      state = {value: 0};

      render() {
        renderPasses++;
        renderedState = this.state.value;
        if (this.state.value === 0) {
          this.setState({value: 1});
        }
        return <div />;
      }
    }

    let instance;

    expect(() => {
      instance = ReactDOM.render(<Component />, container);
    }).toErrorDev(
      'Cannot update during an existing state transition (such as within ' +
        '`render`). Render methods should be a pure function of props and state.',
    );

    // The setState call is queued and then executed as a second pass. This
    // behavior is undefined though so we're free to change it to suit the
    // implementation details.
    expect(renderPasses).toBe(2);
    expect(renderedState).toBe(1);
    expect(instance.state.value).toBe(1);

    // Forcing a rerender anywhere will cause the update to happen.
    const instance2 = ReactDOM.render(<Component prop={123} />, container);
    expect(instance).toBe(instance2);
    expect(renderedState).toBe(1);
    expect(instance2.state.value).toBe(1);

    // Test deduplication; (no additional warnings are expected).
    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(<Component prop={123} />, container);
  });

  it('should cleanup even if render() fatals', () => {
    class BadComponent extends React.Component {
      render() {
        throw new Error();
      }
    }

    let instance = <BadComponent />;

    expect(ReactCurrentOwner.current).toBe(null);

    expect(() => {
      instance = ReactTestUtils.renderIntoDocument(instance);
    }).toThrow();

    expect(ReactCurrentOwner.current).toBe(null);
  });

  it('should call componentWillUnmount before unmounting', async () => {
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    let innerUnmounted = false;

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

    await act(() => {
      root.render(<Component />);
    });
    await act(() => {
      root.unmount();
    });
    expect(innerUnmounted).toBe(true);
  });

  it('should warn when shouldComponentUpdate() returns undefined', () => {
    class ClassComponent extends React.Component {
      state = {bogus: false};

      shouldComponentUpdate() {
        return undefined;
      }

      render() {
        return <div />;
      }
    }

    const instance = ReactTestUtils.renderIntoDocument(<ClassComponent />);

    expect(() => instance.setState({bogus: true})).toErrorDev(
      'Warning: ClassComponent.shouldComponentUpdate(): Returned undefined instead of a ' +
        'boolean value. Make sure to return true or false.',
    );
  });

  it('should warn when componentDidUnmount method is defined', () => {
    class Component extends React.Component {
      componentDidUnmount = () => {};

      render() {
        return <div />;
      }
    }

    expect(() => ReactTestUtils.renderIntoDocument(<Component />)).toErrorDev(
      'Warning: Component has a method called ' +
        'componentDidUnmount(). But there is no such lifecycle method. ' +
        'Did you mean componentWillUnmount()?',
    );
  });

  it('should warn when componentDidReceiveProps method is defined', () => {
    class Component extends React.Component {
      componentDidReceiveProps = () => {};

      render() {
        return <div />;
      }
    }

    expect(() => ReactTestUtils.renderIntoDocument(<Component />)).toErrorDev(
      'Warning: Component has a method called ' +
        'componentDidReceiveProps(). But there is no such lifecycle method. ' +
        'If you meant to update the state in response to changing props, ' +
        'use componentWillReceiveProps(). If you meant to fetch data or ' +
        'run side-effects or mutations after React has updated the UI, use componentDidUpdate().',
    );
  });

  it('should warn when defaultProps was defined as an instance property', () => {
    class Component extends React.Component {
      constructor(props) {
        super(props);
        this.defaultProps = {name: 'Abhay'};
      }

      render() {
        return <div />;
      }
    }

    expect(() => ReactTestUtils.renderIntoDocument(<Component />)).toErrorDev(
      'Warning: Setting defaultProps as an instance property on Component is not supported ' +
        'and will be ignored. Instead, define defaultProps as a static property on Component.',
    );
  });

  // @gate !disableLegacyContext
  it('should pass context to children when not owner', () => {
    class Parent extends React.Component {
      render() {
        return (
          <Child>
            <Grandchild />
          </Child>
        );
      }
    }

    class Child extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string,
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
        foo: PropTypes.string,
      };

      render() {
        return <div>{this.context.foo}</div>;
      }
    }

    const component = ReactTestUtils.renderIntoDocument(<Parent />);
    expect(ReactDOM.findDOMNode(component).innerHTML).toBe('bar');
  });

  it('should skip update when rerendering element in container', async () => {
    class Parent extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    let childRenders = 0;

    class Child extends React.Component {
      render() {
        childRenders++;
        return <div />;
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    const child = <Child />;

    await act(() => {
      root.render(<Parent>{child}</Parent>);
    });
    await act(() => {
      root.render(<Parent>{child}</Parent>);
    });
    expect(childRenders).toBe(1);
  });

  // @gate !disableLegacyContext
  it('should pass context when re-rendered for static child', () => {
    let parentInstance = null;
    let childInstance = null;

    class Parent extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string,
        flag: PropTypes.bool,
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
        foo: PropTypes.string,
        flag: PropTypes.bool,
      };

      render() {
        childInstance = this;
        return <span>Child</span>;
      }
    }

    parentInstance = ReactTestUtils.renderIntoDocument(
      <Parent>
        <Middle>
          <Child />
        </Middle>
      </Parent>,
    );

    expect(parentInstance.state.flag).toBe(false);
    expect(childInstance.context).toEqual({foo: 'bar', flag: false});

    parentInstance.setState({flag: true});
    expect(parentInstance.state.flag).toBe(true);
    expect(childInstance.context).toEqual({foo: 'bar', flag: true});
  });

  // @gate !disableLegacyContext
  it('should pass context when re-rendered for static child within a composite component', () => {
    class Parent extends React.Component {
      static childContextTypes = {
        flag: PropTypes.bool,
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
        flag: PropTypes.bool,
      };

      render() {
        return <div />;
      }
    }

    class Wrapper extends React.Component {
      parentRef = React.createRef();
      childRef = React.createRef();

      render() {
        return (
          <Parent ref={this.parentRef}>
            <Child ref={this.childRef} />
          </Parent>
        );
      }
    }

    const wrapper = ReactTestUtils.renderIntoDocument(<Wrapper />);

    expect(wrapper.parentRef.current.state.flag).toEqual(true);
    expect(wrapper.childRef.current.context).toEqual({flag: true});

    // We update <Parent /> while <Child /> is still a static prop relative to this update
    wrapper.parentRef.current.setState({flag: false});

    expect(wrapper.parentRef.current.state.flag).toEqual(false);
    expect(wrapper.childRef.current.context).toEqual({flag: false});
  });

  // @gate !disableLegacyContext
  it('should pass context transitively', () => {
    let childInstance = null;
    let grandchildInstance = null;

    class Parent extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string,
        depth: PropTypes.number,
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
        foo: PropTypes.string,
        depth: PropTypes.number,
      };

      static childContextTypes = {
        depth: PropTypes.number,
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
        foo: PropTypes.string,
        depth: PropTypes.number,
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

  // @gate !disableLegacyContext
  it('should pass context when re-rendered', () => {
    let parentInstance = null;
    let childInstance = null;

    class Parent extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string,
        depth: PropTypes.number,
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
        let output = <Child />;
        if (!this.state.flag) {
          output = <span>Child</span>;
        }
        return output;
      }
    }

    class Child extends React.Component {
      static contextTypes = {
        foo: PropTypes.string,
        depth: PropTypes.number,
      };

      render() {
        childInstance = this;
        return <span>Child</span>;
      }
    }

    parentInstance = ReactTestUtils.renderIntoDocument(<Parent />);
    expect(childInstance).toBeNull();

    expect(parentInstance.state.flag).toBe(false);
    ReactDOM.unstable_batchedUpdates(function () {
      parentInstance.setState({flag: true});
    });
    expect(parentInstance.state.flag).toBe(true);

    expect(childInstance.context).toEqual({foo: 'bar', depth: 0});
  });

  // @gate !disableLegacyContext
  it('unmasked context propagates through updates', async () => {
    class Leaf extends React.Component {
      static contextTypes = {
        foo: PropTypes.string.isRequired,
      };

      UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        expect('foo' in nextContext).toBe(true);
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
      UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        expect('foo' in nextContext).toBe(false);
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
        foo: PropTypes.string,
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

    const div = document.createElement('div');
    const root = ReactDOMClient.createRoot(div);
    await act(() => {
      root.render(<Parent cntxt="noise" />);
    });
    expect(div.children[0].innerHTML).toBe('noise');
    div.children[0].innerHTML = 'aliens';
    div.children[0].id = 'aliens';
    expect(div.children[0].innerHTML).toBe('aliens');
    expect(div.children[0].id).toBe('aliens');
    await act(() => {
      root.render(<Parent cntxt="bar" />);
    });
    expect(div.children[0].innerHTML).toBe('bar');
    expect(div.children[0].id).toBe('aliens');
  });

  // @gate !disableLegacyContext
  it('should trigger componentWillReceiveProps for context changes', async () => {
    let contextChanges = 0;
    let propChanges = 0;

    class GrandChild extends React.Component {
      static contextTypes = {
        foo: PropTypes.string.isRequired,
      };

      UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
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
        foo: PropTypes.string.isRequired,
      };

      UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
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
      UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
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
        foo: PropTypes.string,
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

    const root = ReactDOMClient.createRoot(document.createElement('div'));

    let parentInstance = null;
    await act(() => {
      root.render(
        <Parent ref={inst => (parentInstance = inst)}>
          <ChildWithoutContext>
            A1
            <GrandChild>A2</GrandChild>
          </ChildWithoutContext>

          <ChildWithContext>
            B1
            <GrandChild>B2</GrandChild>
          </ChildWithContext>
        </Parent>,
      );
    });

    await act(() => {
      parentInstance.setState({
        foo: 'def',
      });
    });

    expect(propChanges).toBe(0);
    expect(contextChanges).toBe(3); // ChildWithContext, GrandChild x 2
  });

  it('should disallow nested render calls', () => {
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

    expect(() => ReactTestUtils.renderIntoDocument(<Outer />)).toErrorDev(
      'Render methods should be a pure function of props and state; ' +
        'triggering nested component updates from render is not allowed. If ' +
        'necessary, trigger nested updates in componentDidUpdate.\n\nCheck the ' +
        'render method of Outer.',
    );
  });

  it('only renders once if updated in componentWillReceiveProps', async () => {
    let renders = 0;

    class Component extends React.Component {
      state = {updated: false};

      UNSAFE_componentWillReceiveProps(props) {
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

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    const ref = React.createRef();
    await act(() => {
      root.render(<Component ref={ref} update={0} />);
    });
    const instance = ref.current;
    expect(renders).toBe(1);
    expect(instance.state.updated).toBe(false);
    await act(() => {
      root.render(<Component update={1} />);
    });
    expect(renders).toBe(2);
    expect(instance.state.updated).toBe(true);
  });

  it('only renders once if updated in componentWillReceiveProps when batching', () => {
    let renders = 0;

    class Component extends React.Component {
      state = {updated: false};

      UNSAFE_componentWillReceiveProps(props) {
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

    const container = document.createElement('div');
    const instance = ReactDOM.render(<Component update={0} />, container);
    expect(renders).toBe(1);
    expect(instance.state.updated).toBe(false);
    ReactDOM.unstable_batchedUpdates(() => {
      ReactDOM.render(<Component update={1} />, container);
    });
    expect(renders).toBe(2);
    expect(instance.state.updated).toBe(true);
  });

  it('should update refs if shouldComponentUpdate gives false', async () => {
    class Static extends React.Component {
      shouldComponentUpdate() {
        return false;
      }

      render() {
        return <div>{this.props.children}</div>;
      }
    }

    class Component extends React.Component {
      static0Ref = React.createRef();
      static1Ref = React.createRef();

      render() {
        if (this.props.flipped) {
          return (
            <div>
              <Static ref={this.static0Ref} key="B">
                B (ignored)
              </Static>
              <Static ref={this.static1Ref} key="A">
                A (ignored)
              </Static>
            </div>
          );
        } else {
          return (
            <div>
              <Static ref={this.static0Ref} key="A">
                A
              </Static>
              <Static ref={this.static1Ref} key="B">
                B
              </Static>
            </div>
          );
        }
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    const componentRef = React.createRef();
    await act(() => {
      root.render(<Component ref={componentRef} flipped={false} />);
    });
    const comp = componentRef.current;
    expect(ReactDOM.findDOMNode(comp.static0Ref.current).textContent).toBe('A');
    expect(ReactDOM.findDOMNode(comp.static1Ref.current).textContent).toBe('B');

    // When flipping the order, the refs should update even though the actual
    // contents do not
    await act(() => {
      root.render(<Component ref={componentRef} flipped={true} />);
    });
    expect(ReactDOM.findDOMNode(comp.static0Ref.current).textContent).toBe('B');
    expect(ReactDOM.findDOMNode(comp.static1Ref.current).textContent).toBe('A');
  });

  it('should allow access to findDOMNode in componentWillUnmount', async () => {
    let a = null;
    let b = null;

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

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    expect(a).toBe(container.firstChild);
    await act(() => {
      root.render(<Component />);
    });
    await act(() => {
      root.unmount();
    });
    expect(a).toBe(b);
  });

  // @gate !disableLegacyContext || !__DEV__
  it('context should be passed down from the parent', async () => {
    class Parent extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string,
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
        foo: PropTypes.string.isRequired,
      };

      render() {
        return <div />;
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(
        <Parent>
          <Component />
        </Parent>,
      );
    });
  });

  it('should replace state', () => {
    class Moo extends React.Component {
      state = {x: 1};
      render() {
        return <div />;
      }
    }

    const moo = ReactTestUtils.renderIntoDocument(<Moo />);
    // No longer a public API, but we can test that it works internally by
    // reaching into the updater.
    moo.updater.enqueueReplaceState(moo, {y: 2});
    expect('x' in moo.state).toBe(false);
    expect(moo.state.y).toBe(2);
  });

  it('should support objects with prototypes as state', () => {
    const NotActuallyImmutable = function (str) {
      this.str = str;
    };
    NotActuallyImmutable.prototype.amIImmutable = function () {
      return true;
    };
    class Moo extends React.Component {
      state = new NotActuallyImmutable('first');
      // No longer a public API, but we can test that it works internally by
      // reaching into the updater.
      _replaceState = update => this.updater.enqueueReplaceState(this, update);
      render() {
        return <div />;
      }
    }

    const moo = ReactTestUtils.renderIntoDocument(<Moo />);
    expect(moo.state.str).toBe('first');
    expect(moo.state.amIImmutable()).toBe(true);

    const secondState = new NotActuallyImmutable('second');
    moo._replaceState(secondState);
    expect(moo.state.str).toBe('second');
    expect(moo.state.amIImmutable()).toBe(true);
    expect(moo.state).toBe(secondState);

    moo.setState({str: 'third'});
    expect(moo.state.str).toBe('third');
    // Here we lose the prototype.
    expect(moo.state.amIImmutable).toBe(undefined);

    // When more than one state update is enqueued, we have the same behavior
    const fifthState = new NotActuallyImmutable('fifth');
    ReactDOM.unstable_batchedUpdates(function () {
      moo.setState({str: 'fourth'});
      moo._replaceState(fifthState);
    });
    expect(moo.state).toBe(fifthState);

    // When more than one state update is enqueued, we have the same behavior
    const sixthState = new NotActuallyImmutable('sixth');
    ReactDOM.unstable_batchedUpdates(function () {
      moo._replaceState(sixthState);
      moo.setState({str: 'seventh'});
    });
    expect(moo.state.str).toBe('seventh');
    expect(moo.state.amIImmutable).toBe(undefined);
  });

  it('should not warn about unmounting during unmounting', async () => {
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    const layer = document.createElement('div');

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

    await act(() => {
      root.render(
        <Outer>
          <Component />
        </Outer>,
      );
    });
    await act(() => {
      root.render(<Outer />);
    });
  });

  it('should warn when mutated props are passed', async () => {
    const root = ReactDOMClient.createRoot(document.createElement('div'));

    class Foo extends React.Component {
      constructor(props) {
        const _props = {idx: props.idx + '!'};
        super(_props);
      }

      render() {
        return <span />;
      }
    }

    await expect(async () => {
      await act(() => {
        root.render(<Foo idx="qwe" />);
      });
    }).toErrorDev(
      'Foo(...): When calling super() in `Foo`, make sure to pass ' +
        "up the same props that your component's constructor was passed.",
    );
  });

  it('should only call componentWillUnmount once', () => {
    let app;
    let count = 0;

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

    const container = document.createElement('div');

    const setRef = ref => {
      if (ref) {
        app = ref;
      }
    };

    expect(() => {
      ReactDOM.render(<App ref={setRef} stage={1} />, container);
      ReactDOM.render(<App ref={setRef} stage={2} />, container);
    }).toThrow();
    expect(count).toBe(1);
  });

  it('prepares new child before unmounting old', async () => {
    const log = [];

    class Spy extends React.Component {
      UNSAFE_componentWillMount() {
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

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(<Wrapper name="A" />);
    });
    await act(() => {
      root.render(<Wrapper name="B" />);
    });

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

  it('respects a shallow shouldComponentUpdate implementation', async () => {
    let renderCalls = 0;
    class PlasticWrap extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {
          color: 'green',
        };
        this.appleRef = React.createRef();
      }

      render() {
        return <Apple color={this.state.color} ref={this.appleRef} />;
      }
    }

    class Apple extends React.Component {
      state = {
        cut: false,
        slices: 1,
      };

      shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
      }

      cut() {
        this.setState({
          cut: true,
          slices: 10,
        });
      }

      eatSlice() {
        this.setState({
          slices: this.state.slices - 1,
        });
      }

      render() {
        renderCalls++;
        return <div />;
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    const ref = React.createRef();
    await act(() => {
      root.render(<PlasticWrap ref={ref} />);
    });
    const instance = ref.current;
    expect(renderCalls).toBe(1);

    // Do not re-render based on props
    await act(() => {
      instance.setState({color: 'green'});
    });
    expect(renderCalls).toBe(1);

    // Re-render based on props
    await act(() => {
      instance.setState({color: 'red'});
    });
    expect(renderCalls).toBe(2);

    // Re-render base on state
    await act(() => {
      instance.appleRef.current.cut();
    });
    expect(renderCalls).toBe(3);

    // No re-render based on state
    await act(() => {
      instance.appleRef.current.cut();
    });
    expect(renderCalls).toBe(3);

    // Re-render based on state again
    await act(() => {
      instance.appleRef.current.eatSlice();
    });
    expect(renderCalls).toBe(4);
  });

  it('does not do a deep comparison for a shallow shouldComponentUpdate implementation', async () => {
    function getInitialState() {
      return {
        foo: [1, 2, 3],
        bar: {a: 4, b: 5, c: 6},
      };
    }

    let renderCalls = 0;
    const initialSettings = getInitialState();

    class Component extends React.Component {
      state = initialSettings;

      shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
      }

      render() {
        renderCalls++;
        return <div />;
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    const ref = React.createRef();
    await act(() => {
      root.render(<Component ref={ref} />);
    });
    const instance = ref.current;
    expect(renderCalls).toBe(1);

    // Do not re-render if state is equal
    const settings = {
      foo: initialSettings.foo,
      bar: initialSettings.bar,
    };
    await act(() => {
      instance.setState(settings);
    });
    expect(renderCalls).toBe(1);

    // Re-render because one field changed
    initialSettings.foo = [1, 2, 3];
    await act(() => {
      instance.setState(initialSettings);
    });
    expect(renderCalls).toBe(2);

    // Re-render because the object changed
    await act(() => {
      instance.setState(getInitialState());
    });
    expect(renderCalls).toBe(3);
  });

  it('should call setState callback with no arguments', () => {
    let mockArgs;
    class Component extends React.Component {
      componentDidMount() {
        this.setState({}, (...args) => (mockArgs = args));
      }
      render() {
        return false;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);
    expect(mockArgs.length).toEqual(0);
  });

  it('this.state should be updated on setState callback inside componentWillMount', async () => {
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    let stateSuccessfullyUpdated = false;

    class Component extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {
          hasUpdatedState: false,
        };
      }

      UNSAFE_componentWillMount() {
        this.setState(
          {hasUpdatedState: true},
          () => (stateSuccessfullyUpdated = this.state.hasUpdatedState),
        );
      }

      render() {
        return <div>{this.props.children}</div>;
      }
    }

    await act(() => {
      root.render(<Component />);
    });
    expect(stateSuccessfullyUpdated).toBe(true);
  });

  it('should call the setState callback even if shouldComponentUpdate = false', async () => {
    const mockFn = jest.fn().mockReturnValue(false);
    const root = ReactDOMClient.createRoot(document.createElement('div'));

    let instance;

    class Component extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {
          hasUpdatedState: false,
        };
      }

      UNSAFE_componentWillMount() {
        instance = this;
      }

      shouldComponentUpdate() {
        return mockFn();
      }

      render() {
        return <div>{this.state.hasUpdatedState}</div>;
      }
    }

    await act(() => {
      root.render(<Component />);
    });

    expect(instance).toBeDefined();
    expect(mockFn).not.toBeCalled();

    instance.setState({hasUpdatedState: true}, () => {
      expect(mockFn).toBeCalled();
      expect(instance.state.hasUpdatedState).toBe(true);
      done();
    });
  });

  it('should return a meaningful warning when constructor is returned', () => {
    class RenderTextInvalidConstructor extends React.Component {
      constructor(props) {
        super(props);
        return {something: false};
      }

      render() {
        return <div />;
      }
    }

    expect(() => {
      expect(() => {
        ReactTestUtils.renderIntoDocument(<RenderTextInvalidConstructor />);
      }).toThrow();
    }).toErrorDev([
      // Expect two errors because invokeGuardedCallback will dispatch an error event,
      // Causing the warning to be logged again.
      'Warning: RenderTextInvalidConstructor(...): No `render` method found on the returned component instance: ' +
        'did you accidentally return an object from the constructor?',
      'Warning: RenderTextInvalidConstructor(...): No `render` method found on the returned component instance: ' +
        'did you accidentally return an object from the constructor?',
    ]);
  });

  it('should warn about reassigning this.props while rendering', async () => {
    class Bad extends React.Component {
      componentDidMount() {}
      componentDidUpdate() {}
      render() {
        this.props = {...this.props};
        return null;
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await expect(async () => {
      {
        await act(() => {
          root.render(<Bad />);
        });
      }
    }).toErrorDev(
      'It looks like Bad is reassigning its own `this.props` while rendering. ' +
        'This is not supported and can lead to confusing bugs.',
    );
  });

  it('should return error if render is not defined', () => {
    class RenderTestUndefinedRender extends React.Component {}

    expect(() => {
      expect(() => {
        ReactTestUtils.renderIntoDocument(<RenderTestUndefinedRender />);
      }).toThrow();
    }).toErrorDev([
      // Expect two errors because invokeGuardedCallback will dispatch an error event,
      // Causing the warning to be logged again.
      'Warning: RenderTestUndefinedRender(...): No `render` method found on the returned ' +
        'component instance: you may have forgotten to define `render`.',
      'Warning: RenderTestUndefinedRender(...): No `render` method found on the returned ' +
        'component instance: you may have forgotten to define `render`.',
    ]);
  });

  // Regression test for accidental breaking change
  // https://github.com/facebook/react/issues/13580
  it('should support classes shadowing isReactComponent', async () => {
    class Shadow extends React.Component {
      isReactComponent() {}
      render() {
        return <div />;
      }
    }
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<Shadow />);
    });
    expect(container.firstChild.tagName).toBe('DIV');
  });

  it('should not warn on updating function component from componentWillMount', async () => {
    let _setState;
    function A() {
      _setState = React.useState()[1];
      return null;
    }
    class B extends React.Component {
      UNSAFE_componentWillMount() {
        _setState({});
      }
      render() {
        return null;
      }
    }
    function Parent() {
      return (
        <div>
          <A />
          <B />
        </div>
      );
    }
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(<Parent />);
    });
  });

  it('should not warn on updating function component from componentWillUpdate', async () => {
    let _setState;
    function A() {
      _setState = React.useState()[1];
      return null;
    }
    class B extends React.Component {
      UNSAFE_componentWillUpdate() {
        _setState({});
      }
      render() {
        return null;
      }
    }
    function Parent() {
      return (
        <div>
          <A />
          <B />
        </div>
      );
    }
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(<Parent />);
    });
    await act(() => {
      root.render(<Parent />);
    });
  });

  it('should not warn on updating function component from componentWillReceiveProps', async () => {
    let _setState;
    function A() {
      _setState = React.useState()[1];
      return null;
    }
    class B extends React.Component {
      UNSAFE_componentWillReceiveProps() {
        _setState({});
      }
      render() {
        return null;
      }
    }
    function Parent() {
      return (
        <div>
          <A />
          <B />
        </div>
      );
    }
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(<Parent />);
    });
    await act(() => {
      root.render(<Parent />);
    });
  });

  it('should warn on updating function component from render', async () => {
    let _setState;
    function A() {
      _setState = React.useState()[1];
      return null;
    }
    class B extends React.Component {
      render() {
        _setState({});
        return null;
      }
    }
    function Parent() {
      return (
        <div>
          <A />
          <B />
        </div>
      );
    }
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await expect(async () => {
      {
        await act(() => {
          root.render(<Parent />);
        });
      }
    }).toErrorDev(
      'Cannot update a component (`A`) while rendering a different component (`B`)',
    );
    // Dedupe.
    await act(() => {
      root.render(<Parent />);
    });
  });
});
